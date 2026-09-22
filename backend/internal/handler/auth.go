package handler

import (
	"errors"
	"net/http"

	"github.com/dutik/auto-hub/internal/domain"
	"github.com/dutik/auto-hub/internal/dto"
	"github.com/dutik/auto-hub/internal/service"
)

type AuthHandler struct {
	svc *service.AuthService
}

func NewAuthHandler(svc *service.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc}
}

// Login godoc
// @Summary      Войти в систему
// @Description  Возвращает JWT токен по email и паролю
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        body  body      dto.LoginRequest   true  "Credentials"
// @Success      200   {object}  dto.LoginResponse
// @Failure      400   {object}  map[string]string
// @Failure      401   {object}  map[string]string
// @Router       /auth/login [post]
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req dto.LoginRequest
	if err := DecodeAndValidate(r, &req); err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}

	token, err := h.svc.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		if errors.Is(err, domain.ErrUnauthorized) {
			Error(w, http.StatusUnauthorized, "Неверный email или пароль")
			return
		}
		HandleError(w, err)
		return
	}

	JSON(w, http.StatusOK, dto.LoginResponse{
		AccessToken: token,
		TokenType:   "bearer",
	})
}
