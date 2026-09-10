# PulseAlert API — Express + Sequelize (MySQL)

Backend for the PulseAlert Angular frontend: alerts, facilities, and
dashboard statistics, backed by the `alertManagement` MySQL database.

## Endpoints

| Method | Endpoint                | Purpose                    |
|--------|--------------------------|-----------------------------|
| GET    | `/api/alerts`            | List alerts (filter/paginate) |
| GET    | `/api/alerts/:id`        | Get one alert               |
| POST   | `/api/alerts`             | Create alert                |
| PUT    | `/api/alerts/:id`        | Update alert                |
| GET    | `/api/facilities`         | List facilities (with live active-alert stats) |
| GET    | `/api/facilities/:id`    | Get one facility            |
| GET    | `/api/users?assignable=true` | List users available for alert assignment |
| GET    | `/api/dashboard/stats`    | Aggregate dashboard stats   |
| GET    | `/health`                 | Liveness check               |

### `GET /api/alerts` query params
- `status` — `Active` \| `Addressed` \| `Closed`
- `severity` — `Critical` \| `High` \| `Medium` \| `Low`
- `facilityId` — e.g. `FAC-001`
- `search` — matches title/description/host/code/source
- `dateFrom`, `dateTo` — `YYYY-MM-DD`, filters on `reported_date`
- `latest` — `true` to only return alerts flagged `is_latest`
- `page`, `pageSize` — pagination (default `1` / `10`, max `pageSize` 100)

Response shape:
```json
{
  "success": true,
  "data": [ { "id": 1, "code": "ALT-2201", "...": "..." } ],
  "meta": {
    "page": 1, "pageSize": 10, "total": 10, "totalPages": 1,
    "counts": {
      "total": 10, "latest": 4,
      "bySeverity": { "Critical": 2, "High": 2, "Medium": 3, "Low": 3 },
      "byStatus": { "Active": 5, "Addressed": 3, "Closed": 2 }
    }
  }
}
```
`meta.counts` is scoped to `facilityId`/`search`/date range but **not** to
`status`/`severity`, so a filter-bar UI can show "how many alerts would
match each chip" in one request — mirrors what the Angular frontend needs.

### `POST /api/alerts` body
```json
{
  "title": "Memory leak in auth-service",
  "host": "auth-service-01",
  "source": "Prometheus Alertmanager",
  "severity": "High",
  "facilityId": "FAC-001",
  "ownerId": 6,
  "status": "Active",
  "description": "optional"
}
```
`title`, `host`, `source`, `severity`, `facilityId` are required. The
alert code (`ALT-####`) is generated automatically, continuing from
whatever's already in the table.

### `PUT /api/alerts/:id` body
Any subset of: `title`, `description`, `host`, `source`, `severity`,
`status`, `ownerId`, `facilityId`, `isLatest`.

## Project layout

```
src/
├── config/         env.js (central env var access), database.js (Sequelize instance)
├── models/         User, Facility, Alert (+ associations in index.js)
├── services/        alert.service.js, facility.service.js, dashboard.service.js — all business logic
├── controllers/     thin HTTP layer — call a service, shape the response
├── routes/           one file per resource + index.js that mounts them under /api
├── middlewares/      errorHandler.js (404 + centralized error formatting)
├── utils/             ApiError, asyncHandler, parseNumberPrefix
└── seed/               seed.js — populates sample data matching the Angular frontend
```

Controllers never touch Sequelize directly — they call a service function
and translate the result into an HTTP response. All query-building,
validation, and cross-table aggregation lives in `services/`.

## Setup

1. **Create the database.** Run the SQL script you already have (creates
   `alertManagement` with `users`, `facilities`, `alerts` tables, FKs, and
   indexes).

2. **Configure environment.**
   ```bash
   cp .env.example .env
   # edit DB_USER / DB_PASSWORD to a MySQL user that can connect over TCP
   ```
   Note: if you're on MySQL/MariaDB with `root@localhost` using the
   `unix_socket` auth plugin (the default on many installs), Node's
   `mysql2` driver can't authenticate as `root` over TCP. Create a
   dedicated app user instead:
   ```sql
   CREATE USER 'pulsealert'@'%' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON alertManagement.* TO 'pulsealert'@'%';
   FLUSH PRIVILEGES;
   ```

3. **Install & seed.**
   ```bash
   npm install
   npm run seed   # clears + repopulates users/facilities/alerts with sample data
   ```

4. **Run.**
   ```bash
   npm run dev     # nodemon, auto-restart
   # or
   npm start
   ```
   API listens on `http://localhost:4000` (see `.env`). Health check at
   `GET /health`.

## Verified

This backend was built and exercised end-to-end against a real MySQL
(MariaDB) instance running the exact schema you provided: schema applied →
seeded → every endpoint hit with curl (list/filter/paginate alerts, get by
id, create, update, list/get facilities with live active-alert counts,
dashboard stats, 404 and 400 error paths) — all responses verified by hand,
not just "the code compiles."

## Wiring up the Angular frontend

Each Angular service currently reads from `dummy-data/*.ts`. To point them
at this API instead:
- `AlertService` → replace the `ALERTS_DUMMY_DATA` signal seed with an
  `HttpClient.get('/api/alerts')` call in a resolver/effect, and replace
  `addAlert`/`setStatus` with `POST`/`PUT` calls against this API.
- `FacilityService` → `GET /api/facilities` already returns `activeAlertCount`
  / `activeAlertsLabel` live, so `alertStatsByFacility` becomes unnecessary
  on the frontend — the backend now owns that computation.
- The 30-second auto-refresh in `AlertService.refresh()` can call
  `GET /api/alerts` again instead of draining `incoming-alerts.data.ts`.
