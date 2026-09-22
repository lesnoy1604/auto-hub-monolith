package dto

import (
	"time"

	"github.com/shopspring/decimal"
)

type DashboardResponse struct {
	Cars       CarStats      `json:"cars"`
	Contracts  ContractStats `json:"contracts"`
	Payments   PaymentStats  `json:"payments"`
	Fines      FineStats     `json:"fines"`
	TopDebtors []TopDebtor   `json:"topDebtors"`
}

type CarStats struct {
	Free   int `json:"FREE"`
	Rented int `json:"RENTED"`
	Repair int `json:"REPAIR"`
	Sold   int `json:"SOLD"`
	Total  int `json:"total"`
}

type ContractStats struct {
	Active int `json:"active"`
}

type PaymentStats struct {
	OverdueCount       int               `json:"overdueCount"`
	OverdueAmount      float64           `json:"overdueAmount"`
	CollectedThisMonth float64           `json:"collectedThisMonth"`
	Upcoming           []UpcomingPayment `json:"upcoming"`
}

type FineStats struct {
	UnpaidCount  int     `json:"unpaidCount"`
	UnpaidAmount float64 `json:"unpaidAmount"`
}

type TopDebtor struct {
	DriverID              int     `json:"driverId"`
	DriverName            string  `json:"driverName"`
	CarPlate              string  `json:"carPlate"`
	CarModel              string  `json:"carModel"`
	ContractID            int     `json:"contractId"`
	TotalDebt             float64 `json:"totalDebt"`
	OverdueCount          int     `json:"overdueCount"`
	MaxDaysOverdue        int     `json:"maxDaysOverdue"`
	FirstOverduePaymentID int     `json:"firstOverduePaymentId"`
}

type UpcomingPayment struct {
	ID         int                  `json:"id"`
	ContractID int                  `json:"contractId"`
	DueDate    time.Time            `json:"dueDate"`
	Amount     decimal.Decimal      `json:"amount"`
	Car        UpcomingPaymentCar   `json:"car"`
	Driver     UpcomingPaymentDriver `json:"driver"`
}

type UpcomingPaymentCar struct {
	PlateNumber string `json:"plateNumber"`
	Brand       string `json:"brand"`
	Model       string `json:"model"`
}

type UpcomingPaymentDriver struct {
	FullName string `json:"fullName"`
}
