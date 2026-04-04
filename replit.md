# Finance Data Processing and Access Control Backend

## Overview

A production-quality REST API backend for a finance dashboard system. Features role-based access control, financial record management with soft deletes, and dashboard analytics.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (zod/v4 compatible), drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Logging**: Pino (structured JSON)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/scripts run seed` — seed the database with demo data

## Project Structure

```
lib/
  api-spec/openapi.yaml  # OpenAPI 3.1 spec (source of truth)
  api-zod/               # Generated Zod schemas
  api-client-react/      # Generated React Query hooks
  db/src/schema/
    users.ts             # Users table (roles, status)
    records.ts           # Financial records table (soft delete)

artifacts/api-server/src/
  routes/
    auth.ts              # Login, logout, /me
    users.ts             # User CRUD (admin only)
    records.ts           # Financial records CRUD + filter + pagination
    dashboard.ts         # Summary, category totals, monthly trends, recent activity
  middlewares/
    requireAuth.ts       # Auth + RBAC middleware (requireAuth, requireRole)
  lib/
    auth.ts              # Password hashing, session management (in-memory)

scripts/src/
  seed.ts                # Database seeder (3 users + 31 records)
```

## Roles

| Role | Permissions |
|---|---|
| viewer | Read records, basic dashboard summary, recent activity |
| analyst | Everything viewer can + category totals + monthly trends |
| admin | Full access including write operations on records and users |

## Demo Credentials (after seeding)

- admin / admin123
- analyst / analyst123
- viewer / viewer123

## API Endpoints

- `POST /api/auth/login` — get Bearer token
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET/POST /api/users` (admin)
- `GET/PATCH/DELETE /api/users/:id` (admin)
- `GET /api/records` — with filters: type, category, dateFrom, dateTo, page, limit
- `POST /api/records` (admin)
- `GET/PATCH/DELETE /api/records/:id` (admin for write)
- `GET /api/dashboard/summary`
- `GET /api/dashboard/category-totals` (analyst+)
- `GET /api/dashboard/monthly-trends?months=12` (analyst+)
- `GET /api/dashboard/recent-activity?limit=10`

## Design Decisions

- Sessions stored in-memory (Map) with 24h expiry; no JWT complexity
- SHA-256 password hashing with SESSION_SECRET
- Soft deletes on financial records (deletedAt timestamp)
- Money stored as NUMERIC(15,2) for exact decimal precision
- OpenAPI spec is single source of truth; Zod schemas and hooks are generated

See README.md for full API documentation.
