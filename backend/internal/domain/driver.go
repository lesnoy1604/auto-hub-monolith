package domain

import "time"

type DriverStatus string

const (
	DriverStatusActive   DriverStatus = "ACTIVE"
	DriverStatusInactive DriverStatus = "INACTIVE"
)

type Driver struct {
	ID          int          `json:"id"`
	FullName    string       `json:"fullName"`
	Phone       string       `json:"phone"`
	PassportNum string       `json:"passportNum"`
	LicenseNum  string       `json:"licenseNum"`
	Status      DriverStatus `json:"status"`
	CreatedAt   time.Time    `json:"createdAt"`
	UpdatedAt   time.Time    `json:"updatedAt"`
}
