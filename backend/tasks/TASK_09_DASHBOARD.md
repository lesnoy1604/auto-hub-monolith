# TASK 09 — Дашборд (`/api/dashboard`)

## Цель
Реализовать агрегированный дашборд с параллельным выполнением всех запросов к БД через `errgroup`.

## Зависимости
- TASK 01–08 выполнены

---

## 9.1 Repository — новые методы

### `CarRepository` — дополнить

```go
// CountByStatus — GROUP BY status
func (r *carRepo) CountByStatus(ctx context.Context) (map[domain.CarStatus]int, error)
```

```sql
SELECT status, COUNT(*) FROM cars GROUP BY status
```

### `ContractRepository` — дополнить

```go
// CountActive — количество активных договоров
func (r *contractRepo) CountActive(ctx context.Context) (int, error)
```

```sql
SELECT COUNT(*) FROM contracts WHERE status = 'ACTIVE'
```

### `PaymentRepository` — дополнить

```go
// AggregateOverdue — count и sum просроченных платежей
func (r *paymentRepo) AggregateOverdue(ctx context.Context) (count int, sum decimal.Decimal, err error)

// UpcomingPayments — UNPAID, due_date в ближайшие 7 дней, limit 7, с вложенными contract→car,driver
func (r *paymentRepo) UpcomingPayments(ctx context.Context) ([]dto.PaymentWithContract, error)

// CollectedThisMonth — sum(amount) PAID-платежей за текущий месяц
func (r *paymentRepo) CollectedThisMonth(ctx context.Context) (decimal.Decimal, error)

// OverdueWithDetails — все просроченные платежи с contract→car,driver
func (r *paymentRepo) OverdueWithDetails(ctx context.Context) ([]dto.OverduePaymentDetail, error)
```

### `FineRepository` — дополнить

```go
// AggregateUnpaid — count и sum неоплаченных штрафов
func (r *fineRepo) AggregateUnpaid(ctx context.Context) (count int, sum decimal.Decimal, err error)
```

---

## 9.2 SQL-запросы

### `AggregateOverdue`

```sql
SELECT COUNT(*), COALESCE(SUM(amount), 0)
FROM payments
WHERE status = 'OVERDUE'
```

### `UpcomingPayments`

```sql
SELECT p.*, 
    c.id, c.car_id, c.driver_id,
    car.id, car.plate_number,
    d.full_name
FROM payments p
JOIN contracts c ON p.contract_id = c.id
JOIN cars car ON c.car_id = car.id
JOIN drivers d ON c.driver_id = d.id
WHERE p.status = 'UNPAID'
  AND p.due_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY p.due_date ASC
LIMIT 7
```

### `CollectedThisMonth`

```sql
SELECT COALESCE(SUM(amount), 0)
FROM payments
WHERE status = 'PAID'
  AND paid_at >= DATE_TRUNC('month', NOW())
```

### `OverdueWithDetails`

```sql
SELECT p.id, p.contract_id, p.amount, p.due_date,
    c.car_id, c.driver_id,
    car.plate_number, car.brand, car.model,
    d.id as driver_id_val, d.full_name, c.id as contract_id_val
FROM payments p
JOIN contracts c ON p.contract_id = c.id
JOIN cars car ON c.car_id = car.id
JOIN drivers d ON c.driver_id = d.id
WHERE p.status = 'OVERDUE'
```

### `AggregateUnpaid` (fines)

```sql
SELECT COUNT(*), COALESCE(SUM(amount), 0)
FROM fines
WHERE status = 'UNPAID'
```

---

## 9.3 DTO — `internal/dto/dashboard.go`

```go
type DashboardResponse struct {
    Cars      CarStats      `json:"cars"`
    Contracts ContractStats `json:"contracts"`
    Payments  PaymentStats  `json:"payments"`
    Fines     FineStats     `json:"fines"`
    TopDebtors []TopDebtor  `json:"top_debtors"`
}

type CarStats struct {
    Free   int `json:"FREE"`
    Rented int `json:"RENTED"`
    Repair int `json:"REPAIR"`
    Sold   int `json:"SOLD"`
    Total  int `json:"total"`
}

type ContractStats struct {
    Active int `json:"active"`
}

type PaymentStats struct {
    OverdueCount       int                   `json:"overdue_count"`
    OverdueAmount      float64               `json:"overdue_amount"`
    CollectedThisMonth float64               `json:"collected_this_month"`
    Upcoming           []PaymentWithContract `json:"upcoming"`
}

type FineStats struct {
    UnpaidCount  int     `json:"unpaid_count"`
    UnpaidAmount float64 `json:"unpaid_amount"`
}

type TopDebtor struct {
    DriverID       int     `json:"driver_id"`
    FullName       string  `json:"full_name"`
    CarPlate       string  `json:"car_plate"`
    CarLabel       string  `json:"car_label"`
    ContractID     int     `json:"contract_id"`
    TotalOverdue   float64 `json:"total_overdue"`
    PaymentCount   int     `json:"payment_count"`
    MaxDaysOverdue int     `json:"max_days_overdue"`
}

type OverduePaymentDetail struct {
    PaymentID  int
    ContractID int
    DriverID   int
    FullName   string
    CarPlate   string
    Brand      string
    Model      string
    DueDate    time.Time
    Amount     decimal.Decimal
}
```

---

## 9.4 Service — `internal/service/dashboard.go`

```go
type DashboardService struct {
    carRepo      repository.CarRepository
    contractRepo repository.ContractRepository
    paymentRepo  repository.PaymentRepository
    fineRepo     repository.FineRepository
}

func (s *DashboardService) Get(ctx context.Context) (*dto.DashboardResponse, error)
```

### Параллельное выполнение через `errgroup`

```go
import "golang.org/x/sync/errgroup"

func (s *DashboardService) Get(ctx context.Context) (*dto.DashboardResponse, error) {
    g, gCtx := errgroup.WithContext(ctx)
    
    var (
        carCounts    map[domain.CarStatus]int
        activeContracts int
        overdueCount    int
        overdueSum      decimal.Decimal
        upcoming        []dto.PaymentWithContract
        unpaidFines     int
        unpaidFinesSum  decimal.Decimal
        collected       decimal.Decimal
        overdueDetails  []dto.OverduePaymentDetail
    )
    
    g.Go(func() error {
        var err error
        carCounts, err = s.carRepo.CountByStatus(gCtx)
        return err
    })
    
    g.Go(func() error {
        var err error
        activeContracts, err = s.contractRepo.CountActive(gCtx)
        return err
    })
    
    g.Go(func() error {
        var err error
        overdueCount, overdueSum, err = s.paymentRepo.AggregateOverdue(gCtx)
        return err
    })
    
    g.Go(func() error {
        var err error
        upcoming, err = s.paymentRepo.UpcomingPayments(gCtx)
        return err
    })
    
    g.Go(func() error {
        var err error
        unpaidFines, unpaidFinesSum, err = s.fineRepo.AggregateUnpaid(gCtx)
        return err
    })
    
    g.Go(func() error {
        var err error
        collected, err = s.paymentRepo.CollectedThisMonth(gCtx)
        return err
    })
    
    g.Go(func() error {
        var err error
        overdueDetails, err = s.paymentRepo.OverdueWithDetails(gCtx)
        return err
    })
    
    if err := g.Wait(); err != nil {
        return nil, err
    }
    
    // Построить CarStats
    carStats := buildCarStats(carCounts)
    
    // Построить TopDebtors из overdueDetails
    topDebtors := buildTopDebtors(overdueDetails)
    
    return &dto.DashboardResponse{
        Cars:      carStats,
        Contracts: dto.ContractStats{Active: activeContracts},
        Payments: dto.PaymentStats{
            OverdueCount:       overdueCount,
            OverdueAmount:      overdueSum.InexactFloat64(),
            CollectedThisMonth: collected.InexactFloat64(),
            Upcoming:           upcoming,
        },
        Fines: dto.FineStats{
            UnpaidCount:  unpaidFines,
            UnpaidAmount: unpaidFinesSum.InexactFloat64(),
        },
        TopDebtors: topDebtors,
    }, nil
}
```

Установить зависимость: `go get golang.org/x/sync`

### Функция `buildTopDebtors`

```go
func buildTopDebtors(details []dto.OverduePaymentDetail) []dto.TopDebtor {
    // 1. Сгруппировать по driver_id
    type group struct {
        fullName   string
        carPlate   string
        carLabel   string
        contractID int
        total      decimal.Decimal
        count      int
        maxDays    int
    }
    
    groups := make(map[int]*group)
    today := time.Now()
    
    for _, d := range details {
        g, ok := groups[d.DriverID]
        if !ok {
            g = &group{
                fullName:   d.FullName,
                carPlate:   d.CarPlate,
                carLabel:   d.Brand + " " + d.Model,
                contractID: d.ContractID,
            }
            groups[d.DriverID] = g
        }
        g.total = g.total.Add(d.Amount)
        g.count++
        days := int(today.Sub(d.DueDate).Hours() / 24)
        if days < 0 { days = 0 }
        if days > g.maxDays { g.maxDays = days }
    }
    
    // 2. Конвертировать в slice
    result := make([]dto.TopDebtor, 0, len(groups))
    for id, g := range groups {
        result = append(result, dto.TopDebtor{
            DriverID:       id,
            FullName:       g.fullName,
            CarPlate:       g.carPlate,
            CarLabel:       g.carLabel,
            ContractID:     g.contractID,
            TotalOverdue:   g.total.InexactFloat64(),
            PaymentCount:   g.count,
            MaxDaysOverdue: g.maxDays,
        })
    }
    
    // 3. Отсортировать по total_overdue DESC
    sort.Slice(result, func(i, j int) bool {
        return result[i].TotalOverdue > result[j].TotalOverdue
    })
    
    // 4. Вернуть top 5
    if len(result) > 5 {
        result = result[:5]
    }
    return result
}
```

---

## 9.5 Handler — `internal/handler/dashboard.go`

```go
// GET /api/dashboard
func (h *DashboardHandler) Get(w http.ResponseWriter, r *http.Request) {
    resp, err := h.svc.Get(r.Context())
    if err != nil {
        Error(w, http.StatusInternalServerError, err.Error())
        return
    }
    JSON(w, http.StatusOK, resp)
}
```

---

## 9.6 Health check — `internal/handler/health.go`

```go
// GET /api/health
func (h *HealthHandler) Check(w http.ResponseWriter, r *http.Request) {
    ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
    defer cancel()
    
    var dbTime time.Time
    err := h.pool.QueryRow(ctx, "SELECT NOW()").Scan(&dbTime)
    
    if err != nil {
        JSON(w, http.StatusInternalServerError, map[string]string{
            "status":  "error",
            "message": err.Error(),
        })
        return
    }
    
    JSON(w, http.StatusOK, map[string]any{
        "status":  "ok",
        "db_time": dbTime,
    })
}
```

---

## Критерии выполнения
- [ ] `GET /api/dashboard` возвращает все 5 блоков данных
- [ ] Все 7 запросов выполняются параллельно через `errgroup`
- [ ] `cars.total` = сумма по всем статусам
- [ ] `payments.upcoming` — только ближайшие 7 дней, не более 7 записей
- [ ] `top_debtors` — 5 водителей с наибольшей суммой просроченных платежей
- [ ] `max_days_overdue` — максимум `(today - due_date).days` среди платежей водителя
- [ ] `GET /api/health` → `{"status": "ok", "db_time": "..."}` при живой БД
- [ ] `GET /api/health` → 500 при недоступной БД
