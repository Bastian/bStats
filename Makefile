.PHONY: all start-dev

USERID := $(shell id -u)

all: start-dev

load-redis-cluster:
	gunzip -k prod/redis-cluster-2025_09_19.tar.gz
	docker load -i prod/redis-cluster-2025_09_19.tar

start-dev:
	cd dev && docker compose up --build --force-recreate --remove-orphans

start-prod:
	cd prod && docker compose up --build --force-recreate --remove-orphans