-- +goose Up
CREATE TABLE contracts (
    id              SERIAL PRIMARY KEY,
    car_id          INTEGER NOT NULL REFERENCES cars(id),
    driver_id       INTEGER NOT NULL REFERENCES drivers(id),
    status          contract_status NOT NULL DEFAULT 'ACTIVE',
    total_amount    DECIMAL(12,2) NOT NULL,
    paid_amount     DECIMAL(12,2) NOT NULL DEFAULT 0,
    monthly_payment DECIMAL(10,2) NOT NULL,
    start_date      TIMESTAMPTZ NOT NULL,
    end_date        TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contracts_car_id ON contracts(car_id);
CREATE INDEX idx_contracts_driver_id ON contracts(driver_id);
CREATE INDEX idx_contracts_status ON contracts(status);

-- +goose Down
DROP TABLE IF EXISTS contracts;
