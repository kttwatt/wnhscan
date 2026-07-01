"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SCAN_MODE_LABELS, formatLogTime } from "@/lib/scan/scan-log-queries";
import type { ScanLogEntry } from "@/lib/scan/scan-log";

export function ScanLogBatch({ log }: { log: ScanLogEntry }) {
  const [open, setOpen] = useState(false);
  const itemCount = log.items.length;
  const totalQty = log.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="rounded-lg border border-border bg-surface-page px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-md text-left transition-colors hover:bg-blue-light/20"
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2 py-0.5">
          <span className="rounded-full bg-blue-light px-2.5 py-0.5 text-xs font-semibold text-blue-primary">
            {SCAN_MODE_LABELS[log.mode]}
          </span>
          <span className="text-sm font-medium text-navy-900">
            {itemCount} รายการ · {totalQty} ชิ้น
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-text-muted">{formatLogTime(log.savedAt)}</span>
          <ChevronDown
            className={`h-4 w-4 text-text-muted transition-transform duration-300 ease-in-out ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </div>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <ul className="divide-y divide-border/60 border-t border-border/60 pt-2">
            {log.items.map((item) => (
              <li
                key={`${log.id}-${item.code}`}
                className="flex items-center justify-between gap-3 py-2 first:pt-2 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-medium text-navy-900">
                    {item.code} — {item.name}
                  </p>
                  <p className="text-xs text-text-muted">บาร์โค้ด {item.barcode}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-navy-900">
                  ×{item.quantity}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
