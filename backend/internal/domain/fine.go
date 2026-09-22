package domain

import (
	"time"

	"github.com/shopspring/decimal"
)

type FineStatus string

const (
	FineStatusUnpaid   FineStatus = "UNPAID"
	FineStatusPaid     FineStatus = "PAID"
	FineStatusDisputed FineStatus = "DISPUTED"
)

type Fine struct {
	ID          int             `json:"id"`
	CarID       int             `json:"carId"`
	DriverID    int             `json:"driverId"`
	ContractID  *int            `json:"contractId"`
	Amount      decimal.Decimal `json:"amount"`
	Description string          `json:"description"`
	FineDate    time.Time       `json:"fineDate"`
	Status      FineStatus      `json:"status"`
	PaidAt      *time.Time      `json:"paidAt"`
	CreatedAt   time.Time       `json:"createdAt"`
}
