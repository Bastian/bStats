.PHONY: all start-dev

USERID := $(shell id -u)

all: start-dev

start-dev:
	cd dev && docker compose up --build --force-recreate --remove-orphans

start-prod:
	cd prod && docker compose up --build --force-recreate --remove-orphans