# TASK 05 — CRUD Водители (`/api/drivers`)

## Цель
Реализовать полный CRUD для водителей с фильтрацией, поиском и вложенными контрактами.

## Зависимости
- TASK 01–04 выполнены

---

## 5.1 Domain — `internal/domain/driver.go`

```go
type DriverStatus string

const (
    DriverStatusActive   DriverStatus = "ACTIVE"
    DriverStatusInactive DriverStatus = "INACTIVE"
)

type Driver struct {
    ID          int          `json:"id"`
    FullName    string       `json:"full_name"`
    Phone       string       `json:"phone"`
    PassportNum string       `json:"passport_num"`
    LicenseNum  string       `json:"license_num"`
    Status      DriverStatus `json:"status"`
    CreatedAt   time.Time    `json:"created_at"`
    UpdatedAt   time.Time    `json:"updated_at"`
}
```

---

## 5.2 Repository interface

```go
type DriverRepository interface {
    List(ctx context.Context, status *DriverStatus, search *string) ([]domain.Driver, error)
    GetByID(ctx context.Context, id int) (*domain.Driver, error)
    Create(ctx context.Context, d *domain.Driver) (*domain.Driver, error)
    Update(ctx context.Context, id int, d *domain.Driver) (*domain.Driver, error)
}
```

---

## 5.3 Repository — `internal/repository/postgres/driver.go`

### `List`
```sql
SELECT * FROM drivers
WHERE ($1::driver_status IS NULL OR status = $1)
  AND ($2::varchar IS NULL OR full_name ILIKE '%' || $2 || '%')
ORDER BY created_at DESC
```

### `GetByID`
```sql
SELECT * FROM drivers WHERE id = $1
```
Вернуть `domain.ErrNotFound` при pgx.ErrNoRows.

### `Create`
```sql
INSERT INTO drivers (full_name, phone, passport_num, license_num, status)
VALUES ($1, $2, $3, $4, $5)
RETURNING *
```

### `Update`
```sql
UPDATE drivers SET full_name=$1, phone=$2, passport_num=$3, license_num=$4, status=$5
WHERE id = $6
RETURNING *
```

---

## 5.4 DTO — `internal/dto/driver.go`

```go
type CreateDriverRequest struct {
    FullName    string `json:"full_name"    validate:"required"`
    Phone       string `json:"phone"        validate:"required"`
    PassportNum string `json:"passport_num" validate:"required"`
    LicenseNum  string `json:"license_num"  validate:"required"`
    Status      string `json:"status"       validate:"required,oneof=ACTIVE INACTIVE"`
}

type UpdateDriverRequest struct {
    // те же поля, что и CreateDriverRequest
}

type DriversListResponse struct {
    Drivers []DriverWithContractsResponse `json:"drivers"`
    Total   int                           `json:"total"`
}

// DriverWithContractsResponse — водитель + последний ACTIVE контракт с машиной
type DriverWithContractsResponse struct {
    domain.Driver
    Contracts []ActiveContractForDriver `json:"contracts"`
}

type ActiveContractForDriver struct {
    ID     int        `json:"id"`
    Status string     `json:"status"`
    Car    CarBrief   `json:"car"`
}

type CarBrief struct {
    PlateNumber string `json:"plate_number"`
    Brand       string `json:"brand"`
    Model       string `json:"model"`
}

// DriverDetailResponse — для GET /api/drivers/{id}
type DriverDetailResponse struct {
    domain.Driver
    Contracts []ContractWithCar `json:"contracts"`
}

type ContractWithCar struct {
    ID             int        `json:"id"`
    Status         string     `json:"status"`
    TotalAmount    string     `json:"total_amount"`
    PaidAmount     string     `json:"paid_amount"`
    MonthlyPayment string     `json:"monthly_payment"`
    StartDate      time.Time  `json:"start_date"`
    EndDate        *time.Time `json:"end_date"`
    CreatedAt      time.Time  `json:"created_at"`
    UpdatedAt      time.Time  `json:"updated_at"`
    Car            CarWithYear `json:"car"`
}

type CarWithYear struct {
    PlateNumber string `json:"plate_number"`
    Brand       string `json:"brand"`
    Model       string `json:"model"`
    Year        int    `json:"year"`
}
```

---

## 5.5 Service — `internal/service/driver.go`

```go
type DriverService struct {
    driverRepo   repository.DriverRepository
    contractRepo repository.ContractRepository
}

func (s *DriverService) List(ctx context.Context, status *string, search *string) (*dto.DriversListResponse, error)
func (s *DriverService) GetByID(ctx context.Context, id int) (*dto.DriverDetailResponse, error)
func (s *DriverService) Create(ctx context.Context, req *dto.CreateDriverRequest) (*domain.Driver, error)
func (s *DriverService) Update(ctx context.Context, id int, req *dto.UpdateDriverRequest) (*domain.Driver, error)
```

**`List`**:
- Загрузить водителей
- Для каждого батчем найти последний ACTIVE контракт с машиной (не N+1)

**`GetByID`**:
- Загрузить водителя (404 если нет)
- Загрузить все его контракты с машинами

---

## 5.6 Handler — `internal/handler/driver.go`

| Метод | Путь                | Описание           |
|-------|---------------------|--------------------|
| GET   | `/api/drivers`      | Список водителей   |
| POST  | `/api/drivers`      | Создать водителя   |
| GET   | `/api/drivers/{id}` | Детали водителя    |
| PUT   | `/api/drivers/{id}` | Обновить водителя  |

**GET `/api/drivers`** — query params: `status`, `search` (ilike по full_name).

**POST `/api/drivers`** — 201 + объект Driver без relations.

**GET `/api/drivers/{id}`** — 200 с контрактами и машинами, 404 если нет.

**PUT `/api/drivers/{id}`** — 200 + обновлённый Driver без relations.

---

## 5.7 Интеграция в Router

```go
r.Get("/api/drivers", driverHandler.List)
r.Post("/api/drivers", driverHandler.Create)
r.Get("/api/drivers/{id}", driverHandler.GetByID)
r.Put("/api/drivers/{id}", driverHandler.Update)
```

---

## Критерии выполнения
- [ ] `GET /api/drivers` возвращает список с `total` и активными контрактами
- [ ] `GET /api/drivers?status=ACTIVE` фильтрует
- [ ] `GET /api/drivers?search=Иван` ищет по имени (ILIKE, кириллица)
- [ ] `GET /api/drivers/{id}` возвращает водителя со всеми контрактами и машинами
- [ ] `GET /api/drivers/999` → 404
- [ ] `POST /api/drivers` → 201
- [ ] `PUT /api/drivers/{id}` → 200
