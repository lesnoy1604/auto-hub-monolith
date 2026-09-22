BINARY=bin/api
MAIN=./cmd/api

.PHONY: run stop build test migrate-up migrate-down tidy vet swagger deploy

stop:
	-lsof -ti :8080 | xargs kill 2>/dev/null; true

swagger:
	$(shell go env GOPATH)/bin/swag init -g cmd/api/main.go --output docs

run: stop
	go run $(MAIN)/main.go

build:
	go build -o $(BINARY) $(MAIN)/main.go

test:
	go test ./...

tidy:
	go mod tidy

vet:
	go vet ./...

migrate-up:
	goose -dir migrations postgres "$(DATABASE_URL)" up

migrate-down:
	goose -dir migrations postgres "$(DATABASE_URL)" down

# Деплой: make deploy SERVER=user@1.2.3.4
deploy:
	bash scripts/deploy.sh $(SERVER)
