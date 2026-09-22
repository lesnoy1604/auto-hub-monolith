package service

import (
	"context"

	"github.com/dutik/auto-hub/internal/domain"
	"github.com/dutik/auto-hub/internal/dto"
	"github.com/dutik/auto-hub/internal/repository"
)

type CarService struct {
	carRepo      repository.CarRepository
	contractRepo repository.ContractRepository
	driverRepo   repository.DriverRepository
	fineRepo     repository.FineRepository
}

func NewCarService(
	carRepo repository.CarRepository,
	contractRepo repository.ContractRepository,
	driverRepo repository.DriverRepository,
	fineRepo repository.FineRepository,
) *CarService {
	return &CarService{
		carRepo:      carRepo,
		contractRepo: contractRepo,
		driverRepo:   driverRepo,
		fineRepo:     fineRepo,
	}
}

func (s *CarService) List(ctx context.Context, status *string, search *string) (*dto.CarsListResponse, error) {
	var carStatus *domain.CarStatus
	if status != nil && *status != "" {
		cs := domain.CarStatus(*status)
		carStatus = &cs
	}

	cars, err := s.carRepo.List(ctx, carStatus, search)
	if err != nil {
		return nil, err
	}

	result := make([]dto.CarWithContracts, 0, len(cars))
	for _, car := range cars {
		cwc := dto.CarWithContracts{Car: car, Contracts: []dto.ActiveContractBrief{}}

		contract, err := s.contractRepo.GetActiveByCarID(ctx, car.ID)
		if err == nil {
			driver, _ := s.driverRepo.GetByID(ctx, contract.DriverID)
			brief := dto.ActiveContractBrief{
				ID:             contract.ID,
				Status:         string(contract.Status),
				TotalAmount:    contract.TotalAmount,
				PaidAmount:     contract.PaidAmount,
				MonthlyPayment: contract.MonthlyPayment,
				StartDate:      contract.StartDate,
				EndDate:        contract.EndDate,
			}
			if driver != nil {
				brief.Driver = dto.DriverName{FullName: driver.FullName}
			}
			cwc.Contracts = append(cwc.Contracts, brief)
		}

		result = append(result, cwc)
	}

	return &dto.CarsListResponse{Cars: result, Total: len(result)}, nil
}

func (s *CarService) GetByID(ctx context.Context, id int) (*dto.CarDetailResponse, error) {
	car, err := s.carRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	contracts, err := s.contractRepo.List(ctx, nil)
	if err != nil {
		return nil, err
	}

	detail := &dto.CarDetailResponse{
		Car:       *car,
		Contracts: []dto.ContractForCarDetail{},
		Fines:     []domain.Fine{},
	}

	for _, c := range contracts {
		if c.CarID != id {
			continue
		}
		cfd := dto.ContractForCarDetail{Contract: c}
		driver, _ := s.driverRepo.GetByID(ctx, c.DriverID)
		cfd.Driver = driver
		// последние 4 платежа — загружаются из репозитория платежей через сервис договора
		detail.Contracts = append(detail.Contracts, cfd)
	}

	fines, err := s.fineRepo.ListByCar(ctx, id, 3)
	if err != nil {
		return nil, err
	}
	if fines != nil {
		detail.Fines = fines
	}

	return detail, nil
}

func (s *CarService) Create(ctx context.Context, req *dto.CreateCarRequest) (*domain.Car, error) {
	car := &domain.Car{
		PlateNumber:      req.PlateNumber,
		VIN:              req.VIN,
		Brand:            req.Brand,
		Model:            req.Model,
		Year:             req.Year,
		Status:           domain.CarStatus(req.Status),
		Mileage:          req.Mileage,
		OsagoBefore:      req.OsagoBefore,
		InspectionBefore: req.InspectionBefore,
	}
	return s.carRepo.Create(ctx, car)
}

func (s *CarService) Update(ctx context.Context, id int, req *dto.UpdateCarRequest) (*domain.Car, error) {
	_, err := s.carRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	car := &domain.Car{
		PlateNumber:      req.PlateNumber,
		VIN:              req.VIN,
		Brand:            req.Brand,
		Model:            req.Model,
		Year:             req.Year,
		Status:           domain.CarStatus(req.Status),
		Mileage:          req.Mileage,
		OsagoBefore:      req.OsagoBefore,
		InspectionBefore: req.InspectionBefore,
	}
	return s.carRepo.Update(ctx, id, car)
}

func (s *CarService) Delete(ctx context.Context, id int) error {
	active, err := s.contractRepo.GetActiveByCarID(ctx, id)
	if err == nil && active != nil {
		return domain.ErrCarHasActiveContract
	}
	return s.carRepo.Delete(ctx, id)
}
