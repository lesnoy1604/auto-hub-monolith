-- +goose Up
CREATE TYPE car_status AS ENUM ('FREE', 'RENTED', 'REPAIR', 'SOLD');
CREATE TYPE contract_status AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE payment_status AS ENUM ('PAID', 'UNPAID', 'OVERDUE');
CREATE TYPE fine_status AS ENUM ('UNPAID', 'PAID', 'DISPUTED');
CREATE TYPE driver_status AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER');

-- +goose Down
DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS driver_status;
DROP TYPE IF EXISTS fine_status;
DROP TYPE IF EXISTS payment_status;
DROP TYPE IF EXISTS contract_status;
DROP TYPE IF EXISTS car_status;
