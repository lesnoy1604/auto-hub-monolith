package domain

import (
	"time"

	"github.com/shopspring/decimal"
)

type CarStatus string

const (
	CarStatusFree   CarStatus = "FREE"
	CarStatusRented CarStatus = "RENTED"
	CarStatusRepair CarStatus = "REPAIR"
	CarStatusSold   CarStatus = "SOLD"
)

type FuelType string

const (
	FuelPetrol   FuelType = "PETROL"
	FuelDiesel   FuelType = "DIESEL"
	FuelElectric FuelType = "ELECTRIC"
	FuelHybrid   FuelType = "HYBRID"
	FuelGas      FuelType = "GAS"
)

type BodyType string

const (
	BodySedan     BodyType = "SEDAN"
	BodyHatchback BodyType = "HATCHBACK"
	BodyCrossover BodyType = "CROSSOVER"
	BodyMinivan   BodyType = "MINIVAN"
	BodyWagon     BodyType = "WAGON"
	BodySUV       BodyType = "SUV"
	BodyCoupe     BodyType = "COUPE"
	BodyPickup    BodyType = "PICKUP"
	BodyVan       BodyType = "VAN"
)

type Car struct {
	ID               int              `json:"id"`
	PlateNumber      string           `json:"plateNumber"`
	VIN              string           `json:"vin"`
	Brand            string           `json:"brand"`
	Model            string           `json:"model"`
	Year             int              `json:"year"`
	Status           CarStatus        `json:"status"`
	Mileage          int              `json:"mileage"`
	EngineVolume     *decimal.Decimal `json:"engineVolume"`
	FuelType         *FuelType        `json:"fuelType"`
	BodyType         *BodyType        `json:"bodyType"`
	OsagoBefore      *time.Time       `json:"osagoBefore"`
	InspectionBefore *time.Time       `json:"inspectionBefore"`
	CreatedAt        time.Time        `json:"createdAt"`
	UpdatedAt        time.Time        `json:"updatedAt"`
}
