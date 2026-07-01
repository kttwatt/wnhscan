"use client";

import { ChevronDown, Lock } from "lucide-react";

type DepartmentSwitcherProps = {
  value?: string;
  departments?: string[];
  locked?: boolean;
  onChange?: (departmentId: string) => void;
};

const departmentBadgeClass =
  "inline-flex items-center gap-1.5 rounded-md bg-blue-light px-3 py-1 text-sm font-semibold text-blue-primary";

export function DepartmentSwitcher({
  value = "",
  departments = [],
  locked = false,
  onChange,
}: DepartmentSwitcherProps) {
  const units = departments;
  const isLocked = locked || units.length <= 1;

  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border bg-surface-card px-4 py-2">
      <span className="text-sm text-text-secondary">เลือกหน่วยงาน</span>
      {isLocked ? (
        <span className={departmentBadgeClass}>
          {value}
          <Lock className="h-3.5 w-3.5 shrink-0" aria-label="ล็อกหน่วยงาน" />
        </span>
      ) : (
        <div className={`relative ${departmentBadgeClass}`}>
          <select
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="appearance-none bg-transparent pr-5 outline-none focus:ring-0"
          >
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-blue-primary"
            aria-hidden
          />
        </div>
      )}
    </div>
  );
}
