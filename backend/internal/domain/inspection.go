package domain

import "time"

type InspectionAngle string

const (
	AngleFront    InspectionAngle = "front"
	AngleBack     InspectionAngle = "back"
	AngleLeft     InspectionAngle = "left"
	AngleRight    InspectionAngle = "right"
	AngleInterior InspectionAngle = "interior"
	AngleOdometer InspectionAngle = "odometer"
)

type InspectionPhoto struct {
	ID           int             `json:"id"`
	InspectionID int             `json:"inspectionId"`
	Angle        InspectionAngle `json:"angle"`
	Filename     string          `json:"filename"`
	URL          string          `json:"url"`
	CreatedAt    time.Time       `json:"createdAt"`
}

type CarInspection struct {
	ID          int               `json:"id"`
	CarID       int               `json:"carId"`
	InspectedAt time.Time         `json:"inspectedAt"`
	Notes       string            `json:"notes"`
	Photos      []InspectionPhoto `json:"photos"`
	CreatedAt   time.Time         `json:"createdAt"`
}
