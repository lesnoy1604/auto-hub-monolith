package dto

import (
	"time"

	"github.com/dutik/auto-hub/internal/domain"
)

type CreateFineRequest struct {
	CarID       int        `json:"carId"       validate:"required"`
	DriverID    *int       `json:"driverId"`
	ContractID  *int       `json:"contractId"`
	Amount      float64    `json:"amount"      validate:"required,gt=0"`
	Description string     `json:"description" validate:"required"`
	FineDate    time.Time  `json:"fineDate"    validate:"required"`
}

type UpdateFineRequest struct {
	Status string     `json:"status" validate:"required,oneof=UNPAID PAID DISPUTED"`
	PaidAt *time.Time `json:"paidAt"`
}

type CarForFine struct {
	ID          int    `json:"id"`
	PlateNumber string `json:"plateNumber"`
	Brand       string `json:"brand"`
	Model       string `json:"model"`
}

type DriverForFine struct {
	ID       int    `json:"id"`
	FullName string `json:"fullName"`
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
