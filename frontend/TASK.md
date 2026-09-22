# Задание: CRM-система управления автопарком — React Frontend

## Контекст

Существует рабочий Nuxt 3 монолит (fullstack). Бэкенд уже написан и задокументирован в `BACKEND.md`.
Задача — написать **React SPA** как отдельный фронтенд, который обращается к этому REST API.

---

## Стек

| Слой | Инструмент |
|---|---|
| Фреймворк | React 19 |
| Роутер | React Router v7 |
| Стейт и запросы | Redux Toolkit (RTK) + RTK Query |
| Стили | Tailwind CSS v4 с настроенной дизайн-системой |
| Формы | React Hook Form + Zod |
| Сборщик | Vite 6 |
| Язык | TypeScript 5 |
| Пакет-менеджер | pnpm |
| Линтер / формат | ESLint flat + Prettier |

---

## Дизайн-система (Tailwind)

Ниже — точная конфигурация `tailwind.config.ts`, которую нужно воспроизвести.
Проект должен работать только с токенами из этой системы, без хардкода цветов.

### Цвета

```
canvas:         #05060f      — фон всего приложения
steel:          #2f343e      — тёмные поверхности
fog-veil:       #9da7ba      — текст muted / placeholder
moon-mist:      #c7d3ea      — текст secondary
frost-glow:     #d1e4fa      — текст primary
ice-highlight:  #d8ecf8      — текст highlight / brand

void-violet:    #663af3      — основной акцент

accent:
  DEFAULT:  #663af3
  hover:    #5530d4
  bg:       rgba(102,58,243,0.15)
  text:     #a78bfa

neutral:
  bg:       #05060f
  surface:  rgba(186,214,247,0.03)
  border:   rgba(186,215,247,0.12)

text:
  primary:   #d1e4fa
  secondary: #c7d3ea
  muted:     #9da7ba

success:
  DEFAULT:  #4ade80
  bg:       rgba(74,222,128,0.12)

warning:
  DEFAULT:  #fb923c
  bg:       rgba(251,146,60,0.12)

danger:
  DEFAULT:  #f87171
  bg:       rgba(248,113,113,0.12)
```

### Типографика

```
font-sans:    Inter
font-display: Space Grotesk   — бренд/заголовки
font-mono:    JetBrains Mono  — метки полей форм

font-size:
  hero:    44px / lh 1.16
  h1:      34px / lh 1.14 / ls -0.02em
  metric:  40px / lh 1.1  / ls -0.02em
  section: 24px / lh 1.17
  card:    18px / lh 1.33
  body:    16px / lh 1.5  / ls -0.01em
  table:   15px / lh 1.43
  caption: 13px / lh 1.4
  small:   12px / lh 1.33
```

### Радиусы и отступы

```
borderRadius:
  xs/sm/md: 6px
  lg/xl/2xl: 16px
  pill: 999px

spacing (расширение):
  2: 2px   4: 4px   10: 10px  14: 14px
  18: 18px 22: 22px 30: 30px  34: 34px
```

### Готовые CSS-компоненты (через `@layer components`)

Обязательно реализовать эти переиспользуемые классы:

**`.btn`** — базовый стиль кнопки (pill, 14px, 500 weight, padding 10/20)
**`.btn-primary`** — фиолетовый фон `#663af3`, hover `#5530d4`
**`.btn-secondary`** — стеклянный фон `rgba(186,214,247,0.06)`, inset border

**`.badge`** — базовый бейдж (12px, padding 4/10, radius xs)
**`.badge-success`** — зелёный
**`.badge-warning`** — оранжевый
**`.badge-danger`** — красный

**`.card`** — glass-карточка (`neutral.surface`, radius lg, padding 24px, inset box-shadow)
**`.row`** — строка списка (grid 64px 1fr 96px, min-height 64px, inset border)
**`.row-active`** — активная строка с акцентным border

Полные значения box-shadow смотри в разделе `tailwind.config.ts` исходного проекта.

---

## Архитектура папок

```
src/
  app/
    store.ts              # RTK store
    hooks.ts              # useAppDispatch / useAppSelector
  features/
    auth/
      authSlice.ts
      LoginPage.tsx
    cars/
      carsApi.ts          # RTK Query endpoints
      carsSlice.ts        # локальный UI state (фильтры, модалки)
      CarsPage.tsx
      CarDetailPage.tsx
      CarFormModal.tsx
      CarStatusBadge.tsx
    contracts/
      contractsApi.ts
      ContractFormModal.tsx
      ContractDetailPage.tsx
      ContractsPage.tsx
      ContractStatusBadge.tsx
    drivers/
      driversApi.ts
      DriversPage.tsx
      DriverDetailPage.tsx
      DriverFormModal.tsx
    payments/
      paymentsApi.ts
      PaymentsPage.tsx
      PaymentMarkModal.tsx
      PaymentStatusBadge.tsx
    fines/
      finesApi.ts
      FinesPage.tsx
      FineFormModal.tsx
      FineStatusBadge.tsx
    dashboard/
      dashboardApi.ts
      DashboardPage.tsx
  shared/
    ui/
      Button.tsx
      Badge.tsx
      Modal.tsx
      Input.tsx
      Select.tsx
      FilterChips.tsx
      SearchInput.tsx
      EmptyState.tsx
      Spinner.tsx
    lib/
      formatDate.ts
      formatMoney.ts
      daysUntil.ts
  router/
    index.tsx             # React Router конфиг
    ProtectedRoute.tsx    # редирект на /login если нет сессии
  layouts/
    AppLayout.tsx         # sidebar + main
```

---

## Роутинг

```
/login                    — страница входа (без layout)
/                         — дашборд
/cars                     — список машин
/cars/:id                 — карточка машины
/contracts                — список договоров
/contracts/:id            — карточка договора
/drivers                  — список водителей
/drivers/:id              — карточка водителя
/payments                 — должники / платежи
/fines                    — штрафы
```

`ProtectedRoute` проверяет наличие токена в Redux store (или localStorage).
Не авторизованные пользователи редиректятся на `/login`.

---

## Аутентификация

API использует `next-auth` credentials. Для входа нужно сделать `POST /api/auth/callback/credentials` с телом `{ email, password }`.

Токен сессии возвращается в cookie (`next-auth.session-token`). Браузер автоматически отправляет его при запросах к API — дополнительных заголовков не нужно.

Для проверки текущей сессии: `GET /api/auth/session` — возвращает `{ user: { name, email, role } }` или `{}`.

При логауте: `POST /api/auth/signout`.

В Redux-слайсе `authSlice` хранить: `user | null`, `status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated'`.

---

## API-эндпоинты (RTK Query baseUrl: `/api`)

### Dashboard

```
GET  /dashboard
```
Ответ:
```ts
{
  cars: { FREE: number; RENTED: number; REPAIR: number; SOLD: number; total: number }
  contracts: { active: number }
  payments: {
    overdueCount: number
    overdueAmount: number
    collectedThisMonth: number
    upcoming: UpcomingPayment[]   // до 7 платежей за 7 дней
  }
  fines: { unpaidCount: number; unpaidAmount: number }
  topDebtors: TopDebtor[]
}
```

### Cars

```
GET  /cars?status=FREE|RENTED|REPAIR|SOLD&search=А123
POST /cars                       { plateNumber, vin, brand, model, year, mileage, status, osagoBefore?, inspectionBefore? }
GET  /cars/:id                   — включает contracts[].payments и fines[]
PUT  /cars/:id                   — те же поля что и POST
```

### Contracts

```
GET  /contracts?status=ACTIVE|COMPLETED|CANCELLED
POST /contracts                  { carId, driverId, totalAmount, monthlyPayment, startDate }
GET  /contracts/:id              — включает car, driver, payments[]
PUT  /contracts/:id              { status, endDate? }
GET  /contracts/:id/payments     — только overdue/unpaid платежи (для PaymentMarkModal)
```

### Drivers

```
GET  /drivers?status=ACTIVE|INACTIVE&search=Иван
POST /drivers                    { fullName, phone, passportNum, licenseNum, status }
GET  /drivers/:id                — включает contracts[]
PUT  /drivers/:id                — те же поля
```

### Payments

```
GET  /payments?status=OVERDUE|UNPAID    — платежи без PAID
POST /payments                          { contractId, paymentId }   — отметить платёж оплаченным
```

### Fines

```
GET  /fines?status=UNPAID|DISPUTED|PAID
POST /fines                      { carId, driverId, contractId?, amount, description, fineDate }
PUT  /fines/:id                  { status: 'PAID' | 'DISPUTED' | 'UNPAID' }
```

---

## Страницы — детальное описание

### `/login` — Страница входа

Дизайн: тёмный фон `#05060f`, по центру карточка `max-width: 380px`.
Фон: CSS grid 80×80 (`rgba(186,215,247,0.04)`) + radial gradient spotlight сверху.

Карточка:
- Брендинг: "Автопарк" — `font-display`, gradient text `#98c0ef → #d8ecf8`
- Подзаголовок: "Введите данные вашей учётной записи"
- Поля: Email + Пароль (лейблы `font-mono`, `font-small`, uppercase, `text-muted`)
- Кнопка "Войти" — `width: 100%`, `.btn-primary`, radius xs (6px)
- Блок ошибки: `danger.bg` фон, `danger` текст, inset border
- После успеха: редирект на `/`

### `/` — Дашборд

**KPI row** — 4 карточки (`.card`):
1. «В аренде» — `d.cars.RENTED` из `d.cars.total`
2. «Активных договоров» — `d.contracts.active`
3. «Просрочено» — сумма `d.payments.overdueAmount` + счётчик. Если `> 0` — красный inset border
4. «Собрано за месяц» — `d.payments.collectedThisMonth`, зелёный. Sub: «штрафов неоплачено: N»

**Парк машин** (280px карточка):
- Список с цветными точками: RENTED фиолетовый `#a78bfa`, FREE зелёный `#4ade80`, REPAIR оранжевый `#fb923c`, SOLD серый `#9da7ba`
- Горизонтальный прогресс-бар (каждый статус — сегмент своего цвета)
- Легенда снизу

**Ближайшие платежи** (растяжимая карточка):
- Таблица: Дата / Машина / Водитель / Сумма
- Если `daysUntil <= 2` — дата красным
- Машина — ссылка на `/contracts/:id`
- Пустое состояние: «Платежей на этой неделе нет»

**Топ должников**:
- Колонки: Водитель / Машина / Платежей / Долг / Макс. дней / Кнопка
- Кнопка «Оплатить» → открывает `PaymentMarkModal` с первым OVERDUE платежом договора
- После отметки — если есть следующий OVERDUE — показывает его; иначе закрывает и обновляет дашборд
- «Все должники →» ссылка на `/payments`

### `/cars` — Список машин

- Заголовок «Машины» + счётчик
- Кнопка «Добавить машину» → `CarFormModal`
- Фильтры-чипсы: Все / Свободна / В аренде / В ремонте / Продана
- Поиск по номеру (debounce 300ms)
- Таблица: Гос. номер / Модель·год / Статус / Водитель / Остаток до выкупа
- Клик по строке → `/cars/:id`
- `EmptyState` при 0 результатов

### `/cars/:id` — Карточка машины

2-колоночный grid:
- **Документы**: ОСАГО (дата + дней осталось с цветом), Техосмотр, Пробег. Цвет: ≤14 дн. красный, ≤30 оранжевый, иначе серый
- **Текущий договор**: водитель, начало, платёж/мес, остаток. Прогресс-бар выкупа
- **История платежей** (последние 4 из активного договора)
- **Штрафы**: список + кнопки «Оплачен» / «Оспорить» / «Сбросить». Кнопка «+ Добавить» → `FineFormModal`
- Кнопка «Редактировать» → `CarFormModal` с предзаполнением

### `/contracts` — Список договоров

- Фильтры: Все / Активные / Завершённые / Отменённые
- Таблица: Машина / Водитель / Начало / Платёж мес / Остаток / Статус
- Остаток: 0 — зелёный, >0 — фиолетовый
- Кнопка «Новый договор» → `ContractFormModal`

### `/contracts/:id` — Карточка договора

2-колоночный grid:
- **Условия**: машина (ссылка), водитель (ссылка), начало, окончание, платёж/мес, срок (мес)
- **Выкуп**: сумма, остаток, выплачено, прогресс %. Прогресс-бар. Плашка «Выкуп завершён» при 100%
- **График платежей**: таблица №/Дата/Сумма/Оплачено/Статус/Кнопка «Оплатить»
- Кнопка «Оплатить» → `PaymentMarkModal`
- Кнопка «Редактировать» (только для ACTIVE) → `ContractFormModal` в режиме edit

### `/drivers` — Список водителей

- Фильтры: Все / Активные / Неактивные
- Поиск по ФИО (debounce 300ms)
- Таблица: ФИО / Телефон / Паспорт / Статус / Текущая машина
- Кнопка «Добавить водителя» → `DriverFormModal`

### `/drivers/:id` — Карточка водителя

2-колоночный grid:
- **Документы**: паспорт, номер прав, дата добавления
- **Текущий договор**: машина, начало, платёж/мес, остаток + прогресс-бар
- **История договоров** (все договоры, растяжимая на всю ширину): дата начала, машина (ссылка), сумма, статус
- Кнопка «Редактировать» → `DriverFormModal`

### `/payments` — Должники

- Заголовок «Должники» + счётчики (N просрочено · M ожидается)
- Фильтры: Просроченные / Ожидаемые / Все
- Сортировка: переключатель «По дням» ↔ «По сумме»
- Таблица: Машина+модель / Водитель / По графику / Сумма / Просрочено дней / Статус / Кнопка
- Кнопка «Оплатить» → `PaymentMarkModal`

### `/fines` — Штрафы

- Фильтры: Все / Не оплачены / Оспариваются / Оплачены
- Таблица: Дата / Машина (ссылка) / Водитель / Сумма / Статус / Кнопки
- Кнопки «✓ Оплачен», «⚖ Оспорить», «Сбросить» — `PUT /api/fines/:id`
- Кнопка «Добавить штраф» → `FineFormModal`

---

## Модальные окна (формы)

Все модалки — фиксированный оверлей `rgba(32,30,29,0.4)`, клик вне — закрытие.
Внутренняя карточка: белый фон, `border-radius: 22px`, `max-width: 520px`, `max-height: 90vh`, overflow-y auto.
Поля форм: `height: 44px`, `border-radius: 14px`, `background: #F5F4FA`, border `#E6E3F0`.
Лейблы: `font-mono`, 12px, uppercase, `color: #615D73`.
Кнопки: Отмена — outlined `#E0DCEC`; Сохранить — `#6B3FE4`.
Ошибка API: красный блок `#FDEAEA / #C62828`.

### `CarFormModal`

Режимы: создание / редактирование (пропс `car?: Car`).

Поля:
- Гос. номер (required)
- VIN (required)
- Марка (required)
- Модель (required)
- Год (number, 2000–2030, required)
- Пробег км (number)
- Статус (select: FREE / RENTED / REPAIR / SOLD)
- ОСАГО до (date)
- Техосмотр до (date)

### `ContractFormModal`

**Режим создания** (нет `contract`):
- Машина (select из `/api/cars?status=FREE`) — если нет свободных, кнопка disabled + предупреждение
- Водитель (select из `/api/drivers?status=ACTIVE`)
- Сумма выкупа (number, required)
- Платёж / мес (number, required)
- Дата начала (date, required)
- Инфо-блок: «График: N мес. по X ₽ · последний Y ₽»

**Режим редактирования**:
- Статус (select: ACTIVE / COMPLETED / CANCELLED)
- Дата окончания (date, только если не ACTIVE)

### `DriverFormModal`

Поля:
- ФИО (required)
- Телефон (required)
- Паспорт серия и номер (required)
- Номер водительского удостоверения (required)
- Статус (select: ACTIVE / INACTIVE)

### `FineFormModal`

Поля:
- Машина (select из `/api/cars`) — можно передать `preselectedCarId`
- Водитель (select из `/api/drivers`)
- Договор (select, опционально)
- Сумма (number, required)
- Описание нарушения (text, required)
- Дата штрафа (date, required)

### `PaymentMarkModal`

Принимает объект платежа. Показывает:
- Номер машины и ФИО водителя
- Сумму и плановую дату
- Фактическую дату оплаты (date input, default = today)
- Кнопка «Отметить оплаченным» → `POST /api/payments`

---

## Компоненты-бейджи

### `CarStatusBadge`

| status | label | класс |
|---|---|---|
| FREE | Свободна | `.badge-success` |
| RENTED | В аренде | `.badge` + accent bg/text |
| REPAIR | В ремонте | `.badge-warning` |
| SOLD | Продана | `.badge` + neutral |

### `ContractStatusBadge`

| status | label | класс |
|---|---|---|
| ACTIVE | Активен | `.badge-success` |
| COMPLETED | Завершён | `.badge` neutral |
| CANCELLED | Отменён | `.badge-danger` |

### `PaymentStatusBadge`

| status | label | класс |
|---|---|---|
| PAID | Оплачен | `.badge-success` |
| UNPAID | Ожидается | `.badge-warning` |
| OVERDUE | Просрочен | `.badge-danger` |

### `FineStatusBadge`

| status | label | класс |
|---|---|---|
| UNPAID | Не оплачен | `.badge-danger` |
| PAID | Оплачен | `.badge-success` |
| DISPUTED | Оспаривается | `.badge-warning` |

---

## Лейаут приложения (`AppLayout`)

Sidebar 230px, фиксированный, `background: #090a14`, правый бордер `rgba(186,215,247,0.07)`.

**Брендинг** вверху: «Автопарк» — `font-display`, gradient `#98c0ef → #d8ecf8`, `-webkit-background-clip: text`.

**Навигация** (иконка + текст):
- Дашборд → `/`
- Машины → `/cars`
- Договоры → `/contracts`
- Водители → `/drivers`
- Должники → `/payments`
- Штрафы → `/fines`

Активный элемент: `accent.bg` + inset border `rgba(102,58,243,0.35)`, текст `text-primary`.
Неактивный hover: `rgba(186,214,247,0.06)`, текст `moon-mist`.

SVG-иконки взять из исходника `app.vue` (они там inline в `layouts/default.vue`).

**Блок пользователя** внизу:
- Аватар-заглушка (фиолетовый круг с иконкой)
- Имя пользователя из сессии
- Кнопка «Выйти» → `POST /api/auth/signout` + редирект на `/login`

**Фоновый grid** (position: fixed, z-index: 0):
```css
background-image:
  linear-gradient(rgba(186,215,247,0.04) 1px, transparent 1px),
  linear-gradient(90deg, rgba(186,215,247,0.04) 1px, transparent 1px);
background-size: 80px 80px;
mask-image: radial-gradient(ellipse 100% 60% at 50% 0%, rgba(0,0,0,0.5), transparent 80%);
```

---

## Требования к RTK Query

Каждый feature-модуль объявляет свой `createApi`:

```ts
// features/cars/carsApi.ts
export const carsApi = createApi({
  reducerPath: 'carsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api', credentials: 'include' }),
  tagTypes: ['Car'],
  endpoints: (builder) => ({
    getCars: builder.query<CarsResponse, CarsQueryParams>({ ... providesTags: ['Car'] }),
    getCarById: builder.query<Car, number>({ ... }),
    createCar: builder.mutation<Car, CreateCarDto>({ ... invalidatesTags: ['Car'] }),
    updateCar: builder.mutation<Car, UpdateCarDto>({ ... invalidatesTags: ['Car'] }),
  }),
})
```

После мутации (create/update/pay) — инвалидировать соответствующие теги, чтобы списки обновлялись автоматически.

---

## Требования к формам (React Hook Form + Zod)

```ts
const schema = z.object({
  plateNumber: z.string().min(1, 'Обязательное поле'),
  vin: z.string().min(17).max(17, 'VIN — 17 символов'),
  year: z.number().int().min(2000).max(2030),
  // ...
})

const { register, handleSubmit, formState: { errors } } = useForm<CarFormData>({
  resolver: zodResolver(schema),
  defaultValues: car ?? {},
})
```

Ошибки показывать под полем, красным текстом `text-danger text-small`.

---

## Утилиты

```ts
// formatDate.ts
export const formatDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })

// formatMoney.ts
export const formatMoney = (n: number | string) =>
  Number(n).toLocaleString('ru-RU') + ' ₽'

// daysUntil.ts
export const daysUntil = (d: string | Date) =>
  Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)

export const daysOverdue = (d: string | Date) =>
  Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 86400000))

// daysColor.ts
export const daysColor = (days: number) =>
  days <= 14 ? 'text-danger' : days <= 30 ? 'text-warning' : 'text-muted'
```

---

## Настройка проекта

### `vite.config.ts`

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',  // Nuxt backend
    },
  },
})
```

### `tsconfig.json` — paths

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### `main.tsx`

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router/dom'
import { store } from '@/app/store'
import { router } from '@/router'
import '@/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
)
```

### `index.css`

```css
@import "tailwindcss";

@layer base {
  html { zoom: 1; }
  body {
    @apply bg-canvas text-frost-glow font-sans m-0;
  }
  a { @apply text-frost-glow hover:text-white; }
}
```

---

## Критерии готовности

- [ ] Все роуты работают, защищённые редиректят на `/login`
- [ ] Логин / логаут работают
- [ ] CRUD машин: список с фильтрами и поиском, карточка, форма добавления/редактирования
- [ ] CRUD договоров: список, карточка с графиком платежей, создание, смена статуса
- [ ] CRUD водителей: список с поиском, карточка с историей договоров
- [ ] Платежи: список должников с сортировкой, отметка оплаты
- [ ] Штрафы: список, добавление, смена статуса
- [ ] Дашборд: все KPI, парк машин, ближайшие платежи, топ должников
- [ ] Дизайн-система подключена, нет хардкода цветов
- [ ] RTK Query: все запросы, инвалидация кешей после мутаций
- [ ] Formы с Zod-валидацией, ошибки отображаются
- [ ] TypeScript: нет `any` в бизнес-логике
- [ ] ESLint / Prettier: нет ошибок

---

## Ссылки на бэкенд

Полная документация API и модели данных — в файле `BACKEND.md` в корне этого репозитория.
Схема базы данных — `prisma/schema.prisma`.
