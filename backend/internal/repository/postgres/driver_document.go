package postgres

import (
	"context"
	"errors"

	"github.com/dutik/auto-hub/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type driverDocumentRepo struct {
	db *pgxpool.Pool
}

func NewDriverDocumentRepository(db *pgxpool.Pool) *driverDocumentRepo {
	return &driverDocumentRepo{db: db}
}

func (r *driverDocumentRepo) Create(ctx context.Context, driverID int, docType domain.DriverDocType, title, filename string) (*domain.DriverDocument, error) {
	doc := &domain.DriverDocument{}
	err := r.db.QueryRow(ctx,
		`INSERT INTO driver_documents (driver_id, doc_type, title, filename)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, driver_id, doc_type, title, filename, created_at`,
		driverID, docType, title, filename,
	).Scan(&doc.ID, &doc.DriverID, &doc.DocType, &doc.Title, &doc.Filename, &doc.CreatedAt)
	return doc, err
}

func (r *driverDocumentRepo) ListByDriverID(ctx context.Context, driverID int) ([]domain.DriverDocument, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, driver_id, doc_type, title, filename, created_at
		 FROM driver_documents WHERE driver_id = $1 ORDER BY created_at DESC`,
		driverID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	docs := []domain.DriverDocument{}
	for rows.Next() {
		var doc domain.DriverDocument
		if err := rows.Scan(&doc.ID, &doc.DriverID, &doc.DocType, &doc.Title, &doc.Filename, &doc.CreatedAt); err != nil {
			return nil, err
		}
		docs = append(docs, doc)
	}
	return docs, rows.Err()
}

func (r *driverDocumentRepo) Delete(ctx context.Context, id int) (*domain.DriverDocument, error) {
	doc := &domain.DriverDocument{}
	err := r.db.QueryRow(ctx,
		`DELETE FROM driver_documents WHERE id = $1
		 RETURNING id, driver_id, doc_type, title, filename, created_at`,
		id,
	).Scan(&doc.ID, &doc.DriverID, &doc.DocType, &doc.Title, &doc.Filename, &doc.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return doc, nil
}
