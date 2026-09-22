# TASK 04 — CRUD Машины (`/api/cars`)

## Цель
Реализовать полный CRUD для машин с фильтрацией, поиском и вложенными объектами.

## Зависимости
- TASK 01–03 выполнены

---

## 4.1 Domain — `internal/domain/car.go`

```go
type CarStatus string

const (
    CarStatusFree   CarStatus = "FREE"
    CarStatusRented CarStatus = "RENTED"
    CarStatusRepair CarStatus = "REPAIR"
    CarStatusSold   CarStatus = "SOLD"
)

type Car struct {
    ID               int        `json:"id"`
    PlateNumber      string     `json:"plate_number"`
    VIN              string     `json:"vin"`
    Brand            string     `json:"brand"`
    Model            string     `json:"model"`
    Year             int        `json:"year"`
    Status           CarStatus  `json:"status"`
    Mileage          int        `json:"mileage"`
    OsagoBefore      *time.Time `json:"osago_before"`
    InspectionBefore *time.Time `json:"inspection_before"`
    CreatedAt        time.Time  `json:"created_at"`
    UpdatedAt        time.Time  `json:"updated_at"`
}

// CarWithContracts — для GET /api/cars (список)
type CarWithContracts struct {
    Car
    Contracts []ContractBrief `json:"contracts"`
}

// CarDetail — для GET /api/cars/{id}
type CarDetail struct {
    Car
    Contracts []ContractDetail `json:"contracts"`
    Fines     []Fine           `json:"fines"`
}
```

---

## 4.2 Repository interface — `internal/repository/interfaces.go`

```go
type CarRepository interface {
    List(ctx context.Context, status *CarStatus, search *string) ([]domain.Car, error)
    GetByID(ctx context.Context, id int) (*domain.Car, error)
    Create(ctx context.Context, car *domain.Car) (*domain.Car, error)
    Update(ctx context.Context, id int, car *domain.Car) (*domain.Car, error)
    UpdateStatus(ctx context.Context, id int, status domain.CarStatus) error
}
```

---

## 4.3 Repository — `internal/repository/postgres/car.go`

### `List`
```sql
SELECT * FROM cars
WHERE ($1::car_status IS NULL OR status = $1)
  AND ($2::varchar IS NULL OR plate_number ILIKE '%' || $2 || '%')
ORDER BY created_at DESC
```

### `GetByID`
```sql
SELECT * FROM cars WHERE id = $1
```
Вернуть `domain.ErrNotFound` при pgx.ErrNoRows.

### `Create`
```sql
INSERT INTO cars (plate_number, vin, brand, model, year, status, mileage, osago_before, inspection_before)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *
```

### `Update`
```sql
UPDATE cars SET plate_number=$1, vin=$2, brand=$3, model=$4, year=$5,
    status=$6, mileage=$7, osago_before=$8, inspection_before=$9
WHERE id = $10
RETURNING *
```

### `UpdateStatus` (используется из сервиса контрактов)
```sql
UPDATE cars SET status = $1 WHERE id = $2
```

---

## 4.4 DTO — `internal/dto/car.go`

```go
type CreateCarRequest struct {
    PlateNumber      string     `json:"plate_number"       validate:"required"`
    VIN              string     `json:"vin"                validate:"required"`
    Brand            string     `json:"brand"              validate:"required"`
    Model            string     `json:"model"              validate:"required"`
    Year             int        `json:"year"               validate:"required,min=1900,max=2100"`
    Status           string     `json:"status"             validate:"required,oneof=FREE RENTED REPAIR SOLD"`
    Mileage          int        `json:"mileage"            validate:"min=0"`
    OsagoBefore      *time.Time `json:"osago_before"`
    InspectionBefore *time.Time `json:"inspection_before"`
}

type UpdateCarRequest struct {
    // те же поля, что и CreateCarRequest
}

type CarsListResponse struct {
    Cars  []CarWithContractsResponse `json:"cars"`
    Total int                        `json:"total"`
}

// CarWithContractsResponse — машина + последний ACTIVE контракт с водителем
type CarWithContractsResponse struct {
    domain.Car
    Contracts []ActiveContractBrief `json:"contracts"`
}

type ActiveContractBrief struct {
    ID             int          `json:"id"`
    Status         string       `json:"status"`
    TotalAmount    string       `json:"total_amount"`
    PaidAmount     string       `json:"paid_amount"`
    MonthlyPayment string       `json:"monthly_payment"`
    StartDate      time.Time    `json:"start_date"`
    EndDate        *time.Time   `json:"end_date"`
    Driver         DriverName   `json:"driver"`
}

type DriverName struct {
    FullName string `json:"full_name"`
}
```

---

## 4.5 Service — `internal/service/car.go`

```go
type CarService struct {
    carRepo      repository.CarRepository
    contractRepo repository.ContractRepository
    fineRepo     repository.FineRepository
}

func (s *CarService) List(ctx context.Context, status *string, search *string) (*dto.CarsListResponse, error)
func (s *CarService) GetByID(ctx context.Context, id int) (*dto.CarDetailResponse, error)
func (s *CarService) Create(ctx context.Context, req *dto.CreateCarRequest) (*domain.Car, error)
func (s *CarService) Update(ctx context.Context, id int, req *dto.UpdateCarRequest) (*domain.Car, error)
```

**`List`** — загрузить машины, для каждой найти последний ACTIVE контракт с водителем (батчевый запрос, не N+1).

**`GetByID`** — загрузить машину + все контракты с водителями и последними 4 платежами + последние 3 штрафа.

**`Create`** — валидировать, создать через репозиторий.

**`Update`** — проверить существование, обновить.

---

## 4.6 Handler — `internal/handler/car.go`

| Метод  | Путь             | Описание           |
|--------|------------------|--------------------|
| GET    | `/api/cars`      | Список машин       |
| POST   | `/api/cars`      | Создать машину     |
| GET    | `/api/cars/{id}` | Детали машины      |
| PUT    | `/api/cars/{id}` | Обновить машину    |

**GET `/api/cars`** — query params: `status`, `search`.

**POST `/api/cars`** — декодировать `CreateCarRequest`, валидировать, вернуть 201.

**GET `/api/cars/{id}`** — `chi.URLParam(r, "id")`, при ErrNotFound → 404.

**PUT `/api/cars/{id}`** — декодировать `UpdateCarRequest`, валидировать, вернуть 200.

Все маршруты защищены JWT мидлварой.

---

## 4.7 Интеграция в Router

В `internal/handler/router.go` в группе с JWT:
```go
r.Mount("/api/cars", carHandler.Routes())
```

Или явно:
```go
r.Get("/api/cars", carHandler.List)
r.Post("/api/cars", carHandler.Create)
r.Get("/api/cars/{id}", carHandler.GetByID)
r.Put("/api/cars/{id}", carHandler.Update)
```

---

## Критерии выполнения
- [ ] `GET /api/cars` возвращает список с `total` и вложенными активными контрактами
- [ ] `GET /api/cars?status=FREE` фильтрует по статусу
- [ ] `GET /api/cars?search=А123` ищет по номеру (ILIKE)
- [ ] `GET /api/cars/{id}` возвращает машину с контрактами, водителями, платежами (4 шт) и штрафами (3 шт)
- [ ] `GET /api/cars/999` → 404
- [ ] `POST /api/cars` создаёт машину → 201
- [ ] `PUT /api/cars/{id}` обновляет → 200
- [ ] Decimal поля (`total_amount` и т.д.) сериализуются как строки `"25000.00"`
