package service

import (
	"context"

	"github.com/dutik/auto-hub/internal/domain"
	"github.com/dutik/auto-hub/internal/dto"
	"github.com/dutik/auto-hub/internal/repository"
)

type DriverService struct {
	driverRepo   repository.DriverRepository
	contractRepo repository.ContractRepository
	carRepo      repository.CarRepository
}

func NewDriverService(
	driverRepo repository.DriverRepository,
	contractRepo repository.ContractRepository,
	carRepo repository.CarRepository,
) *DriverService {
	return &DriverService{
		driverRepo:   driverRepo,
		contractRepo: contractRepo,
		carRepo:      carRepo,
	}
}

func (s *DriverService) List(ctx context.Context, status *string, search *string) (*dto.DriversListResponse, error) {
	var driverStatus *domain.DriverStatus
	if status != nil && *status != "" {
		ds := domain.DriverStatus(*status)
		driverStatus = &ds
	}

	drivers, err := s.driverRepo.List(ctx, driverStatus, search)
	if err != nil {
		return nil, err
	}

	result := make([]dto.DriverWithContracts, 0, len(drivers))
	for _, d := range drivers {
		dwc := dto.DriverWithContracts{Driver: d, Contracts: []dto.ActiveContractForDriver{}}

		activeStatus := domain.ContractStatusActive
		contracts, _ := s.contractRepo.List(ctx, &activeStatus)
		for _, c := range contracts {
			if c.DriverID != d.ID {
				continue
			}
			brief := dto.ActiveContractForDriver{
				ID:     c.ID,
				Status: string(c.Status),
			}
			car, _ := s.carRepo.GetByID(ctx, c.CarID)
			if car != nil {
				brief.Car = dto.CarBrief{
					PlateNumber: car.PlateNumber,
					Brand:       car.Brand,
					Model:       car.Model,
				}
			}
			dwc.Contracts = append(dwc.Contracts, brief)
			break // только последний
		}

		result = append(result, dwc)
	}

	return &dto.DriversListResponse{Drivers: result, Total: len(result)}, nil
}

func (s *DriverService) GetByID(ctx context.Context, id int) (*dto.DriverDetailResponse, error) {
	driver, err := s.driverRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	allContracts, err := s.contractRepo.List(ctx, nil)
	if err != nil {
		return nil, err
	}

	detail := &dto.DriverDetailResponse{
		Driver:    *driver,
		Contracts: []dto.ContractWithCar{},
	}

	for _, c := range allContracts {
		if c.DriverID != id {
			continue
		}
		cwc := dto.ContractWithCar{
			ID:             c.ID,
			Status:         string(c.Status),
			TotalAmount:    c.TotalAmount,
			PaidAmount:     c.PaidAmount,
			MonthlyPayment: c.MonthlyPayment,
			StartDate:      c.StartDate,
			EndDate:        c.EndDate,
			CreatedAt:      c.CreatedAt,
			UpdatedAt:      c.UpdatedAt,
		}
		car, _ := s.carRepo.GetByID(ctx, c.CarID)
		if car != nil {
			cwc.Car = dto.CarWithYear{
				PlateNumber: car.PlateNumber,
				Brand:       car.Brand,
				Model:       car.Model,
				Year:        car.Year,
			}
		}
		detail.Contracts = append(detail.Contracts, cwc)
	}

	return detail, nil
}

func (s *DriverService) Create(ctx context.Context, req *dto.CreateDriverRequest) (*domain.Driver, error) {
	d := &domain.Driver{
		FullName:    req.FullName,
		Phone:       req.Phone,
		PassportNum: req.PassportNum,
		LicenseNum:  req.LicenseNum,
		Status:      domain.DriverStatus(req.Status),
	}
	return s.driverRepo.Create(ctx, d)
}

func (s *DriverService) Update(ctx context.Context, id int, req *dto.UpdateDriverRequest) (*domain.Driver, error) {
	_, err := s.driverRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	d := &domain.Driver{
		FullName:    req.FullName,
		Phone:       req.Phone,
		PassportNum: req.PassportNum,
		LicenseNum:  req.LicenseNum,
		Status:      domain.DriverStatus(req.Status),
	}
	return s.driverRepo.Update(ctx, id, d)
}

func (s *DriverService) Delete(ctx context.Context, id int) error {
	activeStatus := domain.ContractStatusActive
	contracts, err := s.contractRepo.List(ctx, &activeStatus)
	if err != nil {
		return err
	}
	for _, c := range contracts {
		if c.DriverID == id {
			return domain.ErrDriverHasActiveContract
		}
	}
	return s.driverRepo.Delete(ctx, id)
}
