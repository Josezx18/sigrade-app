# SIGRADE — Agent Guide

## Stack
- **Backend**: NestJS + Prisma 7 + PostgreSQL (pgvector) + Redis + MinIO
- **Frontend**: React + Vite + Tailwind CSS + React Query
- **Monorepo**: Nx (apps: `api`, `web`)

## Key Commands
| Command | Description |
|---------|-------------|
| `npx nx serve api` | Start API dev server |
| `npx nx serve web` | Start Web dev server |
| `npx nx build api` | Build API (webpack) |
| `npx nx build web` | Build Web (vite) |
| `npx nx run api:test` | Run API unit tests (jest) |
| `npx nx run api:lint` | Lint API |
| `npx nx run web:lint` | Lint Web (--max-warnings 0) |
| `npm run dev` | Start infra (docker) + both servers |
| `npm run docker:up` | Start full stack via docker-compose |

## Folder Structure
```
apps/api/src/
  app/              — Health endpoint, AppModule
  common/           — HttpExceptionFilter, LoggerMiddleware, PaginationDto
  modules/
    auth/           — JWT auth, guards, decorators
    tenants/        — Multi-tenant hierarchy
    academic/       — SchoolYears, Periods, GradeLevels, Subjects, Courses, Schedules
    students/       — Student CRUD + bulk + DTOs
    teachers/       — Teacher CRUD + DTOs
    grades/         — Grade CRUD + bulk + DTOs
    attendance/     — Attendance CRUD + QR + justification
    planning/       — Planning + sessions + evidence
    analytics/      — Dashboards, KPIs, reports, rankings
    files/          — File CRUD + DTOs (MinIO integration pending)
    ai/             — AI provider abstraction (NVIDIA NIM / OpenAI)
    export/         — CSV export + XLSX/PDF stubs + async queue
    audit/          — Audit log read/write
    counseling/     — Risk alerts, cases, interventions
    ws/             — WebSocket gateway (Socket.IO, /events namespace)
prisma/
  schema.prisma     — 29 models; single baseline migration `0001_init`; RLS policies in `apply-rls.sql`
libs/shared/prisma/ — Canonical PrismaService (used by ALL modules)

apps/web/src/
  pages/            — Route page components (lazy-loaded via pages/index.ts)
  components/       — Reusable UI (ui/, layout/, academic/StudentTable/)
    ui/             — Button, Card, Input, ErrorBoundary (all tested)
  services/         — API client wrappers (studentApi, teacherApi)
  hooks/            — useAuth, useDebounce, etc.
```

## Conventions
- API controllers use `@Roles()` decorator for RBAC
- API services use Prisma raw queries + paginated responses: `{ data, total, page, limit, totalPages }`
- Web pages are lazy-loaded via `pages/index.ts`
- Tests: `apps/api/test/unit/*.spec.ts` (jest), `apps/api/test/*.e2e-spec.ts`, `apps/web/src/**/__tests__/*.test.tsx` (vitest)
- DTOs in `*/dto/*.dto.ts` with class-validator decorators
- Avoid `any` — prefer explicit types. Cast with `as Type` when necessary.
- All Prisma access via `@sigrade/shared-prisma` (single canonical instance)
- RLS: bootstrap de identidad (`JwtStrategy`, `JwtRefreshStrategy`, `AuthService`) usa `OwnerPrismaService` (rol owner, RLS omitido) porque el tenant aún no se conoce. El contexto de tenant por request se fija en `TenantContextInterceptor` (APP_INTERCEPTOR) vía `prisma.runInTenantContext(tenantId, …)` dentro de una transacción; el `PrismaService` enruta las consultas al cliente de esa transacción mediante un Proxy + `AsyncLocalStorage`. Los sockets WebSocket deben usar `EventsGateway.runAsTenant(tenantId, …)` ya que no pasan por el interceptor. Global `ThrottlerGuard` (APP_GUARD) rate-limits API requests.
- WebSocket: `EventsGateway` in `/events` namespace, use `notify(room, event, data)` or `notifyTenant(tenantId, event, data)`
- AI providers: set `AI_PROVIDER=openai` + `OPENAI_API_KEY` or default NVIDIA

## Common Issues
- Route order matters in NestJS controllers (fixed paths before dynamic `:id`)
- Web lint uses `--max-warnings 0` — fix warnings or adjust threshold
- Web build: `tsc && vite build` — tsc catches TS errors first; __tests__ excluded from tsconfig
- Web lint can show stale results from Nx cache; run `npx eslint --no-cache` directly to verify
- e2e tests require Docker (PostgreSQL + Redis + MinIO running)
- npm install may time out due to network/proxy; retry or configure registry
- Prisma 7 uses `@prisma/adapter-pg` with `PrismaPg` (not `PrismaClient` directly)
- RLS: After `prisma migrate deploy`, run `psql $DATABASE_URL -f prisma/apply-rls.sql` to enable row-level security policies on all tables
- WebSocket: requires `@nestjs/platform-socket.io` — install with `npm install @nestjs/platform-socket.io`. Without it, WsModule.forRoot() returns empty module gracefully
- Env validation: `validateEnv()` in AppModule checks required vars at startup (DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET)

## Docker & Infra Facts (environment-specific)
- **Two PostgreSQL servers exist on this dev machine:**
  - Native Windows PostgreSQL **18.4** listening on `0.0.0.0:5432`. Local commands (`npm run dev`, jest, `prisma db seed`, local `migrate deploy`) with `localhost:5432` hit THIS server (kept for dev convenience; currently seeded).
  - Docker container `pgvector/pgvector:pg16` (compose service `postgres`) publishes **`5433:5432`** (5432 was taken by the native server). The compose `api`/`web` services talk to it over the internal bridge (`postgres:5432`). The full Docker stack (`docker compose up -d --build`) is self-contained and functional (health + seed login OK).
- To seed the **container** DB from the host, target the published port: `DATABASE_URL=postgresql://sigrade:sigrade_dev@localhost:5433/sigrade npx prisma db seed`
- **Node 22** is required (Prisma 7 `@prisma/streams-local` engine gate). Dockerfiles use `node:22-bookworm-slim` (Debian/glibc) because Nx's native binaries (`@nx/nx-linux-x64-*`) are not installed by npm on Alpine/musl.
- The `package-lock.json` was regenerated under Linux so `npm ci` works in Docker/CI. When editing dependencies on Windows, re-sync the lockfile for Linux too (see DIAGNOSTICO.md §3.6): `npm install --package-lock-only --os=linux --cpu=x64 --libc=glibc --include=optional`
- `apply-rls.sql` uses `set_config(..., true)` (transaction-local GUC) so tenant context never leaks across pooled connections.
- API e2e suites: `apps/api/test/*.e2e-spec.ts` (superagent) depend on a **seeded** DB (`prisma db seed`) with `director@escuela.edu.do` / `Admin123!` and `docente@escuela.edu.do` / `Docente123!`. `rls.e2e-spec.ts` and `files.e2e-spec.ts` auto-skip when `APP_DATABASE_URL`/`MINIO_*` are not set.
