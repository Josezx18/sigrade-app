# SIGRADE

**Sistema Inteligente de Gestión del Registro Académico Digital**

Plataforma educativa multi-tenant para el Ministerio de Educación de la República Dominicana (MINERD). Gestiona estudiantes, docentes, calificaciones, asistencia, planificación docente y análisis predictivo en una jerarquía que abarca desde el nivel nacional hasta cada centro educativo.

---

## Stack Tecnológico

### Backend (`apps/api`)
| Tecnología | Versión | Propósito |
|---|---|---|
| **NestJS** | 11 | Framework backend modular |
| **Node.js** | 20+ | Runtime |
| **TypeScript** | 5.9 | Lenguaje |
| **Prisma** | 7.8 | ORM con PostgreSQL + RLS |
| **PostgreSQL** | 16 | Base de datos principal |
| **Redis** | 7 | Caché, sesiones, colas |
| **BullMQ** | — | Colas de procesamiento async |
| **Swagger** | — | Documentación API en `/docs` |
| **JWT + Passport** | — | Autenticación |
| **Throttler** | — | Rate limiting (100 req/min) |

### Frontend (`apps/web`)
| Tecnología | Versión | Propósito |
|---|---|---|
| **React** | 18 | UI Framework |
| **TypeScript** | 5.3 | Lenguaje |
| **Vite** | 5 | Build tool |
| **Tailwind CSS** | 3.3 | Estilos utilitarios |
| **shadcn/ui** | — | Componentes base (Radix UI) |
| **TanStack Query** | 5 | Estado del servidor |
| **Zustand** | — | Estado del cliente |
| **React Hook Form + Zod** | — | Formularios y validación |
| **React Router** | 6 | Enrutamiento |
| **Axios** | 1.6 | HTTP Client |
| **Recharts** | — | Gráficas y dashboard |
| **Lucide React** | — | Iconos |

### Infraestructura
- Docker Compose (PostgreSQL + pgvector, Redis, MinIO)
- GitHub Actions (CI/CD)
- MinIO (almacenamiento S3-compatible para evidencias)
- pgvector (búsqueda semántica con embeddings)

---

## Arquitectura

### Jerarquía Multi-Tenant (MINERD)
```
NACIONAL
└── REGIONALES (18)
    └── DISTRITOS (122)
        └── CENTROS EDUCATIVOS (~6,000)
            ├── DIRECTIVOS
            ├── COORDINADORES
            ├── DOCENTES
            └── ORIENTADORES
```

### Roles del Sistema
| Rol | Descripción |
|---|---|
| `NACIONAL` | Administración central MINERD |
| `REGIONAL` | Gestión por región educativa |
| `DISTRITAL` | Gestión por distrito educativo |
| `DIRECTOR` | Dirección del centro educativo |
| `COORDINADOR` | Coordinación académica |
| `DOCENTE` | Planificación y calificaciones |
| `ORIENTADOR` | Orientación y consejería |

### Módulos del Backend (13)
| Módulo | Descripción |
|---|---|
| Auth | Autenticación JWT + 2FA, autorización RBAC |
| Tenants | Jerarquía multi-tenant MINERD |
| Students | Gestión de estudiantes y matrícula |
| Teachers | Gestión de docentes y asignaciones |
| Academic | Años escolares, periodos, grados, materias |
| Grades | Calificaciones, rúbricas, evidencias |
| Attendance | Asistencia diaria |
| Planning | Planificación docente y sesiones |
| Counseling | Alertas de riesgo, consejería |
| Analytics | Dashboards, reportes, predictivo |
| Files | Subida/descarga de evidencias (MinIO) |
| AI | Integración con microservicios de IA |
| Audit | Auditoría de cambios |

---

## Requisitos

- **Node.js** 20+
- **Docker** y **Docker Compose**
- **Nx CLI** (`npx nx`)

## Inicio Rápido

```bash
# 1. Clonar el repositorio
git clone <repo-url> sigrade
cd sigrade

# 2. Instalar dependencias
npm install

# 3. Iniciar infraestructura (PostgreSQL, Redis, MinIO)
docker compose up -d

# 4. Configurar variables de entorno
cp .env .env.local  # editar según sea necesario

# 5. Ejecutar migraciones de base de datos
npx prisma migrate dev

# 6. (Opcional) Poblar datos de prueba
npx prisma db seed

# 7. Iniciar servidores de desarrollo
npx nx serve api     # Backend: http://localhost:3000
npx nx serve web     # Frontend: http://localhost:4200
```

## Comandos Útiles

```bash
# Build producción
npx nx build api
npx nx build web

# Tests
npx nx test api
npx nx test web

# Lint
npx nx lint api
npx nx lint web

# Graph visual de dependencias
npx nx graph

# Generar componentes (Nx generators)
npx nx g @nx/react:component mi-componente --project=web
npx nx g @nx/nest:resource mi-recurso --project=api
```

## Estructura del Proyecto

```
sigrade/
├── apps/
│   ├── api/                    # NestJS backend
│   │   └── src/
│   │       ├── main.ts         # Bootstrap (Swagger, CORS, Validation)
│   │       ├── app/            # Módulo raíz
│   │       ├── common/         # Tipos, guards, decoradores compartidos
│   │       └── modules/        # 13 módulos de dominio
│   ├── web/                    # React + Vite frontend
│   │   └── src/
│   │       ├── main.tsx        # Entry point (React Query, Router)
│   │       ├── App.tsx         # Rutas principales
│   │       ├── components/
│   │       │   ├── ui/         # shadcn/ui components (Button, Input, Modal, Table, etc.)
│   │       │   ├── layout/     # Layout, Sidebar
│   │       │   ├── auth/       # Guards de rutas
│   │       │   └── academic/   # Componentes de gestión académica
│   │       ├── pages/          # 10 páginas (Dashboard, Students, Grades, etc.)
│   │       ├── hooks/          # Custom hooks + React Query hooks
│   │       ├── services/       # API calls (Axios)
│   │       └── lib/            # Utilidades (cn, formatDate, api client)
│   ├── api-e2e/               # Tests E2E del API
│   └── web-e2e/               # Tests E2E del frontend (Cypress)
├── libs/shared/prisma/        # @sigrade/shared-prisma (PrismaClient + RLS)
├── prisma/
│   ├── schema.prisma          # Esquema de BD (25 modelos, 18 enums)
│   ├── migrations/            # Migraciones
│   └── seed.ts                # Datos de prueba
├── docker-compose.yml         # Infraestructura local
├── nx.json                    # Configuración Nx workspace
└── tsconfig.base.json         # Base TypeScript con alias
```

## Frontend - Páginas

| Ruta | Página | Descripción |
|---|---|---|
| `/login` | Login | Autenticación (email + password + 2FA) |
| `/dashboard` | Dashboard | Vista general con estadísticas |
| `/students` | Estudiantes | Gestión de estudiantes (versión simple) |
| `/academico/estudiantes` | Gestión de Estudiantes | Gestión avanzada con tabla, búsqueda, filtros |
| `/teachers` | Docentes | Gestión de docentes |
| `/grades` | Calificaciones | Registro de calificaciones |
| `/attendance` | Asistencia | Control de asistencia |
| `/planning` | Planificación | Planificación docente |
| `/academic` | Gestión Académica | Años, periodos, grados, materias |
| `/analytics` | Analítica | Reportes y dashboard analítico |
| `/profile` | Perfil | Perfil de usuario |

## API - Endpoints Principales

### Autenticación
```
POST   /api/v1/auth/login           Iniciar sesión
POST   /api/v1/auth/refresh         Refrescar token
POST   /api/v1/auth/logout          Cerrar sesión
POST   /api/v1/auth/2fa/enable      Activar 2FA
POST   /api/v1/auth/2fa/verify      Verificar 2FA
```

### Estudiantes
```
GET    /api/v1/students             Listar estudiantes (paginado, filtros)
GET    /api/v1/students/:id         Obtener estudiante
POST   /api/v1/students             Crear estudiante
PATCH  /api/v1/students/:id         Actualizar estudiante
DELETE /api/v1/students/:id         Eliminar estudiante
POST   /api/v1/students/bulk-delete Eliminación masiva
GET    /api/v1/students/export      Exportar a Excel
```

### Calificaciones, Asistencia, Planificación
```
GET    /api/v1/grades               Listar calificaciones
POST   /api/v1/grades               Crear calificación
GET    /api/v1/attendance           Listar asistencia
POST   /api/v1/attendance           Registrar asistencia
GET    /api/v1/planning             Listar planificaciones
POST   /api/v1/planning             Crear planificación
```

Documentación Swagger completa disponible en `http://localhost:3000/docs`.

---

## Variables de Entorno (`.env`)

| Variable | Descripción | Default |
|---|---|---|
| `DATABASE_URL` | Conexión PostgreSQL | `postgresql://sigrade:sigrade_dev@localhost:5432/sigrade` |
| `REDIS_URL` | Conexión Redis | `redis://localhost:6379` |
| `JWT_SECRET` | Secreto JWT | — |
| `JWT_EXPIRES_IN` | Expiración access token | `15m` |
| `JWT_REFRESH_SECRET` | Secreto refresh token | — |
| `JWT_REFRESH_EXPIRES_IN` | Expiración refresh token | `7d` |
| `MINIO_*` | Configuración MinIO | — |
| `CORS_ORIGIN` | Origen CORS | `http://localhost:4200` |

---

## Licencia

MIT
