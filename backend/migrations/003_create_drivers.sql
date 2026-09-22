-- +goose Up
CREATE TABLE drivers (
    id           SERIAL PRIMARY KEY,
    full_name    VARCHAR NOT NULL,
    phone        VARCHAR NOT NULL UNIQUE,
    passport_num VARCHAR NOT NULL UNIQUE,
    license_num  VARCHAR NOT NULL UNIQUE,
    status       driver_status NOT NULL DEFAULT 'ACTIVE',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_full_name ON drivers(full_name);

-- +goose Down
DROP TABLE IF EXISTS drivers;
