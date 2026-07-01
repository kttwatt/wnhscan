"use client";

import { useCallback, useState } from "react";
import { playBeep } from "@/lib/scan/play-beep";
import { evaluateScanMatch, type ScanMatchResult } from "@/lib/scan/match-scan";
import { SCAN_LOG_CHANGED_EVENT } from "@/lib/scan/scan-log";
import { saveScanBatchAction } from "@/lib/scan/scan-actions";
import { sortScanItems } from "@/lib/scan/sort-scan-items";
import type { ScanMode, ScanWizardItem } from "@/lib/scan/types";
import { PENDING_CHANGED_EVENT } from "@/lib/pending/pending-store";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type StartOptions = {
  departmentId?: string;
};

export function useScanWizard() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ScanMode>("queue_scan");
  const [items, setItems] = useState<ScanWizardItem[]>([]);
  const [departmentId, setDepartmentId] = useState<string | undefined>();
  const [index, setIndex] = useState(0);
  const [verified, setVerified] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const current = items[index];
  const isFirst = index === 0;
  const isLast = items.length > 0 && index === items.length - 1;
  const isVerified = current ? verified.has(current.code) : false;
  const allVerified = items.length > 0 && items.every((item) => verified.has(item.code));

  const start = useCallback(
    (scanMode: ScanMode, rawItems: ScanWizardItem[], options?: StartOptions) => {
      const sorted = sortScanItems(rawItems);
      if (sorted.length === 0) return;
      setMode(scanMode);
      setItems(sorted);
      setDepartmentId(options?.departmentId);
      setIndex(0);
      setVerified(new Set());
      setSaving(false);
      setShowSummary(false);
      setSaveError(null);
      setOpen(true);
    },
    [],
  );

  const close = useCallback(() => {
    setOpen(false);
    setItems([]);
    setDepartmentId(undefined);
    setIndex(0);
    setVerified(new Set());
    setSaving(false);
    setShowSummary(false);
    setSaveError(null);
  }, []);

  const matchScan = useCallback(
    (scanned: string): ScanMatchResult => {
      if (!current || isVerified) return "ignored";
      const result = evaluateScanMatch(scanned, current);
      if (result === "match") {
        setVerified((prev) => new Set(prev).add(current.code));
        playBeep();
      }
      return result;
    },
    [current, isVerified],
  );

  const next = useCallback(() => {
    if (isLast) return;
    setIndex((i) => i + 1);
  }, [isLast]);

  const prev = useCallback(() => {
    if (isFirst) return;
    setIndex((i) => i - 1);
  }, [isFirst]);

  const setQuantity = useCallback((quantity: number) => {
    if (!current) return;
    const nextQty = Math.max(1, Math.floor(quantity));
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.code === current.code ? { ...item, quantity: nextQty } : item,
      ),
    );
  }, [current]);

  const save = useCallback(
    async (onSuccess?: () => void) => {
      if (saving) return;
      setSaving(true);
      setSaveError(null);
      try {
        const payload = {
          departmentCode: departmentId,
          mode,
          items: items.map((item) => ({
            code: item.code,
            name: item.name,
            barcode: item.barcode,
            quantity: item.quantity ?? 1,
            verified: verified.has(item.code),
          })),
        };

        if (isSupabaseConfigured()) {
          const result = await saveScanBatchAction(payload);
          if (!result.ok) {
            setSaveError(result.error);
            return;
          }
        }

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event(SCAN_LOG_CHANGED_EVENT));
          if (mode === "queue_scan") {
            window.dispatchEvent(new Event(PENDING_CHANGED_EVENT));
          }
        }

        setShowSummary(true);
        if (typeof onSuccess === "function") onSuccess();
      } finally {
        setSaving(false);
      }
    },
    [saving, departmentId, mode, items, verified],
  );

  return {
    open,
    mode,
    items,
    index,
    current,
    verified,
    saving,
    saveError,
    showSummary,
    isFirst,
    isLast,
    isVerified,
    allVerified,
    start,
    close,
    matchScan,
    next,
    prev,
    setQuantity,
    save,
  };
}
