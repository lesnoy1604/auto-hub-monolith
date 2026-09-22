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
	ID             int             `json:"id"`
	CarID          int             `json:"carId"`
	DriverID       int             `json:"driverId"`
	Status         ContractStatus  `json:"status"`
	TotalAmount    decimal.Decimal `json:"totalAmount"`
	PaidAmount     decimal.Decimal `json:"paidAmount"`
	MonthlyPayment decimal.Decimal `json:"monthlyPayment"`
	StartDate      time.Time       `json:"startDate"`
	EndDate        *time.Time      `json:"endDate"`
	CreatedAt      time.Time       `json:"createdAt"`
	UpdatedAt      time.Time       `json:"updatedAt"`
}
