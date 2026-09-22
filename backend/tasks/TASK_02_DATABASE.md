# TASK 02 — Схема базы данных и миграции

## Цель
Написать SQL-миграции через goose, создать все таблицы, enum-типы, индексы и триггер автообновления `updated_at`.

## Зависимости
- TASK 01 выполнен

## Задачи

### 2.1 `migrations/001_create_enums.sql`

```sql
-- +goose Up
CREATE TYPE car_status AS ENUM ('FREE', 'RENTED', 'REPAIR', 'SOLD');
CREATE TYPE contract_status AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE payment_status AS ENUM ('PAID', 'UNPAID', 'OVERDUE');
CREATE TYPE fine_status AS ENUM ('UNPAID', 'PAID', 'DISPUTED');
CREATE TYPE driver_status AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER');

-- +goose Down
DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS driver_status;
DROP TYPE IF EXISTS fine_status;
DROP TYPE IF EXISTS payment_status;
DROP TYPE IF EXISTS contract_status;
DROP TYPE IF EXISTS car_status;
```

### 2.2 `migrations/002_create_cars.sql`

Таблица `cars`:
- `id` SERIAL PRIMARY KEY
- `plate_number` VARCHAR UNIQUE NOT NULL
- `vin` VARCHAR UNIQUE NOT NULL
- `brand` VARCHAR NOT NULL
- `model` VARCHAR NOT NULL
- `year` INTEGER NOT NULL
- `status` car_status NOT NULL DEFAULT 'FREE'
- `mileage` INTEGER NOT NULL DEFAULT 0
- `osago_before` TIMESTAMPTZ NULLABLE
- `inspection_before` TIMESTAMPTZ NULLABLE
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

Индексы: `idx_cars_status`, `idx_cars_plate_number`

### 2.3 `migrations/003_create_drivers.sql`

Таблица `drivers`:
- `id` SERIAL PRIMARY KEY
- `full_name` VARCHAR NOT NULL
- `phone` VARCHAR UNIQUE NOT NULL
- `passport_num` VARCHAR UNIQUE NOT NULL
- `license_num` VARCHAR UNIQUE NOT NULL
- `status` driver_status NOT NULL DEFAULT 'ACTIVE'
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

Индексы: `idx_drivers_status`, `idx_drivers_full_name` (для ilike поиска — тип `gin` с `pg_trgm`)

### 2.4 `migrations/004_create_users.sql`

Таблица `users`:
- `id` SERIAL PRIMARY KEY
- `email` VARCHAR UNIQUE NOT NULL
- `password_hash` VARCHAR NOT NULL
- `full_name` VARCHAR NOT NULL
- `role` user_role NOT NULL DEFAULT 'MANAGER'
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

### 2.5 `migrations/005_create_contracts.sql`

Таблица `contracts`:
- `id` SERIAL PRIMARY KEY
- `car_id` INTEGER NOT NULL REFERENCES cars(id)
- `driver_id` INTEGER NOT NULL REFERENCES drivers(id)
- `status` contract_status NOT NULL DEFAULT 'ACTIVE'
- `total_amount` DECIMAL(12,2) NOT NULL
- `paid_amount` DECIMAL(12,2) NOT NULL DEFAULT 0
- `monthly_payment` DECIMAL(10,2) NOT NULL
- `start_date` TIMESTAMPTZ NOT NULL
- `end_date` TIMESTAMPTZ NULLABLE
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

Индексы: `idx_contracts_car_id`, `idx_contracts_driver_id`, `idx_contracts_status`

### 2.6 `migrations/006_create_payments.sql`

Таблица `payments`:
- `id` SERIAL PRIMARY KEY
- `contract_id` INTEGER NOT NULL REFERENCES contracts(id)
- `amount` DECIMAL(10,2) NOT NULL
- `status` payment_status NOT NULL DEFAULT 'UNPAID'
- `due_date` TIMESTAMPTZ NOT NULL
- `paid_at` TIMESTAMPTZ NULLABLE
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

Индексы: `idx_payments_contract_id`, `idx_payments_status`, `idx_payments_due_date`

### 2.7 `migrations/007_create_fines.sql`

Таблица `fines`:
- `id` SERIAL PRIMARY KEY
- `car_id` INTEGER NOT NULL REFERENCES cars(id)
- `driver_id` INTEGER NOT NULL REFERENCES drivers(id)
- `contract_id` INTEGER NULLABLE REFERENCES contracts(id)
- `amount` DECIMAL(10,2) NOT NULL
- `description` TEXT NOT NULL
- `fine_date` TIMESTAMPTZ NOT NULL
- `status` fine_status NOT NULL DEFAULT 'UNPAID'
- `paid_at` TIMESTAMPTZ NULLABLE
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

Индексы: `idx_fines_car_id`, `idx_fines_driver_id`, `idx_fines_status`

### 2.8 `migrations/008_create_triggers.sql`

Создать функцию и триггеры `updated_at` для таблиц `cars`, `drivers`, `contracts`, `users`:

```sql
-- +goose Up
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Повторить для каждой таблицы:
CREATE TRIGGER trg_cars_updated_at
  BEFORE UPDATE ON cars
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- ... drivers, contracts, users
```

### 2.9 Database pool `internal/db/postgres.go`

```go
func NewPool(ctx context.Context, databaseURL string) (*pgxpool.Pool, error)
```

- Настройки пула: `MaxConns: 25`, `MinConns: 5`
- Проверка соединения через `pool.Ping(ctx)`

### 2.10 Seeder (опционально, для разработки)

Файл `cmd/seed/main.go` — создать тестового пользователя admin:
```
email: admin@autohub.ru
password: admin123
role: ADMIN
```

## Критерии выполнения
- [ ] `make migrate-up` выполняется без ошибок
- [ ] `make migrate-down` откатывает последнюю миграцию
- [ ] Все таблицы созданы с правильными типами и ограничениями
- [ ] Триггер `updated_at` работает при UPDATE
- [ ] Pool соединений создаётся и ping проходит
