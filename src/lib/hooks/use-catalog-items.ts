"use client";

import { useCallback, useEffect, useState } from "react";
import {
  assignCatalogItemAction,
  createCatalogItemAction,
  removeCatalogItemAction,
  updateCatalogItemAction,
} from "@/lib/catalog/catalog-actions";
import { fetchCatalogItemsForDepartment } from "@/lib/catalog/catalog-db";
import type { CatalogItem, CatalogItemInput } from "@/lib/catalog/types";

export function useCatalogItems(departmentId: string) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCatalogItemsForDepartment(departmentId);
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "โหลดรายการวัสดุไม่สำเร็จ");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [departmentId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runMutation = useCallback(
    async (fn: () => Promise<void>) => {
      try {
        await fn();
        await refresh();
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "ดำเนินการไม่สำเร็จ";
        setError(message);
        throw err;
      }
    },
    [refresh],
  );

  const addItem = useCallback(
    async (input: CatalogItemInput) => {
      let created: CatalogItem | null = null;
      await runMutation(async () => {
        const result = await createCatalogItemAction(departmentId, input);
        if (!result.ok) throw new Error(result.error);
        created = result.data;
      });
      if (!created) throw new Error("สร้างรายการไม่สำเร็จ");
      return created;
    },
    [departmentId, runMutation],
  );

  const updateItem = useCallback(
    async (id: string, input: CatalogItemInput) => {
      let updated: CatalogItem | null = null;
      await runMutation(async () => {
        const result = await updateCatalogItemAction(id, departmentId, input);
        if (!result.ok) throw new Error(result.error);
        updated = result.data;
      });
      if (!updated) throw new Error("บันทึกไม่สำเร็จ");
      return updated;
    },
    [departmentId, runMutation],
  );

  const removeItem = useCallback(
    async (id: string) => {
      await runMutation(async () => {
        const result = await removeCatalogItemAction(id, departmentId);
        if (!result.ok) throw new Error(result.error);
      });
    },
    [departmentId, runMutation],
  );

  const assignItem = useCallback(
    async (id: string) => {
      await runMutation(async () => {
        const result = await assignCatalogItemAction(id, departmentId);
        if (!result.ok) throw new Error(result.error);
      });
    },
    [departmentId, runMutation],
  );

  return { items, loading, error, addItem, updateItem, removeItem, assignItem, refresh };
}
