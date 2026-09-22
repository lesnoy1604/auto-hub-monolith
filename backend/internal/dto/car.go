package dto

import (
	"time"

	"github.com/dutik/auto-hub/internal/domain"
	"github.com/shopspring/decimal"
)

type CreateCarRequest struct {
	PlateNumber      string     `json:"plate_number"       validate:"required"`
	VIN              string     `json:"vin"                validate:"required"`
	Brand            string     `json:"brand"              validate:"required"`
	Model            string     `json:"model"              validate:"required"`
	Year             int        `json:"year"               validate:"required,min=1900,max=2100"`
	Status           string     `json:"status"             validate:"required,oneof=FREE RENTED REPAIR SOLD"`
	Mileage          int        `json:"mileage"            validate:"min=0"`
	OsagoBefore      *time.Time `json:"osago_before"`
	InspectionBefore *time.Time `json:"inspection_before"`
}

type UpdateCarRequest struct {
	PlateNumber      string     `json:"plate_number"       validate:"required"`
	VIN              string     `json:"vin"                validate:"required"`
	Brand            string     `json:"brand"              validate:"required"`
	Model            string     `json:"model"              validate:"required"`
	Year             int        `json:"year"               validate:"required,min=1900,max=2100"`
	Status           string     `json:"status"             validate:"required,oneof=FREE RENTED REPAIR SOLD"`
	Mileage          int        `json:"mileage"            validate:"min=0"`
	OsagoBefore      *time.Time `json:"osago_before"`
	InspectionBefore *time.Time `json:"inspection_before"`
}

type ActiveContractBrief struct {
	ID             int            `json:"id"`
	Status         string         `json:"status"`
	TotalAmount    decimal.Decimal `json:"total_amount"`
	PaidAmount     decimal.Decimal `json:"paid_amount"`
	MonthlyPayment decimal.Decimal `json:"monthly_payment"`
	StartDate      time.Time      `json:"start_date"`
	EndDate        *time.Time     `json:"end_date"`
	Driver         DriverName     `json:"driver"`
}

type DriverName struct {
	FullName string `json:"full_name"`
}

type CarWithContracts struct {
	domain.Car
	Contracts []ActiveContractBrief `json:"contracts"`
}

type CarsListResponse struct {
	Cars  []CarWithContracts `json:"cars"`
	Total int                `json:"total"`
}

type ContractForCarDetail struct {
	domain.Contract
	Driver   *domain.Driver  `json:"driver"`
	Payments []domain.Payment `json:"payments"`
}

type CarDetailResponse struct {
	domain.Car
	Contracts []ContractForCarDetail `json:"contracts"`
	Fines     []domain.Fine          `json:"fines"`
}
