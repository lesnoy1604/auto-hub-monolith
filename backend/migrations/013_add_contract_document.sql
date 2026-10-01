-- +goose Up
ALTER TABLE contracts ADD COLUMN document_url VARCHAR(500);

-- +goose Down
ALTER TABLE contracts DROP COLUMN document_url;
