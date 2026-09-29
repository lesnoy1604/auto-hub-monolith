package service

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"time"

	"github.com/dutik/auto-hub/internal/domain"
	"github.com/dutik/auto-hub/internal/repository"
	"github.com/google/uuid"
)

type InspectionService struct {
	repo       repository.InspectionRepository
	uploadsDir string
	uploadsURL string
}

func NewInspectionService(repo repository.InspectionRepository, uploadsDir, uploadsURL string) *InspectionService {
	return &InspectionService{repo: repo, uploadsDir: uploadsDir, uploadsURL: uploadsURL}
}

func (s *InspectionService) Create(ctx context.Context, carID int, inspectedAt time.Time, notes string) (*domain.CarInspection, error) {
	return s.repo.Create(ctx, carID, inspectedAt, notes)
}

func (s *InspectionService) UploadPhoto(ctx context.Context, inspectionID int, angle domain.InspectionAngle, file multipart.File, header *multipart.FileHeader) (*domain.InspectionPhoto, error) {
	ext := filepath.Ext(header.Filename)
	if ext == "" {
		ext = ".jpg"
	}
	relPath := fmt.Sprintf("inspections/%s%s", uuid.New().String(), ext)
	absPath := filepath.Join(s.uploadsDir, relPath)

	if err := os.MkdirAll(filepath.Dir(absPath), 0755); err != nil {
		return nil, err
	}
	dst, err := os.Create(absPath)
	if err != nil {
		return nil, err
	}
	defer dst.Close()
	if _, err := io.Copy(dst, file); err != nil {
		return nil, err
	}

	photo, err := s.repo.AddPhoto(ctx, inspectionID, angle, relPath)
	if err != nil {
		return nil, err
	}
	photo.URL = s.uploadsURL + "/" + relPath
	return photo, nil
}

func (s *InspectionService) ListByCarID(ctx context.Context, carID int) ([]domain.CarInspection, error) {
	inspections, err := s.repo.ListByCarID(ctx, carID)
	if err != nil {
		return nil, err
	}
	for i := range inspections {
		for j := range inspections[i].Photos {
			inspections[i].Photos[j].URL = s.uploadsURL + "/" + inspections[i].Photos[j].Filename
		}
	}
	return inspections, nil
}
