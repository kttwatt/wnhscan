"use client";

import { useCallback, useMemo, useState } from "react";

export function useQueueSelection(initialCodes: string[] = []) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialCodes));

  const toggle = useCallback((code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }, []);

  const selectAll = useCallback((codes: string[]) => {
    setSelected(new Set(codes));
  }, []);

  const deselectAll = useCallback(() => {
    setSelected((prev) => (prev.size === 0 ? prev : new Set()));
  }, []);

  const isSelected = useCallback((code: string) => selected.has(code), [selected]);

  const pruneMissing = useCallback((validCodes: string[]) => {
    const valid = new Set(validCodes);
    setSelected((prev) => {
      const next = new Set([...prev].filter((code) => valid.has(code)));
      return next.size === prev.size ? prev : next;
    });
  }, []);

  const selectionState = useCallback(
    (codes: string[]) => {
      if (codes.length === 0) return { all: false, indeterminate: false };
      const selectedCount = codes.filter((code) => selected.has(code)).length;
      return {
        all: selectedCount === codes.length,
        indeterminate: selectedCount > 0 && selectedCount < codes.length,
      };
    },
    [selected],
  );

  const selectedCount = selected.size;

  const totalSelectedQuantity = useCallback(
    (rows: { code: string; quantity: number }[]) =>
      rows.reduce((sum, row) => (selected.has(row.code) ? sum + row.quantity : sum), 0),
    [selected],
  );

  return useMemo(
    () => ({
      selected,
      setSelected,
      selectedCount,
      toggle,
      selectAll,
      deselectAll,
      isSelected,
      pruneMissing,
      selectionState,
      totalSelectedQuantity,
    }),
    [
      selected,
      selectedCount,
      toggle,
      selectAll,
      deselectAll,
      isSelected,
      pruneMissing,
      selectionState,
      totalSelectedQuantity,
    ],
  );
}
