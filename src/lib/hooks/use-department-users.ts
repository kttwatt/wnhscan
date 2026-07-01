"use client";

import { useEffect, useState } from "react";
import type { DbProfileRow, ProfileRow } from "@/lib/auth/database";
import { departmentCodesFromLinks, toProfileRow } from "@/lib/auth/database";
import { usersForDepartmentFromProfiles } from "@/lib/auth/profile-utils";
import { createClient } from "@/lib/supabase/client";

const departmentUuidCache = new Map<string, string>();

async function getDepartmentUuid(code: string): Promise<string | null> {
  const cached = departmentUuidCache.get(code);
  if (cached) return cached;

  const supabase = createClient();
  const { data } = await supabase
    .from("departments")
    .select("id")
    .eq("code", code)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data?.id) return null;
  departmentUuidCache.set(code, data.id);
  return data.id;
}

export function useDepartmentUsers(departmentId: string, enabled = false) {
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      const supabase = createClient();
      const deptUuid = await getDepartmentUuid(departmentId);

      if (!deptUuid) {
        if (!cancelled) {
          setUsers([]);
          setLoading(false);
        }
        return;
      }

      const { data: deptLinks } = await supabase
        .from("user_departments")
        .select(
          "user_id, profiles!inner(id, username, email, full_name, department_id, role, created_at)",
        )
        .eq("department_id", deptUuid);

      const profiles = (deptLinks ?? [])
        .map((row) => {
          const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
          return profile as DbProfileRow | undefined;
        })
        .filter((row): row is DbProfileRow => Boolean(row));

      if (profiles.length === 0) {
        if (!cancelled) {
          setUsers([]);
          setLoading(false);
        }
        return;
      }

      const userIds = profiles.map((p) => p.id);
      const { data: allLinks } = await supabase
        .from("user_departments")
        .select("user_id, departments(code)")
        .in("user_id", userIds);

      const enriched = profiles.map((row) => {
        const departmentIds = departmentCodesFromLinks(row.id, allLinks);
        return toProfileRow(row, departmentIds);
      });

      if (!cancelled) {
        setUsers(usersForDepartmentFromProfiles(enriched, departmentId));
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [departmentId, enabled]);

  const deptUsers = users.filter((user) => user.role !== "admin");

  return { users: deptUsers, loading };
}
