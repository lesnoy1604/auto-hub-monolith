-- +goose Up
CREATE TABLE payments (
    id          SERIAL PRIMARY KEY,
    contract_id INTEGER NOT NULL REFERENCES contracts(id),
    amount      DECIMAL(10,2) NOT NULL,
    status      payment_status NOT NULL DEFAULT 'UNPAID',
    due_date    TIMESTAMPTZ NOT NULL,
    paid_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_contract_id ON payments(contract_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date);

-- +goose Down
DROP TABLE IF EXISTS payments;
