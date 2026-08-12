# NORA — Architecture (Phase 1)

## Vision

Turn scattered emergency reports into structured, georeferenced, actionable information —
via a Citizen App, a Command Center, an intelligence layer (NLP/ML), a data engineering
layer (ETL), and a REST/WebSocket API. See the project root `README.md` for the module map
and the master prompt for the full long-term vision.

## Why these choices (Phase 1)

- **NestJS over plain Express** for the API. The platform needs modular boundaries (auth,
  users, incidents, alerts, chat...), dependency injection, guards for RBAC, and native
  WebSocket support (Phase 3) — Nest gives us that structure without hand-rolling it.
- **Prisma + PostgreSQL/PostGIS**. `database/schema.prisma` is the single source of truth
  for the relational model. The `postgis` datasource extension is enabled from Phase 1 so
  geometry columns (`Incident.location`, `Hospital.location`, ...) can be added in Phase 2
  without a datasource migration.
- **pnpm workspaces monorepo** (`apps/*`, `packages/*`). `@nora/types` holds enums/types
  shared between the API and the web app (`Role`, `IncidentType`, `IncidentStatus`, ...) so
  both sides stay in sync.
- **class-validator/class-transformer** for API DTO validation (idiomatic in Nest), **Zod**
  for frontend form validation (per the requested stack) — both enforce input validation at
  the boundary, just with the idiomatic tool for each framework.
- **JWT access + refresh tokens**, refresh tokens are stored **hashed** (SHA-256) in
  `refresh_tokens` and rotated on every use (old token revoked, new pair issued). All routes
  require a valid access token by default (`JwtAuthGuard` is a global guard); a route opts
  out explicitly with `@Public()`. RBAC is enforced with `@Roles(...)` + a global
  `RolesGuard`.

## Module map (target — see ROADMAP for what's implemented today)

```
NORA
├── Citizen App        apps/web        (Next.js, mobile-first)
├── Command Center      apps/web        (Phase 2+, desktop-first views)
├── NORA Intelligence   ml/             (Phase 5 — classification, priority, anomaly detection)
├── NORA Data           data/, ml/pipelines (Phase 4 — ETL, validation, data quality)
└── NORA API            apps/api        (NestJS — auth, users, incidents, ... )
```

## Data model — Phase 1

Implemented in `database/schema.prisma`:

- `User` (email, passwordHash, fullName, phone, role, isActive)
- `Role` enum: `CITIZEN`, `OPERATOR`, `ADMIN`
- `RefreshToken` (hashed token, expiry, revocation, rotation)
- `AuditLog` (minimal trail — expanded in Phase 6)

`Incident`, `Location`, `Resource`, `Hospital`, `Shelter`, `Alert`, `Chat`, etc. (full list
in the master prompt, section 12) are **not yet created** — they land in Phase 2 onward, to
avoid modeling entities before the features that need them are built.

## Auth flow

```
POST /api/v1/auth/register  → creates User (CITIZEN by default) + access/refresh token pair
POST /api/v1/auth/login     → validates credentials → access/refresh token pair
POST /api/v1/auth/refresh   → rotates refresh token → new pair
POST /api/v1/auth/logout    → revokes the given refresh token
GET  /api/v1/users/me       → current user (any authenticated role)
GET  /api/v1/users          → list users (ADMIN only)
```

## Known limitations (tracked for later phases)

- Frontend stores JWTs in `localStorage` (see `apps/web/src/lib/auth-store.ts`). This is a
  known XSS-exposure risk; target design (Phase 6 — security hardening) is an httpOnly
  refresh-token cookie + in-memory access token.
- No rate-limit tuning beyond a global default (`@nestjs/throttler`, 100 req/min); per-route
  limits (e.g. stricter on `/auth/login`) come with Phase 6.
- `apps/api/Dockerfile` and `apps/web/Dockerfile` are written but not yet verified with a
  full `docker build` in this environment — validate before relying on them for deployment.
- E2E tests require `pnpm docker:up` (Postgres) to be running first.

## Roadmap

See the phase breakdown in the project root `README.md` and the master prompt (sections
38/41). Phase 1 deliverables: repo, architecture, base frontend/backend, PostgreSQL/PostGIS,
Prisma, authentication.
