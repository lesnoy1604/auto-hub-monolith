package service

import (
	"context"
	"time"

	"github.com/dutik/auto-hub/internal/domain"
	"github.com/dutik/auto-hub/internal/dto"
	"github.com/dutik/auto-hub/internal/repository"
	"github.com/shopspring/decimal"
)

type FineService struct {
	fineRepo     repository.FineRepository
	contractRepo repository.ContractRepository
	carRepo      repository.CarRepository
	driverRepo   repository.DriverRepository
}

func NewFineService(
	fineRepo repository.FineRepository,
	contractRepo repository.ContractRepository,
	carRepo repository.CarRepository,
	driverRepo repository.DriverRepository,
) *FineService {
	return &FineService{
		fineRepo:     fineRepo,
		contractRepo: contractRepo,
		carRepo:      carRepo,
		driverRepo:   driverRepo,
	}
}

func (s *FineService) List(ctx context.Context, status *string, carID *int, driverID *int) (*dto.FinesListResponse, error) {
	var fs *domain.FineStatus
	if status != nil && *status != "" {
		v := domain.FineStatus(*status)
		fs = &v
	}

	fines, err := s.fineRepo.List(ctx, fs, carID, driverID)
	if err != nil {
		return nil, err
	}

	items := make([]dto.FineWithRelations, 0, len(fines))
	for _, f := range fines {
		item := dto.FineWithRelations{Fine: f}

		car, _ := s.carRepo.GetByID(ctx, f.CarID)
		if car != nil {
			item.Car = &dto.CarForFine{ID: car.ID, PlateNumber: car.PlateNumber, Brand: car.Brand, Model: car.Model}
		}
		driver, _ := s.driverRepo.GetByID(ctx, f.DriverID)
		if driver != nil {
			item.Driver = &dto.DriverForFine{ID: driver.ID, FullName: driver.FullName}
		}
		if f.ContractID != nil {
			item.Contract = &dto.ContractForFine{ID: *f.ContractID}
		}

		items = append(items, item)
	}

	return &dto.FinesListResponse{Fines: items, Total: len(items)}, nil
}

func (s *FineService) Create(ctx context.Context, req *dto.CreateFineRequest) (*domain.Fine, error) {
	driverID := req.DriverID
	contractID := req.ContractID

	if driverID == nil {
		contract, err := s.contractRepo.GetActiveByCarID(ctx, req.CarID)
		if err != nil {
			return nil, domain.ErrDriverNotFound
		}
		driverID = &contract.DriverID
		if contractID == nil {
			contractID = &contract.ID
		}
	}

	fine := &domain.Fine{
		CarID:       req.CarID,
		DriverID:    *driverID,
		ContractID:  contractID,
		Amount:      decimal.NewFromFloat(req.Amount),
		Description: req.Description,
		FineDate:    req.FineDate,
	}

	return s.fineRepo.Create(ctx, fine)
}

func (s *FineService) Delete(ctx context.Context, id int) error {
	_, err := s.fineRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	return s.fineRepo.Delete(ctx, id)
}

func (s *FineService) Update(ctx context.Context, id int, req *dto.UpdateFineRequest) (*domain.Fine, error) {
	fine, err := s.fineRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	fine.Status = domain.FineStatus(req.Status)

	if fine.Status == domain.FineStatusPaid {
		if req.PaidAt != nil {
			fine.PaidAt = req.PaidAt
		} else {
			now := time.Now()
			fine.PaidAt = &now
		}
	} else {
		fine.PaidAt = nil
	}

	return s.fineRepo.Update(ctx, id, fine)
}
