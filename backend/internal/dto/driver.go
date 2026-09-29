package dto

import (
	"time"

	"github.com/dutik/auto-hub/internal/domain"
	"github.com/shopspring/decimal"
)

type CreateDriverRequest struct {
	FullName    string `json:"fullName"    validate:"required"`
	Phone       string `json:"phone"       validate:"required"`
	PassportNum string `json:"passportNum" validate:"required"`
	LicenseNum  string `json:"licenseNum"  validate:"required"`
	Status      string `json:"status"      validate:"required,oneof=ACTIVE INACTIVE"`
}

type UpdateDriverRequest struct {
	FullName    string `json:"fullName"    validate:"required"`
	Phone       string `json:"phone"       validate:"required"`
	PassportNum string `json:"passportNum" validate:"required"`
	LicenseNum  string `json:"licenseNum"  validate:"required"`
	Status      string `json:"status"      validate:"required,oneof=ACTIVE INACTIVE"`
}

type ActiveContractForDriver struct {
	ID     int      `json:"id"`
	Status string   `json:"status"`
	Car    CarBrief `json:"car"`
}

type CarBrief struct {
	PlateNumber string `json:"plateNumber"`
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
	TotalAmount    decimal.Decimal `json:"totalAmount"`
	PaidAmount     decimal.Decimal `json:"paidAmount"`
	MonthlyPayment decimal.Decimal `json:"monthlyPayment"`
	StartDate      time.Time       `json:"startDate"`
	EndDate        *time.Time      `json:"endDate"`
	CreatedAt      time.Time       `json:"createdAt"`
	UpdatedAt      time.Time       `json:"updatedAt"`
	Car            CarWithYear     `json:"car"`
	Payments       []domain.Payment `json:"payments"`
}

type CarWithYear struct {
	ID          int    `json:"id"`
	PlateNumber string `json:"plateNumber"`
	Brand       string `json:"brand"`
	Model       string `json:"model"`
	Year        int    `json:"year"`
}

type DriverDetailResponse struct {
	domain.Driver
	Contracts []ContractWithCar `json:"contracts"`
}
