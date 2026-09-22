# Auto Hub — Rent Cars CRM Backend

REST API для управления арендой автомобилей: машины, водители, договоры, платежи, штрафы.

## Стек

| | |
|---|---|
| **Язык** | Go 1.23 |
| **Router** | chi v5 |
| **Database** | PostgreSQL 16 |
| **Driver** | pgx/v5 + pgxpool |
| **Migrations** | goose v3 |
| **Auth** | JWT (HS256) + bcrypt |
| **Decimal** | shopspring/decimal |
| **Logging** | zerolog |

## Архитектура

Layered Architecture — каждый слой зависит только от нижнего через интерфейсы.

```
Handler  →  Service  →  Repository  →  PostgreSQL
  DTO          бизнес-логика    SQL (pgx)
  JWT          транзакции
  validate     errgroup
```

**Транзакции** обрабатываются в сервисном слое: создание договора (контракт + смена статуса машины + платёжный график), закрытие договора, оплата платежа — всё атомарно.

**Дашборд** выполняет 7 SQL-запросов параллельно через `golang.org/x/sync/errgroup`.

## Структура

```
auto-hub/
├── cmd/
│   ├── api/main.go          # точка входа: config → DB → migrations → HTTP
│   └── seed/main.go         # создать тестового admin
├── internal/
│   ├── config/              # загрузка env-переменных
│   ├── domain/              # entity-структуры, enums, sentinel errors
│   ├── dto/                 # request/response типы
│   ├── repository/
│   │   ├── interfaces.go    # интерфейсы всех репозиториев
│   │   └── postgres/        # реализации на pgx
│   ├── service/             # бизнес-логика и транзакции
│   ├── handler/             # HTTP-хэндлеры, router, валидация
│   └── middleware/          # JWT auth
├── migrations/              # SQL-файлы goose (001–008)
├── tasks/                   # технические задания по задачам
├── docker-compose.yml
├── Dockerfile
└── Makefile
```

## Запуск

**Требования:** Docker, Go 1.23+

```bash
# 1. Конфиг
cp .env.example .env

# 2. База данных
docker compose up db -d

# 3. Сервер (миграции применяются автоматически при старте)
make run

# 4. Создать admin-пользователя
go run ./cmd/seed/main.go
```

## API

Все маршруты кроме `/api/health` и `/api/auth/login` требуют заголовка `Authorization: Bearer <token>`.

| Метод | Путь | Описание |
|---|---|---|
| `POST` | `/api/auth/login` | Получить JWT токен |
| `GET` | `/api/health` | Проверка состояния сервера |
| `GET/POST` | `/api/cars` | Список машин / создать |
| `GET/PUT/DELETE` | `/api/cars/{id}` | Детали / обновить / удалить |
| `GET/POST` | `/api/drivers` | Список водителей / создать |
| `GET/PUT/DELETE` | `/api/drivers/{id}` | Детали / обновить / удалить |
| `GET/POST` | `/api/contracts` | Список договоров / создать |
| `GET/PUT/DELETE` | `/api/contracts/{id}` | Детали / обновить / удалить |
| `GET` | `/api/contracts/{id}/payments` | Платежи по договору |
| `GET/POST` | `/api/payments` | Список платежей / оплатить |
| `DELETE` | `/api/payments/{id}` | Удалить платёж |
| `GET/POST` | `/api/fines` | Список штрафов / создать |
| `PUT/DELETE` | `/api/fines/{id}` | Обновить / удалить штраф |
| `GET` | `/api/dashboard` | Сводная статистика |

### Пример

```bash
# Логин
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@autohub.ru","password":"admin123"}' | jq -r .access_token)

# Создать машину
curl -X POST http://localhost:8080/api/cars \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"plate_number":"А001АА77","vin":"XTA123","brand":"Toyota","model":"Camry","year":2022,"status":"FREE","mileage":0}'
```

## Деплой на сервер

**Первый запуск** — клонировать репозиторий и настроить окружение:

```bash
git clone <repo-url> /opt/autohub-src
cp /opt/autohub-src/.env.example /opt/autohub/.env
# отредактировать /opt/autohub/.env
```

**Обновление** — после `git pull` запускать скрипт деплоя:

```bash
cd /opt/autohub-src
git pull
sudo systemctl stop autohub
bash ./scripts/deploy-server.sh
```

Скрипт собирает бинарник, копирует его вместе с миграциями в `/opt/autohub/` и перезапускает сервис. Миграции применяются автоматически при старте.

## Переменные окружения

| Переменная | Обязательная | По умолчанию |
|---|---|---|
| `DATABASE_URL` | ✓ | — |
| `JWT_SECRET` | ✓ | — |
| `PORT` | | `8080` |
| `ENV` | | `development` |
