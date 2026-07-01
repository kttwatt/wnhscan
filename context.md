# WNHScan — Project Context

Barcode-scanning inventory application for hospital departments. Staff scan supply
barcodes to record stock movements, which are meant to be pushed into the hospital's
**IPISS** system. The UI is entirely in **Thai**; code identifiers are English.

> New here? Read this file top-to-bottom once, then skim `AGENTS.md` for the working rules.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js `16.2.9` (App Router, Server Actions) |
| UI | React `19.2.4`, Tailwind CSS v4 |
| Backend | Supabase (Postgres + Auth + Row Level Security) |
| Auth transport | `@supabase/ssr` (cookie-based sessions) |
| Barcodes | `jsbarcode` (Code128), custom SVG generator, `html2pdf.js` for printable sheets |
| Icons | `lucide-react` |

Scripts: `dev`, `build`, `start`, `lint`, and `gen:types` (regenerates
`src/lib/supabase/database.types.ts` from the linked Supabase project).

## Domain model

- **Department** (`departments`) — an organizational unit (e.g. `OR` = ห้องผ่าตัด,
  `AN` = วิสัญญี). Referenced by `code` in app code, by `id` (uuid) in the DB. Soft-deleted via `deleted_at`.
- **Taxonomy** — `item_groups` → `item_subgroups` (two-level classification of supplies).
- **Item** (`items`) — the central catalog of supplies (`code`, `name`, `unit`, `price`,
  `barcode`, `subgroup_id`). Globally unique `code` and `barcode`. Soft-deleted (trash, 30-day retention).
- **department_items** — join table assigning a catalog item to a department (soft-deleted).
- **profiles** — 1:1 with `auth.users`; holds `role` and legacy `department_id`.
- **user_departments** — join table for a user's department memberships (the source of truth;
  `profiles.department_id` is legacy fallback only).

## Roles & authorization

Three roles. **The app and DB use different names** — always map via
`mapAppRoleToDb` / `mapDbRoleToApp` (`src/lib/auth/database.ts`):

| App role | DB role | Capabilities |
| --- | --- | --- |
| `admin` | `admin` | Everything: users, master catalog, taxonomy, trash, all departments |
| `manager` | `deptmanager` | Department page + close-round for their assigned departments; assign/remove items to their dept |
| `user` | `user` | Scan + view within their department(s) |

Authorization is enforced in **three layers** (all must agree):

1. **Middleware** (`middleware.ts`) — authentication only. Redirects unauthenticated users to
   `/login`; keeps a `PUBLIC_PATHS` allowlist (login, forgot/reset password, auth callbacks).
   It does **not** check roles.
2. **Page/Server-action checks** — role gating via `src/lib/auth/access.ts`
   (`canAccessAdmin`, `canAccessDepartmentPage`, `canManageCatalogMaster`, `canAccessCloseRound`,
   `canAccessDepartment`). Server actions wrap mutations in `requireAdmin` /
   `requireCatalogAdmin` / `requireDepartmentManager`.
3. **Postgres RLS** — `SECURITY DEFINER` helpers (`is_admin()`, `user_has_department()`,
   `is_department_manager()`, `manager_can_view_profile()`) back the row policies in
   `supabase/migrations/`. This is the real security boundary.

Note: several route pages are `"use client"` and gate the UI on the client only
(`admin`, `department`, `close-round`). That is acceptable **only** because data access is
protected by server actions + RLS. Server components that load sensitive data
(`admin/users`, `admin/catalog`, `admin/trash`, `admin/subgroup-mapping`) re-check
`canAccessAdmin` server-side.

## Supabase clients

| Module | Runtime | Respects RLS? | Use for |
| --- | --- | --- | --- |
| `src/lib/supabase/server.ts` | Server (cookies) | Yes | User-scoped server reads/writes, `getUser()` |
| `src/lib/supabase/client.ts` | Browser | Yes | Client-side auth (login, reset password) |
| `src/lib/supabase/admin.ts` | Server only | **No — bypasses RLS** | Deliberate privileged ops (create user, resolve dept uuids, public login-page forms) |

`createAdminClient()` requires `SUPABASE_SERVICE_ROLE_KEY` (server-only env). **Never** import
it into client code. Always re-verify permissions in code before using it.

`isSupabaseConfigured()` gates a **mock mode**: when the public Supabase env vars are absent,
the dashboard renders with `MOCK_PROFILE` (an admin) and auth is skipped. This is a
dev convenience — production must set all env vars.

## Auth flows

- **Login** — client calls `supabase.auth.signInWithPassword` (`login-form.tsx`), then redirects
  to `next` (validated to start with `/`).
- **Create user** — admin-only. Two entry points: the admin Users page (`createUserAction`,
  gated by `requireAdmin`) and a "create user" tab on the public login page
  (`createUserWithAdminAuthAction`) that re-authenticates the admin's credentials before
  delegating to `createUserFromFields`. User creation uses the service-role client to create the
  `auth.users` row + `profiles` row + `user_departments` links (rolls back the auth user if the
  profile insert fails).
- **Forgot / reset password** — `forgot-password` → `POST /auth/reset-password`
  (`resetPasswordForEmail`) → email link → `/auth/callback` (`exchangeCodeForSession` or
  `verifyOtp` for recovery) → `/reset-password` (`updateUser({ password })`).

## Feature areas (App Router)

Routes live under `src/app/(dashboard)/`:

- `/` — dashboard home (scan-flow hero, volume stats).
- `/scan` — "instant scan": build a batch, run the sequential scan wizard, save.
- `/queue` — pending queue management.
- `/close-round` — review the pending queue and finalize a scan round (managers/admin).
- `/department` — manage a department's catalog + users (managers/admin).
- `/admin`, `/admin/users`, `/admin/catalog`, `/admin/subgroup-mapping`, `/admin/trash` — admin tools.

### Scan / queue mechanics

- `useScanBatch` — in-memory batch being assembled on the scan page.
- `useScanWizard` — the step-by-step verification modal; `evaluateScanMatch` compares the
  scanned value against the item's `code` or `barcode`.
- `resolveScanInput` — resolves typed/scanned input to an exact item, ambiguous list, or none.
- Scan modes: `instant_scan` (save immediately) vs `queue_scan` (finalize at close-round).

## Persistence status

Catalog / taxonomy / users / departments / **scan batches** / **pending queue** are backed by **Supabase** when env vars are configured.

`pending-save-history` (batch groupings in the queue history UI) still uses **localStorage** as a lightweight client-side grouping layer on top of the DB-backed pending queue.

When `isSupabaseConfigured()` is false (no env vars), the app falls back to mock profile + localStorage for pending queue (scan logs return empty).

## Directory map

```
src/
  app/
    (dashboard)/       # authenticated app: scan, queue, close-round, department, admin/*
    login/             # login + admin-gated create-user
    forgot-password/, reset-password/, auth/callback/, auth/reset-password/
    middleware.ts      # (repo root) auth redirect + public-path allowlist
  components/          # UI, grouped by feature (scan, catalog, department, admin, layout, auth, ui)
  lib/
    auth/              # roles, access rules, profile loading, role mapping
    supabase/          # server/client/admin factories, env, generated types
    catalog/           # catalog + taxonomy: *-actions.ts (server actions), *-db.server.ts (RLS), helpers
    scan/              # scan matching, scan-log (localStorage), types
    pending/           # pending queue store (localStorage)
    hooks/             # client data hooks
    storage/           # localStorage JSON helper with in-memory fallback
supabase/migrations/   # schema + RLS (source of truth for the DB)
docs/superpowers/      # design specs & plans
```

## Environment

Copy `.env.local.example` → `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public client config.
- `SUPABASE_SERVICE_ROLE_KEY` — **server-only**, never prefixed with `NEXT_PUBLIC_`.

## Known gaps / watch-list

- `pending-save-history` (queue history batch groupings) is still localStorage-only.
- IPISS integration endpoint is not wired — scans are persisted to `scan_batches` only.
