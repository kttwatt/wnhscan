# Login and Role-Based Access — Design Spec

**Date:** 2026-06-25  
**Status:** Implemented

## Summary

WHN-Scan uses **Supabase Auth** with a `profiles` table for `role` and `department_ids`. Admin-provisioned accounts only (no public signup). Existing `access.ts` RBAC helpers and page guards are unchanged; session comes from server-loaded profile.

## Roles

| Role | Thai label | Access |
|------|------------|--------|
| `user` | ผู้ใช้งาน | Home, scan, queue |
| `manager` | ผู้จัดการแผนก | + close-round, department (own depts) |
| `admin` | ผู้ดูแลระบบ | + admin hub, catalog master, all depts, user CRUD |

## Key files

- `supabase/migrations/20260625000000_profiles.sql` — schema + RLS
- `middleware.ts` — auth gate
- `src/app/login/page.tsx` — login UI
- `src/lib/auth/get-profile.ts` — server profile loader
- `src/app/(dashboard)/admin/users/` — user management

## Bootstrap first admin

1. Create user in Supabase Auth dashboard
2. Run migration
3. Insert profile: `insert into profiles (id, email, role) values ('<uuid>', 'admin@hospital.local', 'admin');`

## Environment

Copy `.env.local.example` to `.env.local` and set Supabase URL, anon key, and service role key.
