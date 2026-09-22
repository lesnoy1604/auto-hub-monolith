package domain

import "time"

type DriverStatus string

const (
	DriverStatusActive   DriverStatus = "ACTIVE"
	DriverStatusInactive DriverStatus = "INACTIVE"
)

type Driver struct {
	ID          int          `json:"id"`
	FullName    string       `json:"full_name"`
	Phone       string       `json:"phone"`
	PassportNum string       `json:"passport_num"`
	LicenseNum  string       `json:"license_num"`
	Status      DriverStatus `json:"status"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}
