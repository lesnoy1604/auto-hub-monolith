package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/dutik/auto-hub/internal/domain"
)

func JSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

func Error(w http.ResponseWriter, code int, msg string) {
	JSON(w, code, map[string]string{"detail": msg})
}

func HandleError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrNotFound):
		Error(w, http.StatusNotFound, "Resource not found")
	case errors.Is(err, domain.ErrCarNotFree):
		Error(w, http.StatusConflict, err.Error())
	case errors.Is(err, domain.ErrCarHasActiveContract):
		Error(w, http.StatusConflict, err.Error())
	case errors.Is(err, domain.ErrDriverHasActiveContract):
		Error(w, http.StatusConflict, err.Error())
	case errors.Is(err, domain.ErrConflict):
		Error(w, http.StatusConflict, err.Error())
	case errors.Is(err, domain.ErrAlreadyPaid):
		Error(w, http.StatusConflict, "Payment is already paid")
	case errors.Is(err, domain.ErrUnauthorized):
		Error(w, http.StatusUnauthorized, "Unauthorized")
	case errors.Is(err, domain.ErrDriverNotFound):
		Error(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, domain.ErrValidation):
		Error(w, http.StatusBadRequest, err.Error())
	default:
		Error(w, http.StatusInternalServerError, "Internal server error")
	}
}
