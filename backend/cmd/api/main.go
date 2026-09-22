// @title           Auto Hub API
// @version         1.0
// @description     REST API для управления арендой автомобилей (CRM).

// @host      localhost:8080
// @BasePath  /api

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Введите токен в формате: Bearer {token}

package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/dutik/auto-hub/docs"
	"github.com/dutik/auto-hub/internal/config"
	"github.com/dutik/auto-hub/internal/handler"
	"github.com/dutik/auto-hub/internal/repository/postgres"
	"github.com/dutik/auto-hub/internal/service"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
	"github.com/pressly/goose/v3"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	_ = godotenv.Load()

	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "config error: %v\n", err)
		os.Exit(1)
	}

	if cfg.Env == "development" {
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	}

	ctx := context.Background()

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to create db pool")
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		log.Fatal().Err(err).Msg("failed to ping database")
	}
	log.Info().Msg("database connected")

	// Запуск миграций
	db := stdlib.OpenDBFromPool(pool)
	if err := goose.SetDialect("postgres"); err != nil {
		log.Fatal().Err(err).Msg("goose dialect error")
	}
	if err := goose.Up(db, "migrations"); err != nil {
		log.Fatal().Err(err).Msg("migrations failed")
	}
	log.Info().Msg("migrations applied")

	// Репозитории
	userRepo := postgres.NewUserRepository(pool)
	carRepo := postgres.NewCarRepository(pool)
	driverRepo := postgres.NewDriverRepository(pool)
	contractRepo := postgres.NewContractRepository(pool)
	paymentRepo := postgres.NewPaymentRepository(pool)
	fineRepo := postgres.NewFineRepository(pool)

	// Сервисы
	authSvc := service.NewAuthService(userRepo, cfg.JWTSecret)
	carSvc := service.NewCarService(carRepo, contractRepo, driverRepo, fineRepo)
	driverSvc := service.NewDriverService(driverRepo, contractRepo, carRepo)
	contractSvc := service.NewContractService(contractRepo, paymentRepo, carRepo, driverRepo, pool)
	paymentSvc := service.NewPaymentService(paymentRepo, contractRepo, carRepo, driverRepo, pool)
	fineSvc := service.NewFineService(fineRepo, contractRepo, carRepo, driverRepo)
	dashboardSvc := service.NewDashboardService(carRepo, contractRepo, paymentRepo, fineRepo, driverRepo)

	// Роутер
	r := handler.NewRouter(pool, authSvc, carSvc, driverSvc, contractSvc, paymentSvc, fineSvc, dashboardSvc)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Info().Str("port", cfg.Port).Msg("server started")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("server error")
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("shutting down...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutdownCtx)
	log.Info().Msg("bye")
}
