-- +goose Up
ALTER TABLE cars
    ADD COLUMN engine_volume NUMERIC(4,1),
    ADD COLUMN fuel_type     VARCHAR(20) CHECK (fuel_type IN ('PETROL','DIESEL','ELECTRIC','HYBRID','GAS'));

-- +goose Down
ALTER TABLE cars
    DROP COLUMN IF EXISTS engine_volume,
    DROP COLUMN IF EXISTS fuel_type;
