# Finance Data Processing and Access Control Backend

A production-quality REST API backend for a finance dashboard system. Built with TypeScript, Express 5, PostgreSQL, and Drizzle ORM. Features role-based access control, financial record management, and dashboard analytics.

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 24 |
| Framework | Express 5 |
| Language | TypeScript 5.9 |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod (v3/v4 compatible) |
| Logging | Pino (structured JSON) |
| API Contract | OpenAPI 3.1 |
| Monorepo | pnpm workspaces |

---

## Architecture

```
lib/
  api-spec/        # OpenAPI 3.1 spec (single source of truth)
  api-zod/         # Generated Zod validation schemas (from codegen)
  api-client-react/ # Generated React Query hooks (from codegen)
  db/              # Drizzle ORM schema and database client

artifacts/
  api-server/      # Express 5 API server
    src/
      routes/      # Route handlers (auth, users, records, dashboard)
      middlewares/ # requireAuth, requireRole RBAC middleware
      lib/         # auth utilities (session tokens, password hashing)

scripts/
  seed.ts          # Database seed script
```

**Design principle:** The OpenAPI spec in `lib/api-spec/openapi.yaml` is the single source of truth. Zod schemas and React Query hooks are generated from it — never hand-written.

---

## Assumptions and Design Decisions

1. **Token-based sessions (in-memory):** Sessions are stored in a `Map` in memory using randomly generated 256-bit hex tokens. Tokens are passed as `Bearer` tokens in the `Authorization` header. This keeps the implementation simple and self-contained without requiring Redis or JWT libraries. In production, sessions would be persisted (e.g., database table or Redis) and tokens would have server-side revocation.

2. **Password hashing:** SHA-256 with a server-side secret (`SESSION_SECRET`). This is simpler than bcrypt for assessment purposes. In production, use bcrypt or Argon2 with a per-user salt.

3. **Soft deletes for records:** Financial records are never physically deleted. A `deletedAt` timestamp marks deletion. Deleted records are excluded from all queries and analytics automatically.

4. **Numeric precision:** Money amounts are stored as `NUMERIC(15,2)` in PostgreSQL (exact decimal). They are returned as `number` (float) in JSON responses via `parseFloat()`.

5. **Role hierarchy:**
   - `viewer` — can read records and the basic dashboard summary
   - `analyst` — everything a viewer can do, plus category totals and monthly trends
   - `admin` — full access including creating/updating/deleting records and managing users

6. **No JWT:** Deliberate choice. JWT adds complexity (expiry, refresh, secret rotation) without significant benefit for this assessment scope.

7. **Pagination:** `GET /records` supports page/limit pagination. Other listing endpoints return all results (bounded by reasonable dataset sizes for a finance dashboard).

---

## Setup

### Prerequisites

- pnpm
- PostgreSQL database (set `DATABASE_URL` env var)
- `SESSION_SECRET` env var

### Install dependencies

```bash
pnpm install
```

### Push database schema

```bash
pnpm --filter @workspace/db run push
```

### Seed the database

Creates 3 demo users and ~30 sample financial records across the past 6 months:

```bash
pnpm --filter @workspace/scripts run seed
```

**Demo credentials:**

| Username | Password | Role |
|---|---|---|
| admin | admin123 | admin |
| analyst | analyst123 | analyst |
| viewer | viewer123 | viewer |

### Run the API server

```bash
pnpm --filter @workspace/api-server run dev
```

Server starts on port 8080 (proxied at `/api`).

---

## API Reference

Base URL: `/api`

### Authentication

All endpoints except `/healthz` require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are obtained from `POST /auth/login`.

---

### Health

#### `GET /api/healthz`

No authentication required.

```json
{ "status": "ok" }
```

---

### Auth

#### `POST /api/auth/login`

```json
// Request
{ "username": "admin", "password": "admin123" }

// Response 200
{
  "token": "...",
  "user": {
    "id": 1, "username": "admin", "email": "admin@example.com",
    "role": "admin", "status": "active",
    "createdAt": "...", "updatedAt": "..."
  }
}

// Response 401
{ "error": "Invalid username or password" }
```

#### `POST /api/auth/logout`

Invalidates the current session token.

```json
// Response 200
{ "message": "Logged out successfully" }
```

#### `GET /api/auth/me`

Returns the currently authenticated user (no password).

---

### Users (Admin only)

#### `GET /api/users`

Returns all users.

#### `POST /api/users`

```json
// Request
{
  "username": "newuser",
  "email": "new@example.com",
  "password": "secure123",
  "role": "viewer"
}
```

Returns the created user (201). Returns 409 if username already exists.

#### `GET /api/users/:id`

Returns a single user.

#### `PATCH /api/users/:id`

Any combination of: `email`, `role`, `status`, `password`.

#### `DELETE /api/users/:id`

Permanently deletes the user. Cannot delete your own account.

---

### Financial Records

#### `GET /api/records`

All authenticated roles. Supports filtering and pagination.

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| type | `income` \| `expense` | Filter by transaction type |
| category | string | Filter by exact category name |
| dateFrom | `YYYY-MM-DD` | Filter records from this date |
| dateTo | `YYYY-MM-DD` | Filter records up to this date |
| page | integer | Page number (default: 1) |
| limit | integer | Results per page, max 100 (default: 20) |

```json
// Response
{
  "data": [
    {
      "id": 1,
      "amount": 5000.00,
      "type": "income",
      "category": "Salary",
      "date": "2026-01-01",
      "notes": "Monthly salary",
      "deletedAt": null,
      "createdById": 1,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "total": 31,
  "page": 1,
  "limit": 20,
  "totalPages": 2
}
```

#### `POST /api/records` — Admin only

```json
// Request
{
  "amount": 1200.00,
  "type": "expense",
  "category": "Rent",
  "date": "2026-04-01",
  "notes": "April rent"
}
```

- `amount`: Positive number
- `type`: `income` or `expense`
- `category`: Non-empty string (max 100 chars)
- `date`: Must be `YYYY-MM-DD` format
- `notes`: Optional string (max 1000 chars)

#### `GET /api/records/:id`

All authenticated roles.

#### `PATCH /api/records/:id` — Admin only

Any combination of fields from POST (all optional).

#### `DELETE /api/records/:id` — Admin only

**Soft delete** — sets `deletedAt` timestamp. Record disappears from all queries but is preserved in the database.

---

### Dashboard Analytics

#### `GET /api/dashboard/summary`

All authenticated roles. Overall financial snapshot.

```json
{
  "totalIncome": 39596.33,
  "totalExpenses": 10828.90,
  "netBalance": 28767.43,
  "totalRecords": 31,
  "incomeCount": 10,
  "expenseCount": 21
}
```

#### `GET /api/dashboard/category-totals` — Analyst and Admin

Income/expense totals grouped by category, sorted by total descending.

```json
[
  { "category": "Salary", "type": "income", "total": 35362.63, "count": 6 },
  { "category": "Rent", "type": "expense", "total": 8214.99, "count": 6 }
]
```

#### `GET /api/dashboard/monthly-trends` — Analyst and Admin

Monthly income/expense breakdown. Defaults to last 12 months.

**Query parameters:** `months` (integer, 1–24, default 12)

```json
[
  { "month": "2026-02", "income": 6534.55, "expenses": 1698.57, "net": 4835.98 },
  { "month": "2026-03", "income": 6767.63, "expenses": 1857.73, "net": 4909.90 }
]
```

#### `GET /api/dashboard/recent-activity`

All authenticated roles. Most recently created records.

**Query parameters:** `limit` (integer, 1–50, default 10)

---

## Access Control Matrix

| Endpoint | Viewer | Analyst | Admin |
|---|---|---|---|
| `GET /auth/me` | ✓ | ✓ | ✓ |
| `GET /records` | ✓ | ✓ | ✓ |
| `GET /records/:id` | ✓ | ✓ | ✓ |
| `POST /records` | ✗ | ✗ | ✓ |
| `PATCH /records/:id` | ✗ | ✗ | ✓ |
| `DELETE /records/:id` | ✗ | ✗ | ✓ |
| `GET /dashboard/summary` | ✓ | ✓ | ✓ |
| `GET /dashboard/recent-activity` | ✓ | ✓ | ✓ |
| `GET /dashboard/category-totals` | ✗ | ✓ | ✓ |
| `GET /dashboard/monthly-trends` | ✗ | ✓ | ✓ |
| `GET /users` | ✗ | ✗ | ✓ |
| `POST /users` | ✗ | ✗ | ✓ |
| `PATCH /users/:id` | ✗ | ✗ | ✓ |
| `DELETE /users/:id` | ✗ | ✗ | ✓ |

---

## Error Responses

All errors follow a consistent format:

```json
{ "error": "Human-readable error message" }
```

| Status | Meaning |
|---|---|
| 400 | Validation error or bad input |
| 401 | Not authenticated |
| 403 | Authenticated but insufficient role |
| 404 | Resource not found |
| 409 | Conflict (e.g., duplicate username) |

---

## Codegen

The OpenAPI spec is the source of truth. After any spec change:

```bash
pnpm --filter @workspace/api-spec run codegen
```

This regenerates:
- `lib/api-zod/src/generated/api.ts` — Zod validation schemas (used by server)
- `lib/api-client-react/src/generated/api.ts` — React Query hooks (used by frontend)

---

## Tradeoffs

| Decision | Chosen | Alternative | Why |
|---|---|---|---|
| Session storage | In-memory Map | Redis / DB table | Simplicity for assessment; Redis for production |
| Password hashing | SHA-256 + secret | bcrypt / Argon2 | Simpler; production should use bcrypt |
| Soft deletes | `deletedAt` timestamp | Physical delete | Financial records should never be destroyed |
| Money storage | `NUMERIC(15,2)` | `FLOAT` | Exact decimal arithmetic, no floating-point errors |
| Auth mechanism | Bearer token | JWT / cookies | Simpler without JWT expiry/refresh complexity |
