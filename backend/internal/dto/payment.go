package dto

import (
	"time"

	"github.com/dutik/auto-hub/internal/domain"
)

type PayPaymentRequest struct {
	PaymentID int        `json:"paymentId" validate:"required"`
	PaidAt    *time.Time `json:"paidAt"`
}

type PaymentWithContract struct {
	domain.Payment
	Contract *ContractForPayment `json:"contract"`
}

type PaymentsListResponse struct {
	Payments []PaymentWithContract `json:"payments"`
	Total    int                   `json:"total"`
}

type ContractSummary struct {
	ID               int     `json:"id"`
	PaidAmount       float64 `json:"paidAmount"`
	RemainingBalance float64 `json:"remainingBalance"`
}

type PayPaymentResponse struct {
	Payment  domain.Payment  `json:"payment"`
	Contract ContractSummary `json:"contract"`
}
