package handler

import (
	"net/http"
	"strconv"

	"github.com/dutik/auto-hub/internal/dto"
	"github.com/dutik/auto-hub/internal/service"
	"github.com/go-chi/chi/v5"
)

type CarHandler struct {
	svc *service.CarService
}

func NewCarHandler(svc *service.CarService) *CarHandler {
	return &CarHandler{svc: svc}
}

// List godoc
// @Summary      Список машин
// @Tags         cars
// @Produce      json
// @Param        status  query     string  false  "Фильтр по статусу (FREE, RENTED, REPAIR, SOLD)"
// @Param        search  query     string  false  "Поиск по номеру (ILIKE)"
// @Success      200     {object}  dto.CarsListResponse
// @Failure      401     {object}  map[string]string
// @Security     BearerAuth
// @Router       /cars [get]
func (h *CarHandler) List(w http.ResponseWriter, r *http.Request) {
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
// @Summary      Детали машины
// @Tags         cars
// @Produce      json
// @Param        id   path      int  true  "ID машины"
// @Success      200  {object}  dto.CarDetailResponse
// @Failure      404  {object}  map[string]string
// @Security     BearerAuth
// @Router       /cars/{id} [get]
func (h *CarHandler) GetByID(w http.ResponseWriter, r *http.Request) {
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
// @Summary      Создать машину
// @Tags         cars
// @Accept       json
// @Produce      json
// @Param        body  body      dto.CreateCarRequest  true  "Данные машины"
// @Success      201   {object}  domain.Car
// @Failure      400   {object}  map[string]string
// @Security     BearerAuth
// @Router       /cars [post]
func (h *CarHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateCarRequest
	if err := DecodeAndValidate(r, &req); err != nil {
		HandleError(w, err)
		return
	}

	car, err := h.svc.Create(r.Context(), &req)
	if err != nil {
		HandleError(w, err)
		return
	}
	JSON(w, http.StatusCreated, car)
}

// Update godoc
// @Summary      Обновить машину
// @Tags         cars
// @Accept       json
// @Produce      json
// @Param        id    path      int                   true  "ID машины"
// @Param        body  body      dto.UpdateCarRequest  true  "Данные машины"
// @Success      200   {object}  domain.Car
// @Failure      400   {object}  map[string]string
// @Failure      404   {object}  map[string]string
// @Security     BearerAuth
// @Router       /cars/{id} [put]
func (h *CarHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}

	var req dto.UpdateCarRequest
	if err := DecodeAndValidate(r, &req); err != nil {
		HandleError(w, err)
		return
	}

	car, err := h.svc.Update(r.Context(), id, &req)
	if err != nil {
		HandleError(w, err)
		return
	}
	JSON(w, http.StatusOK, car)
}

// Delete godoc
// @Summary      Удалить машину
// @Tags         cars
// @Produce      json
// @Param        id   path      int  true  "ID машины"
// @Success      204  "No Content"
// @Failure      404  {object}  map[string]string
// @Failure      409  {object}  map[string]string
// @Security     BearerAuth
// @Router       /cars/{id} [delete]
func (h *CarHandler) Delete(w http.ResponseWriter, r *http.Request) {
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

func queryParam(r *http.Request, key string) *string {
	v := r.URL.Query().Get(key)
	if v == "" {
		return nil
	}
	return &v
}
