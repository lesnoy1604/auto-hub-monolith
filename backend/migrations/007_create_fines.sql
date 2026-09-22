-- +goose Up
CREATE TABLE fines (
    id          SERIAL PRIMARY KEY,
    car_id      INTEGER NOT NULL REFERENCES cars(id),
    driver_id   INTEGER NOT NULL REFERENCES drivers(id),
    contract_id INTEGER REFERENCES contracts(id),
    amount      DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    fine_date   TIMESTAMPTZ NOT NULL,
    status      fine_status NOT NULL DEFAULT 'UNPAID',
    paid_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fines_car_id ON fines(car_id);
CREATE INDEX idx_fines_driver_id ON fines(driver_id);
CREATE INDEX idx_fines_status ON fines(status);

-- +goose Down
DROP TABLE IF EXISTS fines;
