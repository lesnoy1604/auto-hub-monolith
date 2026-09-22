package handler

import (
	"net/http"
	"strconv"

	"github.com/dutik/auto-hub/internal/dto"
	"github.com/dutik/auto-hub/internal/service"
	"github.com/go-chi/chi/v5"
)

type PaymentHandler struct {
	svc *service.PaymentService
}

func NewPaymentHandler(svc *service.PaymentService) *PaymentHandler {
	return &PaymentHandler{svc: svc}
}

// List godoc
// @Summary      Список платежей
// @Description  Без фильтра возвращает UNPAID + OVERDUE
// @Tags         payments
// @Produce      json
// @Param        status  query     string  false  "PAID, UNPAID, OVERDUE, PENDING (=UNPAID+OVERDUE)"
// @Success      200     {object}  dto.PaymentsListResponse
// @Security     BearerAuth
// @Router       /payments [get]
func (h *PaymentHandler) List(w http.ResponseWriter, r *http.Request) {
	status := queryParam(r, "status")
	resp, err := h.svc.List(r.Context(), status)
	if err != nil {
		HandleError(w, err)
		return
	}
	JSON(w, http.StatusOK, resp)
}

// Pay godoc
// @Summary      Оплатить платёж
// @Description  Отмечает платёж как PAID и пересчитывает paid_amount договора
// @Tags         payments
// @Accept       json
// @Produce      json
// @Param        body  body      dto.PayPaymentRequest  true  "ID платежа и дата оплаты"
// @Success      200   {object}  dto.PayPaymentResponse
// @Failure      400   {object}  map[string]string
// @Failure      404   {object}  map[string]string
// @Failure      409   {object}  map[string]string  "Платёж уже оплачен"
// @Security     BearerAuth
// @Router       /payments [post]
// Delete godoc
// @Summary      Удалить платёж
// @Description  Нельзя удалить оплаченный платёж
// @Tags         payments
// @Produce      json
// @Param        id   path      int  true  "ID платежа"
// @Success      204  "No Content"
// @Failure      404  {object}  map[string]string
// @Failure      409  {object}  map[string]string  "Платёж уже оплачен"
// @Security     BearerAuth
// @Router       /payments/{id} [delete]
func (h *PaymentHandler) Delete(w http.ResponseWriter, r *http.Request) {
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

func (h *PaymentHandler) Pay(w http.ResponseWriter, r *http.Request) {
	var req dto.PayPaymentRequest
	if err := DecodeAndValidate(r, &req); err != nil {
		HandleError(w, err)
		return
	}

	resp, err := h.svc.Pay(r.Context(), &req)
	if err != nil {
		HandleError(w, err)
		return
	}
	JSON(w, http.StatusOK, resp)
}
