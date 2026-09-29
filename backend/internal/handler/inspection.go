package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/dutik/auto-hub/internal/domain"
	"github.com/dutik/auto-hub/internal/service"
	"github.com/go-chi/chi/v5"
)

type InspectionHandler struct {
	svc *service.InspectionService
}

func NewInspectionHandler(svc *service.InspectionService) *InspectionHandler {
	return &InspectionHandler{svc: svc}
}

func (h *InspectionHandler) Create(w http.ResponseWriter, r *http.Request) {
	carID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid car id")
		return
	}

	var req struct {
		InspectedAt *time.Time `json:"inspectedAt"`
		Notes       string     `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}

	at := time.Now()
	if req.InspectedAt != nil {
		at = *req.InspectedAt
	}

	insp, err := h.svc.Create(r.Context(), carID, at, req.Notes)
	if err != nil {
		HandleError(w, err)
		return
	}
	JSON(w, http.StatusCreated, insp)
}

func (h *InspectionHandler) UploadPhoto(w http.ResponseWriter, r *http.Request) {
	inspectionID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid inspection id")
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		Error(w, http.StatusBadRequest, "failed to parse form (max 10 MB)")
		return
	}

	angle := domain.InspectionAngle(r.FormValue("angle"))
	file, header, err := r.FormFile("photo")
	if err != nil {
		Error(w, http.StatusBadRequest, "photo file required")
		return
	}
	defer file.Close()

	photo, err := h.svc.UploadPhoto(r.Context(), inspectionID, angle, file, header)
	if err != nil {
		HandleError(w, err)
		return
	}
	JSON(w, http.StatusCreated, photo)
}

func (h *InspectionHandler) ListByCarID(w http.ResponseWriter, r *http.Request) {
	carID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid car id")
		return
	}

	inspections, err := h.svc.ListByCarID(r.Context(), carID)
	if err != nil {
		HandleError(w, err)
		return
	}
	JSON(w, http.StatusOK, inspections)
}
