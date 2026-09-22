package repository

import (
	"context"

	"github.com/dutik/auto-hub/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/shopspring/decimal"
)

type UserRepository interface {
	GetByEmail(ctx context.Context, email string) (*domain.User, error)
	Create(ctx context.Context, user *domain.User) (*domain.User, error)
}

type CarRepository interface {
	List(ctx context.Context, status *domain.CarStatus, search *string) ([]domain.Car, error)
	GetByID(ctx context.Context, id int) (*domain.Car, error)
	Create(ctx context.Context, car *domain.Car) (*domain.Car, error)
	Update(ctx context.Context, id int, car *domain.Car) (*domain.Car, error)
	Delete(ctx context.Context, id int) error
	UpdateStatus(ctx context.Context, id int, status domain.CarStatus) error
	UpdateStatusTx(ctx context.Context, tx pgx.Tx, id int, status domain.CarStatus) error
	CountByStatus(ctx context.Context) (map[domain.CarStatus]int, error)
}

type DriverRepository interface {
	List(ctx context.Context, status *domain.DriverStatus, search *string) ([]domain.Driver, error)
	GetByID(ctx context.Context, id int) (*domain.Driver, error)
	Create(ctx context.Context, d *domain.Driver) (*domain.Driver, error)
	Update(ctx context.Context, id int, d *domain.Driver) (*domain.Driver, error)
	Delete(ctx context.Context, id int) error
}

type ContractRepository interface {
	List(ctx context.Context, status *domain.ContractStatus) ([]domain.Contract, error)
	GetByID(ctx context.Context, id int) (*domain.Contract, error)
	GetActiveByCarID(ctx context.Context, carID int) (*domain.Contract, error)
	Create(ctx context.Context, c *domain.Contract) (*domain.Contract, error)
	CreateTx(ctx context.Context, tx pgx.Tx, c *domain.Contract) (*domain.Contract, error)
	Update(ctx context.Context, id int, c *domain.Contract) (*domain.Contract, error)
	UpdateTx(ctx context.Context, tx pgx.Tx, id int, c *domain.Contract) (*domain.Contract, error)
	UpdatePaidAmount(ctx context.Context, id int, paidAmount decimal.Decimal) error
	UpdatePaidAmountTx(ctx context.Context, tx pgx.Tx, id int, paidAmount decimal.Decimal) error
	Delete(ctx context.Context, id int) error
	CountActive(ctx context.Context) (int, error)
}

type PaymentRepository interface {
	List(ctx context.Context, status *domain.PaymentStatus) ([]domain.Payment, error)
	ListByContractID(ctx context.Context, contractID int) ([]domain.Payment, error)
	GetByID(ctx context.Context, id int) (*domain.Payment, error)
	BulkCreateTx(ctx context.Context, tx pgx.Tx, payments []domain.Payment) error
	MarkAsPaidTx(ctx context.Context, tx pgx.Tx, id int, paidAt interface{}) (*domain.Payment, error)
	SumPaidByContractIDTx(ctx context.Context, tx pgx.Tx, contractID int) (decimal.Decimal, error)
	Delete(ctx context.Context, id int) error
	AggregateOverdue(ctx context.Context) (count int, sum decimal.Decimal, err error)
	CollectedThisMonth(ctx context.Context) (decimal.Decimal, error)
}

type FineRepository interface {
	List(ctx context.Context, status *domain.FineStatus, carID *int, driverID *int) ([]domain.Fine, error)
	GetByID(ctx context.Context, id int) (*domain.Fine, error)
	Create(ctx context.Context, fine *domain.Fine) (*domain.Fine, error)
	Update(ctx context.Context, id int, fine *domain.Fine) (*domain.Fine, error)
	Delete(ctx context.Context, id int) error
	ListByCar(ctx context.Context, carID int, limit int) ([]domain.Fine, error)
	AggregateUnpaid(ctx context.Context) (count int, sum decimal.Decimal, err error)
}
