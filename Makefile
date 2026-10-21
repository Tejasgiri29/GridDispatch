.PHONY: up down build test seed logs clean

up:
	docker compose up -d

down:
	docker compose down -v

build:
	mvn clean package -DskipTests

test:
	mvn clean test

seed:
	curl -X POST http://localhost:8082/api/v1/admin/seed -H "X-Tenant-ID: tenant-grid-us-east"

logs:
	docker compose logs -f griddispatch-backend

clean:
	mvn clean
