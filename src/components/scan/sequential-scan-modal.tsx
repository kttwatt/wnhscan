"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Minus, Plus, X } from "lucide-react";
import { Code128Barcode } from "@/components/catalog/code128-barcode";
import { ItemSummaryModal, SCAN_SUMMARY_COPY } from "@/components/scan/item-summary-modal";
import { Button } from "@/components/ui/button";
import type { ScanMode, ScanWizardItem } from "@/lib/scan/types";
import type { ScanMatchResult } from "@/lib/scan/match-scan";

type Props = {
  open: boolean;
  mode: ScanMode;
  items: ScanWizardItem[];
  index: number;
  current: ScanWizardItem | undefined;
  isVerified: boolean;
  isFirst: boolean;
  isLast: boolean;
  saving: boolean;
  showSummary: boolean;
  onClose: () => void;
  onMatchScan: (value: string) => ScanMatchResult;
  onNext: () => void;
  onPrev: () => void;
  onQuantityChange: (quantity: number) => void;
  onSave: () => void;
};

const MODE_TITLE: Record<ScanMode, string> = {
  queue_scan: "รายการรอสแกน",
  instant_scan: "สแกนทันที",
};

function ItemDetails({
  name,
  quantity,
  onQuantityChange,
}: {
  name: string;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}) {
  const [text, setText] = useState(String(quantity));

  useEffect(() => {
    setText(String(quantity));
  }, [quantity]);

  function commit() {
    const n = parseInt(text, 10);
    if (text === "" || Number.isNaN(n) || n < 1) {
      onQuantityChange(1);
      setText("1");
      return;
    }
    onQuantityChange(n);
    setText(String(n));
  }

  return (
    <div className="mt-3 flex flex-col items-center text-center">
      <p className="max-w-[280px] text-sm font-medium leading-snug text-navy-900">{name}</p>
      <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-blue-primary/25 bg-blue-light/50 px-3 py-1.5">
        <span className="text-xs font-semibold text-blue-primary">จำนวนที่ใช้</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-blue-primary/40 bg-blue-primary/10 text-blue-primary transition-colors hover:border-blue-primary hover:bg-blue-primary hover:text-white"
            aria-label="ลดจำนวน"
          >
            <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
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
            className="h-8 w-11 rounded-md border border-blue-primary/30 bg-white text-center text-lg font-bold tabular-nums text-navy-900 outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20"
            aria-label={`จำนวนที่ใช้ ${name}`}
          />
          <button
            type="button"
            onClick={() => onQuantityChange(quantity + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-blue-primary/40 bg-blue-primary/10 text-blue-primary transition-colors hover:border-blue-primary hover:bg-blue-primary hover:text-white"
            aria-label="เพิ่มจำนวน"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function SequentialScanModal({
  open,
  mode,
  items,
  index,
  current,
  isVerified,
  isFirst,
  isLast,
  saving,
  showSummary,
  onClose,
  onMatchScan,
  onNext,
  onPrev,
  onQuantityChange,
  onSave,
}: Props) {
  const bufferRef = useRef("");
  const panelRef = useRef<HTMLDivElement>(null);
  const barcodeAreaRef = useRef<HTMLDivElement>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setScanError(null);
    bufferRef.current = "";
    panelRef.current?.focus();
    requestAnimationFrame(() => {
      barcodeAreaRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }, [open, index]);

  useEffect(() => {
    if (!open) return;

    function applyScan(value: string) {
      const result = onMatchScan(value);
      if (result === "match") {
        setScanError(null);
      } else if (result === "mismatch") {
        setScanError("บาร์โค้ดไม่ตรง — ลองสแกนใหม่");
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "Enter") {
        const value = bufferRef.current;
        bufferRef.current = "";
        if (value) applyScan(value);
        e.preventDefault();
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        bufferRef.current += e.key;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      bufferRef.current = "";
    };
  }, [open, onMatchScan]);

  if (!open) return null;

  if (showSummary) {
    const copy = SCAN_SUMMARY_COPY[mode];
    return (
      <ItemSummaryModal
        open
        title={copy.title}
        description={copy.description}
        successMessage={copy.successMessage}
        items={items.map((item) => ({
          code: item.code,
          name: item.name,
          group: item.group,
          quantity: item.quantity ?? 1,
        }))}
        onClose={onClose}
      />
    );
  }

  if (!current) return null;

  const saveLabel = "บันทึกการสแกน";
  const quantity = current.quantity ?? 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-wizard-title"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-xl border border-border bg-surface-card shadow-xl outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          className="btn-ghost absolute right-3 top-3 z-10"
          aria-label="ปิด"
        >
          <X className="h-5 w-5" />
        </button>

        <div
          className={`border-b border-border px-5 py-3 pr-12 ${isVerified ? "" : "opacity-80"}`}
        >
          <p id="scan-wizard-title" className="font-semibold text-navy-900">
            {MODE_TITLE[mode]}
          </p>
          <p className="mt-0.5 text-sm text-text-secondary">
            รายการ {index + 1} / {items.length} · {current.code}
          </p>
        </div>

        <div className="flex flex-col items-center px-5 py-4">
          {isVerified ? (
            <>
              <div className="flex w-full max-w-sm flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-green-500 bg-green-50 px-4 py-6">
                <Check className="h-8 w-8 text-green-600" />
                <span className="text-sm font-medium text-green-700">สแกนตรงแล้ว</span>
              </div>
              <ItemDetails
                name={current.name}
                quantity={quantity}
                onQuantityChange={onQuantityChange}
              />
            </>
          ) : (
            <>
              <div
                ref={barcodeAreaRef}
                className={`relative z-10 flex h-36 w-full items-center justify-center rounded-lg bg-white p-1 shadow-xl ring-4 ${
                  scanError
                    ? "ring-red-400/40"
                    : "shadow-blue-primary/10 ring-blue-primary/25"
                }`}
              >
                <Code128Barcode
                  value={current.barcode}
                  variant="scan"
                  className="h-full w-full max-h-full max-w-full"
                />
              </div>
              <div className="w-full opacity-75">
                <ItemDetails
                  name={current.name}
                  quantity={quantity}
                  onQuantityChange={onQuantityChange}
                />
              </div>
              {scanError ? (
                <p className="mt-3 text-center text-sm font-medium text-red-600">{scanError}</p>
              ) : null}
            </>
          )}
        </div>

        <div
          className={`flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 ${
            isVerified ? "" : "opacity-80"
          }`}
        >
          <Button
            variant="secondary"
            onClick={isFirst ? onClose : onPrev}
            disabled={saving}
          >
            {isFirst ? "ปิด" : "ย้อนกลับ"}
          </Button>

          <div className="flex gap-2">
            {isLast ? (
              <Button variant="primary" onClick={() => onSave()} disabled={saving}>
                {saving ? "กำลังบันทึก..." : saveLabel}
              </Button>
            ) : (
              <Button variant="primary" onClick={onNext} disabled={saving}>
                ถัดไป
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
