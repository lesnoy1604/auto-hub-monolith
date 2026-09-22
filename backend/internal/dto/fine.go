package dto

import (
	"time"

	"github.com/dutik/auto-hub/internal/domain"
)

type CreateFineRequest struct {
	CarID       int        `json:"car_id"      validate:"required"`
	DriverID    *int       `json:"driver_id"`
	ContractID  *int       `json:"contract_id"`
	Amount      float64    `json:"amount"      validate:"required,gt=0"`
	Description string     `json:"description" validate:"required"`
	FineDate    time.Time  `json:"fine_date"   validate:"required"`
}

type UpdateFineRequest struct {
	Status string     `json:"status" validate:"required,oneof=UNPAID PAID DISPUTED"`
	PaidAt *time.Time `json:"paid_at"`
}

type CarForFine struct {
	ID          int    `json:"id"`
	PlateNumber string `json:"plate_number"`
	Brand       string `json:"brand"`
	Model       string `json:"model"`
}

type DriverForFine struct {
	ID       int    `json:"id"`
	FullName string `json:"full_name"`
}

type ContractForFine struct {
	ID int `json:"id"`
}

type FineWithRelations struct {
	domain.Fine
	Car      *CarForFine      `json:"car"`
	Driver   *DriverForFine   `json:"driver"`
	Contract *ContractForFine `json:"contract"`
}

type FinesListResponse struct {
	Fines []FineWithRelations `json:"fines"`
	Total int                 `json:"total"`
}
