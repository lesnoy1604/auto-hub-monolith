package service

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"

	"github.com/dutik/auto-hub/internal/domain"
	"github.com/dutik/auto-hub/internal/repository"
	"github.com/google/uuid"
)

type DriverDocumentService struct {
	repo       repository.DriverDocumentRepository
	uploadsDir string
	uploadsURL string
}

func NewDriverDocumentService(repo repository.DriverDocumentRepository, uploadsDir, uploadsURL string) *DriverDocumentService {
	return &DriverDocumentService{repo: repo, uploadsDir: uploadsDir, uploadsURL: uploadsURL}
}

func (s *DriverDocumentService) Upload(ctx context.Context, driverID int, docType domain.DriverDocType, title string, file multipart.File, header *multipart.FileHeader) (*domain.DriverDocument, error) {
	ext := filepath.Ext(header.Filename)
	if ext == "" {
		ext = ".bin"
	}
	relPath := fmt.Sprintf("drivers/%s%s", uuid.New().String(), ext)
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

	doc, err := s.repo.Create(ctx, driverID, docType, title, relPath)
	if err != nil {
		return nil, err
	}
	doc.URL = s.uploadsURL + "/" + relPath
	return doc, nil
}

func (s *DriverDocumentService) ListByDriverID(ctx context.Context, driverID int) ([]domain.DriverDocument, error) {
	docs, err := s.repo.ListByDriverID(ctx, driverID)
	if err != nil {
		return nil, err
	}
	for i := range docs {
		docs[i].URL = s.uploadsURL + "/" + docs[i].Filename
	}
	return docs, nil
}

func (s *DriverDocumentService) Delete(ctx context.Context, id int) error {
	doc, err := s.repo.Delete(ctx, id)
	if err != nil {
		return err
	}
	absPath := filepath.Join(s.uploadsDir, doc.Filename)
	_ = os.Remove(absPath)
	return nil
}
