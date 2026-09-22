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
	PlateNumber      string     `json:"plateNumber"`
	VIN              string     `json:"vin"`
	Brand            string     `json:"brand"`
	Model            string     `json:"model"`
	Year             int        `json:"year"`
	Status           CarStatus  `json:"status"`
	Mileage          int        `json:"mileage"`
	OsagoBefore      *time.Time `json:"osagoBefore"`
	InspectionBefore *time.Time `json:"inspectionBefore"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
}
