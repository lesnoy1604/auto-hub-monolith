package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/dutik/auto-hub/internal/domain"
	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

func DecodeAndValidate(r *http.Request, dst any) error {
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		return fmt.Errorf("%w: %s", domain.ErrValidation, err.Error())
	}
	if err := validate.Struct(dst); err != nil {
		return fmt.Errorf("%w: %s", domain.ErrValidation, err.Error())
	}
	return nil
}
