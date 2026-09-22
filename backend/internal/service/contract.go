package service

import (
	"context"
	"math"
	"time"

	"github.com/dutik/auto-hub/internal/domain"
	"github.com/dutik/auto-hub/internal/dto"
	"github.com/dutik/auto-hub/internal/repository"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"
)

type ContractService struct {
	contractRepo repository.ContractRepository
	paymentRepo  repository.PaymentRepository
	carRepo      repository.CarRepository
	driverRepo   repository.DriverRepository
	db           *pgxpool.Pool
}

func NewContractService(
	contractRepo repository.ContractRepository,
	paymentRepo repository.PaymentRepository,
	carRepo repository.CarRepository,
	driverRepo repository.DriverRepository,
	db *pgxpool.Pool,
) *ContractService {
	return &ContractService{
		contractRepo: contractRepo,
		paymentRepo:  paymentRepo,
		carRepo:      carRepo,
		driverRepo:   driverRepo,
		db:           db,
	}
}

func (s *ContractService) List(ctx context.Context, status *string) (*dto.ContractsListResponse, error) {
	var cs *domain.ContractStatus
	if status != nil && *status != "" {
		v := domain.ContractStatus(*status)
		cs = &v
	}

	contracts, err := s.contractRepo.List(ctx, cs)
	if err != nil {
		return nil, err
	}

	items := make([]dto.ContractListItem, 0, len(contracts))
	for _, c := range contracts {
		item := dto.ContractListItem{
			Contract:         c,
			RemainingBalance: math.Max(0, c.TotalAmount.Sub(c.PaidAmount).InexactFloat64()),
		}
		car, _ := s.carRepo.GetByID(ctx, c.CarID)
		if car != nil {
			item.Car = dto.CarBrief{PlateNumber: car.PlateNumber, Brand: car.Brand, Model: car.Model}
		}
		driver, _ := s.driverRepo.GetByID(ctx, c.DriverID)
		if driver != nil {
			item.Driver = dto.DriverName{FullName: driver.FullName}
		}
		items = append(items, item)
	}

	return &dto.ContractsListResponse{Contracts: items, Total: len(items)}, nil
}

func (s *ContractService) GetByID(ctx context.Context, id int) (*dto.ContractDetailResponse, error) {
	contract, err := s.contractRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	payments, err := s.paymentRepo.ListByContractID(ctx, id)
	if err != nil {
		return nil, err
	}

	var actualPaid decimal.Decimal
	for _, p := range payments {
		if p.Status == domain.PaymentStatusPaid {
			actualPaid = actualPaid.Add(p.Amount)
		}
	}
	if !actualPaid.Equal(contract.PaidAmount) {
		_ = s.contractRepo.UpdatePaidAmount(ctx, id, actualPaid)
		contract.PaidAmount = actualPaid
	}

	car, _ := s.carRepo.GetByID(ctx, contract.CarID)
	driver, _ := s.driverRepo.GetByID(ctx, contract.DriverID)

	return &dto.ContractDetailResponse{
		Contract:         *contract,
		Car:              car,
		Driver:           driver,
		Payments:         payments,
		RemainingBalance: math.Max(0, contract.TotalAmount.Sub(contract.PaidAmount).InexactFloat64()),
	}, nil
}

func (s *ContractService) Create(ctx context.Context, req *dto.CreateContractRequest) (*domain.Contract, error) {
	car, err := s.carRepo.GetByID(ctx, req.CarID)
	if err != nil {
		return nil, err
	}
	if car.Status != domain.CarStatusFree {
		return nil, domain.ErrCarNotFree
	}

	contract := &domain.Contract{
		CarID:          req.CarID,
		DriverID:       req.DriverID,
		TotalAmount:    decimal.NewFromFloat(req.TotalAmount),
		MonthlyPayment: decimal.NewFromFloat(req.MonthlyPayment),
		StartDate:      req.StartDate,
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	created, err := s.contractRepo.CreateTx(ctx, tx, contract)
	if err != nil {
		return nil, err
	}

	if err := s.carRepo.UpdateStatusTx(ctx, tx, req.CarID, domain.CarStatusRented); err != nil {
		return nil, err
	}

	payments := generatePaymentSchedule(created)
	if err := s.paymentRepo.BulkCreateTx(ctx, tx, payments); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return created, nil
}

func (s *ContractService) Update(ctx context.Context, id int, req *dto.UpdateContractRequest) (*dto.ContractResponse, error) {
	contract, err := s.contractRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	closing := req.Status != nil &&
		*req.Status != string(domain.ContractStatusActive) &&
		contract.Status == domain.ContractStatusActive

	if req.Status != nil {
		contract.Status = domain.ContractStatus(*req.Status)
	}
	if req.EndDate != nil {
		contract.EndDate = req.EndDate
	}
	if req.MonthlyPayment != nil {
		contract.MonthlyPayment = decimal.NewFromFloat(*req.MonthlyPayment)
	}
	if req.TotalAmount != nil {
		contract.TotalAmount = decimal.NewFromFloat(*req.TotalAmount)
	}

	if closing {
		if contract.EndDate == nil {
			now := time.Now()
			contract.EndDate = &now
		}

		tx, err := s.db.Begin(ctx)
		if err != nil {
			return nil, err
		}
		defer tx.Rollback(ctx) //nolint:errcheck

		updated, err := s.contractRepo.UpdateTx(ctx, tx, id, contract)
		if err != nil {
			return nil, err
		}
		if err := s.carRepo.UpdateStatusTx(ctx, tx, contract.CarID, domain.CarStatusFree); err != nil {
			return nil, err
		}
		if err := tx.Commit(ctx); err != nil {
			return nil, err
		}
		contract = updated
	} else {
		updated, err := s.contractRepo.Update(ctx, id, contract)
		if err != nil {
			return nil, err
		}
		contract = updated
	}

	return &dto.ContractResponse{
		Contract:         *contract,
		RemainingBalance: math.Max(0, contract.TotalAmount.Sub(contract.PaidAmount).InexactFloat64()),
	}, nil
}

func (s *ContractService) GetPayments(ctx context.Context, id int) ([]domain.Payment, error) {
	_, err := s.contractRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return s.paymentRepo.ListByContractID(ctx, id)
}

func (s *ContractService) Delete(ctx context.Context, id int) error {
	contract, err := s.contractRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if contract.Status == domain.ContractStatusActive {
		return domain.ErrConflict
	}
	return s.contractRepo.Delete(ctx, id)
}

func generatePaymentSchedule(c *domain.Contract) []domain.Payment {
	monthCount := int(math.Ceil(c.TotalAmount.Div(c.MonthlyPayment).InexactFloat64()))
	payments := make([]domain.Payment, 0, monthCount)

	for i := 0; i < monthCount; i++ {
		dueDate := c.StartDate.AddDate(0, i+1, 0)

		var amount decimal.Decimal
		if i == monthCount-1 {
			paid := c.MonthlyPayment.Mul(decimal.NewFromInt(int64(monthCount - 1)))
			amount = c.TotalAmount.Sub(paid)
		} else {
			amount = c.MonthlyPayment
		}

		payments = append(payments, domain.Payment{
			ContractID: c.ID,
			Amount:     amount,
			Status:     domain.PaymentStatusUnpaid,
			DueDate:    dueDate,
		})
	}
	return payments
}
