"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  type DepartmentRow,
  departmentLabelByCode,
  formatDepartmentDisplay,
} from "@/lib/auth/departments-db";

const EMPTY_DEPARTMENT_SELECTION: string[] = [];

export function DepartmentMultiSelect({
  name,
  departments,
  defaultSelected = EMPTY_DEPARTMENT_SELECTION,
  hideLabel = false,
}: {
  name: string;
  departments: DepartmentRow[];
  defaultSelected?: string[];
  hideLabel?: boolean;
}) {
  const [selected, setSelected] = useState(() => [...defaultSelected]);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function toggle(code: string) {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code],
    );
  }

  const triggerLabel =
    selected.length === 0
      ? "เลือกหน่วยงาน"
      : selected.map((code) => departmentLabelByCode(departments, code)).join(", ");

  return (
    <div ref={rootRef} className="relative">
      {hideLabel ? null : (
        <p className="mb-1.5 text-sm font-medium text-navy-900">หน่วยงาน</p>
      )}
      {selected.map((code) => (
        <input key={code} type="hidden" name={name} value={code} />
      ))}
      {departments.length === 0 ? (
        <p className="text-sm text-text-secondary">ไม่พบหน่วยงานในระบบ</p>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-haspopup="listbox"
            className="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-border bg-white px-3 py-2.5 text-left text-sm outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/15"
          >
            <span
              className={`min-w-0 truncate ${selected.length === 0 ? "text-text-secondary" : "text-navy-900"}`}
            >
              {triggerLabel}
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
          {open ? (
            <div
              role="listbox"
              aria-multiselectable
              className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-white py-1 shadow-lg"
            >
              {departments.map((dept) => {
                const checked = selected.includes(dept.code);
                return (
                  <button
                    key={dept.id}
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => toggle(dept.code)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-page ${
                      checked ? "bg-blue-light/30 text-navy-900" : "text-navy-900"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        checked ? "border-blue-primary bg-blue-primary text-white" : "border-border"
                      }`}
                      aria-hidden
                    >
                      {checked ? "✓" : ""}
                    </span>
                    {formatDepartmentDisplay(dept)}
                  </button>
                );
              })}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
