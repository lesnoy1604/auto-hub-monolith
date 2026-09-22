package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/dutik/auto-hub/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"
)

type paymentRepo struct {
	db *pgxpool.Pool
}

func NewPaymentRepository(db *pgxpool.Pool) *paymentRepo {
	return &paymentRepo{db: db}
}

const paymentColumns = `id, contract_id, amount, status, due_date, paid_at, created_at`

func scanPayment(row pgx.Row) (*domain.Payment, error) {
	p := &domain.Payment{}
	err := row.Scan(&p.ID, &p.ContractID, &p.Amount, &p.Status, &p.DueDate, &p.PaidAt, &p.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return p, nil
}

func (r *paymentRepo) List(ctx context.Context, status *domain.PaymentStatus) ([]domain.Payment, error) {
	var query string
	var args []any

	if status == nil || *status == "PENDING" {
		query = `SELECT ` + paymentColumns + ` FROM payments WHERE status IN ('UNPAID', 'OVERDUE') ORDER BY due_date ASC`
	} else {
		query = `SELECT ` + paymentColumns + ` FROM payments WHERE status = $1 ORDER BY due_date ASC`
		args = append(args, *status)
	}

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var payments []domain.Payment
	for rows.Next() {
		p := domain.Payment{}
		if err := rows.Scan(&p.ID, &p.ContractID, &p.Amount, &p.Status, &p.DueDate, &p.PaidAt, &p.CreatedAt); err != nil {
			return nil, err
		}
		payments = append(payments, p)
	}
	return payments, rows.Err()
}

func (r *paymentRepo) ListByContractID(ctx context.Context, contractID int) ([]domain.Payment, error) {
	rows, err := r.db.Query(ctx,
		`SELECT `+paymentColumns+` FROM payments WHERE contract_id = $1 ORDER BY due_date ASC`,
		contractID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var payments []domain.Payment
	for rows.Next() {
		p := domain.Payment{}
		if err := rows.Scan(&p.ID, &p.ContractID, &p.Amount, &p.Status, &p.DueDate, &p.PaidAt, &p.CreatedAt); err != nil {
			return nil, err
		}
		payments = append(payments, p)
	}
	return payments, rows.Err()
}

func (r *paymentRepo) GetByID(ctx context.Context, id int) (*domain.Payment, error) {
	row := r.db.QueryRow(ctx, `SELECT `+paymentColumns+` FROM payments WHERE id = $1`, id)
	return scanPayment(row)
}

func (r *paymentRepo) BulkCreateTx(ctx context.Context, tx pgx.Tx, payments []domain.Payment) error {
	for _, p := range payments {
		_, err := tx.Exec(ctx,
			`INSERT INTO payments (contract_id, amount, status, due_date) VALUES ($1, $2, 'UNPAID', $3)`,
			p.ContractID, p.Amount, p.DueDate,
		)
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *paymentRepo) MarkAsPaidTx(ctx context.Context, tx pgx.Tx, id int, paidAt interface{}) (*domain.Payment, error) {
	var t time.Time
	switch v := paidAt.(type) {
	case time.Time:
		t = v
	case *time.Time:
		if v != nil {
			t = *v
		} else {
			t = time.Now()
		}
	default:
		t = time.Now()
	}

	row := tx.QueryRow(ctx,
		`UPDATE payments SET status='PAID', paid_at=$1 WHERE id=$2 RETURNING `+paymentColumns,
		t, id,
	)
	return scanPayment(row)
}

func (r *paymentRepo) SumPaidByContractIDTx(ctx context.Context, tx pgx.Tx, contractID int) (decimal.Decimal, error) {
	var sum decimal.Decimal
	err := tx.QueryRow(ctx,
		`SELECT COALESCE(SUM(amount), 0) FROM payments WHERE contract_id = $1 AND status = 'PAID'`,
		contractID,
	).Scan(&sum)
	return sum, err
}

func (r *paymentRepo) AggregateOverdue(ctx context.Context) (int, decimal.Decimal, error) {
	var count int
	var sum decimal.Decimal
	err := r.db.QueryRow(ctx,
		`SELECT COUNT(*), COALESCE(SUM(amount), 0) FROM payments WHERE status = 'OVERDUE'`,
	).Scan(&count, &sum)
	return count, sum, err
}

func (r *paymentRepo) CollectedThisMonth(ctx context.Context) (decimal.Decimal, error) {
	var sum decimal.Decimal
	err := r.db.QueryRow(ctx,
		`SELECT COALESCE(SUM(amount), 0) FROM payments
		 WHERE status = 'PAID' AND paid_at >= DATE_TRUNC('month', NOW())`,
	).Scan(&sum)
	return sum, err
}

func (r *paymentRepo) Delete(ctx context.Context, id int) error {
	tag, err := r.db.Exec(ctx, `DELETE FROM payments WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}
