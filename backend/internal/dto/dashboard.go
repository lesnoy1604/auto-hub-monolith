package dto

type DashboardResponse struct {
	Cars       CarStats       `json:"cars"`
	Contracts  ContractStats  `json:"contracts"`
	Payments   PaymentStats   `json:"payments"`
	Fines      FineStats      `json:"fines"`
	TopDebtors []TopDebtor    `json:"top_debtors"`
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
	OverdueCount       int               `json:"overdue_count"`
	OverdueAmount      float64           `json:"overdue_amount"`
	CollectedThisMonth float64           `json:"collected_this_month"`
	Upcoming           []UpcomingPayment `json:"upcoming"`
}

type FineStats struct {
	UnpaidCount  int     `json:"unpaid_count"`
	UnpaidAmount float64 `json:"unpaid_amount"`
}

type TopDebtor struct {
	DriverID       int     `json:"driver_id"`
	FullName       string  `json:"full_name"`
	CarPlate       string  `json:"car_plate"`
	CarLabel       string  `json:"car_label"`
	ContractID     int     `json:"contract_id"`
	TotalOverdue   float64 `json:"total_overdue"`
	PaymentCount   int     `json:"payment_count"`
	MaxDaysOverdue int     `json:"max_days_overdue"`
}
