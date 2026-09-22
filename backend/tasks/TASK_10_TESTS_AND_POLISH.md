# TASK 10 — Тесты, middleware и финальная полировка

## Цель
Покрыть бизнес-логику unit-тестами, добавить middleware логирования, настроить CORS, обработку ошибок и подготовить проект к деплою.

## Зависимости
- TASK 01–09 выполнены

---

## 10.1 Unit-тесты сервисов

### `internal/service/contract_test.go`

Тестировать `generatePaymentSchedule` — чистую функцию, не требует моков:

```go
func TestGeneratePaymentSchedule(t *testing.T) {
    tests := []struct {
        name           string
        totalAmount    float64
        monthlyPayment float64
        wantCount      int
        wantLastAmount float64
    }{
        {
            name:           "равные платежи",
            totalAmount:    100000,
            monthlyPayment: 25000,
            wantCount:      4,
            wantLastAmount: 25000,
        },
        {
            name:           "последний платёж меньше",
            totalAmount:    110000,
            monthlyPayment: 25000,
            wantCount:      5,
            wantLastAmount: 10000,
        },
        {
            name:           "один платёж",
            totalAmount:    25000,
            monthlyPayment: 30000,
            wantCount:      1,
            wantLastAmount: 25000,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            contract := &domain.Contract{
                TotalAmount:    decimal.NewFromFloat(tt.totalAmount),
                MonthlyPayment: decimal.NewFromFloat(tt.monthlyPayment),
                StartDate:      time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC),
            }
            payments := generatePaymentSchedule(contract)
            
            assert.Len(t, payments, tt.wantCount)
            assert.Equal(t, tt.wantLastAmount, payments[len(payments)-1].Amount.InexactFloat64())
            
            // Проверить что даты идут по возрастанию
            for i := 1; i < len(payments); i++ {
                assert.True(t, payments[i].DueDate.After(payments[i-1].DueDate))
            }
        })
    }
}
```

### `internal/service/dashboard_test.go`

Тестировать `buildTopDebtors`:

```go
func TestBuildTopDebtors(t *testing.T) {
    // Создать 6 просроченных платежей от 3 разных водителей
    // Проверить что вернётся не более 5
    // Проверить сортировку по total_overdue DESC
    // Проверить корректность max_days_overdue
}
```

### `internal/service/fine_test.go`

Тестировать через мок-репозитории:

```go
// Мок ContractRepository
type mockContractRepo struct {
    activeContract *domain.Contract
    err            error
}

func TestFineService_Create_AutoDetectDriver(t *testing.T) {
    // Тест: driver_id не передан → берётся из активного договора
}

func TestFineService_Create_NoActiveContract(t *testing.T) {
    // Тест: driver_id не передан, нет активного договора → ErrDriverNotFound
}

func TestFineService_Update_PaidAt(t *testing.T) {
    // Тест: status=PAID без paid_at → paid_at = now()
    // Тест: status=PAID с paid_at → paid_at из запроса
    // Тест: status=DISPUTED → paid_at = nil
}
```

---

## 10.2 Middleware — `internal/middleware/logger.go`

Использовать `zerolog` для логирования входящих запросов:

```go
func Logger(logger zerolog.Logger) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            start := time.Now()
            ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
            
            defer func() {
                logger.Info().
                    Str("method", r.Method).
                    Str("path", r.URL.Path).
                    Int("status", ww.Status()).
                    Dur("latency", time.Since(start)).
                    Str("request_id", middleware.GetReqID(r.Context())).
                    Msg("request")
            }()
            
            next.ServeHTTP(ww, r)
        })
    }
}
```

---

## 10.3 CORS middleware

```go
// в router.go
r.Use(cors.Handler(cors.Options{
    AllowedOrigins:   []string{"*"}, // в проде — конкретный домен
    AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
    AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
    AllowCredentials: false,
    MaxAge:           300,
}))
```

Установить: `go get github.com/rs/cors`

---

## 10.4 Централизованная обработка ошибок

В `internal/handler/response.go` добавить маппер:

```go
func HandleServiceError(w http.ResponseWriter, err error) {
    switch {
    case errors.Is(err, domain.ErrNotFound):
        Error(w, http.StatusNotFound, "Resource not found")
    case errors.Is(err, domain.ErrConflict), errors.Is(err, domain.ErrCarNotFree):
        Error(w, http.StatusConflict, err.Error())
    case errors.Is(err, domain.ErrAlreadyPaid):
        Error(w, http.StatusConflict, "Payment is already paid")
    case errors.Is(err, domain.ErrUnauthorized):
        Error(w, http.StatusUnauthorized, "Unauthorized")
    case errors.Is(err, domain.ErrValidation), errors.Is(err, domain.ErrDriverNotFound):
        Error(w, http.StatusBadRequest, err.Error())
    default:
        // Логировать неожиданные ошибки
        Error(w, http.StatusInternalServerError, "Internal server error")
    }
}
```

---

## 10.5 Валидатор — инициализация singleton

```go
// internal/handler/validator.go
var validate = validator.New()

func ValidateRequest(r *http.Request, dst any) error {
    if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
        return fmt.Errorf("%w: %s", domain.ErrValidation, err.Error())
    }
    if err := validate.Struct(dst); err != nil {
        return fmt.Errorf("%w: %s", domain.ErrValidation, err.Error())
    }
    return nil
}
```

---

## 10.6 Dockerfile

```dockerfile
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/api ./cmd/api

FROM alpine:3.20
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /bin/api .
COPY migrations ./migrations
EXPOSE 8080
CMD ["./api"]
```

---

## 10.7 docker-compose.yml (для разработки)

```yaml
version: "3.9"
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: autohub
      POSTGRES_USER: autohub
      POSTGRES_PASSWORD: autohub
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: postgresql://autohub:autohub@db:5432/autohub
      JWT_SECRET: dev-secret-key
    depends_on:
      - db

volumes:
  pgdata:
```

---

## 10.8 Финальный чеклист

### Общее
- [ ] `go build ./...` — без ошибок
- [ ] `go vet ./...` — без предупреждений  
- [ ] `go test ./...` — все тесты проходят

### Безопасность
- [ ] JWT-токен проверяется на каждом защищённом маршруте
- [ ] Пароли хранятся как bcrypt hash (cost ≥ 10)
- [ ] `JWT_SECRET` не hardcoded, только из env

### Транзакции
- [ ] Создание контракта: атомарно (контракт + статус машины + платежи)
- [ ] Закрытие контракта: атомарно (обновление + статус машины)
- [ ] Оплата платежа: атомарно (платёж + paid_amount договора)

### Корректность данных
- [ ] Decimal хранится в БД как DECIMAL(12,2), сериализуется в JSON как строка
- [ ] Вычисляемые поля (remaining_balance, total_overdue) → float64
- [ ] Timestamps → ISO 8601 (time.Time сериализуется автоматически)
- [ ] `updated_at` обновляется через триггер PostgreSQL

### Производительность
- [ ] Нет N+1 запросов (батчевые SELECT / JOIN вместо цикла)
- [ ] Дашборд: все 7 запросов параллельны через errgroup
- [ ] Индексы на все FK и frequently-filtered колонки

### API соответствие
- [ ] Все эндпоинты из BACKEND.md реализованы
- [ ] Все коды ответов соответствуют спецификации (200/201/400/401/404/409/500)
- [ ] `GET /api/health` работает без авторизации
- [ ] `POST /api/auth/login` работает без авторизации
