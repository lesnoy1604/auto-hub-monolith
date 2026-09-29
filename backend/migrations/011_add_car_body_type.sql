-- +goose Up
ALTER TABLE cars ADD COLUMN body_type VARCHAR(20) CHECK (body_type IN ('SEDAN','HATCHBACK','CROSSOVER','MINIVAN','WAGON','SUV','COUPE','PICKUP','VAN'));

-- +goose Down
ALTER TABLE cars DROP COLUMN body_type;
