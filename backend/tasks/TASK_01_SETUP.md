# TASK 01 — Инициализация проекта и архитектура

## Цель
Создать скелет Go-проекта с правильной структурой пакетов, настроить зависимости и конфигурацию.

## Стек технологий

| Компонент        | Библиотека                         | Назначение                        |
|------------------|------------------------------------|-----------------------------------|
| HTTP роутер      | `go-chi/chi/v5`                    | REST API маршрутизация            |
| PostgreSQL       | `jackc/pgx/v5` + `pgxpool`         | Драйвер + пул соединений          |
| SQL генератор    | `sqlc`                             | Типобезопасные SQL-запросы        |
| Миграции         | `pressly/goose/v3`                 | Управление схемой БД              |
| JWT              | `golang-jwt/jwt/v5`                | Аутентификация                    |
| Пароли           | `golang.org/x/crypto/bcrypt`       | Хэширование паролей               |
| Валидация        | `go-playground/validator/v10`      | Валидация входящих запросов       |
| Логгер           | `rs/zerolog`                       | Структурированное логирование     |
| Тесты            | `stretchr/testify`                 | Assertions + моки                 |
| Env              | `joho/godotenv`                    | Загрузка `.env` файла             |

## Структура проекта

```
auto-hub-backend/
├── cmd/
│   └── api/
│       └── main.go              # точка входа
├── internal/
│   ├── config/
│   │   └── config.go            # конфиг из env-переменных
│   ├── domain/
│   │   ├── car.go               # entity + enums CarStatus
│   │   ├── driver.go            # entity + enums DriverStatus
│   │   ├── contract.go          # entity + enums ContractStatus
│   │   ├── payment.go           # entity + enums PaymentStatus
│   │   ├── fine.go              # entity + enums FineStatus
│   │   ├── user.go              # entity + enums UserRole
│   │   └── errors.go            # sentinel errors (ErrNotFound, ErrConflict, etc.)
│   ├── repository/
│   │   ├── interfaces.go        # интерфейсы всех репозиториев
│   │   └── postgres/
│   │       ├── car.go
│   │       ├── driver.go
│   │       ├── contract.go
│   │       ├── payment.go
│   │       ├── fine.go
│   │       └── user.go
│   ├── service/
│   │   ├── car.go
│   │   ├── driver.go
│   │   ├── contract.go
│   │   ├── payment.go
│   │   ├── fine.go
│   │   ├── dashboard.go
│   │   └── auth.go
│   ├── handler/
│   │   ├── router.go            # сборка всех маршрутов
│   │   ├── car.go
│   │   ├── driver.go
│   │   ├── contract.go
│   │   ├── payment.go
│   │   ├── fine.go
│   │   ├── dashboard.go
│   │   ├── auth.go
│   │   └── health.go
│   ├── middleware/
│   │   ├── auth.go              # JWT-мидлвара
│   │   ├── logger.go            # логирование запросов
│   │   └── recovery.go          # паника → 500
│   └── dto/
│       ├── car.go               # request/response DTO
│       ├── driver.go
│       ├── contract.go
│       ├── payment.go
│       ├── fine.go
│       ├── dashboard.go
│       └── auth.go
├── migrations/
│   ├── 001_create_enums.sql
│   ├── 002_create_cars.sql
│   ├── 003_create_drivers.sql
│   ├── 004_create_users.sql
│   ├── 005_create_contracts.sql
│   ├── 006_create_payments.sql
│   ├── 007_create_fines.sql
│   └── 008_create_triggers.sql
├── .env.example
├── .env
├── go.mod
├── go.sum
└── Makefile
```

## Задачи

### 1.1 Инициализировать модуль
```bash
go mod init github.com/your-org/auto-hub-backend
```

### 1.2 Установить зависимости
```bash
go get github.com/go-chi/chi/v5
go get github.com/go-chi/chi/v5/middleware
go get github.com/jackc/pgx/v5
go get github.com/jackc/pgx/v5/pgxpool
go get github.com/pressly/goose/v3
go get github.com/golang-jwt/jwt/v5
go get golang.org/x/crypto/bcrypt
go get github.com/go-playground/validator/v10
go get github.com/rs/zerolog
go get github.com/joho/godotenv
go get github.com/stretchr/testify
```

### 1.3 Конфигурация `internal/config/config.go`

```go
type Config struct {
    DatabaseURL string
    JWTSecret   string
    Port        string // default "8080"
    Env         string // "development" | "production"
}

func Load() (*Config, error)  // читает os.Getenv, возвращает ошибку если обязательные поля пусты
```

Обязательные: `DATABASE_URL`, `JWT_SECRET`.

### 1.4 `.env.example`
```env
DATABASE_URL=postgresql://user:password@localhost:5432/autohub
JWT_SECRET=change-me-in-production
PORT=8080
ENV=development
```

### 1.5 `Makefile`

Targets:
- `make run` — запустить сервер
- `make migrate-up` — применить миграции
- `make migrate-down` — откатить одну миграцию
- `make build` — собрать бинарник в `./bin/api`
- `make test` — запустить тесты

### 1.6 `domain/errors.go`

```go
var (
    ErrNotFound       = errors.New("not found")
    ErrConflict       = errors.New("conflict")
    ErrUnauthorized   = errors.New("unauthorized")
    ErrValidation     = errors.New("validation error")
    ErrAlreadyPaid    = errors.New("payment already paid")
    ErrCarNotFree     = errors.New("car is not free")
    ErrDriverNotFound = errors.New("driver not found for car")
)
```

### 1.7 `cmd/api/main.go` — точка входа

Порядок инициализации:
1. Загрузить `.env` (godotenv)
2. Прочитать `config.Load()`
3. Создать `pgxpool.New(ctx, cfg.DatabaseURL)`
4. Выполнить миграции через goose
5. Собрать репозитории, сервисы, хэндлеры
6. Запустить `http.ListenAndServe`

## Критерии выполнения
- [ ] `go build ./...` проходит без ошибок
- [ ] `go vet ./...` — без предупреждений
- [ ] Структура папок соответствует схеме выше
- [ ] `make run` запускает сервер на порту 8080
