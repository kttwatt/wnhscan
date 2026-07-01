<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# WNHScan — Agent Guide

Barcode-scanning inventory app for hospital departments (Thai UI), feeding stock counts into the "IPISS" system. Next.js 16 (App Router, React 19) + Supabase (Postgres, Auth, RLS). See `context.md` for the full architecture reference.

## Golden rules

- **Read `context.md` first.** It maps the domain, data model, auth model, and known gaps.
- **UI copy is Thai.** Keep all user-facing strings in Thai and match the existing tone. Code identifiers stay English.
- **Never trust the client for authorization.** Client pages gate the UI, but every mutation must be enforced by (a) a server-action role check (`requireAdmin` / `requireCatalogAdmin` / `requireDepartmentManager`) **and** (b) Postgres RLS. Add both when introducing new tables/actions.
- **Two Supabase clients, two purposes.** Use the cookie-bound SSR client (`@/lib/supabase/server`, `/client`) for normal user-scoped access (respects RLS). Only use the service-role client (`@/lib/supabase/admin`) in server-only code for deliberate RLS bypass, and re-check permissions in code first. Never import the admin client into anything that ships to the browser.
- **Roles are mapped.** App uses `user | manager | admin`; the DB stores `user | deptmanager | admin`. Always convert via `mapAppRoleToDb` / `mapDbRoleToApp` — never write raw role strings.
- **Departments are referenced by `code` in the app, `id` (uuid) in the DB.** Resolve codes → uuids server-side before touching `department_items` / `user_departments`.

## Conventions

- Server actions live next to their route (`actions.ts`) or in `src/lib/**/*-actions.ts`, always `"use server"`, and return a discriminated result (`{ ok: true, ... } | { ok: false, error }`) rather than throwing to the client.
- Server-only DB helpers use the `*.server.ts` suffix. Do not import them from client components.
- Client state for pending-save-history still persists to **localStorage** via `@/lib/storage/local-json`. Scan batches and the pending queue use Supabase when configured (`scan-actions.ts`, `pending-actions.ts`).
- Regenerate DB types with `npm run gen:types` after schema changes. Add schema changes as new files in `supabase/migrations/`.

## Before you finish

- `npm run lint` and a type check must pass.
- Remove any temporary debug/telemetry code. Do not add logging that posts to external/localhost endpoints.
- If you touch auth, RBAC, or RLS, re-verify all three affected roles (user, manager, admin).
