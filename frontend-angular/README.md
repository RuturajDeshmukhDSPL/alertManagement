# PulseAlert — Alerts & Observability Operations (Angular)

An Angular 18 (standalone components, signals) rebuild of the PulseAlert
alerts-management UI, following `DESIGN.md`'s design tokens.

## Architecture

```
src/app/
├── dummy-data/                Mock data layer — the ONLY place raw records live
│   ├── alerts.data.ts            Seed Alert[] + code/date helpers
│   ├── facilities.data.ts        Seed Facility[] + network summary stats
│   ├── alert-form-options.data.ts Severity/status/source/owner option lists
│   ├── current-user.data.ts       Signed-in user shown in the Header
│   └── index.ts                   Barrel export
│
├── core/                     Framework-agnostic app logic
│   ├── models/                Alert, Facility, filter types
│   ├── services/               State layer (signals) — import from dummy-data
│   │   ├── alert.service.ts        Alert state + mutations (source of truth)
│   │   ├── facility.service.ts     Facility state
│   │   ├── current-user.service.ts Signed-in user state
│   │   ├── search.service.ts       Global search-box value (shared bus)
│   │   └── modal.service.ts        "Raise Alert" modal open/close bus
│   └── utils/alert-styles.ts   Single source of truth for severity/status colors
│
├── layout/                   STATIC shell — same on every route
│   ├── header/                 Logo, global search, Raise Alert, profile menu
│   └── sidebar/                 Nav links, live alert/facility count badges, Raise Alert
│
├── shared/                   Reusable, presentation-only building blocks
│   ├── severity-badge/          <app-severity-badge [severity]="...">
│   ├── status-badge/            <app-status-badge [status]="...">
│   └── pagination/               <app-pagination> (rows-per-page + page nav)
│
└── features/
    ├── alerts/                 DYNAMIC feature — reacts to data/filters
    │   ├── alerts-page/           Container: owns filter/search/date/paging state
    │   ├── filter-bar/            Severity/status chips + date range (controlled)
    │   ├── alert-list/            Table + pagination composition
    │   ├── alert-row/             Single <tr app-alert-row> row
    │   ├── alert-detail/          Right-hand triage/inspector panel
    │   ├── raise-alert-modal/     "Raise Alert" form (writes to AlertService)
    │   └── confirm-close-modal/   Confirmation before closing an alert
    │
    └── facilities/              Second nav destination (Facility Management)
        ├── facilities-page/
        └── facility-detail-modal/
```

Every component has its own `*.component.ts` / `*.component.html` / `*.component.css`
(or an inline `template` for the two tiniest badges, each still with its own
`.css` via `styleUrl`) — no styling lives only inside `styles.scss` except
truly global concerns (fonts, base resets).

### Why this split

- **No hardcoded data in components or services.** Every seed record (alerts,
  facilities, dropdown option lists, the signed-in user) lives in
  `dummy-data/*.ts` as a plain exported array/object. Services
  (`AlertService`, `FacilityService`, `CurrentUserService`) *import* that data
  as their initial signal value — components never declare data inline. To
  swap in a real backend, replace what a service imports with an HTTP call;
  no component changes are needed.
- **Header & Sidebar are static**: they render identically on every route and
  never contain filtering/pagination logic. They only *emit intent* (search
  text, "raise alert" clicks) through small shared services
  (`SearchService`, `ModalService`) — they don't need to know anything about
  how Alerts are filtered or paginated. The one live number they show (alert
  count, facility count) comes from a read-only signal on the relevant
  service, so it's never stale or hardcoded.
- **AlertsPageComponent is the dynamic container**: it owns all reactive
  state (current filter, search term, date range, page, selection) as
  Angular **signals**, and derives `filteredAlerts` / `pagedAlerts` /
  `selectedAlert` with `computed()`. Any state change (search typed in the
  header, a filter chip clicked, an alert closed) automatically re-renders
  only the affected pieces.
- **Everything else is a reusable, "dumb" component** — `SeverityBadge`,
  `StatusBadge`, `Pagination`, `AlertRow`, `AlertDetail`, `FilterBar` — each
  takes inputs and emits outputs, so they can be reused for other lists
  (e.g. the Facilities alert counts) or dropped into a different page
  without modification.

## Recent additions

- **Header facility dropdown** (right of the PulseAlert logo): lists only
  facilities that actually exist (`FacilityService.facilities()`, live —
  never hardcoded). Selecting one narrows the Alerts list to that facility
  via `FacilityFilterService`, a small shared signal both the Header and
  the Alerts page read/write without knowing about each other's internals.
- **Facility-scoped alerts**: every `Alert` now carries a `facilityId`.
  Clicking "View Facility Alerts" in the facility detail modal sets the
  same `FacilityFilterService` signal and navigates to `/alerts`, so only
  that facility's alerts show up — no more, no less.
- **Facility detail modal shows exactly one facility.** `FacilitiesPageComponent`
  tracks a single `selectedId`; the modal only ever renders the matching
  record, and its "Active Incidents" stat is computed live from
  `AlertService` per facility (see `FacilityService.alertStatsByFacility`),
  never a stale hardcoded count.
- **Route-aware header search**: the global search box is hidden while on
  `/facilities` and reappears on `/alerts`, driven by a signal derived from
  `Router` events (`HeaderComponent.showSearch`).
- **30-second auto-refresh**: `AlertService` polls every 30s
  (`AUTO_REFRESH_INTERVAL_MS`) and merges in new alerts automatically — no
  page reload needed. Since it's dummy data, the "server" is simulated by
  draining `dummy-data/incoming-alerts.data.ts`; swap `AlertService.refresh()`
  for a real HTTP call and everything downstream keeps working unchanged.
  A small "Live · updated HH:MM:SS" indicator (with a manual refresh
  button) sits in the Alerts page header so the behavior is visible.



```bash
npm install
npm start        # ng serve, http://localhost:4200
npm run build     # production build -> dist/pulsealert-angular
```

## Notes

- State is in-memory (Angular signals) with realistic seed data matching the
  original prototype (`code.html`) — 10 alerts, 4 facilities. Swap
  `AlertService`/`FacilityService` internals for real HTTP calls without
  touching any component.
- Styling uses Tailwind CSS configured directly from the color/spacing/
  radius tokens in `DESIGN.md` (see `tailwind.config.js`).
- Material Symbols Outlined + Inter/JetBrains Mono are loaded the same way
  as in the original HTML prototype (`src/index.html`).
