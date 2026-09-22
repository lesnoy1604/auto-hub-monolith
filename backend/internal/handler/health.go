package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type HealthHandler struct {
	pool *pgxpool.Pool
}

func NewHealthHandler(pool *pgxpool.Pool) *HealthHandler {
	return &HealthHandler{pool: pool}
}

// Check godoc
// @Summary      Health check
// @Description  Проверяет доступность сервера и базы данных
// @Tags         system
// @Produce      json
// @Success      200  {object}  map[string]interface{}
// @Failure      500  {object}  map[string]string
// @Router       /health [get]
func (h *HealthHandler) Check(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	var dbTime time.Time
	err := h.pool.QueryRow(ctx, "SELECT NOW()").Scan(&dbTime)
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	JSON(w, http.StatusOK, map[string]any{
		"status":  "ok",
		"db_time": dbTime,
	})
}
