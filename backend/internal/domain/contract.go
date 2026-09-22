package domain

import (
	"time"

	"github.com/shopspring/decimal"
)

type ContractStatus string

const (
	ContractStatusActive    ContractStatus = "ACTIVE"
	ContractStatusCompleted ContractStatus = "COMPLETED"
	ContractStatusCancelled ContractStatus = "CANCELLED"
)

type Contract struct {
	ID             int            `json:"id"`
	CarID          int            `json:"car_id"`
	DriverID       int            `json:"driver_id"`
	Status         ContractStatus `json:"status"`
	TotalAmount    decimal.Decimal `json:"total_amount"`
	PaidAmount     decimal.Decimal `json:"paid_amount"`
	MonthlyPayment decimal.Decimal `json:"monthly_payment"`
	StartDate      time.Time      `json:"start_date"`
	EndDate        *time.Time     `json:"end_date"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
}
