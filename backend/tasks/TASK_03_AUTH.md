# TASK 03 — Аутентификация (JWT + bcrypt)

## Цель
Реализовать login endpoint, JWT-мидлвару, репозиторий и сервис пользователей.

## Зависимости
- TASK 01, TASK 02 выполнены

---

## 3.1 Domain — `internal/domain/user.go`

```go
type UserRole string

const (
    RoleAdmin   UserRole = "ADMIN"
    RoleManager UserRole = "MANAGER"
)

type User struct {
    ID           int       `json:"id"`
    Email        string    `json:"email"`
    PasswordHash string    `json:"-"`
    FullName     string    `json:"full_name"`
    Role         UserRole  `json:"role"`
    CreatedAt    time.Time `json:"created_at"`
    UpdatedAt    time.Time `json:"updated_at"`
}

type Claims struct {
    ID    int      `json:"id"`
    Email string   `json:"email"`
    Name  string   `json:"name"`
    Role  UserRole `json:"role"`
    jwt.RegisteredClaims
}
```

---

## 3.2 Repository — `internal/repository/interfaces.go`

```go
type UserRepository interface {
    GetByEmail(ctx context.Context, email string) (*domain.User, error)
    Create(ctx context.Context, user *domain.User) (*domain.User, error)
}
```

---

## 3.3 Repository — `internal/repository/postgres/user.go`

Реализовать `UserRepository` используя `pgxpool.Pool`:

**`GetByEmail`** — SELECT по email, вернуть `domain.ErrNotFound` если pgx.ErrNoRows.

**`Create`** — INSERT RETURNING *.

---

## 3.4 Service — `internal/service/auth.go`

```go
type AuthService struct {
    userRepo  repository.UserRepository
    jwtSecret string
}

// Login — проверить email+пароль, вернуть JWT токен
func (s *AuthService) Login(ctx context.Context, email, password string) (string, error)

// GenerateToken — создать JWT с Claims{id, email, name, role}, exp=24h
func (s *AuthService) GenerateToken(user *domain.User) (string, error)

// ParseToken — распарсить и верифицировать токен, вернуть Claims
func (s *AuthService) ParseToken(tokenStr string) (*domain.Claims, error)
```

Логика `Login`:
1. `userRepo.GetByEmail` → если ErrNotFound → return ErrUnauthorized
2. `bcrypt.CompareHashAndPassword(user.PasswordHash, password)` → если ошибка → return ErrUnauthorized
3. `GenerateToken(user)` → вернуть токен

---

## 3.5 DTO — `internal/dto/auth.go`

```go
type LoginRequest struct {
    Email    string `json:"email"    validate:"required,email"`
    Password string `json:"password" validate:"required,min=6"`
}

type LoginResponse struct {
    AccessToken string `json:"access_token"`
    TokenType   string `json:"token_type"` // всегда "bearer"
}
```

---

## 3.6 Handler — `internal/handler/auth.go`

**`POST /api/auth/login`**

```
1. Декодировать JSON → LoginRequest
2. Валидировать (validator)
3. authService.Login(ctx, req.Email, req.Password)
4. При ErrUnauthorized → 401 {"detail": "Неверный email или пароль"}
5. При успехе → 200 LoginResponse{access_token, token_type: "bearer"}
```

---

## 3.7 Middleware — `internal/middleware/auth.go`

```go
func Auth(authService *service.AuthService) func(http.Handler) http.Handler
```

Логика:
1. Взять заголовок `Authorization`
2. Если нет или не начинается с `"Bearer "` → 401
3. `authService.ParseToken(token)` → если ошибка → 401
4. Положить `claims` в контекст: `context.WithValue(r.Context(), claimsKey, claims)`

Вспомогательная функция:
```go
func ClaimsFromCtx(ctx context.Context) *domain.Claims
```

---

## 3.8 Вспомогательный helper `internal/handler/response.go`

```go
// JSON ответ с кодом
func JSON(w http.ResponseWriter, code int, v any)

// Ответ ошибки
func Error(w http.ResponseWriter, code int, msg string)
```

---

## 3.9 Router — `internal/handler/router.go`

```go
func NewRouter(
    authSvc  *service.AuthService,
    // ... другие сервисы добавятся позже
) http.Handler {
    r := chi.NewRouter()
    
    // Глобальные мидлвары
    r.Use(middleware.Logger)     // zerolog
    r.Use(middleware.Recoverer)  // chi recoverer
    r.Use(middleware.RequestID)  // chi request id
    
    // Публичные маршруты
    r.Post("/api/auth/login", authHandler.Login)
    r.Get("/api/health", healthHandler.Check)
    
    // Защищённые маршруты (добавятся в следующих тасках)
    r.Group(func(r chi.Router) {
        r.Use(authMiddleware.Auth(authSvc))
        // ...
    })
    
    return r
}
```

---

## Критерии выполнения
- [ ] `POST /api/auth/login` с правильными данными возвращает JWT токен
- [ ] `POST /api/auth/login` с неверным паролем → 401
- [ ] Запрос к защищённому маршруту без токена → 401
- [ ] Запрос с невалидным токеном → 401
- [ ] Запрос с валидным токеном → 200
