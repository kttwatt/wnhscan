"use client";

import { ChevronDown } from "lucide-react";

type DepartmentSwitcherProps = {
  value?: string;
  departments?: string[];
  locked?: boolean;
  onChange?: (departmentId: string) => void;
};

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
        <span className="rounded-md bg-blue-light px-3 py-1 text-sm font-semibold text-blue-primary">
          {value} (ล็อกหน่วยงาน)
        </span>
      ) : (
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="appearance-none rounded-md border border-border bg-white py-1.5 pl-3 pr-8 text-sm font-semibold text-navy-900 outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20"
          >
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            aria-hidden
          />
        </div>
      )}
    </div>
  );
}
