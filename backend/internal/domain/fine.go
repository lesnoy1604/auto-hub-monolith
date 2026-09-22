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
	CarID       int             `json:"car_id"`
	DriverID    int             `json:"driver_id"`
	ContractID  *int            `json:"contract_id"`
	Amount      decimal.Decimal `json:"amount"`
	Description string          `json:"description"`
	FineDate    time.Time       `json:"fine_date"`
	Status      FineStatus      `json:"status"`
	PaidAt      *time.Time      `json:"paid_at"`
	CreatedAt   time.Time       `json:"created_at"`
}
