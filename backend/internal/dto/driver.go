package dto

import (
	"time"

	"github.com/dutik/auto-hub/internal/domain"
	"github.com/shopspring/decimal"
)

type CreateDriverRequest struct {
	FullName    string `json:"full_name"    validate:"required"`
	Phone       string `json:"phone"        validate:"required"`
	PassportNum string `json:"passport_num" validate:"required"`
	LicenseNum  string `json:"license_num"  validate:"required"`
	Status      string `json:"status"       validate:"required,oneof=ACTIVE INACTIVE"`
}

type UpdateDriverRequest struct {
	FullName    string `json:"full_name"    validate:"required"`
	Phone       string `json:"phone"        validate:"required"`
	PassportNum string `json:"passport_num" validate:"required"`
	LicenseNum  string `json:"license_num"  validate:"required"`
	Status      string `json:"status"       validate:"required,oneof=ACTIVE INACTIVE"`
}

type ActiveContractForDriver struct {
	ID     int      `json:"id"`
	Status string   `json:"status"`
	Car    CarBrief `json:"car"`
}

type CarBrief struct {
	PlateNumber string `json:"plate_number"`
	Brand       string `json:"brand"`
	Model       string `json:"model"`
}

type DriverWithContracts struct {
	domain.Driver
	Contracts []ActiveContractForDriver `json:"contracts"`
}

type DriversListResponse struct {
	Drivers []DriverWithContracts `json:"drivers"`
	Total   int                   `json:"total"`
}

type ContractWithCar struct {
	ID             int             `json:"id"`
	Status         string          `json:"status"`
	TotalAmount    decimal.Decimal `json:"total_amount"`
	PaidAmount     decimal.Decimal `json:"paid_amount"`
	MonthlyPayment decimal.Decimal `json:"monthly_payment"`
	StartDate      time.Time       `json:"start_date"`
	EndDate        *time.Time      `json:"end_date"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
	Car            CarWithYear     `json:"car"`
}

type CarWithYear struct {
	PlateNumber string `json:"plate_number"`
	Brand       string `json:"brand"`
	Model       string `json:"model"`
	Year        int    `json:"year"`
}

type DriverDetailResponse struct {
	domain.Driver
	Contracts []ContractWithCar `json:"contracts"`
}
