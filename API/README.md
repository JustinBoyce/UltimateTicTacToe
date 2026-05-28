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

## Database (production / Supabase)

Production uses the `prod` profile and a Supabase PostgreSQL instance. Credentials are **never** stored in git—only in environment variables or a local `.env` file.

1. Copy the template and add your Supabase database password:

```bash
cd API
cp .env.example .env   # Windows: copy .env.example .env
# Edit .env — set DATABASE_PASSWORD (and SOCKET_SERVER_ALLOWED_ORIGINS if needed)
```

2. Activate the `prod` profile and start the API (from `API/`):

```powershell
# PowerShell
$env:SPRING_PROFILES_ACTIVE = "prod"
.\mvnw.cmd spring-boot:run
```

```bash
# Bash
export SPRING_PROFILES_ACTIVE=prod
./mvnw spring-boot:run
```

Flyway runs migrations against the Supabase `postgres` database on startup. Defaults (override with env vars if needed):

| Variable | Purpose |
|----------|---------|
| `DATABASE_PASSWORD` | **Required** in prod — Supabase database password |
| `DATABASE_URL` | JDBC URL (default: Supabase host with `sslmode=require`) |
| `DATABASE_USERNAME` | Default `postgres` |
| `SOCKET_SERVER_ALLOWED_ORIGINS` | Your hosted frontend origin |

On a deployment platform, set `SPRING_PROFILES_ACTIVE=prod`, `DATABASE_PASSWORD`, and socket/CORS variables in the service configuration—do not upload `.env`.

## Tests

Default `mvn test` runs unit tests only. Integration tests (Testcontainers) run when Docker is available:

```bash
set RUN_DOCKER_TESTS=true
mvn test
```
