package postgres

import (
	"context"
	"errors"

	"github.com/dutik/auto-hub/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type driverRepo struct {
	db *pgxpool.Pool
}

func NewDriverRepository(db *pgxpool.Pool) *driverRepo {
	return &driverRepo{db: db}
}

const driverColumns = `id, full_name, phone, passport_num, license_num, status, created_at, updated_at`

func scanDriver(row pgx.Row) (*domain.Driver, error) {
	d := &domain.Driver{}
	err := row.Scan(&d.ID, &d.FullName, &d.Phone, &d.PassportNum, &d.LicenseNum, &d.Status, &d.CreatedAt, &d.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return d, nil
}

func (r *driverRepo) List(ctx context.Context, status *domain.DriverStatus, search *string) ([]domain.Driver, error) {
	rows, err := r.db.Query(ctx,
		`SELECT `+driverColumns+` FROM drivers
		 WHERE ($1::text IS NULL OR status::text = $1)
		   AND ($2::text IS NULL OR full_name ILIKE '%' || $2 || '%')
		 ORDER BY created_at DESC`,
		status, search,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var drivers []domain.Driver
	for rows.Next() {
		d := domain.Driver{}
		if err := rows.Scan(&d.ID, &d.FullName, &d.Phone, &d.PassportNum, &d.LicenseNum, &d.Status, &d.CreatedAt, &d.UpdatedAt); err != nil {
			return nil, err
		}
		drivers = append(drivers, d)
	}
	return drivers, rows.Err()
}

func (r *driverRepo) GetByID(ctx context.Context, id int) (*domain.Driver, error) {
	row := r.db.QueryRow(ctx, `SELECT `+driverColumns+` FROM drivers WHERE id = $1`, id)
	return scanDriver(row)
}

func (r *driverRepo) Create(ctx context.Context, d *domain.Driver) (*domain.Driver, error) {
	row := r.db.QueryRow(ctx,
		`INSERT INTO drivers (full_name, phone, passport_num, license_num, status)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING `+driverColumns,
		d.FullName, d.Phone, d.PassportNum, d.LicenseNum, d.Status,
	)
	return scanDriver(row)
}

func (r *driverRepo) Update(ctx context.Context, id int, d *domain.Driver) (*domain.Driver, error) {
	row := r.db.QueryRow(ctx,
		`UPDATE drivers SET full_name=$1, phone=$2, passport_num=$3, license_num=$4, status=$5
		 WHERE id=$6 RETURNING `+driverColumns,
		d.FullName, d.Phone, d.PassportNum, d.LicenseNum, d.Status, id,
	)
	return scanDriver(row)
}

func (r *driverRepo) Delete(ctx context.Context, id int) error {
	tag, err := r.db.Exec(ctx, `DELETE FROM drivers WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}
