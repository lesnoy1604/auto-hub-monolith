package handler

import (
	"net/http"
	"strconv"

	"github.com/dutik/auto-hub/internal/dto"
	"github.com/dutik/auto-hub/internal/service"
	"github.com/go-chi/chi/v5"
)

type FineHandler struct {
	svc *service.FineService
}

func NewFineHandler(svc *service.FineService) *FineHandler {
	return &FineHandler{svc: svc}
}

// List godoc
// @Summary      Список штрафов
// @Tags         fines
// @Produce      json
// @Param        status     query     string  false  "Фильтр по статусу (UNPAID, PAID, DISPUTED)"
// @Param        car_id     query     int     false  "Фильтр по машине"
// @Param        driver_id  query     int     false  "Фильтр по водителю"
// @Success      200        {object}  dto.FinesListResponse
// @Security     BearerAuth
// @Router       /fines [get]
func (h *FineHandler) List(w http.ResponseWriter, r *http.Request) {
	status := queryParam(r, "status")

	var carID *int
	if v := r.URL.Query().Get("car_id"); v != "" {
		id, err := strconv.Atoi(v)
		if err != nil {
			Error(w, http.StatusBadRequest, "invalid car_id")
			return
		}
		carID = &id
	}

	var driverID *int
	if v := r.URL.Query().Get("driver_id"); v != "" {
		id, err := strconv.Atoi(v)
		if err != nil {
			Error(w, http.StatusBadRequest, "invalid driver_id")
			return
		}
		driverID = &id
	}

	resp, err := h.svc.List(r.Context(), status, carID, driverID)
	if err != nil {
		HandleError(w, err)
		return
	}
	JSON(w, http.StatusOK, resp)
}

// Create godoc
// @Summary      Создать штраф
// @Description  Если driver_id не передан — определяется автоматически из активного договора машины
// @Tags         fines
// @Accept       json
// @Produce      json
// @Param        body  body      dto.CreateFineRequest  true  "Данные штрафа"
// @Success      201   {object}  domain.Fine
// @Failure      400   {object}  map[string]string
// @Security     BearerAuth
// @Router       /fines [post]
func (h *FineHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateFineRequest
	if err := DecodeAndValidate(r, &req); err != nil {
		HandleError(w, err)
		return
	}

	fine, err := h.svc.Create(r.Context(), &req)
	if err != nil {
		HandleError(w, err)
		return
	}
	JSON(w, http.StatusCreated, fine)
}

// Update godoc
// @Summary      Обновить штраф
// @Description  При status=PAID проставляет paid_at. При status!=PAID сбрасывает paid_at в null.
// @Tags         fines
// @Accept       json
// @Produce      json
// @Param        id    path      int                    true  "ID штрафа"
// @Param        body  body      dto.UpdateFineRequest  true  "Новый статус"
// @Success      200   {object}  domain.Fine
// @Failure      404   {object}  map[string]string
// @Security     BearerAuth
// @Router       /fines/{id} [put]
func (h *FineHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}

	var req dto.UpdateFineRequest
	if err := DecodeAndValidate(r, &req); err != nil {
		HandleError(w, err)
		return
	}

	fine, err := h.svc.Update(r.Context(), id, &req)
	if err != nil {
		HandleError(w, err)
		return
	}
	JSON(w, http.StatusOK, fine)
}

// Delete godoc
// @Summary      Удалить штраф
// @Tags         fines
// @Produce      json
// @Param        id   path      int  true  "ID штрафа"
// @Success      204  "No Content"
// @Failure      404  {object}  map[string]string
// @Security     BearerAuth
// @Router       /fines/{id} [delete]
func (h *FineHandler) Delete(w http.ResponseWriter, r *http.Request) {
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
