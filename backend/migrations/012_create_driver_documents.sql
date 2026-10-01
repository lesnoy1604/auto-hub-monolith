-- +goose Up
CREATE TYPE driver_doc_type AS ENUM ('passport', 'license', 'contract', 'photo', 'other');

CREATE TABLE driver_documents (
    id         SERIAL PRIMARY KEY,
    driver_id  INT              NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    doc_type   driver_doc_type  NOT NULL DEFAULT 'other',
    title      VARCHAR(255)     NOT NULL DEFAULT '',
    filename   VARCHAR(255)     NOT NULL,
    created_at TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- +goose Down
DROP TABLE IF EXISTS driver_documents;
DROP TYPE IF EXISTS driver_doc_type;
