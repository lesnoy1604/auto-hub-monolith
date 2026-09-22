package dto

import (
	"time"

	"github.com/dutik/auto-hub/internal/domain"
	"github.com/shopspring/decimal"
)

type CreateContractRequest struct {
	CarID          int       `json:"car_id"          validate:"required"`
	DriverID       int       `json:"driver_id"       validate:"required"`
	TotalAmount    float64   `json:"total_amount"    validate:"required,gt=0"`
	MonthlyPayment float64   `json:"monthly_payment" validate:"required,gt=0"`
	StartDate      time.Time `json:"start_date"      validate:"required"`
}

type UpdateContractRequest struct {
	Status         *string    `json:"status"          validate:"omitempty,oneof=ACTIVE COMPLETED CANCELLED"`
	EndDate        *time.Time `json:"end_date"`
	MonthlyPayment *float64   `json:"monthly_payment" validate:"omitempty,gt=0"`
	TotalAmount    *float64   `json:"total_amount"    validate:"omitempty,gt=0"`
}

type ContractListItem struct {
	domain.Contract
	Car              CarBrief   `json:"car"`
	Driver           DriverName `json:"driver"`
	RemainingBalance float64    `json:"remaining_balance"`
}

type ContractsListResponse struct {
	Contracts []ContractListItem `json:"contracts"`
	Total     int                `json:"total"`
}

type ContractDetailResponse struct {
	domain.Contract
	Car              *domain.Car      `json:"car"`
	Driver           *domain.Driver   `json:"driver"`
	Payments         []domain.Payment `json:"payments"`
	RemainingBalance float64          `json:"remaining_balance"`
}

type ContractResponse struct {
	domain.Contract
	RemainingBalance float64 `json:"remaining_balance"`
}

// ContractForPayment — вложенный в платёж
type ContractForPayment struct {
	ID             int             `json:"id"`
	CarID          int             `json:"car_id"`
	DriverID       int             `json:"driver_id"`
	Status         string          `json:"status"`
	TotalAmount    decimal.Decimal `json:"total_amount"`
	PaidAmount     decimal.Decimal `json:"paid_amount"`
	MonthlyPayment decimal.Decimal `json:"monthly_payment"`
	StartDate      time.Time       `json:"start_date"`
	EndDate        *time.Time      `json:"end_date"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
	Car            *CarForPayment  `json:"car"`
	Driver         *DriverForPayment `json:"driver"`
}

type CarForPayment struct {
	ID          int    `json:"id"`
	PlateNumber string `json:"plate_number"`
	Brand       string `json:"brand"`
	Model       string `json:"model"`
}

type DriverForPayment struct {
	ID       int    `json:"id"`
	FullName string `json:"full_name"`
	Phone    string `json:"phone"`
}
