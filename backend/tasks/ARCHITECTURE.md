# Архитектура Go-бэкенда — Auto Hub CRM

## Стек технологий

| Слой             | Библиотека                    | Версия   | Обоснование                                          |
|------------------|-------------------------------|----------|------------------------------------------------------|
| HTTP Router      | `go-chi/chi/v5`               | v5       | Лёгкий, идиоматичный, совместим со стандартной lib   |
| PostgreSQL       | `jackc/pgx/v5` + `pgxpool`    | v5       | Нативный драйвер, лучшая производительность          |
| Миграции         | `pressly/goose/v3`            | v3       | Embedded SQL-файлы, простой CLI                      |
| JWT              | `golang-jwt/jwt/v5`           | v5       | Стандартный, активно поддерживается                  |
| Пароли           | `x/crypto/bcrypt`             | stdlib   | Стандартный bcrypt из стандартной библиотеки Go      |
| Decimal          | `shopspring/decimal`          | latest   | Точные денежные вычисления без потерь float          |
| Валидация        | `go-playground/validator/v10` | v10      | Декларативные теги, поддержка кириллицы              |
| Логирование      | `rs/zerolog`                  | latest   | Структурированный JSON-лог, zero allocation          |
| Параллелизм      | `golang.org/x/sync/errgroup`  | stdlib   | Параллельные запросы дашборда с cancel-контекстом    |
| CORS             | `rs/cors`                     | latest   | Гибкая настройка CORS                                |
| Конфиг           | `joho/godotenv`               | latest   | Загрузка .env файла                                  |
| Тесты            | `stretchr/testify`            | latest   | assert/require/mock                                  |

---

## Архитектурный паттерн: Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     HTTP Layer                          │
│   handler/  ←  middleware/  ←  dto/                    │
│   (chi router, JWT auth, logging, recovery, CORS)       │
└────────────────────────┬────────────────────────────────┘
                         │ вызов
┌────────────────────────▼────────────────────────────────┐
│                   Service Layer                         │
│   service/  (бизнес-логика, транзакции, errgroup)       │
└────────────────────────┬────────────────────────────────┘
                         │ через интерфейсы
┌────────────────────────▼────────────────────────────────┐
│                 Repository Layer                        │
│   repository/postgres/  (SQL через pgx, pgxpool)        │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                  PostgreSQL 16                          │
│   (DECIMAL, ENUM, Triggers, Indexes)                    │
└─────────────────────────────────────────────────────────┘
```

### Почему не ORM (GORM/Ent)?
- Полный контроль над SQL-запросами (важно для JOIN/агрегаций дашборда)
- Нет N+1 сюрпризов
- Нет магии — проще дебажить
- pgx/v5 сам по себе очень удобен

### Почему не sqlc?
sqlc отличный инструмент, но генерирует жёсткие структуры под каждый запрос. При наших вложенных ответах (car→contracts→payments→driver) ручной маппинг через pgx даёт больше гибкости.

---

## Поток данных (на примере POST /api/contracts)

```
Client
  │ POST /api/contracts {car_id, driver_id, ...}
  ▼
middleware.Auth(JWT validation)
  ▼
handler.CreateContract(w, r)
  │ decode + validate DTO
  ▼
service.ContractService.Create(ctx, req)
  │
  ├── carRepo.GetByID(carID)          → проверить существование
  ├── if car.Status != FREE → 409
  │
  ├── db.Begin(ctx)                   → транзакция
  │   ├── contractRepo.Create(tx)     → INSERT contract
  │   ├── carRepo.UpdateStatus(tx)    → UPDATE car SET status='RENTED'
  │   └── paymentRepo.BulkCreate(tx)  → INSERT payments (график)
  └── tx.Commit()
  ▼
handler: JSON(w, 201, contract)
  ▼
Client ← {id, car_id, driver_id, status, ...}
```

---

## Масштабируемость

### Горизонтальное масштабирование
- Stateless сервис (JWT не требует сессий на сервере)
- `pgxpool` — пул соединений с PostgreSQL
- Все состояния в БД → можно запустить N инстансов за load balancer

### Вертикальное масштабирование
- `errgroup` для параллельных запросов дашборда
- Индексы на все FK и filtered-колонки
- DECIMAL в БД, никаких float-сумм

### Будущие улучшения (если потребуется)
- Redis для кэша дашборда (TTL 60с)
- Pagination для списков (LIMIT/OFFSET или cursor-based)
- Background job для auto-update UNPAID → OVERDUE по расписанию

---

## Структура файлов

```
auto-hub-backend/
├── cmd/api/main.go
├── internal/
│   ├── config/config.go
│   ├── domain/          # entities + enums + sentinel errors
│   ├── repository/      # interfaces + postgres implementations
│   ├── service/         # business logic + transactions
│   ├── handler/         # HTTP handlers + router + response helpers
│   ├── middleware/       # auth, logger, recovery
│   └── dto/             # request/response types
├── migrations/          # SQL файлы goose
├── tasks/               # задания (этот файл)
├── Dockerfile
├── docker-compose.yml
├── Makefile
├── .env.example
└── go.mod
```

---

## Порядок реализации

| # | Задание                       | Файл                        |
|---|-------------------------------|-----------------------------|
| 1 | Инициализация + конфиг        | `TASK_01_SETUP.md`          |
| 2 | Миграции + схема БД           | `TASK_02_DATABASE.md`       |
| 3 | Аутентификация (JWT)          | `TASK_03_AUTH.md`           |
| 4 | CRUD Машины                   | `TASK_04_CARS.md`           |
| 5 | CRUD Водители                 | `TASK_05_DRIVERS.md`        |
| 6 | Договоры + платёжный график   | `TASK_06_CONTRACTS.md`      |
| 7 | Оплата платежей               | `TASK_07_PAYMENTS.md`       |
| 8 | Штрафы                        | `TASK_08_FINES.md`          |
| 9 | Дашборд + Health check        | `TASK_09_DASHBOARD.md`      |
| 10| Тесты + Docker + полировка    | `TASK_10_TESTS_AND_POLISH.md` |
