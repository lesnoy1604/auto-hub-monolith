package handler

import (
	"net/http"

	"github.com/dutik/auto-hub/internal/service"
)

type DashboardHandler struct {
	svc *service.DashboardService
}

func NewDashboardHandler(svc *service.DashboardService) *DashboardHandler {
	return &DashboardHandler{svc: svc}
}

// Get godoc
// @Summary      Сводная статистика
// @Description  Возвращает статистику по машинам, договорам, платежам, штрафам и топ должникам. Все запросы выполняются параллельно.
// @Tags         dashboard
// @Produce      json
// @Success      200  {object}  dto.DashboardResponse
// @Security     BearerAuth
// @Router       /dashboard [get]
func (h *DashboardHandler) Get(w http.ResponseWriter, r *http.Request) {
	resp, err := h.svc.Get(r.Context())
	if err != nil {
		HandleError(w, err)
		return
	}
	JSON(w, http.StatusOK, resp)
}
