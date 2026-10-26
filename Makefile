.PHONY: all start-dev

USERID := $(shell id -u)

all: start-dev

load-redis-cluster:
	docker load -i prod/redis-cluster-7.0.15.tar.gz

start-dev:
	cd dev && docker compose up --build --force-recreate --remove-orphans

start-prod:
	cd prod && docker compose up --build --force-recreate --remove-orphans