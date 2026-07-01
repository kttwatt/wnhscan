"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  permanentlyDeleteCatalogItemAction,
  purgeExpiredTrashAction,
  restoreCatalogItemAction,
} from "@/lib/catalog/catalog-actions";
import { fetchTrashCatalogItems } from "@/lib/catalog/catalog-db";
import { searchItems } from "@/lib/catalog/search-items";
import { sortCatalogItems } from "@/lib/catalog/sort-items";
import {
  canPermanentlyDelete,
  daysUntilPermanentDelete,
  TRASH_RETENTION_DAYS,
} from "@/lib/catalog/trash-helpers";
import type { TrashCatalogItem } from "@/lib/catalog/types";

export function useTrashCatalogItems() {
  const [items, setItems] = useState<TrashCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTrashCatalogItems();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "โหลดถังขยะไม่สำเร็จ");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const restoreItem = useCallback(
    async (id: string) => {
      try {
        const result = await restoreCatalogItemAction(id);
        if (!result.ok) throw new Error(result.error);
        setMessage("กู้คืนรายการสำเร็จ");
        setError(null);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "กู้คืนไม่สำเร็จ");
        throw err;
      }
    },
    [refresh],
  );

  const permanentlyDeleteItem = useCallback(
    async (id: string) => {
      try {
        const result = await permanentlyDeleteCatalogItemAction(id);
        if (!result.ok) throw new Error(result.error);
        setMessage("ลบถาวรสำเร็จ");
        setError(null);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "ลบถาวรไม่สำเร็จ");
        throw err;
      }
    },
    [refresh],
  );

  const purgeExpired = useCallback(async () => {
    try {
      const result = await purgeExpiredTrashAction();
      if (!result.ok) throw new Error(result.error);
      setMessage(
        result.data.count > 0
          ? `ลบถาวร ${result.data.count} รายการที่ครบ ${TRASH_RETENTION_DAYS} วันแล้ว`
          : "ไม่มีรายการที่ครบกำหนดลบถาวร",
      );
      setError(null);
      await refresh();
      return result.data.count;
    } catch (err) {
      setError(err instanceof Error ? err.message : "ลบถาวรไม่สำเร็จ");
      throw err;
    }
  }, [refresh]);

  const expiredCount = useMemo(
    () => items.filter((item) => canPermanentlyDelete(item.deletedAt)).length,
    [items],
  );

  return {
    items,
    loading,
    error,
    message,
    expiredCount,
    restoreItem,
    permanentlyDeleteItem,
    purgeExpired,
    refresh,
    clearMessage: () => setMessage(null),
  };
}

export function filterTrashItems(items: TrashCatalogItem[], query: string): TrashCatalogItem[] {
  const q = query.trim();
  if (!q) return sortCatalogItems(items) as TrashCatalogItem[];
  return searchItems(sortCatalogItems(items), q) as TrashCatalogItem[];
}

export { canPermanentlyDelete, daysUntilPermanentDelete };
