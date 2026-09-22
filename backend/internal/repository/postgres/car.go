package postgres

import (
	"context"
	"errors"

	"github.com/dutik/auto-hub/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type carRepo struct {
	db *pgxpool.Pool
}

func NewCarRepository(db *pgxpool.Pool) *carRepo {
	return &carRepo{db: db}
}

const carColumns = `id, plate_number, vin, brand, model, year, status, mileage, osago_before, inspection_before, created_at, updated_at`

func scanCar(row pgx.Row) (*domain.Car, error) {
	c := &domain.Car{}
	err := row.Scan(
		&c.ID, &c.PlateNumber, &c.VIN, &c.Brand, &c.Model, &c.Year,
		&c.Status, &c.Mileage, &c.OsagoBefore, &c.InspectionBefore,
		&c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return c, nil
}

func (r *carRepo) List(ctx context.Context, status *domain.CarStatus, search *string) ([]domain.Car, error) {
	rows, err := r.db.Query(ctx,
		`SELECT `+carColumns+` FROM cars
		 WHERE ($1::text IS NULL OR status::text = $1)
		   AND ($2::text IS NULL OR plate_number ILIKE '%' || $2 || '%')
		 ORDER BY created_at DESC`,
		status, search,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cars []domain.Car
	for rows.Next() {
		c := domain.Car{}
		if err := rows.Scan(
			&c.ID, &c.PlateNumber, &c.VIN, &c.Brand, &c.Model, &c.Year,
			&c.Status, &c.Mileage, &c.OsagoBefore, &c.InspectionBefore,
			&c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			return nil, err
		}
		cars = append(cars, c)
	}
	return cars, rows.Err()
}

func (r *carRepo) GetByID(ctx context.Context, id int) (*domain.Car, error) {
	row := r.db.QueryRow(ctx,
		`SELECT `+carColumns+` FROM cars WHERE id = $1`, id,
	)
	return scanCar(row)
}

func (r *carRepo) Create(ctx context.Context, car *domain.Car) (*domain.Car, error) {
	row := r.db.QueryRow(ctx,
		`INSERT INTO cars (plate_number, vin, brand, model, year, status, mileage, osago_before, inspection_before)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		 RETURNING `+carColumns,
		car.PlateNumber, car.VIN, car.Brand, car.Model, car.Year,
		car.Status, car.Mileage, car.OsagoBefore, car.InspectionBefore,
	)
	return scanCar(row)
}

func (r *carRepo) Update(ctx context.Context, id int, car *domain.Car) (*domain.Car, error) {
	row := r.db.QueryRow(ctx,
		`UPDATE cars SET plate_number=$1, vin=$2, brand=$3, model=$4, year=$5,
		 status=$6, mileage=$7, osago_before=$8, inspection_before=$9
		 WHERE id=$10 RETURNING `+carColumns,
		car.PlateNumber, car.VIN, car.Brand, car.Model, car.Year,
		car.Status, car.Mileage, car.OsagoBefore, car.InspectionBefore, id,
	)
	return scanCar(row)
}

func (r *carRepo) UpdateStatus(ctx context.Context, id int, status domain.CarStatus) error {
	_, err := r.db.Exec(ctx, `UPDATE cars SET status=$1 WHERE id=$2`, status, id)
	return err
}

func (r *carRepo) UpdateStatusTx(ctx context.Context, tx pgx.Tx, id int, status domain.CarStatus) error {
	_, err := tx.Exec(ctx, `UPDATE cars SET status=$1 WHERE id=$2`, status, id)
	return err
}

func (r *carRepo) Delete(ctx context.Context, id int) error {
	tag, err := r.db.Exec(ctx, `DELETE FROM cars WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *carRepo) CountByStatus(ctx context.Context) (map[domain.CarStatus]int, error) {
	rows, err := r.db.Query(ctx, `SELECT status, COUNT(*) FROM cars GROUP BY status`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := map[domain.CarStatus]int{}
	for rows.Next() {
		var status domain.CarStatus
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return nil, err
		}
		result[status] = count
	}
	return result, rows.Err()
}
