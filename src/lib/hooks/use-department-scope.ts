"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/components/auth/session-provider";
import { selectableDepartments } from "@/lib/auth/access";

/** เลือกหน่วยงานตามสิทธิ์ผู้ใช้ — ล็อกอัตโนมัติเมื่อมีแผนกเดียว */
export function useDepartmentScope() {
  const profile = useSession();
  const departments = useMemo(() => selectableDepartments(profile), [profile]);

  const [departmentId, setDepartmentId] = useState(() => departments[0] ?? "");

  useEffect(() => {
    if (departments.length === 0) return;
    if (!departments.includes(departmentId)) {
      setDepartmentId(departments[0]);
    }
  }, [departmentId, departments]);

  return {
    departmentId,
    setDepartmentId,
    departments,
    locked: departments.length <= 1,
  };
}
