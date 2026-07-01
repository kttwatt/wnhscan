"use client";

import { ArrowRight, PackageOpen, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScanWizardItem } from "@/lib/scan/types";

type ScanBatchStripProps = {
  items: ScanWizardItem[];
  totalQty: number;
  onRemove: (code: string) => void;
  onIncrement: (code: string) => void;
  onStart: () => void;
  disabled?: boolean;
};

export function ScanBatchStrip({
  items,
  totalQty,
  onRemove,
  onIncrement,
  onStart,
  disabled = false,
}: ScanBatchStripProps) {
  const canStart = items.length > 0 && !disabled;

  return (
    <div className="mt-6 border-t border-border pt-5">
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-blue-light/20 px-6 py-10 text-center">
          <PackageOpen className="mx-auto h-8 w-8 text-text-muted" />
          <p className="mt-3 font-medium text-navy-900">ยังไม่มีรายการ</p>
          <p className="mt-1 text-sm text-text-secondary">สแกนหรือค้นหาเพื่อเพิ่ม</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-navy-900">
              รายการรอสแกน · {items.length} รายการ ({totalQty} ชิ้น)
            </p>
            <Button variant="primary" disabled={!canStart} onClick={onStart}>
              เริ่มสแกน ({items.length})
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <ul className="divide-y divide-border rounded-xl border border-border">
            {items.map((item) => (
              <li
                key={item.code}
                className="flex items-center gap-3 px-4 py-3 first:rounded-t-xl last:rounded-b-xl"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-text-muted">{item.group}</p>
                  <p className="font-semibold text-navy-900">
                    <span className="text-blue-primary">{item.code}</span> — {item.name}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="rounded-full bg-blue-light px-3 py-1 text-xs font-semibold text-blue-primary">
                    ×{item.quantity ?? 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => onIncrement(item.code)}
                    disabled={disabled}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-card text-navy-900 transition-colors hover:border-blue-primary/30 hover:bg-blue-light disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`เพิ่มจำนวน ${item.name}`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(item.code)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                  aria-label={`ลบ ${item.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
