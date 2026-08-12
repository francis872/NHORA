# NORA — Emergency Intelligence Platform

**Network · Operations · Response · Assistance**

NORA is a technology platform for **information, communication, geospatial analysis, and
coordination** during emergencies and natural disasters. It consolidates dispersed reports
into structured, georeferenced, actionable information for citizens, operators, and command
centers.

> NORA is **not** a substitute for official emergency organizations and does not provide
> medical diagnoses. It supports decision-making — it does not make final decisions.

This repository is being built in phases (see [docs/architecture/ROADMAP.md](docs/architecture/ROADMAP.md)).
**Phase 1 (current): repository, architecture, base frontend/backend, PostgreSQL/PostGIS,
Prisma, authentication.**

## Monorepo layout

```
nora/
├── apps/
│   ├── web/            Next.js citizen app (mobile-first)
│   └── api/             NestJS API (REST, JWT auth, RBAC)
├── database/
│   ├── schema.prisma    Prisma schema (source of truth for the data model)
│   └── seed.ts          Local dev seed (creates a default admin)
├── packages/
│   └── types/           Shared TypeScript enums/types (@nora/types)
├── docs/
│   └── architecture/    Architecture & phase documentation
├── docker-compose.yml    postgres (PostGIS) + api + web
└── .env.example
```

Command Center, NORA Chat, ETL pipelines, and ML services are planned for later phases and
are intentionally not implemented yet — see [ARCHITECTURE.md](ARCHITECTURE.md).

## Prerequisites

- Node.js ≥ 20
- pnpm ≥ 10 (`corepack enable`)
- Docker Desktop (for PostgreSQL/PostGIS)

## Getting started

```bash
cp .env.example .env
pnpm install

# Start PostgreSQL + PostGIS
pnpm docker:up

# Generate the Prisma client and apply migrations
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# Run the API and the web app (in separate terminals)
pnpm dev:api
pnpm dev:web
```

- API: http://localhost:4000/health
- Web (citizen app): http://localhost:3000

Default seeded admin: `admin@nora.local` / `ChangeMe123!` (override via `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD`, change immediately outside local development).

## Testing

```bash
pnpm --filter @nora/api test        # unit tests
pnpm --filter @nora/api test:e2e    # requires postgres running (pnpm docker:up)
```

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — system design, module boundaries, phase plan
- [.env.example](.env.example) — required environment variables

Additional docs (DATABASE.md, ML.md, API.md, SECURITY.md, DEPLOYMENT.md) will be added as
their corresponding phases are implemented.
