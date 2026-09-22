package handler

import (
	"net/http"
	"strconv"

	"github.com/dutik/auto-hub/internal/dto"
	"github.com/dutik/auto-hub/internal/service"
	"github.com/go-chi/chi/v5"
)

type DriverHandler struct {
	svc *service.DriverService
}

func NewDriverHandler(svc *service.DriverService) *DriverHandler {
	return &DriverHandler{svc: svc}
}

// List godoc
// @Summary      Список водителей
// @Tags         drivers
// @Produce      json
// @Param        status  query     string  false  "Фильтр по статусу (ACTIVE, INACTIVE)"
// @Param        search  query     string  false  "Поиск по имени (ILIKE)"
// @Success      200     {object}  dto.DriversListResponse
// @Failure      401     {object}  map[string]string
// @Security     BearerAuth
// @Router       /drivers [get]
func (h *DriverHandler) List(w http.ResponseWriter, r *http.Request) {
	status := queryParam(r, "status")
	search := queryParam(r, "search")

	resp, err := h.svc.List(r.Context(), status, search)
	if err != nil {
		HandleError(w, err)
		return
	}
	JSON(w, http.StatusOK, resp)
}

// GetByID godoc
// @Summary      Детали водителя
// @Tags         drivers
// @Produce      json
// @Param        id   path      int  true  "ID водителя"
// @Success      200  {object}  dto.DriverDetailResponse
// @Failure      404  {object}  map[string]string
// @Security     BearerAuth
// @Router       /drivers/{id} [get]
func (h *DriverHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}

	resp, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		HandleError(w, err)
		return
	}
	JSON(w, http.StatusOK, resp)
}

// Create godoc
// @Summary      Создать водителя
// @Tags         drivers
// @Accept       json
// @Produce      json
// @Param        body  body      dto.CreateDriverRequest  true  "Данные водителя"
// @Success      201   {object}  domain.Driver
// @Failure      400   {object}  map[string]string
// @Security     BearerAuth
// @Router       /drivers [post]
func (h *DriverHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateDriverRequest
	if err := DecodeAndValidate(r, &req); err != nil {
		HandleError(w, err)
		return
	}

	driver, err := h.svc.Create(r.Context(), &req)
	if err != nil {
		HandleError(w, err)
		return
	}
	JSON(w, http.StatusCreated, driver)
}

// Update godoc
// @Summary      Обновить водителя
// @Tags         drivers
// @Accept       json
// @Produce      json
// @Param        id    path      int                      true  "ID водителя"
// @Param        body  body      dto.UpdateDriverRequest  true  "Данные водителя"
// @Success      200   {object}  domain.Driver
// @Failure      400   {object}  map[string]string
// @Failure      404   {object}  map[string]string
// @Security     BearerAuth
// @Router       /drivers/{id} [put]
func (h *DriverHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}

	var req dto.UpdateDriverRequest
	if err := DecodeAndValidate(r, &req); err != nil {
		HandleError(w, err)
		return
	}

	driver, err := h.svc.Update(r.Context(), id, &req)
	if err != nil {
		HandleError(w, err)
		return
	}
	JSON(w, http.StatusOK, driver)
}

// Delete godoc
// @Summary      Удалить водителя
// @Tags         drivers
// @Produce      json
// @Param        id   path      int  true  "ID водителя"
// @Success      204  "No Content"
// @Failure      404  {object}  map[string]string
// @Failure      409  {object}  map[string]string
// @Security     BearerAuth
// @Router       /drivers/{id} [delete]
func (h *DriverHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}

	if err := h.svc.Delete(r.Context(), id); err != nil {
		HandleError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
