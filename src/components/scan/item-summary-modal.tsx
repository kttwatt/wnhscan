"use client";

import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ItemSummaryRow = {
  code: string;
  name: string;
  group?: string;
  quantity: number;
};

type ItemSummaryModalProps = {
  open: boolean;
  title: string;
  description: string;
  successMessage: string;
  items: ItemSummaryRow[];
  onClose: () => void;
};

export function ItemSummaryList({
  items,
  successMessage,
}: {
  items: ItemSummaryRow[];
  successMessage: string;
}) {
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-green-500 bg-green-50 px-4 py-6">
        <Check className="h-10 w-10 text-green-600" />
        <span className="font-medium text-green-700">{successMessage}</span>
      </div>

      <p className="text-sm font-semibold text-navy-900">
        {items.length} รายการ · {totalQty} ชิ้น
      </p>

      <ul className="divide-y divide-border rounded-lg border border-border">
        {items.map((item) => (
          <li
            key={item.code}
            className="flex items-center justify-between gap-3 px-4 py-3 first:rounded-t-lg last:rounded-b-lg"
          >
            <div className="min-w-0">
              {item.group ? <p className="text-xs text-text-muted">{item.group}</p> : null}
              <p className="font-medium text-navy-900">
                <span className="text-blue-primary">{item.code}</span> — {item.name}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-navy-900">
              ×{item.quantity}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ItemSummaryModal({
  open,
  title,
  description,
  successMessage,
  items,
  onClose,
}: ItemSummaryModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-summary-title"
    >
      <div className="relative w-full max-w-xl rounded-xl border border-border bg-surface-card shadow-xl outline-none">
        <button
          type="button"
          onClick={onClose}
          className="btn-ghost absolute right-3 top-3 z-10"
          aria-label="ปิด"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="border-b border-border px-6 py-4 pr-14">
          <p id="item-summary-title" className="font-semibold text-navy-900">
            {title}
          </p>
          <p className="mt-0.5 text-sm text-text-secondary">{description}</p>
        </div>

        <div className="max-h-[min(60vh,420px)] overflow-y-auto px-6 py-5">
          <ItemSummaryList items={items} successMessage={successMessage} />
        </div>

        <div className="flex justify-end border-t border-border px-6 py-4">
          <Button variant="primary" onClick={onClose}>
            ปิด
          </Button>
        </div>
      </div>
    </div>
  );
}

export const SCAN_SUMMARY_COPY = {
  queue_scan: {
    title: "สรุปการปิดรอบสแกน",
    description: "ตรวจสอบรายการวัสดุและจำนวนที่ใช้ก่อนปิด",
    successMessage: "บันทึกการสแกนแล้ว",
  },
  instant_scan: {
    title: "สรุปการสแกน",
    description: "ตรวจสอบรายการวัสดุและจำนวนที่ใช้ก่อนปิด",
    successMessage: "บันทึกการสแกนแล้ว",
  },
  pending_save: {
    title: "สรุปการจดไว้ก่อน",
    description: "ตรวจสอบรายการและจำนวนก่อนปิด — ผู้จัดการสแกนได้ที่หน้า ปิดรอบสแกน",
    successMessage: "บันทึกสำเร็จ — รอสแกน",
  },
} as const;
