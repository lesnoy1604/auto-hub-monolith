-- +goose Up
CREATE TABLE cars (
    id               SERIAL PRIMARY KEY,
    plate_number     VARCHAR NOT NULL UNIQUE,
    vin              VARCHAR NOT NULL UNIQUE,
    brand            VARCHAR NOT NULL,
    model            VARCHAR NOT NULL,
    year             INTEGER NOT NULL,
    status           car_status NOT NULL DEFAULT 'FREE',
    mileage          INTEGER NOT NULL DEFAULT 0,
    osago_before     TIMESTAMPTZ,
    inspection_before TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cars_status ON cars(status);
CREATE INDEX idx_cars_plate_number ON cars(plate_number);

-- +goose Down
DROP TABLE IF EXISTS cars;
