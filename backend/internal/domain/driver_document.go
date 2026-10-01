package domain

import "time"

type DriverDocType string

const (
	DocTypePassport DriverDocType = "passport"
	DocTypeLicense  DriverDocType = "license"
	DocTypeContract DriverDocType = "contract"
	DocTypePhoto    DriverDocType = "photo"
	DocTypeOther    DriverDocType = "other"
)

type DriverDocument struct {
	ID        int           `json:"id"`
	DriverID  int           `json:"driverId"`
	DocType   DriverDocType `json:"docType"`
	Title     string        `json:"title"`
	Filename  string        `json:"filename"`
	URL       string        `json:"url"`
	CreatedAt time.Time     `json:"createdAt"`
}
