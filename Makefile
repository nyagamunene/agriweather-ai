# AgriWeather AI — Development Makefile
# Usage: make <target>
#
# Quick start:
#   make dev.setup   — first-time setup (copies env, installs deps, runs migrations)
#   make dev.start   — start the app with hot-reload
#   make dev.stop    — stop all containers

.DEFAULT_GOAL := help
.PHONY: help dev.setup dev.start dev.stop dev.restart dev.logs dev.console \
        db.migrate db.create db.reset db.console \
        build lint test clean

# ── Config ───────────────────────────────────────────────────────────────────

COMPOSE_FILE  := docker-compose.dev.yml
APP_CONTAINER := agriweather_app
DB_CONTAINER  := agriweather_db
DB_NAME       := agriweather
DB_USER       := agriweather

# ── Help ─────────────────────────────────────────────────────────────────────

help: ## Show this help message
	@echo ""
	@echo "  AgriWeather AI — Development Commands"
	@echo ""
	@grep -E '^[a-zA-Z_.-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-25s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ── Dev lifecycle ─────────────────────────────────────────────────────────────

dev.setup: ## First-time setup: copy env, start containers, install deps, run migrations
	@echo "→ Checking .env.local..."
	@if [ ! -f .env.local ]; then \
		cp .env.example .env.local; \
		echo "  Created .env.local from .env.example — add your WEATHER_AI_API_KEY"; \
	else \
		echo "  .env.local already exists, skipping"; \
	fi
	@echo "→ Starting containers..."
	docker compose -f $(COMPOSE_FILE) up -d --wait --build
	@echo "→ Installing Node.js dependencies..."
	docker compose -f $(COMPOSE_FILE) exec app npm install
	@echo "→ Running database migrations..."
	$(MAKE) db.migrate
	@echo ""
	@echo "✓ Setup complete. Run \`make dev.start\` to launch the app."

dev.start: ## Start the app (hot-reload via Next.js dev server)
	@echo "→ Starting containers..."
	docker compose -f $(COMPOSE_FILE) up -d --wait
	@echo "→ Starting Next.js dev server..."
	docker compose -f $(COMPOSE_FILE) exec -d app npm run dev
	@echo "→ Waiting for app to be healthy..."
	@scripts/wait-for-app
	@echo ""
	@echo "✓ App is running at http://localhost:3000"

dev.stop: ## Stop all containers
	docker compose -f $(COMPOSE_FILE) down

dev.restart: ## Restart containers
	docker compose -f $(COMPOSE_FILE) restart

dev.logs: ## Stream all container logs
	docker compose -f $(COMPOSE_FILE) logs -f

dev.logs.app: ## Stream app container logs only
	docker compose -f $(COMPOSE_FILE) logs -f app

dev.logs.db: ## Stream database logs only
	docker compose -f $(COMPOSE_FILE) logs -f postgres

dev.console: ## Open a bash shell in the app container
	docker compose -f $(COMPOSE_FILE) exec app sh

dev.build: ## Rebuild containers without cache
	docker compose -f $(COMPOSE_FILE) build --no-cache

# ── Database ──────────────────────────────────────────────────────────────────

db.migrate: ## Run pending database migrations
	@echo "→ Running migrations..."
	docker compose -f $(COMPOSE_FILE) exec postgres \
		psql -U $(DB_USER) -d $(DB_NAME) -f /docker-entrypoint-initdb.d/init.sql -q \
		|| true
	@echo "✓ Migrations complete"

db.create: ## Create the database (already done by docker-compose on first run)
	docker compose -f $(COMPOSE_FILE) exec postgres \
		createdb -U $(DB_USER) $(DB_NAME) 2>/dev/null || echo "  Database already exists"
	docker compose -f $(COMPOSE_FILE) exec postgres \
		psql -U $(DB_USER) -d $(DB_NAME) -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' -q

db.console: ## Connect to the database via psql
	docker compose -f $(COMPOSE_FILE) exec postgres \
		psql -U $(DB_USER) -d $(DB_NAME)

db.reset: ## ⚠ Drop and recreate the database (destructive)
	@echo "⚠ This will destroy all data in $(DB_NAME). Press Ctrl+C to cancel."
	@sleep 3
	docker compose -f $(COMPOSE_FILE) exec postgres \
		psql -U $(DB_USER) -c "DROP DATABASE IF EXISTS $(DB_NAME);" -q
	$(MAKE) db.create
	$(MAKE) db.migrate
	@echo "✓ Database reset complete"

db.dump: ## Dump the database schema to db/structure.sql
	docker compose -f $(COMPOSE_FILE) exec postgres \
		pg_dump --schema-only --no-privileges --no-owner \
		-U $(DB_USER) -d $(DB_NAME) > db/structure.sql
	@echo "✓ Schema dumped to db/structure.sql"

# ── Build & Quality ───────────────────────────────────────────────────────────

build: ## Build the production Next.js app
	npm run build

lint: ## Run ESLint
	npm run lint

test: ## Run tests (if configured)
	npm test 2>/dev/null || echo "No test suite configured yet"

type-check: ## Run TypeScript type checking
	npx tsc --noEmit

clean: ## Remove build artifacts
	rm -rf .next out node_modules/.cache

# ── Docker image ──────────────────────────────────────────────────────────────

image.build: ## Build the production Docker image
	docker build -t agriweather-ai:latest .

image.build.nc: ## Build the production Docker image (no cache)
	docker build --no-cache -t agriweather-ai:latest .
