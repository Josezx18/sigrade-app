# DIAGNÓSTICO — SIGRADE

> Diagnóstico del estado real del código (generado tras inspección de `apps/api`,
> `libs/shared/prisma`, `prisma/` y configuración). Incluye un hallazgo crítico de
> seguridad ya corregido y los riesgos restantes con su plan de remediación.

## 1. Hallazgo crítico (CORREGIDO): RLS no se aplicaba — aislamiento multi-tenant inexistente

**Síntoma:** El sistema se anuncia como multi-tenant con RLS por `app.current_tenant_id`,
pero en la práctica **cualquier usuario autenticado podía leer/escribir los datos de todos los
inquilinos**.

**Causa raíz:** En PostgreSQL, el **propietario de las tablas (owner) omita Row Level Security
por defecto**. Todos los accesos —runtime, migraciones y seed— usaban `DATABASE_URL`, cuyo
rol `sigrade` es precisamente el owner de las tablas (lo es porque ejecuta las migraciones).
Por tanto:

- `prisma/apply-rls.sql` define las políticas RLS, pero estas **nunca se evaluaban** para la
  conexión de la API.
- Los servicios (ej. `students.service.ts:25` construye `where` sin `tenantId`) **no filtran
  por inquilino a nivel de aplicación**.
- Resultado: aislamiento multi-tenant = 0. Esto es una fuga de datos entre ministerio,
  regionales, distritos y centros.

**Corrección aplicada:**

| Archivo | Cambio |
|---|---|
| `libs/shared/prisma/src/prisma.service.ts` | La conexión runtime ahora usa `APP_DATABASE_URL` (rol **no-owner** `sigrade_app`), de modo que RLS sí se aplica. Migraciones/seed siguen en `DATABASE_URL` (owner, que debe omitir RLS). |
| `.env` / `.env.example` | Se agrega `APP_DATABASE_URL="postgresql://sigrade_app:sigrade_app_dev@..."`. El rol `sigrade_app` ya es creado por `prisma/apply-rls.sql` con `GRANT` de CRUD. |
| `apps/api/.../auth/strategies/jwt.strategy.ts`, `jwt-refresh.strategy.ts`, `auth.service.ts` | Usan `OwnerPrismaService` (rol owner, RLS omitido) porque en el arranque el tenant aún no se conoce y RLS ocultaría la fila a consultar. **No** invocan `setTenantContext`. |

**Requisito de orden de arranque (ya documentado en README):** ejecutar
`prisma migrate deploy` → `apply-rls.sql` (crea `sigrade_app`) → `prisma db seed` **antes** de
iniciar la API. Con `APP_DATABASE_URL` apuntando a `sigrade_app`, la API sólo levanta si el rol
existe (es decir, tras `apply-rls.sql`).

## 2. Riesgo crítico (CORREGIDO): condición de carrera en el contexto de tenant (`max:1`)

`PrismaService` usaba `new Pool({ max: 1 })` y `setTenantContext` se invocaba por request en
`JwtStrategy`. Con **una sola conexión** y requests concurrentes, el orden real en el cable podía ser:

```
A: set_current_tenant(X)  →  B: set_current_tenant(Y)  →  A: query  →  B: query
```

La query de A se ejecutaba **con el contexto de Y** ⇒ fuga cruzada de inquilinos aunque RLS estuviera
activado.

**Corrección aplicada:** el `PrismaService` ahora expone un `Proxy` y la clase base ya **no** usa
`max:1`. Un `TenantContextInterceptor` (`APP_INTERCEPTOR`) envuelve **cada request HTTP** en una
transacción interactiva (`prisma.runInTenantContext(tenantId, …)`) que fija `app.current_tenant_id`
al inicio de la transacción; mientras el handler corre, todo el acceso a Prisma se enruta al cliente
de **esa** transacción vía el Proxy + `AsyncLocalStorage`. Esto elimina la carrera: dos requests
concurrentes usan transacciones distintas y no pueden filtrarse el contexto de tenant. En
`NODE_ENV==='test'` el `PrismaService` cae al rol owner para no romper los suites existentes.

## 3. Riesgos medios

| # | Riesgo | Detalle | Acción |
|---|---|---|---|
| 3.1 | `libs/shared/prisma/src/generated/` (top-level) contiene un cliente Prisma **commiteado/vendored** que no es usado | El `PrismaService` real importa de `@prisma/client` (node_modules), no de ese `generated`. Era peso muerto. | **(Hecho)** Carpeta `generated/` eliminada. |
| 3.2 | Libs duplicados | Existen `D:\Desarrollo\Proyecto x\libs/shared/prisma` (solo `generated`) y `sigrade/libs/shared/prisma` (el `PrismaService` real). | **(Hecho)** Unificado en `sigrade/libs/shared/prisma` (canónico, usado por todos los módulos vía `@sigrade/shared-prisma`). |
| 3.3 | `ARCHITECTURE.md` desactualizado | Afirmaba "200+ archivos sin commitear"; `git status` en `sigrade` muestra árbol limpio. | **(Hecho)** `ARCHITECTURE.md` actualizado con el diseño RLS real, rol `sigrade_app`, interceptor y el estado limpio del repo. |
| 3.4 | `apply-rls.sql` usa `ENABLE ROW LEVEL SECURITY` (no `FORCE`) | Con `FORCE`, el owner también estaría sujeto a RLS; hoy se compensa usando el rol `sigrade_app` para runtime y `OwnerPrismaService` para el arranque. El endurecimiento a `FORCE` + funciones `SECURITY DEFINER` para el arranque **sigue pendiente** (ver comentario en el propio SQL). | **Pendiente** — reevaluar tras la validación Docker completa. |
| 3.5 | MinIO en e2e | ~~Mockeado~~. | **(Hecho)** `apps/api/test/files.e2e-spec.ts` hace round-trip real contra MinIO (subir → descargar → borrar); se omite si `MINIO_*` no está definido. |
| 3.6 | Lockfile incompleto para Linux | `package-lock.json` generado en Windows carecía de los paquetes nativos Linux (`@nx/nx-linux-x64-gnu/musl`, `chokidar`, `@noble/hashes`), por lo que `npm ci` fallaba en Docker/CI (`EUSAGE Missing …`). | **(Hecho)** Lockfile regenerado dentro de `node:22-bookworm-slim` (`npm install --package-lock-only` bajo Linux) para incluir los nodos nativos; el build Docker y `npm ci` en CI ya pasan. |
| 3.7 | Doble PostgreSQL detectado al validar Docker | En el host conviven: un **PostgreSQL nativo de Windows (v18.4)** escuchando en `0.0.0.0:5432` y el **contenedor `pgvector/pgvector:pg16`** que no podía publicar ese puerto (ocupado). Consecuencia: los tests locales/seed con `localhost:5432` iban al postgres nativo; el stack Docker quedaba con la BD vacía. | **(Hecho)** El puerto publicado del contenedor postgres pasa a **`5433:5432`**. `docker compose up` sigue siendo autocontenido; los comandos locales (tests) siguen usando el postgres nativo del host en `5432`. |

## 4. Buenas prácticas confirmadas (no tocar)

- RBAC por `@Roles()` + `RolesGuard`, JWT access/refresh, Throttler global.
- `validateEnv()` exige `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` al arrancar.
- Tests: 34 suites / **343 tests** en API (pasando) y **23** en web (pasando). e2e requieren Docker (postgres + redis + minio).
- CI en `.github/workflows/ci.yml` y `e2e.yml` (pipeline `migrate deploy → apply-rls.sql → seed → tests`), Node 22.
- Documentación (`README.md`, `AGENTS.md`, `ARCHITECTURE.md`) coherente en lo general.

## 5. Plan de remediación — estado final

Todas las acciones de remediación están **completadas y validadas con Docker**:

1. **(Hecho)** Runtime como `sigrade_app` (no-owner) → RLS efectivo.
2. **(Hecho)** Arranque de identidad vía `OwnerPrismaService` (el tenant aún no se conoce).
3. **(Hecho)** Carrera eliminada: `PrismaService` con Proxy + `AsyncLocalStorage` y transacción por request.
4. **(Hecho)** Limpieza de `generated/` vendored y unificación de `libs/shared/prisma`.
5. **(Hecho)** WebSocket endurecido; `EventsGateway` deriva tenant de JWT verificado y expone `runAsTenant`.
6. **(Hecho)** CI rediseñado (`ci.yml`, `e2e.yml`): targets `api:lint`/`web:lint` + `tsc --noEmit`; runner Node 22; env `APP_DATABASE_URL`/`JWT_*` en CI; `migrate → apply-rls → seed` antes de los tests; Jest 30 (`testPathPatterns`, `runInBand`, `forceExit`).
7. **(Hecho)** `apply-rls.sql` ahora fija el contexto de tenant con `set_config(..., true)` (GUC **transaction-local**) para no arrastrar tenant entre requests.
8. **(Hecho)** `PrismaService.runtimeConnectionString()` **falla rápido** si falta `APP_DATABASE_URL` (salvo `NODE_ENV=test`).
9. **(Hecho)** e2e de aislamiento RLS (`rls.e2e-spec.ts`, matriz 0/1/0/0 con `sigrade_app`) y de archivos MinIO (`files.e2e-spec.ts`) con skip limpio sin env.
10. **(Hecho)** Stack Docker construido y funcional: `api` (Node 22 + OpenSSL instalado) y `web` (nginx con el bundle real); health OK, login seed OK (SUPER_ADMIN) contra la BD del contenedor.
11. **(Hecho)** Lockfile regenerado en Linux (compat `npm ci` en Docker/CI).
12. **Pendiente (opcional/endurecimiento):** `FORCE ROW LEVEL SECURITY` + funciones `SECURITY DEFINER`.

## 6. Verificación (ejecutada)

Validación real ejecutada en este entorno (Docker Desktop 29.6.1):

```bash
docker compose up -d postgres redis minio
npx prisma migrate deploy --schema=prisma/schema.prisma
psql "$DATABASE_URL" -f prisma/apply-rls.sql        # 29 políticas
npx prisma db seed
# API Docker: GET /api/v1/health → {status:"ok", checks:{database:"ok"}}
# POST /api/v1/auth/login (admin@sigrade.gob.do / Admin123!) → 200 + JWT; /auth/profile OK
# Web en http://localhost:4200 → HTTP 200 (title SIGRADE)
npx nx run api:test    # 34 suites / 343 tests OK
npx nx test web        # 23 tests OK
npx nx run api:lint    # 0 errores (32 warnings preexistentes en tests)
npx nx run web:lint    # OK
# Aislamiento RLS probado como sigrade_app con dos tenants: own=1, other=0
```

> Nota de infraestructura: si un PostgreSQL nativo (v18.4) del host ocupa `localhost:5432`,
> los tests/seed locales usarán ESE servidor (también válido, tiene seed + RLS); el contenedor
> postgres del compose publica en `5433:5432` para evitar el conflicto. Para “funcional
> full-stack”, levantá el stack con `docker compose up -d --build` (el API del contenedor
> conversa con el postgres del contenedor por la red interna `sigrade-network`).
