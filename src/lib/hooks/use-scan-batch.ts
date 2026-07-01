"use client";

import { useCallback, useMemo, useState } from "react";
import type { ScanWizardItem } from "@/lib/scan/types";

export function useScanBatch() {
  const [items, setItems] = useState<ScanWizardItem[]>([]);

  const add = useCallback((item: ScanWizardItem) => {
    setItems((prev) => {
      const existing = prev.find((row) => row.code === item.code);
      if (existing) {
        return prev.map((row) =>
          row.code === item.code
            ? { ...row, quantity: (row.quantity ?? 1) + 1 }
            : row,
        );
      }
      return [...prev, { ...item, quantity: item.quantity ?? 1 }];
    });
  }, []);

  const remove = useCallback((code: string) => {
    setItems((prev) => prev.filter((row) => row.code !== code));
  }, []);

  const increment = useCallback((code: string) => {
    setItems((prev) =>
      prev.map((row) =>
        row.code === code ? { ...row, quantity: (row.quantity ?? 1) + 1 } : row,
      ),
    );
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const pruneMissing = useCallback((validCodes: Iterable<string>) => {
    const codes = new Set(validCodes);
    setItems((prev) => prev.filter((row) => codes.has(row.code)));
  }, []);

  const totalQty = useMemo(
    () => items.reduce((sum, row) => sum + (row.quantity ?? 1), 0),
    [items],
  );

  return {
    items,
    count: items.length,
    totalQty,
    add,
    remove,
    increment,
    clear,
    pruneMissing,
  };
}
