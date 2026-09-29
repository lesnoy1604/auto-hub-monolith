# Auto Hub — CRM для аренды автомобилей

Монорепозиторий: Go REST API + React SPA для управления парком автомобилей в лизинг/аренду.

## Возможности

- **Машины** — список, детальная страница, статусы (свободна / в аренде / в ремонте / продана), документы (ОСАГО, техосмотр)
- **Водители** — страница с выкупом автомобиля, сеткой платежей по месяцам, таймлайном событий и быстрым приёмом платежа
- **Договоры** — создание, изменение статуса, прогресс выкупа, платёжный график
- **Платежи** — список должников, просроченные, приём оплаты
- **Штрафы** — учёт, смена статуса (не оплачен / оспаривается / оплачен)
- **Дашборд** — общая статистика по парку, топ должников, ближайшие платежи
- **Удаление с ограничениями** — нельзя удалить машину с активным договором, водителя с активным договором, оплаченный платёж, активный договор

## Стек

| | Backend | Frontend |
|---|---|---|
| **Язык / Runtime** | Go 1.23 | TypeScript + React 19 |
| **Фреймворк** | chi v5 | React Router v8 |
| **Состояние** | — | Redux Toolkit + RTK Query |
| **БД** | PostgreSQL 16 (pgx/v5) | — |
| **Миграции** | goose v3 | — |
| **Формы** | — | react-hook-form + zod |
| **Сборка** | — | Vite 6 |
| **Auth** | JWT HS256 + bcrypt | — |

## Структура монорепо

```
auto-hub-monolith/
├── backend/                  # Go API
│   ├── cmd/
│   │   ├── api/main.go       # точка входа
│   │   └── seed/main.go      # демо-данные (12 машин, договоры, штрафы)
│   ├── internal/
│   │   ├── domain/           # entity-структуры, enums, ошибки
│   │   ├── dto/              # request/response типы
│   │   ├── repository/       # интерфейсы + реализации на pgx
│   │   ├── service/          # бизнес-логика и транзакции
│   │   ├── handler/          # HTTP-хэндлеры, роутер, валидация
│   │   └── middleware/       # JWT auth
│   ├── migrations/           # SQL goose (001–008)
│   ├── Makefile
│   └── .env                  # DATABASE_URL, JWT_SECRET, PORT
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── app/              # store, router, baseQuery
│   │   ├── features/         # cars, drivers, contracts, payments, fines, dashboard
│   │   └── shared/           # ui-компоненты, типы, утилиты
│   └── vite.config.ts
├── docker-compose.yml        # dev: db + api (hot reload) + frontend (HMR)
└── docker-compose.prod.yml   # prod: db + api + nginx
```

## Быстрый старт (Docker)

```bash
# Поднять всё окружение разработки
docker compose up -d

# Залить демо-данные (12 машин, водители, договоры, штрафы, 2 должника)
cd backend && go run ./cmd/seed/main.go
```

Приложение: http://localhost:5173  
API: http://localhost:8080  
Логин: `admin@autohub.ru` / `admin123`

## Запуск без Docker

```bash
# Backend
cd backend
cp .env.example .env        # настроить DATABASE_URL
docker compose up db -d     # только база
make run                    # сервер + автомиграции

# Frontend (отдельный терминал)
cd frontend
npm install
npm run dev
```

## Сидер (демо-данные)

```bash
cd backend && go run ./cmd/seed/main.go
# или
make seed
```

Создаёт:
- 12 машин: 10 в аренде, 1 в ремонте, 1 свободна
- 11 водителей с договорами
- Платёжные графики на 6 месяцев
- **2 должника** с просроченными платежами
- **7 штрафов** на 5 разных машинах

## Переменные окружения (backend)

| Переменная | Обязательная | По умолчанию |
|---|---|---|
| `DATABASE_URL` | ✓ | — |
| `JWT_SECRET` | ✓ | — |
| `PORT` | | `8080` |
| `ENV` | | `development` |
