package handler

import (
	"net/http"

	appmiddleware "github.com/dutik/auto-hub/internal/middleware"
	"github.com/dutik/auto-hub/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/cors"
	httpSwagger "github.com/swaggo/http-swagger/v2"
)

func NewRouter(
	pool *pgxpool.Pool,
	authSvc *service.AuthService,
	carSvc *service.CarService,
	driverSvc *service.DriverService,
	contractSvc *service.ContractService,
	paymentSvc *service.PaymentService,
	fineSvc *service.FineService,
	dashboardSvc *service.DashboardService,
) http.Handler {
	r := chi.NewRouter()

	r.Use(cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	}).Handler)
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)

	authH := NewAuthHandler(authSvc)
	healthH := NewHealthHandler(pool)
	carH := NewCarHandler(carSvc)
	driverH := NewDriverHandler(driverSvc)
	contractH := NewContractHandler(contractSvc)
	paymentH := NewPaymentHandler(paymentSvc)
	fineH := NewFineHandler(fineSvc)
	dashboardH := NewDashboardHandler(dashboardSvc)

	// Swagger UI
	r.Get("/swagger/*", httpSwagger.Handler(
		httpSwagger.URL("/swagger/doc.json"),
	))

	// Публичные маршруты
	r.Post("/api/auth/login", authH.Login)
	r.Get("/api/health", healthH.Check)

	// Защищённые маршруты
	r.Group(func(r chi.Router) {
		r.Use(appmiddleware.Auth(authSvc))

		r.Get("/api/cars", carH.List)
		r.Post("/api/cars", carH.Create)
		r.Get("/api/cars/{id}", carH.GetByID)
		r.Put("/api/cars/{id}", carH.Update)
		r.Delete("/api/cars/{id}", carH.Delete)

		r.Get("/api/drivers", driverH.List)
		r.Post("/api/drivers", driverH.Create)
		r.Get("/api/drivers/{id}", driverH.GetByID)
		r.Put("/api/drivers/{id}", driverH.Update)
		r.Delete("/api/drivers/{id}", driverH.Delete)

		r.Get("/api/contracts", contractH.List)
		r.Post("/api/contracts", contractH.Create)
		r.Get("/api/contracts/{id}", contractH.GetByID)
		r.Put("/api/contracts/{id}", contractH.Update)
		r.Delete("/api/contracts/{id}", contractH.Delete)
		r.Get("/api/contracts/{id}/payments", contractH.GetPayments)

		r.Get("/api/payments", paymentH.List)
		r.Post("/api/payments", paymentH.Pay)
		r.Delete("/api/payments/{id}", paymentH.Delete)

		r.Get("/api/fines", fineH.List)
		r.Post("/api/fines", fineH.Create)
		r.Put("/api/fines/{id}", fineH.Update)
		r.Delete("/api/fines/{id}", fineH.Delete)

		r.Get("/api/dashboard", dashboardH.Get)
	})

	return r
}
