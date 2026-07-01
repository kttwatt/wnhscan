-- NOTE: Remote project (WNHScan) was bootstrapped via migrations 001–012 on Supabase.
-- This file documents the profiles shape expected by the webapp (src/lib/auth/database.ts).
-- For a full local reset, pull schema from the linked Supabase project.

-- Expected columns (already on remote):
--   id uuid PK → auth.users
--   username text unique
--   email text
--   full_name text nullable
--   department_id uuid nullable → departments (legacy; app uses user_departments)
--   role text check (admin | deptmanager | user)
--   created_at timestamptz

-- App role mapping: manager ↔ deptmanager in DB (see mapAppRoleToDb / mapDbRoleToApp).
