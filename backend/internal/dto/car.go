package dto

import (
	"time"

	"github.com/dutik/auto-hub/internal/domain"
	"github.com/shopspring/decimal"
)

type CreateCarRequest struct {
	PlateNumber      string     `json:"plateNumber"       validate:"required"`
	VIN              string     `json:"vin"               validate:"required"`
	Brand            string     `json:"brand"             validate:"required"`
	Model            string     `json:"model"             validate:"required"`
	Year             int        `json:"year"              validate:"required,min=1900,max=2100"`
	Status           string     `json:"status"            validate:"required,oneof=FREE RENTED REPAIR SOLD"`
	Mileage          int        `json:"mileage"           validate:"min=0"`
	EngineVolume     *float64   `json:"engineVolume"`
	FuelType         *string    `json:"fuelType"          validate:"omitempty,oneof=PETROL DIESEL ELECTRIC HYBRID GAS"`
	OsagoBefore      *time.Time `json:"osagoBefore"`
	InspectionBefore *time.Time `json:"inspectionBefore"`
}

type UpdateCarRequest struct {
	PlateNumber      string     `json:"plateNumber"       validate:"required"`
	VIN              string     `json:"vin"               validate:"required"`
	Brand            string     `json:"brand"             validate:"required"`
	Model            string     `json:"model"             validate:"required"`
	Year             int        `json:"year"              validate:"required,min=1900,max=2100"`
	Status           string     `json:"status"            validate:"required,oneof=FREE RENTED REPAIR SOLD"`
	Mileage          int        `json:"mileage"           validate:"min=0"`
	EngineVolume     *float64   `json:"engineVolume"`
	FuelType         *string    `json:"fuelType"          validate:"omitempty,oneof=PETROL DIESEL ELECTRIC HYBRID GAS"`
	OsagoBefore      *time.Time `json:"osagoBefore"`
	InspectionBefore *time.Time `json:"inspectionBefore"`
}

type ActiveContractBrief struct {
	ID             int             `json:"id"`
	Status         string          `json:"status"`
	TotalAmount    decimal.Decimal `json:"totalAmount"`
	PaidAmount     decimal.Decimal `json:"paidAmount"`
	MonthlyPayment decimal.Decimal `json:"monthlyPayment"`
	StartDate      time.Time       `json:"startDate"`
	EndDate        *time.Time      `json:"endDate"`
	Driver         DriverName      `json:"driver"`
}

type DriverName struct {
	FullName string `json:"fullName"`
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
	Driver   *domain.Driver   `json:"driver"`
	Payments []domain.Payment `json:"payments"`
}

type CarDetailResponse struct {
	domain.Car
	Contracts []ContractForCarDetail `json:"contracts"`
	Fines     []domain.Fine          `json:"fines"`
}
