# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (localhost with HMR)
npm run build        # Production build → dist/
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
npm run electron:dev # Launch Electron desktop app
npm run electron:build # Package Windows portable EXE → electron-dist/
```

No test suite is configured.

## Architecture

React 19 SPA backed by Supabase (PostgreSQL + Auth), packaged as a web app or Windows EXE via Electron. The app is a multi-company HR system with Thai/English localization.

### Entry points

| File | Role |
|------|------|
| `src/main.jsx` | React DOM root |
| `src/App.jsx` | Router + role-gated page map (`ROLE_PAGES`) |
| `src/components/Layout.jsx` | App shell: sidebar, company filter, language toggle, password modal |
| `src/lib/AuthContext.jsx` | Auth state, role helpers, `signIn`/`signOut`/`changePassword` |
| `src/lib/supabase.js` | Supabase client (env vars `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`; hardcoded fallbacks present) |

### Key abstractions

**`src/lib/hooks.js`** — central data layer:
- `useSupabase(table, opts)` — reactive Supabase query hook with filters, sorting, pagination
- `insertRow()`, `updateRow()`, `deleteRow()`, `bulkInsert()` — direct CRUD helpers
- `fmt(value)` — number formatting; `fmtDate(value)` — date formatting

**`src/lib/CompanyFilterContext.jsx`** — global company filter applied to every Supabase query. All pages pull employee lists filtered by the selected company, then filter related tables by those employee IDs.

**`src/lib/translations.js`** — `T` object keyed by label slug with `{ th, en }` values. Language toggled via `lang` prop drilled from Layout. No i18n library.

**`src/utils/nameHelper.js`** — `formatName()` for Thai/English name display with nickname support.

### Role system

Roles (ascending privilege): `employee` → `manager` → `admin` → `superuser`.  
Role checks: `canViewAll`, `canViewTeam`, `canEdit`, `canManageUsers`, `canViewSalary` — defined in `AuthContext`.  
`ROLE_PAGES` in `App.jsx` maps each role to allowed page keys; the router enforces this at render time.

### Pages (`src/pages/`)

24 feature modules. Each page fetches its own data independently via `useSupabase()`. Notable ones:
- `Dashboard.jsx` — KPI cards and Recharts charts
- `Employees.jsx` — CRUD, column visibility, CSV/Excel import
- `Payroll.jsx` — salary, deductions, net pay
- `Leave.jsx` — requests and approvals
- `TimeAttendance.jsx` — clock in/out
- `Reports.jsx` — data export (XLSX, CSV, PDF via jsPDF)
- `UserManagement.jsx`, `CompanyManagement.jsx` — admin-only

### UI components

- `src/components/PageUI.jsx` — `PageHeader`, `KPICard`, `Section`, `DetailPanel`, `Avatar`
- `src/components/UI.jsx` — `Badge`, `StatCard`, `Card`, `SearchInput`, `Button`, `LoadingSpinner`
- `src/components/ImportExport.jsx` — shared CSV/Excel import-export logic
- Styling: Tailwind CSS 4 + Lucide React icons throughout

### Database tables (Supabase)

- `hr_user_profiles` — user accounts with `role` field
- `hr_employees` — employee records, keyed by `company_entity` (company code)
- `hr_companies` — company entities (`code`, `name_th`, `name_en`, `is_active`)
- Additional tables for leaves, payroll, attendance, performance, recruitment, training, etc.

## Environment

Supabase credentials default to hardcoded fallbacks in `src/lib/supabase.js`. Override with:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

The Electron main process is expected at `electron/main.cjs` (referenced in `package.json`) but is not present in the repository — Electron commands will fail without it.
