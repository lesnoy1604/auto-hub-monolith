# TASK 06 — Договоры (`/api/contracts`) + генерация платежей

## Цель
Реализовать CRUD договоров с транзакционной логикой: при создании договора автоматически менять статус машины и генерировать график платежей. При закрытии — освобождать машину.

## Зависимости
- TASK 01–05 выполнены

---

## 6.1 Domain — `internal/domain/contract.go`

```go
type ContractStatus string

const (
    ContractStatusActive    ContractStatus = "ACTIVE"
    ContractStatusCompleted ContractStatus = "COMPLETED"
    ContractStatusCancelled ContractStatus = "CANCELLED"
)

type Contract struct {
    ID             int            `json:"id"`
    CarID          int            `json:"car_id"`
    DriverID       int            `json:"driver_id"`
    Status         ContractStatus `json:"status"`
    TotalAmount    decimal        `json:"total_amount"`   // см. примечание о Decimal
    PaidAmount     decimal        `json:"paid_amount"`
    MonthlyPayment decimal        `json:"monthly_payment"`
    StartDate      time.Time      `json:"start_date"`
    EndDate        *time.Time     `json:"end_date"`
    CreatedAt      time.Time      `json:"created_at"`
    UpdatedAt      time.Time      `json:"updated_at"`
}
```

> **Примечание о Decimal:** использовать `shopspring/decimal` пакет для хранения и сериализации денег. При сериализации в JSON — строки (`"25000.00"`). Для вычисляемых полей (`remaining_balance`) — float64.
>
> Установить: `go get github.com/shopspring/decimal`

---

## 6.2 Domain — `internal/domain/payment.go`

```go
type PaymentStatus string

const (
    PaymentStatusPaid    PaymentStatus = "PAID"
    PaymentStatusUnpaid  PaymentStatus = "UNPAID"
    PaymentStatusOverdue PaymentStatus = "OVERDUE"
)

type Payment struct {
    ID         int           `json:"id"`
    ContractID int           `json:"contract_id"`
    Amount     decimal       `json:"amount"`
    Status     PaymentStatus `json:"status"`
    DueDate    time.Time     `json:"due_date"`
    PaidAt     *time.Time    `json:"paid_at"`
    CreatedAt  time.Time     `json:"created_at"`
}
```

---

## 6.3 Repository interfaces

```go
type ContractRepository interface {
    List(ctx context.Context, status *ContractStatus) ([]domain.Contract, error)
    GetByID(ctx context.Context, id int) (*domain.Contract, error)
    GetActiveByCarID(ctx context.Context, carID int) (*domain.Contract, error)
    Create(ctx context.Context, c *domain.Contract) (*domain.Contract, error)
    Update(ctx context.Context, id int, c *domain.Contract) (*domain.Contract, error)
    UpdatePaidAmount(ctx context.Context, id int, paidAmount decimal.Decimal) error
}

type PaymentRepository interface {
    ListByContractID(ctx context.Context, contractID int) ([]domain.Payment, error)
    BulkCreate(ctx context.Context, payments []domain.Payment) error
    GetByID(ctx context.Context, id int) (*domain.Payment, error)
    // ... (расширяется в TASK 07)
}
```

---

## 6.4 Repository — `internal/repository/postgres/contract.go`

### `List`
```sql
SELECT * FROM contracts
WHERE ($1::contract_status IS NULL OR status = $1)
ORDER BY created_at DESC
```
Для каждого контракта батчем загрузить `car` (plate_number, brand, model) и `driver` (full_name).

### `GetByID`
```sql
SELECT * FROM contracts WHERE id = $1
```

### `GetActiveByCarID`
```sql
SELECT * FROM contracts 
WHERE car_id = $1 AND status = 'ACTIVE'
ORDER BY created_at DESC
LIMIT 1
```

### `Create`
```sql
INSERT INTO contracts (car_id, driver_id, status, total_amount, paid_amount, monthly_payment, start_date)
VALUES ($1, $2, 'ACTIVE', $3, 0, $4, $5)
RETURNING *
```

### `Update`
```sql
UPDATE contracts SET status=$1, end_date=$2, monthly_payment=$3, total_amount=$4
WHERE id = $5
RETURNING *
```

---

## 6.5 Repository — `internal/repository/postgres/payment.go` (часть)

### `BulkCreate`
Использовать `pgx` batch или `COPY`:
```sql
INSERT INTO payments (contract_id, amount, status, due_date)
VALUES ($1, $2, 'UNPAID', $3)
```
Выполнить в рамках транзакции.

### `ListByContractID`
```sql
SELECT * FROM payments WHERE contract_id = $1 ORDER BY due_date ASC
```

---

## 6.6 Service — `internal/service/contract.go`

```go
type ContractService struct {
    contractRepo repository.ContractRepository
    paymentRepo  repository.PaymentRepository
    carRepo      repository.CarRepository
    db           *pgxpool.Pool  // для явных транзакций
}

func (s *ContractService) List(ctx context.Context, status *string) (*dto.ContractsListResponse, error)
func (s *ContractService) GetByID(ctx context.Context, id int) (*dto.ContractDetailResponse, error)
func (s *ContractService) Create(ctx context.Context, req *dto.CreateContractRequest) (*domain.Contract, error)
func (s *ContractService) Update(ctx context.Context, id int, req *dto.UpdateContractRequest) (*dto.ContractResponse, error)
func (s *ContractService) GetPayments(ctx context.Context, id int) ([]domain.Payment, error)
```

### `Create` — транзакционная логика

```go
// Псевдокод
func (s *ContractService) Create(ctx context.Context, req *dto.CreateContractRequest) (*domain.Contract, error) {
    // 1. Получить машину → 404 если нет
    car, err := s.carRepo.GetByID(ctx, req.CarID)
    
    // 2. Проверить статус
    if car.Status != domain.CarStatusFree {
        return nil, domain.ErrCarNotFree  // → 409
    }
    
    // 3. Начать транзакцию
    tx, err := s.db.Begin(ctx)
    defer tx.Rollback(ctx)
    
    // 4. Создать контракт
    contract, err := s.contractRepo.CreateTx(ctx, tx, contract)
    
    // 5. Обновить статус машины → RENTED
    err = s.carRepo.UpdateStatusTx(ctx, tx, req.CarID, domain.CarStatusRented)
    
    // 6. Сгенерировать платежи
    payments := generatePaymentSchedule(contract)
    err = s.paymentRepo.BulkCreateTx(ctx, tx, payments)
    
    // 7. Commit
    tx.Commit(ctx)
    return contract, nil
}
```

### Функция генерации графика платежей

```go
func generatePaymentSchedule(c *domain.Contract) []domain.Payment {
    monthCount := int(math.Ceil(c.TotalAmount.Div(c.MonthlyPayment).InexactFloat64()))
    payments := make([]domain.Payment, 0, monthCount)
    
    for i := 0; i < monthCount; i++ {
        dueDate := c.StartDate.AddDate(0, i+1, 0)
        
        var amount decimal.Decimal
        if i == monthCount-1 {
            // Последний платёж = остаток
            amount = c.TotalAmount.Sub(c.MonthlyPayment.Mul(decimal.NewFromInt(int64(monthCount - 1))))
        } else {
            amount = c.MonthlyPayment
        }
        
        payments = append(payments, domain.Payment{
            ContractID: c.ID,
            Amount:     amount,
            Status:     domain.PaymentStatusUnpaid,
            DueDate:    dueDate,
        })
    }
    return payments
}
```

### `GetByID` — пересчёт `paid_amount`

```go
func (s *ContractService) GetByID(ctx context.Context, id int) (*dto.ContractDetailResponse, error) {
    contract, err := s.contractRepo.GetByID(ctx, id)
    payments, err := s.paymentRepo.ListByContractID(ctx, id)
    
    // Пересчитать paid_amount из PAID-платежей
    var actualPaid decimal.Decimal
    for _, p := range payments {
        if p.Status == domain.PaymentStatusPaid {
            actualPaid = actualPaid.Add(p.Amount)
        }
    }
    
    // Обновить в БД если отличается
    if !actualPaid.Equal(contract.PaidAmount) {
        s.contractRepo.UpdatePaidAmount(ctx, id, actualPaid)
        contract.PaidAmount = actualPaid
    }
    
    // Загрузить car и driver
    // Вернуть с remaining_balance
}
```

### `Update` — закрытие договора

```go
func (s *ContractService) Update(ctx context.Context, id int, req *dto.UpdateContractRequest) {
    contract, err := s.contractRepo.GetByID(ctx, id)
    
    // Если договор переходит из ACTIVE в другой статус
    if req.Status != nil && *req.Status != "ACTIVE" && contract.Status == domain.ContractStatusActive {
        // Транзакция:
        // 1. end_date = req.EndDate ?? now()
        // 2. car.status = FREE
        // 3. обновить contract
    }
}
```

---

## 6.7 DTO — `internal/dto/contract.go`

```go
type CreateContractRequest struct {
    CarID          int        `json:"car_id"          validate:"required"`
    DriverID       int        `json:"driver_id"       validate:"required"`
    TotalAmount    float64    `json:"total_amount"    validate:"required,gt=0"`
    MonthlyPayment float64    `json:"monthly_payment" validate:"required,gt=0"`
    StartDate      time.Time  `json:"start_date"      validate:"required"`
}

type UpdateContractRequest struct {
    Status         *string    `json:"status"`
    EndDate        *time.Time `json:"end_date"`
    MonthlyPayment *float64   `json:"monthly_payment"`
    TotalAmount    *float64   `json:"total_amount"`
}

type ContractResponse struct {
    domain.Contract
    RemainingBalance float64 `json:"remaining_balance"`
}

type ContractsListResponse struct {
    Contracts []ContractListItem `json:"contracts"`
    Total     int                `json:"total"`
}

type ContractListItem struct {
    domain.Contract
    Car              CarBrief   `json:"car"`
    Driver           DriverName `json:"driver"`
    RemainingBalance float64    `json:"remaining_balance"`
}

type ContractDetailResponse struct {
    domain.Contract
    Car              domain.Car     `json:"car"`
    Driver           domain.Driver  `json:"driver"`
    Payments         []domain.Payment `json:"payments"`
    RemainingBalance float64        `json:"remaining_balance"`
}
```

---

## 6.8 Handler — `internal/handler/contract.go`

| Метод | Путь                             | Описание                    |
|-------|----------------------------------|-----------------------------|
| GET   | `/api/contracts`                 | Список договоров            |
| POST  | `/api/contracts`                 | Создать договор             |
| GET   | `/api/contracts/{id}`            | Детали договора             |
| PUT   | `/api/contracts/{id}`            | Обновить договор            |
| GET   | `/api/contracts/{id}/payments`   | Платежи по договору         |

Коды ошибок:
- `ErrNotFound` → 404
- `ErrCarNotFree` → 409 `{"detail": "Car is not available for rent"}`

---

## Критерии выполнения
- [ ] `POST /api/contracts` создаёт договор, меняет статус машины на RENTED, генерирует платежи
- [ ] Количество платежей = `ceil(total_amount / monthly_payment)`
- [ ] Последний платёж = остаток
- [ ] `POST /api/contracts` с машиной не FREE → 409
- [ ] `GET /api/contracts/{id}` пересчитывает `paid_amount` из PAID-платежей
- [ ] `PUT /api/contracts/{id}` с `status=COMPLETED` → машина становится FREE, `end_date` проставляется
- [ ] `GET /api/contracts/{id}/payments` → массив платежей по возрастанию `due_date`
- [ ] `remaining_balance` возвращается как float64, а не строка
