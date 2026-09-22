# TASK 07 — Платежи (`/api/payments`)

## Цель
Реализовать список платежей с фильтрацией и endpoint оплаты с транзакционным пересчётом баланса договора.

## Зависимости
- TASK 01–06 выполнены

---

## 7.1 Repository — дополнить `internal/repository/postgres/payment.go`

### `List`

```go
type PaymentFilter struct {
    Status *PaymentStatus
}
```

Логика фильтрации:
- Если `status == "PAID"` → `WHERE status = 'PAID'`
- Если `status == "OVERDUE"` → `WHERE status = 'OVERDUE'`
- Если `status == "UNPAID"` → `WHERE status = 'UNPAID'`
- Если `status == "PENDING"` или пусто → `WHERE status IN ('UNPAID', 'OVERDUE')`

```sql
SELECT p.*, c.id, c.car_id, c.driver_id, c.status, c.total_amount, c.paid_amount,
       c.monthly_payment, c.start_date, c.end_date, c.created_at, c.updated_at,
       car.id, car.plate_number, car.brand, car.model,
       d.id, d.full_name, d.phone
FROM payments p
JOIN contracts c ON p.contract_id = c.id
JOIN cars car ON c.car_id = car.id
JOIN drivers d ON c.driver_id = d.id
WHERE <фильтр>
ORDER BY p.due_date ASC
```

### `MarkAsPaid`

```go
func (r *paymentRepo) MarkAsPaid(ctx context.Context, id int, paidAt time.Time) (*domain.Payment, error)
```

```sql
UPDATE payments SET status = 'PAID', paid_at = $1 WHERE id = $2 RETURNING *
```

### `SumPaidByContractID`

```go
func (r *paymentRepo) SumPaidByContractID(ctx context.Context, contractID int) (decimal.Decimal, error)
```

```sql
SELECT COALESCE(SUM(amount), 0) FROM payments WHERE contract_id = $1 AND status = 'PAID'
```

---

## 7.2 DTO — `internal/dto/payment.go`

```go
type PayPaymentRequest struct {
    PaymentID int        `json:"payment_id" validate:"required"`
    PaidAt    *time.Time `json:"paid_at"`
}

type PaymentWithContract struct {
    domain.Payment
    Contract ContractWithRelations `json:"contract"`
}

type ContractWithRelations struct {
    ID             int        `json:"id"`
    CarID          int        `json:"car_id"`
    DriverID       int        `json:"driver_id"`
    Status         string     `json:"status"`
    TotalAmount    string     `json:"total_amount"`
    PaidAmount     string     `json:"paid_amount"`
    MonthlyPayment string     `json:"monthly_payment"`
    StartDate      time.Time  `json:"start_date"`
    EndDate        *time.Time `json:"end_date"`
    CreatedAt      time.Time  `json:"created_at"`
    UpdatedAt      time.Time  `json:"updated_at"`
    Car            CarForPayment    `json:"car"`
    Driver         DriverForPayment `json:"driver"`
}

type CarForPayment struct {
    ID          int    `json:"id"`
    PlateNumber string `json:"plate_number"`
    Brand       string `json:"brand"`
    Model       string `json:"model"`
}

type DriverForPayment struct {
    ID       int    `json:"id"`
    FullName string `json:"full_name"`
    Phone    string `json:"phone"`
}

type PaymentsListResponse struct {
    Payments []PaymentWithContract `json:"payments"`
    Total    int                   `json:"total"`
}

type PayPaymentResponse struct {
    Payment  domain.Payment  `json:"payment"`
    Contract ContractSummary `json:"contract"`
}

type ContractSummary struct {
    ID               int     `json:"id"`
    PaidAmount       float64 `json:"paid_amount"`
    RemainingBalance float64 `json:"remaining_balance"`
}
```

---

## 7.3 Service — `internal/service/payment.go`

```go
type PaymentService struct {
    paymentRepo  repository.PaymentRepository
    contractRepo repository.ContractRepository
    db           *pgxpool.Pool
}

func (s *PaymentService) List(ctx context.Context, status *string) (*dto.PaymentsListResponse, error)
func (s *PaymentService) Pay(ctx context.Context, req *dto.PayPaymentRequest) (*dto.PayPaymentResponse, error)
```

### `List`
Делегировать в `paymentRepo.List(ctx, filter)`, сформировать ответ.

### `Pay` — транзакционная логика

```go
func (s *PaymentService) Pay(ctx context.Context, req *dto.PayPaymentRequest) (*dto.PayPaymentResponse, error) {
    // 1. Проверить что payment_id передан → иначе ErrValidation → 400
    // (уже покрыто validator, но можно явно)
    
    // 2. Загрузить платёж → ErrNotFound → 404
    payment, err := s.paymentRepo.GetByID(ctx, req.PaymentID)
    
    // 3. Проверить что платёж не PAID → ErrAlreadyPaid → 409
    if payment.Status == domain.PaymentStatusPaid {
        return nil, domain.ErrAlreadyPaid
    }
    
    // 4. Определить paidAt
    paidAt := time.Now()
    if req.PaidAt != nil {
        paidAt = *req.PaidAt
    }
    
    // 5. Транзакция:
    tx, err := s.db.Begin(ctx)
    defer tx.Rollback(ctx)
    
    // 5a. Обновить платёж → PAID
    updatedPayment, err := s.paymentRepo.MarkAsPaidTx(ctx, tx, req.PaymentID, paidAt)
    
    // 5b. Пересчитать paid_amount договора
    newPaidAmount, err := s.paymentRepo.SumPaidByContractIDTx(ctx, tx, payment.ContractID)
    err = s.contractRepo.UpdatePaidAmountTx(ctx, tx, payment.ContractID, newPaidAmount)
    
    tx.Commit(ctx)
    
    // 6. Получить total_amount для вычисления remaining_balance
    contract, err := s.contractRepo.GetByID(ctx, payment.ContractID)
    remaining := math.Max(0, contract.TotalAmount.Sub(newPaidAmount).InexactFloat64())
    
    return &dto.PayPaymentResponse{
        Payment: *updatedPayment,
        Contract: dto.ContractSummary{
            ID:               payment.ContractID,
            PaidAmount:       newPaidAmount.InexactFloat64(),
            RemainingBalance: remaining,
        },
    }, nil
}
```

---

## 7.4 Handler — `internal/handler/payment.go`

| Метод | Путь              | Описание                        |
|-------|-------------------|---------------------------------|
| GET   | `/api/payments`   | Список платежей с фильтрацией   |
| POST  | `/api/payments`   | Оплатить платёж                 |

**GET `/api/payments`** — query param `status` (PAID / UNPAID / OVERDUE / PENDING или пусто).

**POST `/api/payments`** — принять `PayPaymentRequest`.

Маппинг ошибок:
- `ErrValidation` → 400
- `ErrNotFound` → 404
- `ErrAlreadyPaid` → 409 `{"detail": "Payment is already paid"}`

---

## Критерии выполнения
- [ ] `GET /api/payments` без параметров возвращает UNPAID + OVERDUE
- [ ] `GET /api/payments?status=PAID` возвращает только оплаченные
- [ ] `GET /api/payments?status=OVERDUE` возвращает только просроченные
- [ ] Каждый платёж содержит вложенный `contract` с `car` и `driver`
- [ ] `POST /api/payments` оплачивает платёж и возвращает обновлённый баланс договора
- [ ] `POST /api/payments` без `payment_id` → 400
- [ ] `POST /api/payments` с несуществующим ID → 404
- [ ] `POST /api/payments` с уже оплаченным платежом → 409
- [ ] `paid_at` принимается из тела, если не передан — `time.Now()`
- [ ] `remaining_balance` возвращается как float64
