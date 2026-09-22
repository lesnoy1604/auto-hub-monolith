package domain

import "time"

type CarStatus string

const (
	CarStatusFree   CarStatus = "FREE"
	CarStatusRented CarStatus = "RENTED"
	CarStatusRepair CarStatus = "REPAIR"
	CarStatusSold   CarStatus = "SOLD"
)

type Car struct {
	ID               int        `json:"id"`
	PlateNumber      string     `json:"plate_number"`
	VIN              string     `json:"vin"`
	Brand            string     `json:"brand"`
	Model            string     `json:"model"`
	Year             int        `json:"year"`
	Status           CarStatus  `json:"status"`
	Mileage          int        `json:"mileage"`
	OsagoBefore      *time.Time `json:"osago_before"`
	InspectionBefore *time.Time `json:"inspection_before"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}
