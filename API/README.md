# Ultimate Tic Tac Toe API

## Database (local)

1. Start PostgreSQL:

```bash
docker compose up -d
```

2. Run the API with the `local` profile (defaults connect to `localhost:5432/uttt`):

```bash
cd API
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

Flyway applies migrations from `src/main/resources/db/migration/` on startup.

Environment variables (optional overrides):

- `DATABASE_URL` — JDBC URL (default `jdbc:postgresql://localhost:5432/uttt`)
- `DATABASE_USERNAME` — default `uttt`
- `DATABASE_PASSWORD` — default `uttt`

To wipe local database data: `docker compose down -v`

## Tests

Default `mvn test` runs unit tests only. Integration tests (Testcontainers) run when Docker is available:

```bash
set RUN_DOCKER_TESTS=true
mvn test
```
