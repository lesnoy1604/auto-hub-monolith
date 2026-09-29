-- +goose Up
CREATE TABLE car_inspections (
    id           SERIAL PRIMARY KEY,
    car_id       INT         NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    inspected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE car_inspection_photos (
    id            SERIAL PRIMARY KEY,
    inspection_id INT         NOT NULL REFERENCES car_inspections(id) ON DELETE CASCADE,
    angle         VARCHAR(20) NOT NULL CHECK (angle IN ('front','back','left','right','interior','odometer')),
    filename      VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (inspection_id, angle)
);

-- +goose Down
DROP TABLE IF EXISTS car_inspection_photos;
DROP TABLE IF EXISTS car_inspections;
