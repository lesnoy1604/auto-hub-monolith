package postgres

import (
	"context"
	"errors"

	"github.com/dutik/auto-hub/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"
)

type fineRepo struct {
	db *pgxpool.Pool
}

func NewFineRepository(db *pgxpool.Pool) *fineRepo {
	return &fineRepo{db: db}
}

const fineColumns = `id, car_id, driver_id, contract_id, amount, description, fine_date, status, paid_at, created_at`

func scanFine(row pgx.Row) (*domain.Fine, error) {
	f := &domain.Fine{}
	err := row.Scan(
		&f.ID, &f.CarID, &f.DriverID, &f.ContractID,
		&f.Amount, &f.Description, &f.FineDate,
		&f.Status, &f.PaidAt, &f.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return f, nil
}

func (r *fineRepo) List(ctx context.Context, status *domain.FineStatus, carID *int, driverID *int) ([]domain.Fine, error) {
	rows, err := r.db.Query(ctx,
		`SELECT `+fineColumns+` FROM fines
		 WHERE ($1::text IS NULL OR status::text = $1)
		   AND ($2::int IS NULL OR car_id = $2)
		   AND ($3::int IS NULL OR driver_id = $3)
		 ORDER BY fine_date DESC`,
		status, carID, driverID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var fines []domain.Fine
	for rows.Next() {
		f := domain.Fine{}
		if err := rows.Scan(
			&f.ID, &f.CarID, &f.DriverID, &f.ContractID,
			&f.Amount, &f.Description, &f.FineDate,
			&f.Status, &f.PaidAt, &f.CreatedAt,
		); err != nil {
			return nil, err
		}
		fines = append(fines, f)
	}
	return fines, rows.Err()
}

func (r *fineRepo) GetByID(ctx context.Context, id int) (*domain.Fine, error) {
	row := r.db.QueryRow(ctx, `SELECT `+fineColumns+` FROM fines WHERE id = $1`, id)
	return scanFine(row)
}

func (r *fineRepo) Create(ctx context.Context, fine *domain.Fine) (*domain.Fine, error) {
	row := r.db.QueryRow(ctx,
		`INSERT INTO fines (car_id, driver_id, contract_id, amount, description, fine_date, status)
		 VALUES ($1, $2, $3, $4, $5, $6, 'UNPAID')
		 RETURNING `+fineColumns,
		fine.CarID, fine.DriverID, fine.ContractID,
		fine.Amount, fine.Description, fine.FineDate,
	)
	return scanFine(row)
}

func (r *fineRepo) Update(ctx context.Context, id int, fine *domain.Fine) (*domain.Fine, error) {
	row := r.db.QueryRow(ctx,
		`UPDATE fines SET status=$1, paid_at=$2 WHERE id=$3 RETURNING `+fineColumns,
		fine.Status, fine.PaidAt, id,
	)
	return scanFine(row)
}

func (r *fineRepo) ListByCar(ctx context.Context, carID int, limit int) ([]domain.Fine, error) {
	rows, err := r.db.Query(ctx,
		`SELECT `+fineColumns+` FROM fines WHERE car_id = $1 ORDER BY fine_date DESC LIMIT $2`,
		carID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var fines []domain.Fine
	for rows.Next() {
		f := domain.Fine{}
		if err := rows.Scan(
			&f.ID, &f.CarID, &f.DriverID, &f.ContractID,
			&f.Amount, &f.Description, &f.FineDate,
			&f.Status, &f.PaidAt, &f.CreatedAt,
		); err != nil {
			return nil, err
		}
		fines = append(fines, f)
	}
	return fines, rows.Err()
}

func (r *fineRepo) AggregateUnpaid(ctx context.Context) (int, decimal.Decimal, error) {
	var count int
	var sum decimal.Decimal
	err := r.db.QueryRow(ctx,
		`SELECT COUNT(*), COALESCE(SUM(amount), 0) FROM fines WHERE status = 'UNPAID'`,
	).Scan(&count, &sum)
	return count, sum, err
}

func (r *fineRepo) Delete(ctx context.Context, id int) error {
	tag, err := r.db.Exec(ctx, `DELETE FROM fines WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}
