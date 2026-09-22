package dto

import (
	"time"

	"github.com/dutik/auto-hub/internal/domain"
)

type PayPaymentRequest struct {
	PaymentID int        `json:"payment_id" validate:"required"`
	PaidAt    *time.Time `json:"paid_at"`
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
	PaidAmount       float64 `json:"paid_amount"`
	RemainingBalance float64 `json:"remaining_balance"`
}

type PayPaymentResponse struct {
	Payment  domain.Payment  `json:"payment"`
	Contract ContractSummary `json:"contract"`
}

// UpcomingPayment — для дашборда
type UpcomingPaymentContract struct {
	ID     int                   `json:"id"`
	Car    *UpcomingPaymentCar   `json:"car"`
	Driver *UpcomingPaymentDriver `json:"driver"`
}

type UpcomingPaymentCar struct {
	ID          int    `json:"id"`
	PlateNumber string `json:"plate_number"`
}

type UpcomingPaymentDriver struct {
	FullName string `json:"full_name"`
}

type UpcomingPayment struct {
	domain.Payment
	Contract *UpcomingPaymentContract `json:"contract"`
}
