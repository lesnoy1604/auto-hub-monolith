package domain

import "errors"

var (
	ErrNotFound              = errors.New("not found")
	ErrConflict              = errors.New("conflict")
	ErrUnauthorized          = errors.New("unauthorized")
	ErrValidation            = errors.New("validation error")
	ErrAlreadyPaid           = errors.New("payment already paid")
	ErrCarNotFree            = errors.New("car is not available for rent")
	ErrDriverNotFound        = errors.New("no active contract found for this car, please provide driver_id")
	ErrCarHasActiveContract  = errors.New("cannot delete car with active contract")
	ErrDriverHasActiveContract = errors.New("cannot delete driver with active contract")
)
