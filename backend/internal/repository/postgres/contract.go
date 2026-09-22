package postgres

import (
	"context"
	"errors"

	"github.com/dutik/auto-hub/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"
)

type contractRepo struct {
	db *pgxpool.Pool
}

func NewContractRepository(db *pgxpool.Pool) *contractRepo {
	return &contractRepo{db: db}
}

const contractColumns = `id, car_id, driver_id, status, total_amount, paid_amount, monthly_payment, start_date, end_date, created_at, updated_at`

func scanContract(row pgx.Row) (*domain.Contract, error) {
	c := &domain.Contract{}
	err := row.Scan(
		&c.ID, &c.CarID, &c.DriverID, &c.Status,
		&c.TotalAmount, &c.PaidAmount, &c.MonthlyPayment,
		&c.StartDate, &c.EndDate, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return c, nil
}

func (r *contractRepo) List(ctx context.Context, status *domain.ContractStatus) ([]domain.Contract, error) {
	rows, err := r.db.Query(ctx,
		`SELECT `+contractColumns+` FROM contracts
		 WHERE ($1::text IS NULL OR status::text = $1)
		 ORDER BY created_at DESC`,
		status,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var contracts []domain.Contract
	for rows.Next() {
		c := domain.Contract{}
		if err := rows.Scan(
			&c.ID, &c.CarID, &c.DriverID, &c.Status,
			&c.TotalAmount, &c.PaidAmount, &c.MonthlyPayment,
			&c.StartDate, &c.EndDate, &c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			return nil, err
		}
		contracts = append(contracts, c)
	}
	return contracts, rows.Err()
}

func (r *contractRepo) GetByID(ctx context.Context, id int) (*domain.Contract, error) {
	row := r.db.QueryRow(ctx, `SELECT `+contractColumns+` FROM contracts WHERE id = $1`, id)
	return scanContract(row)
}

func (r *contractRepo) GetActiveByCarID(ctx context.Context, carID int) (*domain.Contract, error) {
	row := r.db.QueryRow(ctx,
		`SELECT `+contractColumns+` FROM contracts
		 WHERE car_id = $1 AND status = 'ACTIVE'
		 ORDER BY created_at DESC LIMIT 1`,
		carID,
	)
	return scanContract(row)
}

func (r *contractRepo) Create(ctx context.Context, c *domain.Contract) (*domain.Contract, error) {
	row := r.db.QueryRow(ctx,
		`INSERT INTO contracts (car_id, driver_id, status, total_amount, paid_amount, monthly_payment, start_date)
		 VALUES ($1, $2, 'ACTIVE', $3, 0, $4, $5)
		 RETURNING `+contractColumns,
		c.CarID, c.DriverID, c.TotalAmount, c.MonthlyPayment, c.StartDate,
	)
	return scanContract(row)
}

func (r *contractRepo) CreateTx(ctx context.Context, tx pgx.Tx, c *domain.Contract) (*domain.Contract, error) {
	row := tx.QueryRow(ctx,
		`INSERT INTO contracts (car_id, driver_id, status, total_amount, paid_amount, monthly_payment, start_date)
		 VALUES ($1, $2, 'ACTIVE', $3, 0, $4, $5)
		 RETURNING `+contractColumns,
		c.CarID, c.DriverID, c.TotalAmount, c.MonthlyPayment, c.StartDate,
	)
	return scanContract(row)
}

func (r *contractRepo) Update(ctx context.Context, id int, c *domain.Contract) (*domain.Contract, error) {
	row := r.db.QueryRow(ctx,
		`UPDATE contracts SET status=$1, end_date=$2, monthly_payment=$3, total_amount=$4
		 WHERE id=$5 RETURNING `+contractColumns,
		c.Status, c.EndDate, c.MonthlyPayment, c.TotalAmount, id,
	)
	return scanContract(row)
}

func (r *contractRepo) UpdateTx(ctx context.Context, tx pgx.Tx, id int, c *domain.Contract) (*domain.Contract, error) {
	row := tx.QueryRow(ctx,
		`UPDATE contracts SET status=$1, end_date=$2, monthly_payment=$3, total_amount=$4
		 WHERE id=$5 RETURNING `+contractColumns,
		c.Status, c.EndDate, c.MonthlyPayment, c.TotalAmount, id,
	)
	return scanContract(row)
}

func (r *contractRepo) UpdatePaidAmount(ctx context.Context, id int, paidAmount decimal.Decimal) error {
	_, err := r.db.Exec(ctx, `UPDATE contracts SET paid_amount=$1 WHERE id=$2`, paidAmount, id)
	return err
}

func (r *contractRepo) UpdatePaidAmountTx(ctx context.Context, tx pgx.Tx, id int, paidAmount decimal.Decimal) error {
	_, err := tx.Exec(ctx, `UPDATE contracts SET paid_amount=$1 WHERE id=$2`, paidAmount, id)
	return err
}

func (r *contractRepo) CountActive(ctx context.Context) (int, error) {
	var count int
	err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM contracts WHERE status = 'ACTIVE'`).Scan(&count)
	return count, err
}

func (r *contractRepo) Delete(ctx context.Context, id int) error {
	tag, err := r.db.Exec(ctx, `DELETE FROM contracts WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}
