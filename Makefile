SHELL := /bin/bash

.DEFAULT_GOAL := help
.PHONY: help
help:
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

up-dev: ## Run a local development environment with Docker Compose.
	@mkdir -p dev_volumes/files
	@mkdir -p dev_volumes/database
	@docker compose -f ./deployments/dev/docker-compose.yml up --build --force-recreate

recreate-dev: ## Recreate and run development docker compose
	@docker compose -f ./deployments/dev/docker-compose.yml up --build --force-recreate

down-dev: ## Stop Docker Compose local development environment.
	@docker compose -f ./deployments/dev/docker-compose.yml down

clean-dev: ## Clean Docker Compose local development environment.
	@rm -r dev_volumes
	@docker compose -f ./deployments/dev/docker-compose.yml down --remove-orphans --volumes

up-prod: ## Run a local prod environment with Docker Compose.
	@mkdir -p ./images/backend/.deps/keys
	@cp -LR /etc/letsencrypt/live/trivia.run/. ./images/backend/.deps/keys
	@docker compose -f ./deployments/prod/docker-compose.yml up -d --build --force-recreate
	docker image prune -f

up-prod-sync: ## Run a local prod environment with Docker Compose.
	@mkdir -p ./images/backend/.deps/keys
	@cp -LR /etc/letsencrypt/live/trivia.run/. ./images/backend/.deps/keys
	@docker compose -f ./deployments/prod/docker-compose.yml up --build --force-recreate
	docker image prune -f

stop-prod:
	@docker compose -f ./deployments/prod/docker-compose.yml stop

recreate-prod: ## Recreate and run prod docker compose
	@docker compose -f ./deployments/prod/docker-compose.yml up --build --force-recreate

down-prod: ## Stop Docker Compose local prod environment.
	@docker compose -f ./deployments/prod/docker-compose.yml down

clean-prod: ## Clean Docker Compose local prod environment.
	@docker compose -f ./deployments/prod/docker-compose.yml down --remove-orphans --volumes
