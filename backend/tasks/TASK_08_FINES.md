# TASK 08 — Штрафы (`/api/fines`)

## Цель
Реализовать создание, список и обновление штрафов. Логика автоопределения водителя по активному договору машины.

## Зависимости
- TASK 01–07 выполнены

---

## 8.1 Domain — `internal/domain/fine.go`

```go
type FineStatus string

const (
    FineStatusUnpaid   FineStatus = "UNPAID"
    FineStatusPaid     FineStatus = "PAID"
    FineStatusDisputed FineStatus = "DISPUTED"
)

type Fine struct {
    ID          int        `json:"id"`
    CarID       int        `json:"car_id"`
    DriverID    int        `json:"driver_id"`
    ContractID  *int       `json:"contract_id"`
    Amount      decimal    `json:"amount"`
    Description string     `json:"description"`
    FineDate    time.Time  `json:"fine_date"`
    Status      FineStatus `json:"status"`
    PaidAt      *time.Time `json:"paid_at"`
    CreatedAt   time.Time  `json:"created_at"`
}
```

---

## 8.2 Repository interface

```go
type FineRepository interface {
    List(ctx context.Context, filter FineFilter) ([]domain.Fine, error)
    GetByID(ctx context.Context, id int) (*domain.Fine, error)
    Create(ctx context.Context, fine *domain.Fine) (*domain.Fine, error)
    Update(ctx context.Context, id int, fine *domain.Fine) (*domain.Fine, error)
    ListByCar(ctx context.Context, carID int, limit int) ([]domain.Fine, error)
}

type FineFilter struct {
    Status   *domain.FineStatus
    CarID    *int
    DriverID *int
}
```

---

## 8.3 Repository — `internal/repository/postgres/fine.go`

### `List`

```sql
SELECT f.*,
    car.id, car.plate_number, car.brand, car.model,
    d.id, d.full_name,
    con.id as contract_fk_id
FROM fines f
JOIN cars car ON f.car_id = car.id
JOIN drivers d ON f.driver_id = d.id
LEFT JOIN contracts con ON f.contract_id = con.id
WHERE ($1::fine_status IS NULL OR f.status = $1)
  AND ($2::int IS NULL OR f.car_id = $2)
  AND ($3::int IS NULL OR f.driver_id = $3)
ORDER BY f.fine_date DESC
```

### `GetByID`

```sql
SELECT * FROM fines WHERE id = $1
```
Вернуть `domain.ErrNotFound` при pgx.ErrNoRows.

### `Create`

```sql
INSERT INTO fines (car_id, driver_id, contract_id, amount, description, fine_date, status)
VALUES ($1, $2, $3, $4, $5, $6, 'UNPAID')
RETURNING *
```

### `Update`

```sql
UPDATE fines SET status=$1, paid_at=$2 WHERE id=$3 RETURNING *
```

### `ListByCar`

```sql
SELECT * FROM fines WHERE car_id = $1 ORDER BY fine_date DESC LIMIT $2
```

---

## 8.4 DTO — `internal/dto/fine.go`

```go
type CreateFineRequest struct {
    CarID       int        `json:"car_id"      validate:"required"`
    DriverID    *int       `json:"driver_id"`   // опционален — если нет, ищем по активному договору
    ContractID  *int       `json:"contract_id"`
    Amount      float64    `json:"amount"      validate:"required,gt=0"`
    Description string     `json:"description" validate:"required"`
    FineDate    time.Time  `json:"fine_date"   validate:"required"`
}

type UpdateFineRequest struct {
    Status string     `json:"status" validate:"required,oneof=UNPAID PAID DISPUTED"`
    PaidAt *time.Time `json:"paid_at"`
}

type FineWithRelations struct {
    domain.Fine
    Car      CarForFine      `json:"car"`
    Driver   DriverForFine   `json:"driver"`
    Contract *ContractForFine `json:"contract"`
}

type CarForFine struct {
    ID          int    `json:"id"`
    PlateNumber string `json:"plate_number"`
    Brand       string `json:"brand"`
    Model       string `json:"model"`
}

type DriverForFine struct {
    ID       int    `json:"id"`
    FullName string `json:"full_name"`
}

type ContractForFine struct {
    ID int `json:"id"`
}

type FinesListResponse struct {
    Fines []FineWithRelations `json:"fines"`
    Total int                 `json:"total"`
}
```

---

## 8.5 Service — `internal/service/fine.go`

```go
type FineService struct {
    fineRepo     repository.FineRepository
    contractRepo repository.ContractRepository
}

func (s *FineService) List(ctx context.Context, status *string, carID *int, driverID *int) (*dto.FinesListResponse, error)
func (s *FineService) Create(ctx context.Context, req *dto.CreateFineRequest) (*domain.Fine, error)
func (s *FineService) Update(ctx context.Context, id int, req *dto.UpdateFineRequest) (*domain.Fine, error)
```

### `Create` — автоопределение водителя

```go
func (s *FineService) Create(ctx context.Context, req *dto.CreateFineRequest) (*domain.Fine, error) {
    driverID := req.DriverID
    contractID := req.ContractID
    
    // Если driver_id не передан — найти по активному договору машины
    if driverID == nil {
        contract, err := s.contractRepo.GetActiveByCarID(ctx, req.CarID)
        if err != nil {
            // Активный договор не найден → 400
            return nil, domain.ErrDriverNotFound
        }
        driverID = &contract.DriverID
        contractID = &contract.ID
    }
    
    fine := &domain.Fine{
        CarID:       req.CarID,
        DriverID:    *driverID,
        ContractID:  contractID,
        Amount:      decimal.NewFromFloat(req.Amount),
        Description: req.Description,
        FineDate:    req.FineDate,
    }
    
    return s.fineRepo.Create(ctx, fine)
}
```

### `Update` — логика paid_at

```go
func (s *FineService) Update(ctx context.Context, id int, req *dto.UpdateFineRequest) (*domain.Fine, error) {
    fine, err := s.fineRepo.GetByID(ctx, id)
    if err != nil { return nil, err }
    
    fine.Status = domain.FineStatus(req.Status)
    
    if fine.Status == domain.FineStatusPaid {
        if req.PaidAt != nil {
            fine.PaidAt = req.PaidAt
        } else {
            now := time.Now()
            fine.PaidAt = &now
        }
    } else {
        fine.PaidAt = nil  // сбросить paid_at если статус не PAID
    }
    
    return s.fineRepo.Update(ctx, id, fine)
}
```

---

## 8.6 Handler — `internal/handler/fine.go`

| Метод | Путь               | Описание            |
|-------|--------------------|---------------------|
| GET   | `/api/fines`       | Список штрафов      |
| POST  | `/api/fines`       | Создать штраф       |
| PUT   | `/api/fines/{id}`  | Обновить штраф      |

**GET `/api/fines`** — query params: `status`, `car_id`, `driver_id`.

**POST `/api/fines`** — 201 + объект Fine без relations.

**PUT `/api/fines/{id}`** — 200 + обновлённый Fine без relations.

Маппинг ошибок:
- `ErrNotFound` → 404
- `ErrDriverNotFound` → 400 `{"detail": "No active contract found for this car, please provide driver_id"}`

---

## Критерии выполнения
- [ ] `GET /api/fines` возвращает список с `total` и вложенными `car`, `driver`, `contract`
- [ ] `GET /api/fines?status=UNPAID` фильтрует по статусу
- [ ] `GET /api/fines?car_id=1` фильтрует по машине
- [ ] `GET /api/fines?driver_id=3` фильтрует по водителю
- [ ] `POST /api/fines` без `driver_id` — автоопределяет из активного договора машины
- [ ] `POST /api/fines` без `driver_id` и без активного договора → 400
- [ ] `PUT /api/fines/{id}` с `status=PAID` → `paid_at` проставляется (из тела или now())
- [ ] `PUT /api/fines/{id}` с `status=DISPUTED` → `paid_at = null`
- [ ] `PUT /api/fines/999` → 404
