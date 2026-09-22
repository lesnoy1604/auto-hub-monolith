package domain

import (
	"time"

	"github.com/shopspring/decimal"
)

type PaymentStatus string

const (
	PaymentStatusPaid    PaymentStatus = "PAID"
	PaymentStatusUnpaid  PaymentStatus = "UNPAID"
	PaymentStatusOverdue PaymentStatus = "OVERDUE"
)

type Payment struct {
	ID         int             `json:"id"`
	ContractID int             `json:"contractId"`
	Amount     decimal.Decimal `json:"amount"`
	Status     PaymentStatus   `json:"status"`
	DueDate    time.Time       `json:"dueDate"`
	PaidAt     *time.Time      `json:"paidDate"`
	CreatedAt  time.Time       `json:"createdAt"`
}
