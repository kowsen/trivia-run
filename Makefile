SHELL := /bin/bash

.DEFAULT_GOAL := help
.PHONY: help
help:
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

up-dev: ## Run a local development environment with Docker Compose.
	@mkdir -p dev_volumes/files
	@docker-compose -f ./deployments/dev/docker-compose.yml up --build --force-recreate

recreate-dev: ## Recreate and run development docker compose
	@docker-compose -f ./deployments/dev/docker-compose.yml up --build --force-recreate

down-dev: ## Stop Docker Compose local development environment.
	@docker-compose -f ./deployments/dev/docker-compose.yml down

clean-dev: ## Clean Docker Compose local development environment.
	@rm -r dev_volumes/files
	@docker-compose -f ./deployments/dev/docker-compose.yml down --remove-orphans --volumes

up-prod: ## Run a local prod environment with Docker Compose.
	@docker-compose -f ./deployments/prod/docker-compose.yml up --build --force-recreate

recreate-prod: ## Recreate and run prod docker compose
	@docker-compose -f ./deployments/prod/docker-compose.yml up --build --force-recreate

down-prod: ## Stop Docker Compose local prod environment.
	@docker-compose -f ./deployments/prod/docker-compose.yml down

clean-prod: ## Clean Docker Compose local prod environment.
	@docker-compose -f ./deployments/prod/docker-compose.yml down --remove-orphans --volumes

.PHONY: test
test: ## Run tests
	@npm test

fmt: ## Format code
	@npm run format

lint: ## Run static analysis
	@npm run lint

check: ## Run all checks for this project
	@npm run format:check
	@npm run lint
	@npm run test
	@npm run build
