package service

import (
	"context"
	"sort"
	"time"

	"github.com/dutik/auto-hub/internal/domain"
	"github.com/dutik/auto-hub/internal/dto"
	"github.com/dutik/auto-hub/internal/repository"
	"github.com/shopspring/decimal"
	"golang.org/x/sync/errgroup"
)

type DashboardService struct {
	carRepo      repository.CarRepository
	contractRepo repository.ContractRepository
	paymentRepo  repository.PaymentRepository
	fineRepo     repository.FineRepository
	driverRepo   repository.DriverRepository
}

func NewDashboardService(
	carRepo repository.CarRepository,
	contractRepo repository.ContractRepository,
	paymentRepo repository.PaymentRepository,
	fineRepo repository.FineRepository,
	driverRepo repository.DriverRepository,
) *DashboardService {
	return &DashboardService{
		carRepo:      carRepo,
		contractRepo: contractRepo,
		paymentRepo:  paymentRepo,
		fineRepo:     fineRepo,
		driverRepo:   driverRepo,
	}
}

func (s *DashboardService) Get(ctx context.Context) (*dto.DashboardResponse, error) {
	g, gCtx := errgroup.WithContext(ctx)

	var (
		carCounts       map[domain.CarStatus]int
		activeContracts int
		overdueCount    int
		overdueSum      decimal.Decimal
		upcoming        []dto.UpcomingPayment
		unpaidFineCount int
		unpaidFineSum   decimal.Decimal
		collected       decimal.Decimal
		overduePayments []domain.Payment
	)

	g.Go(func() error {
		var err error
		carCounts, err = s.carRepo.CountByStatus(gCtx)
		return err
	})

	g.Go(func() error {
		var err error
		activeContracts, err = s.contractRepo.CountActive(gCtx)
		return err
	})

	g.Go(func() error {
		var err error
		overdueCount, overdueSum, err = s.paymentRepo.AggregateOverdue(gCtx)
		return err
	})

	g.Go(func() error {
		var err error
		upcoming, err = s.upcomingPayments(gCtx)
		return err
	})

	g.Go(func() error {
		var err error
		unpaidFineCount, unpaidFineSum, err = s.fineRepo.AggregateUnpaid(gCtx)
		return err
	})

	g.Go(func() error {
		var err error
		collected, err = s.paymentRepo.CollectedThisMonth(gCtx)
		return err
	})

	g.Go(func() error {
		var err error
		overdueStatus := domain.PaymentStatusOverdue
		overduePayments, err = s.paymentRepo.List(gCtx, &overdueStatus)
		return err
	})

	if err := g.Wait(); err != nil {
		return nil, err
	}

	carStats := dto.CarStats{Total: 0}
	for status, count := range carCounts {
		carStats.Total += count
		switch status {
		case domain.CarStatusFree:
			carStats.Free = count
		case domain.CarStatusRented:
			carStats.Rented = count
		case domain.CarStatusRepair:
			carStats.Repair = count
		case domain.CarStatusSold:
			carStats.Sold = count
		}
	}

	topDebtors, err := s.buildTopDebtors(ctx, overduePayments)
	if err != nil {
		return nil, err
	}

	return &dto.DashboardResponse{
		Cars:     carStats,
		Contracts: dto.ContractStats{Active: activeContracts},
		Payments: dto.PaymentStats{
			OverdueCount:       overdueCount,
			OverdueAmount:      overdueSum.InexactFloat64(),
			CollectedThisMonth: collected.InexactFloat64(),
			Upcoming:           upcoming,
		},
		Fines: dto.FineStats{
			UnpaidCount:  unpaidFineCount,
			UnpaidAmount: unpaidFineSum.InexactFloat64(),
		},
		TopDebtors: topDebtors,
	}, nil
}

func (s *DashboardService) upcomingPayments(ctx context.Context) ([]dto.UpcomingPayment, error) {
	unpaid := domain.PaymentStatusUnpaid
	payments, err := s.paymentRepo.List(ctx, &unpaid)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	deadline := now.AddDate(0, 0, 7)

	result := make([]dto.UpcomingPayment, 0, 7)
	for _, p := range payments {
		if p.DueDate.After(now) && p.DueDate.Before(deadline) {
			up := dto.UpcomingPayment{Payment: p}

			contract, err := s.contractRepo.GetByID(ctx, p.ContractID)
			if err == nil {
				upc := &dto.UpcomingPaymentContract{ID: contract.ID}
				car, _ := s.carRepo.GetByID(ctx, contract.CarID)
				if car != nil {
					upc.Car = &dto.UpcomingPaymentCar{ID: car.ID, PlateNumber: car.PlateNumber}
				}
				driver, _ := s.driverRepo.GetByID(ctx, contract.DriverID)
				if driver != nil {
					upc.Driver = &dto.UpcomingPaymentDriver{FullName: driver.FullName}
				}
				up.Contract = upc
			}
			result = append(result, up)
			if len(result) == 7 {
				break
			}
		}
	}
	return result, nil
}

func (s *DashboardService) buildTopDebtors(ctx context.Context, overduePayments []domain.Payment) ([]dto.TopDebtor, error) {
	type group struct {
		fullName   string
		carPlate   string
		carLabel   string
		contractID int
		total      decimal.Decimal
		count      int
		maxDays    int
	}

	groups := make(map[int]*group)
	today := time.Now()

	for _, p := range overduePayments {
		contract, err := s.contractRepo.GetByID(ctx, p.ContractID)
		if err != nil {
			continue
		}

		driver, err := s.driverRepo.GetByID(ctx, contract.DriverID)
		if err != nil {
			continue
		}

		car, _ := s.carRepo.GetByID(ctx, contract.CarID)

		g, ok := groups[driver.ID]
		if !ok {
			g = &group{
				fullName:   driver.FullName,
				contractID: contract.ID,
			}
			if car != nil {
				g.carPlate = car.PlateNumber
				g.carLabel = car.Brand + " " + car.Model
			}
			groups[driver.ID] = g
		}

		g.total = g.total.Add(p.Amount)
		g.count++

		days := int(today.Sub(p.DueDate).Hours() / 24)
		if days < 0 {
			days = 0
		}
		if days > g.maxDays {
			g.maxDays = days
		}
	}

	result := make([]dto.TopDebtor, 0, len(groups))
	for id, g := range groups {
		result = append(result, dto.TopDebtor{
			DriverID:       id,
			FullName:       g.fullName,
			CarPlate:       g.carPlate,
			CarLabel:       g.carLabel,
			ContractID:     g.contractID,
			TotalOverdue:   g.total.InexactFloat64(),
			PaymentCount:   g.count,
			MaxDaysOverdue: g.maxDays,
		})
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].TotalOverdue > result[j].TotalOverdue
	})

	if len(result) > 5 {
		result = result[:5]
	}
	return result, nil
}
