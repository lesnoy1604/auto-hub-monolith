package main

import (
	"context"
	"fmt"
	"os"

	"github.com/dutik/auto-hub/internal/config"
	"github.com/dutik/auto-hub/internal/domain"
	"github.com/dutik/auto-hub/internal/repository/postgres"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
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

	fmt.Printf("Created admin user: id=%d email=%s\n", user.ID, user.Email)
}
