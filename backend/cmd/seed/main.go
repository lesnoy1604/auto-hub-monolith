package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/dutik/auto-hub/internal/config"
	"github.com/dutik/auto-hub/internal/domain"
	"github.com/dutik/auto-hub/internal/repository/postgres"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/shopspring/decimal"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	_ = godotenv.Load()

	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "config error: %v\n", err)
		os.Exit(1)
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "db error: %v\n", err)
		os.Exit(1)
	}
	defer pool.Close()

	// --- Admin user ---
	hash, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		fmt.Fprintf(os.Stderr, "bcrypt error: %v\n", err)
		os.Exit(1)
	}
	userRepo := postgres.NewUserRepository(pool)
	user, err := userRepo.Create(ctx, &domain.User{
		Email:        "admin@autohub.ru",
		PasswordHash: string(hash),
		FullName:     "Администратор",
		Role:         domain.RoleAdmin,
	})
	if err != nil {
		fmt.Fprintf(os.Stderr, "create user error: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("✓ admin user: id=%d email=%s\n", user.ID, user.Email)

	carRepo := postgres.NewCarRepository(pool)
	driverRepo := postgres.NewDriverRepository(pool)
	contractRepo := postgres.NewContractRepository(pool)
	paymentRepo := postgres.NewPaymentRepository(pool)
	fineRepo := postgres.NewFineRepository(pool)

	// --- Cars ---
	// 0-9: RENTED, 10: REPAIR, 11: FREE
	type carSeed struct {
		plate, vin, brand, model string
		year                     int
		status                   domain.CarStatus
		mileage                  int
		engineVolume             float64
		fuelType                 domain.FuelType
		bodyType                 domain.BodyType
	}

	carSeeds := []carSeed{
		{"А123ВС77", "XTA210930Y2345671", "Kia", "Rio", 2020, domain.CarStatusRented, 87400, 1.6, domain.FuelPetrol, domain.BodyHatchback},
		{"В456ДЕ77", "Z94C251BAEM123456", "Hyundai", "Solaris", 2021, domain.CarStatusRented, 64200, 1.6, domain.FuelPetrol, domain.BodySedan},
		{"С789ЕФ77", "JTDBF32K900123456", "Toyota", "Camry", 2022, domain.CarStatusRented, 41800, 2.5, domain.FuelPetrol, domain.BodySedan},
		{"Д012ГИ77", "WVWZZZ9NZ8Y123456", "Volkswagen", "Polo", 2020, domain.CarStatusRented, 102300, 1.6, domain.FuelPetrol, domain.BodySedan},
		{"Е345ИЙ77", "TMBEG21Z012345678", "Skoda", "Octavia", 2021, domain.CarStatusRented, 58700, 2.0, domain.FuelDiesel, domain.BodyWagon},
		{"Ж678КЛ77", "VF1LSNL0H12345678", "Renault", "Logan", 2019, domain.CarStatusRented, 134900, 1.6, domain.FuelPetrol, domain.BodySedan},
		{"З901МН77", "JN1TCNT30U0123456", "Nissan", "Almera", 2020, domain.CarStatusRented, 79600, 1.6, domain.FuelPetrol, domain.BodySedan},
		{"И234ОП77", "WF0TXXGCDT1234567", "Ford", "Focus", 2021, domain.CarStatusRented, 53100, 1.5, domain.FuelPetrol, domain.BodyHatchback},
		{"К567РС77", "XTA21230012345678", "Lada", "Vesta", 2022, domain.CarStatusRented, 31200, 1.8, domain.FuelPetrol, domain.BodySedan},
		{"Л890ТУ77", "JMZBL12Z001234567", "Mazda", "3", 2020, domain.CarStatusRented, 91500, 2.0, domain.FuelPetrol, domain.BodySedan},
		{"М123УФ77", "WBAFR91090L123456", "BMW", "3 Series", 2019, domain.CarStatusRepair, 167800, 2.0, domain.FuelDiesel, domain.BodySedan},
		{"Н456ФХ77", "1GCEK19T31E123456", "Chevrolet", "Cruze", 2021, domain.CarStatusFree, 22000, 1.4, domain.FuelPetrol, domain.BodySedan},
	}

	osago := func(y, m, d int) *time.Time {
		t := time.Date(y, time.Month(m), d, 0, 0, 0, 0, time.UTC)
		return &t
	}

	cars := make([]*domain.Car, len(carSeeds))
	for i, s := range carSeeds {
		obl := osago(2027, (i%12)+1, 15)
		ins := osago(2027, ((i+3)%12)+1, 20)
		ev := decimal.NewFromFloat(s.engineVolume)
		ft := s.fuelType
		bt := s.bodyType
		car, err := carRepo.Create(ctx, &domain.Car{
			PlateNumber:      s.plate,
			VIN:              s.vin,
			Brand:            s.brand,
			Model:            s.model,
			Year:             s.year,
			Status:           s.status,
			Mileage:          s.mileage,
			EngineVolume:     &ev,
			FuelType:         &ft,
			BodyType:         &bt,
			OsagoBefore:      obl,
			InspectionBefore: ins,
		})
		if err != nil {
			fmt.Fprintf(os.Stderr, "create car %d error: %v\n", i, err)
			os.Exit(1)
		}
		cars[i] = car
		fmt.Printf("  car[%d]: %s %s %s (id=%d)\n", i, s.brand, s.model, s.plate, car.ID)
	}
	fmt.Printf("✓ %d cars\n", len(cars))

	// --- Drivers ---
	// 11 drivers: 0-9 for active contracts, 10 for REPAIR car's completed contract
	type driverSeed struct {
		fullName, phone, passport, license string
	}
	driverSeeds := []driverSeed{
		{"Иванов Алексей Петрович", "+79161234501", "4501 123456", "7701 123456"},
		{"Смирнов Дмитрий Иванович", "+79162234502", "4502 234567", "7702 234567"},
		{"Кузнецов Сергей Николаевич", "+79163234503", "4503 345678", "7703 345678"},
		{"Попов Андрей Владимирович", "+79164234504", "4504 456789", "7704 456789"},
		{"Васильев Михаил Александрович", "+79165234505", "4505 567890", "7705 567890"},
		{"Петров Николай Сергеевич", "+79166234506", "4506 678901", "7706 678901"},
		{"Соколов Владимир Михайлович", "+79167234507", "4507 789012", "7707 789012"},
		{"Михайлов Олег Анатольевич", "+79168234508", "4508 890123", "7708 890123"},
		{"Новиков Павел Юрьевич", "+79169234509", "4509 901234", "7709 901234"},  // debtor 1
		{"Фёдоров Роман Викторович", "+79170234510", "4510 012345", "7710 012345"}, // debtor 2
		{"Морозов Евгений Константинович", "+79171234511", "4511 123450", "7711 123450"}, // REPAIR car
	}

	drivers := make([]*domain.Driver, len(driverSeeds))
	for i, d := range driverSeeds {
		drv, err := driverRepo.Create(ctx, &domain.Driver{
			FullName:    d.fullName,
			Phone:       d.phone,
			PassportNum: d.passport,
			LicenseNum:  d.license,
			Status:      domain.DriverStatusActive,
		})
		if err != nil {
			fmt.Fprintf(os.Stderr, "create driver %d error: %v\n", i, err)
			os.Exit(1)
		}
		drivers[i] = drv
	}
	fmt.Printf("✓ %d drivers\n", len(drivers))

	// --- Contracts & Payments ---
	// Active contracts for cars 0-9 (drivers 0-9), start 2026-04-01
	// Completed contract for car 10 (driver 10), 2025-01-01 – 2025-12-31

	activeStart := time.Date(2026, 4, 1, 0, 0, 0, 0, time.UTC)

	type contractConfig struct {
		carIdx, driverIdx int
		monthly           decimal.Decimal
		status            domain.ContractStatus
		startDate         time.Time
		endDate           *time.Time
		// how many of 6 monthly payments are PAID (rest are OVERDUE if isDebtor, else UNPAID)
		paidCount int
		isDebtor  bool
	}

	completedEnd := time.Date(2025, 12, 31, 0, 0, 0, 0, time.UTC)

	contracts := []contractConfig{
		{0, 0, decimal.NewFromFloat(18000), domain.ContractStatusActive, activeStart, nil, 5, false},
		{1, 1, decimal.NewFromFloat(15000), domain.ContractStatusActive, activeStart, nil, 5, false},
		{2, 2, decimal.NewFromFloat(25000), domain.ContractStatusActive, activeStart, nil, 5, false},
		{3, 3, decimal.NewFromFloat(16000), domain.ContractStatusActive, activeStart, nil, 5, false},
		{4, 4, decimal.NewFromFloat(20000), domain.ContractStatusActive, activeStart, nil, 5, false},
		{5, 5, decimal.NewFromFloat(12000), domain.ContractStatusActive, activeStart, nil, 5, false},
		{6, 6, decimal.NewFromFloat(14000), domain.ContractStatusActive, activeStart, nil, 5, false},
		{7, 7, decimal.NewFromFloat(17000), domain.ContractStatusActive, activeStart, nil, 5, false},
		{8, 8, decimal.NewFromFloat(19000), domain.ContractStatusActive, activeStart, nil, 3, true},  // debtor 1
		{9, 9, decimal.NewFromFloat(16500), domain.ContractStatusActive, activeStart, nil, 2, true},  // debtor 2
		{10, 10, decimal.NewFromFloat(22000), domain.ContractStatusCompleted,
			time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC), &completedEnd, 12, false}, // REPAIR car
	}

	for _, cc := range contracts {
		months := 36
		if cc.status == domain.ContractStatusCompleted {
			months = 12
		}
		total := cc.monthly.Mul(decimal.NewFromInt(int64(months)))

		tx, err := pool.Begin(ctx)
		if err != nil {
			fmt.Fprintf(os.Stderr, "begin tx error: %v\n", err)
			os.Exit(1)
		}

		contract, err := contractRepo.CreateTx(ctx, tx, &domain.Contract{
			CarID:          cars[cc.carIdx].ID,
			DriverID:       drivers[cc.driverIdx].ID,
			Status:         cc.status,
			TotalAmount:    total,
			MonthlyPayment: cc.monthly,
			StartDate:      cc.startDate,
			EndDate:        cc.endDate,
		})
		if err != nil {
			_ = tx.Rollback(ctx)
			fmt.Fprintf(os.Stderr, "create contract car[%d] error: %v\n", cc.carIdx, err)
			os.Exit(1)
		}

		// Generate payment schedule: active contracts run to end of year (Apr–Dec = 9 months), completed = 12
		paymentMonths := 9
		if cc.status == domain.ContractStatusCompleted {
			paymentMonths = 12
		}

		payments := make([]domain.Payment, paymentMonths)
		var totalPaid decimal.Decimal
		now := time.Now().UTC()

		for m := 0; m < paymentMonths; m++ {
			dueDate := cc.startDate.AddDate(0, m, 0)
			status := domain.PaymentStatusUnpaid
			var paidAt *time.Time

			if m < cc.paidCount {
				status = domain.PaymentStatusPaid
				paidTime := dueDate.Add(2 * 24 * time.Hour) // paid 2 days after due
				paidAt = &paidTime
				totalPaid = totalPaid.Add(cc.monthly)
			} else if cc.status == domain.ContractStatusCompleted {
				status = domain.PaymentStatusPaid
				paidTime := dueDate.Add(3 * 24 * time.Hour)
				paidAt = &paidTime
				totalPaid = totalPaid.Add(cc.monthly)
			} else if cc.isDebtor && dueDate.Before(now) {
				status = domain.PaymentStatusOverdue
			} else {
				status = domain.PaymentStatusUnpaid
			}

			payments[m] = domain.Payment{
				ContractID: contract.ID,
				Amount:     cc.monthly,
				Status:     status,
				DueDate:    dueDate,
				PaidAt:     paidAt,
			}
		}

		if err := paymentRepo.BulkCreateTx(ctx, tx, payments); err != nil {
			_ = tx.Rollback(ctx)
			fmt.Fprintf(os.Stderr, "bulk create payments car[%d] error: %v\n", cc.carIdx, err)
			os.Exit(1)
		}

		if err := contractRepo.UpdatePaidAmountTx(ctx, tx, contract.ID, totalPaid); err != nil {
			_ = tx.Rollback(ctx)
			fmt.Fprintf(os.Stderr, "update paid amount car[%d] error: %v\n", cc.carIdx, err)
			os.Exit(1)
		}

		if err := tx.Commit(ctx); err != nil {
			fmt.Fprintf(os.Stderr, "commit tx error: %v\n", err)
			os.Exit(1)
		}

		debtorMark := ""
		if cc.isDebtor {
			debtorMark = " ⚠ DEBTOR"
		}
		fmt.Printf("  contract car[%d] driver[%d] status=%s paid=%s/%s%s\n",
			cc.carIdx, cc.driverIdx, cc.status, totalPaid, total, debtorMark)
	}
	fmt.Printf("✓ %d contracts with payments\n", len(contracts))

	// --- Fines for cars 0-4 ---
	type fineSeed struct {
		carIdx     int
		amount     decimal.Decimal
		desc       string
		daysAgo    int
		fineStatus domain.FineStatus
	}

	fineSeeds := []fineSeed{
		{0, decimal.NewFromFloat(1500), "Превышение скорости 20-40 км/ч", 45, domain.FineStatusUnpaid},
		{1, decimal.NewFromFloat(500), "Нарушение разметки", 90, domain.FineStatusPaid},
		{1, decimal.NewFromFloat(3000), "Проезд на красный сигнал светофора", 30, domain.FineStatusUnpaid},
		{2, decimal.NewFromFloat(5000), "Превышение скорости 40-60 км/ч", 60, domain.FineStatusDisputed},
		{3, decimal.NewFromFloat(3000), "Остановка в запрещённом месте", 15, domain.FineStatusUnpaid},
		{4, decimal.NewFromFloat(1000), "Нарушение правил парковки", 75, domain.FineStatusUnpaid},
		{4, decimal.NewFromFloat(2500), "Непристёгнутый ремень безопасности", 20, domain.FineStatusUnpaid},
	}

	for _, f := range fineSeeds {
		fineDate := time.Now().UTC().AddDate(0, 0, -f.daysAgo)
		carContracts, err := contractRepo.GetActiveByCarID(ctx, cars[f.carIdx].ID)
		if err != nil {
			carContracts = nil
		}
		var contractID *int
		if carContracts != nil {
			contractID = &carContracts.ID
		}

		fine, err := fineRepo.Create(ctx, &domain.Fine{
			CarID:       cars[f.carIdx].ID,
			DriverID:    drivers[f.carIdx].ID,
			ContractID:  contractID,
			Amount:      f.amount,
			Description: f.desc,
			FineDate:    fineDate,
			Status:      f.fineStatus,
		})
		if err != nil {
			fmt.Fprintf(os.Stderr, "create fine car[%d] error: %v\n", f.carIdx, err)
			os.Exit(1)
		}
		fmt.Printf("  fine car[%d] %s %s (id=%d)\n", f.carIdx, f.amount, f.fineStatus, fine.ID)
	}
	fmt.Printf("✓ %d fines on 5 cars\n", len(fineSeeds))

	fmt.Println("\n✓ seed complete")
}
