package postgres

import (
	"context"
	"time"

	"github.com/dutik/auto-hub/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

type inspectionRepo struct {
	db *pgxpool.Pool
}

func NewInspectionRepository(db *pgxpool.Pool) *inspectionRepo {
	return &inspectionRepo{db: db}
}

func (r *inspectionRepo) Create(ctx context.Context, carID int, inspectedAt time.Time, notes string) (*domain.CarInspection, error) {
	insp := &domain.CarInspection{}
	err := r.db.QueryRow(ctx,
		`INSERT INTO car_inspections (car_id, inspected_at, notes)
		 VALUES ($1, $2, $3)
		 RETURNING id, car_id, inspected_at, COALESCE(notes, ''), created_at`,
		carID, inspectedAt, notes,
	).Scan(&insp.ID, &insp.CarID, &insp.InspectedAt, &insp.Notes, &insp.CreatedAt)
	if err != nil {
		return nil, err
	}
	insp.Photos = []domain.InspectionPhoto{}
	return insp, nil
}

func (r *inspectionRepo) AddPhoto(ctx context.Context, inspectionID int, angle domain.InspectionAngle, filename string) (*domain.InspectionPhoto, error) {
	p := &domain.InspectionPhoto{}
	err := r.db.QueryRow(ctx,
		`INSERT INTO car_inspection_photos (inspection_id, angle, filename)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (inspection_id, angle) DO UPDATE SET filename = EXCLUDED.filename, created_at = NOW()
		 RETURNING id, inspection_id, angle, filename, created_at`,
		inspectionID, angle, filename,
	).Scan(&p.ID, &p.InspectionID, &p.Angle, &p.Filename, &p.CreatedAt)
	return p, err
}

func (r *inspectionRepo) ListByCarID(ctx context.Context, carID int) ([]domain.CarInspection, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, car_id, inspected_at, COALESCE(notes, ''), created_at
		 FROM car_inspections WHERE car_id = $1 ORDER BY inspected_at DESC`,
		carID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var inspections []domain.CarInspection
	idxByID := make(map[int]int)
	for rows.Next() {
		insp := domain.CarInspection{Photos: []domain.InspectionPhoto{}}
		if err := rows.Scan(&insp.ID, &insp.CarID, &insp.InspectedAt, &insp.Notes, &insp.CreatedAt); err != nil {
			return nil, err
		}
		idxByID[insp.ID] = len(inspections)
		inspections = append(inspections, insp)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if len(inspections) == 0 {
		return []domain.CarInspection{}, nil
	}

	ids := make([]int, len(inspections))
	for i, insp := range inspections {
		ids[i] = insp.ID
	}

	photoRows, err := r.db.Query(ctx,
		`SELECT id, inspection_id, angle, filename, created_at
		 FROM car_inspection_photos WHERE inspection_id = ANY($1) ORDER BY created_at ASC`,
		ids,
	)
	if err != nil {
		return nil, err
	}
	defer photoRows.Close()

	for photoRows.Next() {
		p := domain.InspectionPhoto{}
		if err := photoRows.Scan(&p.ID, &p.InspectionID, &p.Angle, &p.Filename, &p.CreatedAt); err != nil {
			return nil, err
		}
		if idx, ok := idxByID[p.InspectionID]; ok {
			inspections[idx].Photos = append(inspections[idx].Photos, p)
		}
	}
	return inspections, photoRows.Err()
}
