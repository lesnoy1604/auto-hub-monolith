package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/dutik/auto-hub/internal/domain"
	"github.com/dutik/auto-hub/internal/service"
)

type contextKey string

const claimsKey contextKey = "claims"

func Auth(authSvc *service.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if !strings.HasPrefix(header, "Bearer ") {
				http.Error(w, `{"detail":"unauthorized"}`, http.StatusUnauthorized)
				return
			}

			tokenStr := strings.TrimPrefix(header, "Bearer ")
			claims, err := authSvc.ParseToken(tokenStr)
			if err != nil {
				http.Error(w, `{"detail":"unauthorized"}`, http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), claimsKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func ClaimsFromCtx(ctx context.Context) *service.Claims {
	v, _ := ctx.Value(claimsKey).(*service.Claims)
	return v
}

// RequireRole — опциональная мидлвара для проверки роли
func RequireRole(role domain.UserRole) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims := ClaimsFromCtx(r.Context())
			if claims == nil || claims.Role != role {
				http.Error(w, `{"detail":"forbidden"}`, http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
