package handler

import (
	"net/http"
	"strconv"

	"github.com/dutik/auto-hub/internal/dto"
	"github.com/dutik/auto-hub/internal/service"
	"github.com/go-chi/chi/v5"
)

type ContractHandler struct {
	svc *service.ContractService
}

func NewContractHandler(svc *service.ContractService) *ContractHandler {
	return &ContractHandler{svc: svc}
}

// List godoc
// @Summary      Список договоров
// @Tags         contracts
// @Produce      json
// @Param        status  query     string  false  "Фильтр по статусу (ACTIVE, COMPLETED, CANCELLED)"
// @Success      200     {object}  dto.ContractsListResponse
// @Security     BearerAuth
// @Router       /contracts [get]
func (h *ContractHandler) List(w http.ResponseWriter, r *http.Request) {
	status := queryParam(r, "status")
	resp, err := h.svc.List(r.Context(), status)
	if err != nil {
		HandleError(w, err)
		return
	}
	JSON(w, http.StatusOK, resp)
}

// GetByID godoc
// @Summary      Детали договора
// @Description  Возвращает договор с машиной, водителем и платежами. Пересчитывает paid_amount.
// @Tags         contracts
// @Produce      json
// @Param        id   path      int  true  "ID договора"
// @Success      200  {object}  dto.ContractDetailResponse
// @Failure      404  {object}  map[string]string
// @Security     BearerAuth
// @Router       /contracts/{id} [get]
func (h *ContractHandler) GetByID(w http.ResponseWriter, r *http.Request) {
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
// @Summary      Создать договор
// @Description  Создаёт договор, меняет статус машины на RENTED и генерирует платёжный график
// @Tags         contracts
// @Accept       json
// @Produce      json
// @Param        body  body      dto.CreateContractRequest  true  "Данные договора"
// @Success      201   {object}  domain.Contract
// @Failure      400   {object}  map[string]string
// @Failure      404   {object}  map[string]string
// @Failure      409   {object}  map[string]string  "Машина не свободна"
// @Security     BearerAuth
// @Router       /contracts [post]
func (h *ContractHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateContractRequest
	if err := DecodeAndValidate(r, &req); err != nil {
		HandleError(w, err)
		return
	}

	contract, err := h.svc.Create(r.Context(), &req)
	if err != nil {
		HandleError(w, err)
		return
	}
	JSON(w, http.StatusCreated, contract)
}

// Update godoc
// @Summary      Обновить договор
// @Description  При смене статуса с ACTIVE на другой — освобождает машину (FREE)
// @Tags         contracts
// @Accept       json
// @Produce      json
// @Param        id    path      int                        true  "ID договора"
// @Param        body  body      dto.UpdateContractRequest  true  "Поля для обновления"
// @Success      200   {object}  dto.ContractResponse
// @Failure      404   {object}  map[string]string
// @Security     BearerAuth
// @Router       /contracts/{id} [put]
func (h *ContractHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}

	var req dto.UpdateContractRequest
	if err := DecodeAndValidate(r, &req); err != nil {
		HandleError(w, err)
		return
	}

	resp, err := h.svc.Update(r.Context(), id, &req)
	if err != nil {
		HandleError(w, err)
		return
	}
	JSON(w, http.StatusOK, resp)
}

// Delete godoc
// @Summary      Удалить договор
// @Tags         contracts
// @Produce      json
// @Param        id   path      int  true  "ID договора"
// @Success      204  "No Content"
// @Failure      404  {object}  map[string]string
// @Failure      409  {object}  map[string]string
// @Security     BearerAuth
// @Router       /contracts/{id} [delete]
func (h *ContractHandler) Delete(w http.ResponseWriter, r *http.Request) {
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

// GetPayments godoc
// @Summary      Платежи по договору
// @Tags         contracts
// @Produce      json
// @Param        id   path      int  true  "ID договора"
// @Success      200  {array}   domain.Payment
// @Failure      404  {object}  map[string]string
// @Security     BearerAuth
// @Router       /contracts/{id}/payments [get]
func (h *ContractHandler) GetPayments(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}

	payments, err := h.svc.GetPayments(r.Context(), id)
	if err != nil {
		HandleError(w, err)
		return
	}
	JSON(w, http.StatusOK, payments)
}
