"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, ChevronDown, Plus, Trash2 } from "lucide-react";
import { PendingStaleIcon } from "@/components/queue/pending-stale-icon";
import { Button } from "@/components/ui/button";
import type { CartSaveItem } from "@/lib/pending/pending-store";
import type { PendingSaveBatch } from "@/lib/pending/pending-save-history";
import { formatBatchSavedAt } from "@/lib/scan/scan-log-queries";

export type PendingItemEditHandlers = {
  onUpdateQuantity: (code: string, quantity: number) => void;
  onRemoveItem: (code: string) => void;
};

const qtyInputClassName =
  "h-8 w-12 rounded-md border border-border bg-blue-light/60 px-1 text-center text-sm font-semibold tabular-nums text-navy-900 outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20";

function PendingQuantityInput({
  code,
  quantity,
  name,
  onSetQuantity,
}: {
  code: string;
  quantity: number;
  name: string;
  onSetQuantity: (code: string, quantity: number) => void;
}) {
  const [text, setText] = useState(String(quantity));

  useEffect(() => {
    setText(String(quantity));
  }, [quantity]);

  function commit() {
    const n = parseInt(text, 10);
    if (text === "" || Number.isNaN(n) || n < 1) {
      onSetQuantity(code, 1);
      setText("1");
      return;
    }
    onSetQuantity(code, n);
    setText(String(n));
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={text}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "" || /^\d+$/.test(v)) setText(v);
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      onClick={(e) => e.stopPropagation()}
      className={qtyInputClassName}
      aria-label={`จำนวน ${name}`}
    />
  );
}

function PendingItemQuantityControls({
  item,
  edit,
}: {
  item: CartSaveItem;
  edit: PendingItemEditHandlers;
}) {
  return (
    <div
      className="flex shrink-0 items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      <PendingQuantityInput
        code={item.code}
        quantity={item.quantity}
        name={item.name}
        onSetQuantity={edit.onUpdateQuantity}
      />
      <button
        type="button"
        onClick={() => edit.onUpdateQuantity(item.code, item.quantity + 1)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-card text-navy-900 transition-colors hover:border-blue-primary/30 hover:bg-blue-light"
        aria-label={`เพิ่มจำนวน ${item.name}`}
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => edit.onRemoveItem(item.code)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
        aria-label={`ลบ ${item.name} ออกจากคิว`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

type PendingSaveBatchCardProps = {
  batch: PendingSaveBatch;
  pendingCodes: Set<string>;
  edit?: PendingItemEditHandlers;
};

export function PendingSaveBatchCard({ batch, pendingCodes, edit }: PendingSaveBatchCardProps) {
  const [open, setOpen] = useState(false);
  const itemCount = batch.items.length;
  const totalQty = batch.items.reduce((sum, item) => sum + item.quantity, 0);
  const allPending = batch.items.every((item) => pendingCodes.has(item.code));

  return (
    <PendingSaveBatchShell
      batch={batch}
      open={open}
      onToggleOpen={() => setOpen((v) => !v)}
      badge={
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            allPending ? "bg-yellow-light text-navy-900" : "bg-blue-light text-blue-primary"
          }`}
        >
          {allPending ? "จดไว้ก่อน" : "บางรายการสแกนแล้ว"}
        </span>
      }
      summary={`${itemCount} รายการ · ${totalQty} ชิ้น`}
      renderItem={(item) => {
        const stillPending = pendingCodes.has(item.code);
        return (
          <>
            <div className="min-w-0">
              <p className="font-medium text-navy-900">
                {item.code} — {item.name}
              </p>
              <p className="text-xs text-text-muted">บาร์โค้ด {item.barcode}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {stillPending && edit ? (
                <PendingItemQuantityControls item={item} edit={edit} />
              ) : (
                <span className="text-sm font-semibold tabular-nums text-navy-900">
                  ×{item.quantity}
                </span>
              )}
              {stillPending ? (
                <PendingStaleIcon pendingSince={batch.savedAt} />
              ) : (
                <span className="rounded-full bg-blue-light px-2 py-0.5 text-xs font-semibold text-blue-primary">
                  สแกนแล้ว
                </span>
              )}
            </div>
          </>
        );
      }}
    />
  );
}

type PendingQueueBatchCardProps = {
  batch: PendingSaveBatch;
  open: boolean;
  onToggleOpen: () => void;
  onStartScan: () => void;
  showStartScan?: boolean;
  edit?: PendingItemEditHandlers;
};

export function PendingQueueBatchCard({
  batch,
  open,
  onToggleOpen,
  onStartScan,
  showStartScan = true,
  edit,
}: PendingQueueBatchCardProps) {
  const itemCount = batch.items.length;
  const totalQty = batch.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <PendingSaveBatchShell
      batch={batch}
      open={open}
      onToggleOpen={onToggleOpen}
      badge={
        <span className="rounded-full bg-yellow-light px-2.5 py-0.5 text-xs font-semibold text-navy-900">
          จดไว้ก่อน
        </span>
      }
      summary={`${itemCount} รายการ · ${totalQty} ชิ้น`}
      headerAction={
        showStartScan ? (
          <Button
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              onStartScan();
            }}
          >
            เริ่มสแกน
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : null
      }
      renderItem={(item) => (
        <>
          <div className="min-w-0">
            <p className="text-xs text-text-muted">{item.group}</p>
            <p className="font-medium text-navy-900">
              <span className="text-blue-primary">{item.code}</span> — {item.name}
            </p>
            <p className="text-xs text-text-muted">บาร์โค้ด {item.barcode}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {edit ? (
              <PendingItemQuantityControls item={item} edit={edit} />
            ) : (
              <span className="text-sm font-semibold tabular-nums text-navy-900">
                ×{item.quantity}
              </span>
            )}
            <PendingStaleIcon pendingSince={batch.savedAt} />
          </div>
        </>
      )}
    />
  );
}

function PendingSaveBatchShell({
  batch,
  open,
  onToggleOpen,
  badge,
  summary,
  renderItem,
  headerAction,
}: {
  batch: PendingSaveBatch;
  open: boolean;
  onToggleOpen: () => void;
  badge: ReactNode;
  summary: string;
  renderItem: (item: CartSaveItem) => ReactNode;
  headerAction?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-page px-4 py-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleOpen}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-md text-left transition-colors hover:bg-blue-light/20"
        >
          <div className="flex min-w-0 flex-wrap items-center gap-2 py-0.5">
            {badge}
            <span className="text-sm font-medium text-navy-900">{summary}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-text-muted">{formatBatchSavedAt(batch.savedAt)}</span>
            <ChevronDown
              className={`h-4 w-4 text-text-muted transition-transform duration-300 ease-in-out ${
                open ? "rotate-180" : ""
              }`}
              aria-hidden
            />
          </div>
        </button>
        {headerAction}
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <ul className="divide-y divide-border/60 border-t border-border/60 pt-2">
            {batch.items.map((item) => (
              <li
                key={`${batch.id}-${item.code}`}
                className="flex items-center justify-between gap-3 py-2 first:pt-2 last:pb-0"
              >
                {renderItem(item)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
