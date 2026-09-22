package service

import (
	"context"
	"math"
	"time"

	"github.com/dutik/auto-hub/internal/domain"
	"github.com/dutik/auto-hub/internal/dto"
	"github.com/dutik/auto-hub/internal/repository"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PaymentService struct {
	paymentRepo  repository.PaymentRepository
	contractRepo repository.ContractRepository
	carRepo      repository.CarRepository
	driverRepo   repository.DriverRepository
	db           *pgxpool.Pool
}

func NewPaymentService(
	paymentRepo repository.PaymentRepository,
	contractRepo repository.ContractRepository,
	carRepo repository.CarRepository,
	driverRepo repository.DriverRepository,
	db *pgxpool.Pool,
) *PaymentService {
	return &PaymentService{
		paymentRepo:  paymentRepo,
		contractRepo: contractRepo,
		carRepo:      carRepo,
		driverRepo:   driverRepo,
		db:           db,
	}
}

func (s *PaymentService) List(ctx context.Context, status *string) (*dto.PaymentsListResponse, error) {
	var ps *domain.PaymentStatus
	if status != nil && *status != "" {
		v := domain.PaymentStatus(*status)
		ps = &v
	}

	payments, err := s.paymentRepo.List(ctx, ps)
	if err != nil {
		return nil, err
	}

	items := make([]dto.PaymentWithContract, 0, len(payments))
	for _, p := range payments {
		item := dto.PaymentWithContract{Payment: p}

		contract, err := s.contractRepo.GetByID(ctx, p.ContractID)
		if err == nil {
			cft := &dto.ContractForPayment{
				ID:             contract.ID,
				CarID:          contract.CarID,
				DriverID:       contract.DriverID,
				Status:         string(contract.Status),
				TotalAmount:    contract.TotalAmount,
				PaidAmount:     contract.PaidAmount,
				MonthlyPayment: contract.MonthlyPayment,
				StartDate:      contract.StartDate,
				EndDate:        contract.EndDate,
				CreatedAt:      contract.CreatedAt,
				UpdatedAt:      contract.UpdatedAt,
			}
			car, _ := s.carRepo.GetByID(ctx, contract.CarID)
			if car != nil {
				cft.Car = &dto.CarForPayment{
					ID: car.ID, PlateNumber: car.PlateNumber,
					Brand: car.Brand, Model: car.Model,
				}
			}
			driver, _ := s.driverRepo.GetByID(ctx, contract.DriverID)
			if driver != nil {
				cft.Driver = &dto.DriverForPayment{
					ID: driver.ID, FullName: driver.FullName, Phone: driver.Phone,
				}
			}
			item.Contract = cft
		}

		items = append(items, item)
	}

	return &dto.PaymentsListResponse{Payments: items, Total: len(items)}, nil
}

func (s *PaymentService) Delete(ctx context.Context, id int) error {
	payment, err := s.paymentRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if payment.Status == domain.PaymentStatusPaid {
		return domain.ErrAlreadyPaid
	}
	return s.paymentRepo.Delete(ctx, id)
}

func (s *PaymentService) Pay(ctx context.Context, req *dto.PayPaymentRequest) (*dto.PayPaymentResponse, error) {
	payment, err := s.paymentRepo.GetByID(ctx, req.PaymentID)
	if err != nil {
		return nil, err
	}

	if payment.Status == domain.PaymentStatusPaid {
		return nil, domain.ErrAlreadyPaid
	}

	paidAt := time.Now()
	if req.PaidAt != nil {
		paidAt = *req.PaidAt
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	updatedPayment, err := s.paymentRepo.MarkAsPaidTx(ctx, tx, req.PaymentID, paidAt)
	if err != nil {
		return nil, err
	}

	newPaidAmount, err := s.paymentRepo.SumPaidByContractIDTx(ctx, tx, payment.ContractID)
	if err != nil {
		return nil, err
	}

	if err := s.contractRepo.UpdatePaidAmountTx(ctx, tx, payment.ContractID, newPaidAmount); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	contract, err := s.contractRepo.GetByID(ctx, payment.ContractID)
	if err != nil {
		return nil, err
	}

	remaining := math.Max(0, contract.TotalAmount.Sub(newPaidAmount).InexactFloat64())

	return &dto.PayPaymentResponse{
		Payment: *updatedPayment,
		Contract: dto.ContractSummary{
			ID:               payment.ContractID,
			PaidAmount:       newPaidAmount.InexactFloat64(),
			RemainingBalance: remaining,
		},
	}, nil
}
