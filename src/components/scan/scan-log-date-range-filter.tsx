"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarRange, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatDateRangeSummary,
  formatLogDateHeading,
  normalizeDateRange,
} from "@/lib/scan/scan-log-queries";

type ScanLogDateRangeFilterProps = {
  dateFrom: string;
  dateTo: string;
  dateOptions: string[];
  onApply: (from: string, to: string) => void;
};

export function ScanLogDateRangeFilter({
  dateFrom,
  dateTo,
  dateOptions,
  onApply,
}: ScanLogDateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(dateFrom);
  const [draftTo, setDraftTo] = useState(dateTo);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setDraftFrom(dateFrom);
    setDraftTo(dateTo);
  }, [open, dateFrom, dateTo]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function applyRange() {
    const { from, to } = normalizeDateRange(draftFrom, draftTo);
    onApply(from, to);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-white px-3 py-2.5 text-left text-sm transition-colors hover:border-blue-primary/40 hover:bg-blue-light/20"
      >
        <span className="inline-flex min-w-0 flex-1 items-center gap-2">
          <CalendarRange className="h-4 w-4 shrink-0 text-text-muted" />
          <span className="min-w-0 truncate">
            <span className="font-semibold text-navy-900">ตัวกรองวันที่</span>
            {dateFrom && dateTo ? (
              <span className="ml-2 font-normal text-text-secondary">
                {formatDateRangeSummary(dateFrom, dateTo)}
              </span>
            ) : null}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-text-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-border bg-surface-card p-4 shadow-lg sm:w-[320px] sm:left-auto">
          <p className="mb-3 text-sm font-semibold text-navy-900">ช่วงวันที่</p>
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-text-secondary">ตั้งแต่</span>
              <div className="relative">
                <select
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-border bg-white py-2 pl-3 pr-9 text-sm text-navy-900 outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20"
                >
                  {dateOptions.map((dateKey) => (
                    <option key={`from-${dateKey}`} value={dateKey}>
                      {formatLogDateHeading(dateKey)}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                  aria-hidden
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-text-secondary">ถึง</span>
              <div className="relative">
                <select
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-border bg-white py-2 pl-3 pr-9 text-sm text-navy-900 outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20"
                >
                  {dateOptions.map((dateKey) => (
                    <option key={`to-${dateKey}`} value={dateKey}>
                      {formatLogDateHeading(dateKey)}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                  aria-hidden
                />
              </div>
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              ปิด
            </Button>
            <Button variant="primary" onClick={applyRange}>
              ใช้ช่วงวันที่
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
