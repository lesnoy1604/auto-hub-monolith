# Backend Reference — Rent Cars CRM

Документация для написания Python-бэкенда. Описывает структуру БД, все связи, endpoint-ы и форматы данных.

---

## 1. База данных

**СУБД:** PostgreSQL  
**Подключение:** переменная окружения `DATABASE_URL`

---

## 2. Перечисления (Enums)

```python
class CarStatus(str, Enum):
    FREE    = "FREE"     # свободна
    RENTED  = "RENTED"   # в аренде
    REPAIR  = "REPAIR"   # в ремонте
    SOLD    = "SOLD"     # продана

class ContractStatus(str, Enum):
    ACTIVE    = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class PaymentStatus(str, Enum):
    PAID    = "PAID"
    UNPAID  = "UNPAID"
    OVERDUE = "OVERDUE"

class FineStatus(str, Enum):
    UNPAID   = "UNPAID"
    PAID     = "PAID"
    DISPUTED = "DISPUTED"

class DriverStatus(str, Enum):
    ACTIVE   = "ACTIVE"
    INACTIVE = "INACTIVE"

class UserRole(str, Enum):
    ADMIN   = "ADMIN"
    MANAGER = "MANAGER"
```

---

## 3. Схема таблиц

### `cars`

| Колонка            | Тип                 | Ограничения                       |
|--------------------|---------------------|-----------------------------------|
| `id`               | `SERIAL`            | PRIMARY KEY                       |
| `plate_number`     | `VARCHAR`           | UNIQUE NOT NULL                   |
| `vin`              | `VARCHAR`           | UNIQUE NOT NULL                   |
| `brand`            | `VARCHAR`           | NOT NULL                          |
| `model`            | `VARCHAR`           | NOT NULL                          |
| `year`             | `INTEGER`           | NOT NULL                          |
| `status`           | `CarStatus`         | NOT NULL DEFAULT 'FREE'           |
| `mileage`          | `INTEGER`           | NOT NULL DEFAULT 0                |
| `osago_before`     | `TIMESTAMP`         | NULLABLE                          |
| `inspection_before`| `TIMESTAMP`         | NULLABLE                          |
| `created_at`       | `TIMESTAMP`         | NOT NULL DEFAULT now()            |
| `updated_at`       | `TIMESTAMP`         | NOT NULL (auto-update on write)   |

**Связи:** → `contracts` (1:M), → `fines` (1:M)

---

### `drivers`

| Колонка       | Тип             | Ограничения                     |
|---------------|-----------------|---------------------------------|
| `id`          | `SERIAL`        | PRIMARY KEY                     |
| `full_name`   | `VARCHAR`       | NOT NULL                        |
| `phone`       | `VARCHAR`       | UNIQUE NOT NULL                 |
| `passport_num`| `VARCHAR`       | UNIQUE NOT NULL                 |
| `license_num` | `VARCHAR`       | UNIQUE NOT NULL                 |
| `status`      | `DriverStatus`  | NOT NULL DEFAULT 'ACTIVE'       |
| `created_at`  | `TIMESTAMP`     | NOT NULL DEFAULT now()          |
| `updated_at`  | `TIMESTAMP`     | NOT NULL (auto-update on write) |

**Связи:** → `contracts` (1:M), → `fines` (1:M)

---

### `contracts`

| Колонка          | Тип                | Ограничения                     |
|------------------|--------------------|---------------------------------|
| `id`             | `SERIAL`           | PRIMARY KEY                     |
| `car_id`         | `INTEGER`          | FK → cars.id NOT NULL           |
| `driver_id`      | `INTEGER`          | FK → drivers.id NOT NULL        |
| `status`         | `ContractStatus`   | NOT NULL DEFAULT 'ACTIVE'       |
| `total_amount`   | `DECIMAL(12,2)`    | NOT NULL                        |
| `paid_amount`    | `DECIMAL(12,2)`    | NOT NULL DEFAULT 0              |
| `monthly_payment`| `DECIMAL(10,2)`    | NOT NULL                        |
| `start_date`     | `TIMESTAMP`        | NOT NULL                        |
| `end_date`       | `TIMESTAMP`        | NULLABLE                        |
| `created_at`     | `TIMESTAMP`        | NOT NULL DEFAULT now()          |
| `updated_at`     | `TIMESTAMP`        | NOT NULL (auto-update on write) |

**Связи:** → `payments` (1:M), → `fines` (1:M, optional)

---

### `payments`

| Колонка       | Тип             | Ограничения                |
|---------------|-----------------|----------------------------|
| `id`          | `SERIAL`        | PRIMARY KEY                |
| `contract_id` | `INTEGER`       | FK → contracts.id NOT NULL |
| `amount`      | `DECIMAL(10,2)` | NOT NULL                   |
| `status`      | `PaymentStatus` | NOT NULL DEFAULT 'UNPAID'  |
| `due_date`    | `TIMESTAMP`     | NOT NULL                   |
| `paid_at`     | `TIMESTAMP`     | NULLABLE                   |
| `created_at`  | `TIMESTAMP`     | NOT NULL DEFAULT now()     |

**Связи:** → `contracts` (M:1)

---

### `fines`

| Колонка       | Тип           | Ограничения                         |
|---------------|---------------|-------------------------------------|
| `id`          | `SERIAL`      | PRIMARY KEY                         |
| `car_id`      | `INTEGER`     | FK → cars.id NOT NULL               |
| `driver_id`   | `INTEGER`     | FK → drivers.id NOT NULL            |
| `contract_id` | `INTEGER`     | FK → contracts.id NULLABLE          |
| `amount`      | `DECIMAL(10,2)`| NOT NULL                           |
| `description` | `TEXT`        | NOT NULL                            |
| `fine_date`   | `TIMESTAMP`   | NOT NULL                            |
| `status`      | `FineStatus`  | NOT NULL DEFAULT 'UNPAID'           |
| `paid_at`     | `TIMESTAMP`   | NULLABLE                            |
| `created_at`  | `TIMESTAMP`   | NOT NULL DEFAULT now()              |

**Связи:** → `cars` (M:1), → `drivers` (M:1), → `contracts` (M:1, optional)

---

### `users`

| Колонка         | Тип         | Ограничения                     |
|-----------------|-------------|---------------------------------|
| `id`            | `SERIAL`    | PRIMARY KEY                     |
| `email`         | `VARCHAR`   | UNIQUE NOT NULL                 |
| `password_hash` | `VARCHAR`   | NOT NULL                        |
| `full_name`     | `VARCHAR`   | NOT NULL                        |
| `role`          | `UserRole`  | NOT NULL DEFAULT 'MANAGER'      |
| `created_at`    | `TIMESTAMP` | NOT NULL DEFAULT now()          |
| `updated_at`    | `TIMESTAMP` | NOT NULL (auto-update on write) |

---

## 4. ER-диаграмма связей

```
users (самостоятельная таблица)

cars ──────────────────────────────────── contracts ──── payments
  │                                           │
  └──────── fines ──── drivers ───────────────┘
                │
                └── (contract_id NULLABLE → contracts)
```

```
cars       1 ──── M  contracts
cars       1 ──── M  fines
drivers    1 ──── M  contracts
drivers    1 ──── M  fines
contracts  1 ──── M  payments
contracts  1 ──── M  fines  (опционально)
```

---

## 5. Аутентификация

**Метод:** JWT (HS256)  
**Хэширование паролей:** bcrypt  
**Поля токена:** `id`, `email`, `name` (full_name), `role`

### `POST /api/auth/login`

**Тело запроса:**
```json
{ "email": "string", "password": "string" }
```

**Логика:**
1. Найти пользователя по `email`
2. `bcrypt.verify(password, user.password_hash)`
3. При успехе — выдать JWT с payload `{ id, email, name, role }`

**Ответ (200):**
```json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

**Ошибки:** `401` — неверный email или пароль

---

## 6. Endpoints

> Все защищённые маршруты требуют заголовка `Authorization: Bearer <token>`.  
> Формат дат: ISO 8601 (`2025-01-15T00:00:00.000Z`).  
> Decimal-поля возвращаются как строки (`"15000.00"`).

---

### Машины (`/api/cars`)

---

#### `GET /api/cars`

**Query-параметры:**

| Параметр | Тип    | Описание                           |
|----------|--------|------------------------------------|
| `status` | string | Фильтр по CarStatus (пусто = все)  |
| `search` | string | Поиск по plate_number (ilike)      |

**Ответ (200):**
```json
{
  "cars": [
    {
      "id": 1,
      "plate_number": "А123БВ77",
      "vin": "XTA...",
      "brand": "Toyota",
      "model": "Camry",
      "year": 2020,
      "status": "RENTED",
      "mileage": 45000,
      "osago_before": "2025-06-01T00:00:00.000Z",
      "inspection_before": null,
      "created_at": "...",
      "updated_at": "...",
      "contracts": [
        {
          "id": 5,
          "status": "ACTIVE",
          "total_amount": "500000.00",
          "paid_amount": "100000.00",
          "monthly_payment": "25000.00",
          "start_date": "...",
          "end_date": null,
          "driver": { "full_name": "Иванов Иван Иванович" }
        }
      ]
    }
  ],
  "total": 12
}
```

> `contracts` — только ACTIVE, берётся последний по `created_at`, с вложенным `driver.full_name`.

---

#### `POST /api/cars`

**Тело:**
```json
{
  "plate_number": "А123БВ77",
  "vin": "XTA123456789",
  "brand": "Toyota",
  "model": "Camry",
  "year": 2020,
  "status": "FREE",
  "mileage": 0,
  "osago_before": "2026-01-01T00:00:00.000Z",
  "inspection_before": null
}
```

**Ответ (201):** объект Car (без relations)

---

#### `GET /api/cars/{id}`

**Ответ (200):**
```json
{
  "id": 1,
  "plate_number": "...",
  "vin": "...",
  "brand": "...",
  "model": "...",
  "year": 2020,
  "status": "RENTED",
  "mileage": 45000,
  "osago_before": "...",
  "inspection_before": null,
  "created_at": "...",
  "updated_at": "...",
  "contracts": [
    {
      "id": 5,
      "car_id": 1,
      "driver_id": 3,
      "status": "ACTIVE",
      "total_amount": "500000.00",
      "paid_amount": "100000.00",
      "monthly_payment": "25000.00",
      "start_date": "...",
      "end_date": null,
      "created_at": "...",
      "updated_at": "...",
      "driver": { /* полный объект Driver */ },
      "payments": [ /* последние 4, order by due_date DESC */ ]
    }
  ],
  "fines": [ /* последние 3, order by fine_date DESC */ ]
}
```

**Ошибки:** `404`

---

#### `PUT /api/cars/{id}`

**Тело:** те же поля, что и при `POST` (все обязательны кроме дат)

**Ответ (200):** обновлённый объект Car (без relations)

---

### Водители (`/api/drivers`)

---

#### `GET /api/drivers`

**Query-параметры:**

| Параметр | Тип    | Описание                          |
|----------|--------|-----------------------------------|
| `status` | string | Фильтр по DriverStatus            |
| `search` | string | Поиск по full_name (ilike)        |

**Ответ (200):**
```json
{
  "drivers": [
    {
      "id": 3,
      "full_name": "Иванов Иван Иванович",
      "phone": "+79001234567",
      "passport_num": "4510 123456",
      "license_num": "77 АА 123456",
      "status": "ACTIVE",
      "created_at": "...",
      "updated_at": "...",
      "contracts": [
        {
          "id": 5,
          "status": "ACTIVE",
          "car": { "plate_number": "А123БВ77", "brand": "Toyota", "model": "Camry" }
        }
      ]
    }
  ],
  "total": 8
}
```

> `contracts` — только ACTIVE, последний по `created_at`, с вложенным `car.{plate_number, brand, model}`.

---

#### `POST /api/drivers`

**Тело:**
```json
{
  "full_name": "Иванов Иван Иванович",
  "phone": "+79001234567",
  "passport_num": "4510 123456",
  "license_num": "77 АА 123456",
  "status": "ACTIVE"
}
```

**Ответ (201):** объект Driver (без relations)

---

#### `GET /api/drivers/{id}`

**Ответ (200):**
```json
{
  "id": 3,
  "full_name": "...",
  "phone": "...",
  "passport_num": "...",
  "license_num": "...",
  "status": "ACTIVE",
  "created_at": "...",
  "updated_at": "...",
  "contracts": [
    {
      "id": 5,
      "status": "ACTIVE",
      "total_amount": "500000.00",
      "paid_amount": "100000.00",
      "monthly_payment": "25000.00",
      "start_date": "...",
      "end_date": null,
      "created_at": "...",
      "updated_at": "...",
      "car": { "plate_number": "...", "brand": "...", "model": "...", "year": 2020 }
    }
  ]
}
```

**Ошибки:** `404`

---

#### `PUT /api/drivers/{id}`

**Тело:** те же поля, что и при `POST`

**Ответ (200):** обновлённый объект Driver (без relations)

---

### Договоры (`/api/contracts`)

---

#### `GET /api/contracts`

**Query-параметры:**

| Параметр | Тип    | Описание                   |
|----------|--------|----------------------------|
| `status` | string | Фильтр по ContractStatus   |

**Ответ (200):**
```json
{
  "contracts": [
    {
      "id": 5,
      "car_id": 1,
      "driver_id": 3,
      "status": "ACTIVE",
      "total_amount": "500000.00",
      "paid_amount": "100000.00",
      "monthly_payment": "25000.00",
      "start_date": "...",
      "end_date": null,
      "created_at": "...",
      "updated_at": "...",
      "car": { "plate_number": "А123БВ77", "brand": "Toyota", "model": "Camry" },
      "driver": { "full_name": "Иванов Иван Иванович" },
      "remaining_balance": 400000.0
    }
  ],
  "total": 5
}
```

> `remaining_balance = max(0, total_amount - paid_amount)` — вычисляется на лету.

---

#### `POST /api/contracts`

**Тело:**
```json
{
  "car_id": 1,
  "driver_id": 3,
  "total_amount": 500000,
  "monthly_payment": 25000,
  "start_date": "2025-01-01T00:00:00.000Z"
}
```

**Валидация:**
- Машина должна существовать
- `car.status` должен быть `FREE` → иначе `409 Conflict`

**Транзакция:**
1. Создать `Contract` (status=ACTIVE, paid_amount=0)
2. Обновить `Car.status = RENTED`
3. Сгенерировать график платежей:
   ```python
   month_count = ceil(total_amount / monthly_payment)
   for i in range(month_count):
       due_date = start_date + relativedelta(months=i+1)
       if i == month_count - 1:
           amount = total_amount - monthly_payment * (month_count - 1)
       else:
           amount = monthly_payment
       # создать Payment(contract_id, amount, status=UNPAID, due_date)
   ```

**Ответ (201):** объект Contract (без relations)

---

#### `GET /api/contracts/{id}`

**Логика:**
1. Загрузить договор с `car`, `driver`, `payments` (order by due_date ASC)
2. Пересчитать `paid_amount` = сумма всех PAID-платежей
3. Если отличается от БД — обновить запись в БД
4. Вернуть с актуальными значениями

**Ответ (200):**
```json
{
  "id": 5,
  "car_id": 1,
  "driver_id": 3,
  "status": "ACTIVE",
  "total_amount": "500000.00",
  "paid_amount": 100000.0,
  "monthly_payment": "25000.00",
  "start_date": "...",
  "end_date": null,
  "created_at": "...",
  "updated_at": "...",
  "car": { /* полный объект Car */ },
  "driver": { /* полный объект Driver */ },
  "payments": [ /* все платежи, order by due_date ASC */ ],
  "remaining_balance": 400000.0
}
```

**Ошибки:** `404`

---

#### `PUT /api/contracts/{id}`

**Тело (все поля опциональны):**
```json
{
  "status": "COMPLETED",
  "end_date": "2026-01-01T00:00:00.000Z",
  "monthly_payment": 25000,
  "total_amount": 500000
}
```

**Транзакция:**
1. Если `status != ACTIVE` и текущий был `ACTIVE` → **закрытие договора**:
   - Установить `end_date` (из тела или `now()`)
   - Обновить `Car.status = FREE`
2. Обновить поля договора

**Ответ (200):** обновлённый Contract + `remaining_balance`

---

#### `GET /api/contracts/{id}/payments`

**Ответ (200):** массив Payment (order by due_date ASC)

```json
[
  {
    "id": 10,
    "contract_id": 5,
    "amount": "25000.00",
    "status": "PAID",
    "due_date": "2025-02-01T00:00:00.000Z",
    "paid_at": "2025-01-31T10:00:00.000Z",
    "created_at": "..."
  }
]
```

---

### Платежи (`/api/payments`)

---

#### `GET /api/payments`

**Query-параметры:**

| Параметр | Тип    | Описание                                                  |
|----------|--------|-----------------------------------------------------------|
| `status` | string | `OVERDUE`, `UNPAID`, `PAID`. Если `PENDING` или пусто — возвращает UNPAID + OVERDUE |

**Ответ (200):**
```json
{
  "payments": [
    {
      "id": 10,
      "contract_id": 5,
      "amount": "25000.00",
      "status": "OVERDUE",
      "due_date": "...",
      "paid_at": null,
      "created_at": "...",
      "contract": {
        "id": 5,
        "car_id": 1,
        "driver_id": 3,
        "status": "ACTIVE",
        "total_amount": "500000.00",
        "paid_amount": "100000.00",
        "monthly_payment": "25000.00",
        "start_date": "...",
        "end_date": null,
        "created_at": "...",
        "updated_at": "...",
        "car": { "id": 1, "plate_number": "А123БВ77", "brand": "Toyota", "model": "Camry" },
        "driver": { "id": 3, "full_name": "Иванов Иван Иванович", "phone": "+79001234567" }
      }
    }
  ],
  "total": 3
}
```

---

#### `POST /api/payments` — оплатить платёж

**Тело:**
```json
{
  "payment_id": 10,
  "paid_at": "2025-01-31T10:00:00.000Z"
}
```

**Валидация:**
- `payment_id` обязателен → `400`
- Платёж должен существовать → `404`
- `payment.status != PAID` → `409`

**Транзакция:**
1. Обновить `Payment.status = PAID`, `Payment.paid_at = paid_at ?? now()`
2. Пересчитать `contract.paid_amount` = сумма всех PAID-платежей этого договора
3. Обновить договор

**Ответ (200):**
```json
{
  "payment": { /* обновлённый объект Payment */ },
  "contract": {
    "id": 5,
    "paid_amount": 125000.0,
    "remaining_balance": 375000.0
  }
}
```

---

### Штрафы (`/api/fines`)

---

#### `GET /api/fines`

**Query-параметры:**

| Параметр    | Тип    | Описание                       |
|-------------|--------|--------------------------------|
| `status`    | string | Фильтр по FineStatus           |
| `car_id`    | int    | Фильтр по машине               |
| `driver_id` | int    | Фильтр по водителю             |

**Ответ (200):**
```json
{
  "fines": [
    {
      "id": 2,
      "car_id": 1,
      "driver_id": 3,
      "contract_id": 5,
      "amount": "1500.00",
      "description": "Превышение скорости",
      "fine_date": "2025-03-10T00:00:00.000Z",
      "status": "UNPAID",
      "paid_at": null,
      "created_at": "...",
      "car": { "id": 1, "plate_number": "А123БВ77", "brand": "Toyota", "model": "Camry" },
      "driver": { "id": 3, "full_name": "Иванов Иван Иванович" },
      "contract": { "id": 5 }
    }
  ],
  "total": 4
}
```

---

#### `POST /api/fines`

**Тело:**
```json
{
  "car_id": 1,
  "driver_id": 3,
  "contract_id": 5,
  "amount": 1500,
  "description": "Превышение скорости",
  "fine_date": "2025-03-10T00:00:00.000Z"
}
```

**Логика:**
- Если `driver_id` не передан — найти активный договор по `car_id` и взять `driver_id` и `contract_id` из него
- Если водитель всё равно не найден → `400`

**Ответ (201):** объект Fine (без relations)

---

#### `PUT /api/fines/{id}`

**Тело:**
```json
{
  "status": "PAID",
  "paid_at": "2025-03-15T10:00:00.000Z"
}
```

**Логика:**
- Если `status == PAID` → `paid_at = paid_at ?? now()`
- Если `status != PAID` → `paid_at = null`

**Ответ (200):** обновлённый объект Fine (без relations)

---

### Дашборд (`/api/dashboard`)

---

#### `GET /api/dashboard`

Выполняет все запросы **параллельно**:

1. Группировка машин по статусу (`GROUP BY status`)
2. Подсчёт активных договоров
3. Агрегация просроченных платежей (status=OVERDUE): count, sum
4. Ближайшие платежи: status=UNPAID, due_date между now() и now()+7 дней, limit 7, order by due_date ASC — с вложенным `contract.{car.{id, plate_number}, driver.{full_name}}`
5. Агрегация неоплаченных штрафов (status=UNPAID): count, sum
6. Сбор за текущий месяц: платежи status=PAID, paid_at >= начало текущего месяца — sum(amount)
7. Все просроченные платежи с `contract.{car.{id, plate_number, brand, model}, driver.{id, full_name}}`

**Post-processing топ должников** (из п.7):
```python
# Группировка по driver_id
# Для каждого: sum(amount), count, max(days_overdue)
# days_overdue = max(0, (today - due_date).days)
# Сортировка по total_overdue DESC, limit 5
```

**Ответ (200):**
```json
{
  "cars": {
    "FREE": 3,
    "RENTED": 7,
    "REPAIR": 1,
    "SOLD": 2,
    "total": 13
  },
  "contracts": {
    "active": 7
  },
  "payments": {
    "overdue_count": 4,
    "overdue_amount": 85000.0,
    "collected_this_month": 125000.0,
    "upcoming": [
      {
        "id": 12,
        "contract_id": 5,
        "amount": "25000.00",
        "status": "UNPAID",
        "due_date": "2025-04-03T00:00:00.000Z",
        "paid_at": null,
        "created_at": "...",
        "contract": {
          "id": 5,
          "car": { "id": 1, "plate_number": "А123БВ77" },
          "driver": { "full_name": "Иванов Иван Иванович" }
        }
      }
    ]
  },
  "fines": {
    "unpaid_count": 6,
    "unpaid_amount": 9000.0
  },
  "top_debtors": [
    {
      "driver_id": 3,
      "full_name": "Иванов Иван Иванович",
      "car_plate": "А123БВ77",
      "car_label": "Toyota Camry",
      "contract_id": 5,
      "total_overdue": 75000.0,
      "payment_count": 3,
      "max_days_overdue": 45
    }
  ]
}
```

---

### Health check

#### `GET /api/health`

**Ответ (200):**
```json
{ "status": "ok", "db_time": "2025-04-01T10:00:00.000Z" }
```

**Ответ (500):**
```json
{ "status": "error", "message": "connection refused" }
```

---

## 7. Общие правила

### Коды ответов

| Код | Случай                                             |
|-----|----------------------------------------------------|
| 200 | Успешное чтение / обновление                       |
| 201 | Успешное создание                                  |
| 400 | Отсутствует обязательное поле                      |
| 401 | Неверные credentials / нет токена                  |
| 404 | Ресурс не найден                                   |
| 409 | Конфликт: машина не FREE, платёж уже оплачен       |
| 500 | Внутренняя ошибка сервера                          |

### Работа с Decimal

- В БД хранятся как `DECIMAL(12,2)` / `DECIMAL(10,2)`
- В JSON возвращаются как **строки** (`"25000.00"`)
- Исключение — вычисляемые поля (`remaining_balance`, `total_overdue`) возвращаются как **числа с плавающей точкой**

### Обновление `updated_at`

Поля `updated_at` у `cars`, `drivers`, `contracts`, `users` должны автоматически обновляться при каждом `UPDATE`. Реализуется через триггер PostgreSQL или на уровне ORM.

### Сортировка по умолчанию

| Ресурс      | Сортировка                   |
|-------------|------------------------------|
| cars        | `created_at DESC`            |
| drivers     | `created_at DESC`            |
| contracts   | `created_at DESC`            |
| payments    | `due_date ASC`               |
| fines       | `fine_date DESC`             |

### Переменные окружения

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-secret-key
```
