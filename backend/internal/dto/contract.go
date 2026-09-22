package dto

import (
	"time"

	"github.com/dutik/auto-hub/internal/domain"
	"github.com/shopspring/decimal"
)

type CreateContractRequest struct {
	CarID          int       `json:"carId"          validate:"required"`
	DriverID       int       `json:"driverId"       validate:"required"`
	TotalAmount    float64   `json:"totalAmount"    validate:"required,gt=0"`
	MonthlyPayment float64   `json:"monthlyPayment" validate:"required,gt=0"`
	StartDate      time.Time `json:"startDate"      validate:"required"`
}

type UpdateContractRequest struct {
	Status         *string    `json:"status"          validate:"omitempty,oneof=ACTIVE COMPLETED CANCELLED"`
	EndDate        *time.Time `json:"endDate"`
	MonthlyPayment *float64   `json:"monthlyPayment" validate:"omitempty,gt=0"`
	TotalAmount    *float64   `json:"totalAmount"    validate:"omitempty,gt=0"`
}

type ContractListItem struct {
	domain.Contract
	Car              CarBrief   `json:"car"`
	Driver           DriverName `json:"driver"`
	RemainingBalance float64    `json:"remainingBalance"`
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
	RemainingBalance float64          `json:"remainingBalance"`
}

type ContractResponse struct {
	domain.Contract
	RemainingBalance float64 `json:"remainingBalance"`
}

type ContractForPayment struct {
	ID             int             `json:"id"`
	CarID          int             `json:"carId"`
	DriverID       int             `json:"driverId"`
	Status         string          `json:"status"`
	TotalAmount    decimal.Decimal `json:"totalAmount"`
	PaidAmount     decimal.Decimal `json:"paidAmount"`
	MonthlyPayment decimal.Decimal `json:"monthlyPayment"`
	StartDate      time.Time       `json:"startDate"`
	EndDate        *time.Time      `json:"endDate"`
	CreatedAt      time.Time       `json:"createdAt"`
	UpdatedAt      time.Time       `json:"updatedAt"`
	Car            *CarForPayment  `json:"car"`
	Driver         *DriverForPayment `json:"driver"`
}

type CarForPayment struct {
	ID          int    `json:"id"`
	PlateNumber string `json:"plateNumber"`
	Brand       string `json:"brand"`
	Model       string `json:"model"`
}

type DriverForPayment struct {
	ID       int    `json:"id"`
	FullName string `json:"fullName"`
	Phone    string `json:"phone"`
}
