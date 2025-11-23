# Define the project name for cleaner binary output
APP_NAME := server
BUILD_DIR := bin

# Database (Used by goose for migrations)
DB_URL := postgres://postgres:password@127.0.0.1:5432/skyforge?sslmode=disable
GOOSE := goose

.PHONY: all build run dev sqlc migrate-up migrate-down clean

# Default target runs the application in development mode
all: dev

# ----------------------------------------------------------------------
# APPLICATION COMMANDS

# Compiles the final executable binary
build:
	go build -o $(BUILD_DIR)/$(APP_NAME) ./cmd/api

# Runs the compiled binary (used for manual check or production)
run: build
	./$(BUILD_DIR)/$(APP_NAME)

# Runs the application with hot-reloading (uses the 'air' tool)
# This is what you will use 99% of the time during development.
dev:
	air

# ----------------------------------------------------------------------
# TOOLING & DB COMMANDS

# Generates Go code from the SQL files
sqlc:
	sqlc generate

# Runs all pending 'up' database migrations
migrate-up:
	@echo "--- Running Migrations ---"
	@cd sql/schema && $(GOOSE) postgres $(DB_URL) up

# Rolls back the last migration
migrate-down:
	@echo "--- Rolling Back Last Migration ---"
	@cd sql/schema && $(GOOSE) postgres $(DB_URL) down

# Cleans up generated artifacts
clean:
	rm -f $(BUILD_DIR)/$(APP_NAME)
	@echo "Note: Generated database files in internal/database/ are preserved"

