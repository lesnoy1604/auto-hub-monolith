package handler

import (
	"net/http"
	"strconv"

	"github.com/dutik/auto-hub/internal/domain"
	"github.com/dutik/auto-hub/internal/service"
	"github.com/go-chi/chi/v5"
)

type DriverDocumentHandler struct {
	svc *service.DriverDocumentService
}

func NewDriverDocumentHandler(svc *service.DriverDocumentService) *DriverDocumentHandler {
	return &DriverDocumentHandler{svc: svc}
}

func (h *DriverDocumentHandler) Upload(w http.ResponseWriter, r *http.Request) {
	driverID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid driver id")
		return
	}

	if err := r.ParseMultipartForm(20 << 20); err != nil {
		Error(w, http.StatusBadRequest, "failed to parse form (max 20 MB)")
		return
	}

	docType := domain.DriverDocType(r.FormValue("docType"))
	switch docType {
	case domain.DocTypePassport, domain.DocTypeLicense, domain.DocTypeContract, domain.DocTypePhoto, domain.DocTypeOther:
	default:
		docType = domain.DocTypeOther
	}

	title := r.FormValue("title")
	file, header, err := r.FormFile("file")
	if err != nil {
		Error(w, http.StatusBadRequest, "file required")
		return
	}
	defer file.Close()

	doc, err := h.svc.Upload(r.Context(), driverID, docType, title, file, header)
	if err != nil {
		HandleError(w, err)
		return
	}
	JSON(w, http.StatusCreated, doc)
}

func (h *DriverDocumentHandler) ListByDriverID(w http.ResponseWriter, r *http.Request) {
	driverID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid driver id")
		return
	}

	docs, err := h.svc.ListByDriverID(r.Context(), driverID)
	if err != nil {
		HandleError(w, err)
		return
	}
	JSON(w, http.StatusOK, docs)
}

func (h *DriverDocumentHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid document id")
		return
	}

	if err := h.svc.Delete(r.Context(), id); err != nil {
		HandleError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
