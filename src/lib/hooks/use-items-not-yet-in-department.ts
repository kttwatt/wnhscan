"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { itemsNotYetInDepartment } from "@/lib/catalog/catalog-helpers";
import { fetchAllActiveCatalogItems } from "@/lib/catalog/catalog-db";
import type { CatalogItem } from "@/lib/catalog/types";

function loadErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return "โหลดรายการไม่สำเร็จ";
}

/** โหลดรายการจากฐานข้อมูลกลางที่ยังไม่ได้เพิ่มเข้าหน่วยงาน */
export function useItemsNotYetInDepartment(assignedItemIds: string[], enabled: boolean) {
  const [masterItems, setMasterItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllActiveCatalogItems();
      setMasterItems(data);
      setError(null);
    } catch (err) {
      setMasterItems([]);
      setError(loadErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  const items = useMemo(
    () => itemsNotYetInDepartment(masterItems, assignedItemIds),
    [masterItems, assignedItemIds],
  );

  return { items, loading, error, refresh };
}
