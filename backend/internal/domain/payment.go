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
	ContractID int             `json:"contract_id"`
	Amount     decimal.Decimal `json:"amount"`
	Status     PaymentStatus   `json:"status"`
	DueDate    time.Time       `json:"due_date"`
	PaidAt     *time.Time      `json:"paid_at"`
	CreatedAt  time.Time       `json:"created_at"`
}
