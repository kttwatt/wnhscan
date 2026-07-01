"use client";

import { useCallback, useEffect, useState } from "react";
import {
  assignCatalogItemAction,
  createMasterCatalogItemAction,
  deleteCatalogItemAction,
  removeCatalogItemAction,
  updateCatalogItemAction,
} from "@/lib/catalog/catalog-actions";
import { fetchMasterCatalogItems } from "@/lib/catalog/catalog-db";
import type { CatalogItem, CatalogItemInput } from "@/lib/catalog/types";

function updateItemDepartments(
  items: CatalogItem[],
  itemId: string,
  departmentCode: string,
  assigned: boolean,
): CatalogItem[] {
  return items.map((item) => {
    if (item.id !== itemId) return item;
    const next = new Set(item.departmentIds);
    if (assigned) next.add(departmentCode);
    else next.delete(departmentCode);
    return { ...item, departmentIds: [...next].sort() };
  });
}

export function useMasterCatalogItems() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMasterCatalogItems();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "โหลดรายการวัสดุไม่สำเร็จ");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createItem = useCallback(
    async (input: CatalogItemInput) => {
      const result = await createMasterCatalogItemAction(input);
      if (!result.ok) throw new Error(result.error);
      await refresh();
      return result.data;
    },
    [refresh],
  );

  const updateItem = useCallback(
    async (id: string, input: CatalogItemInput) => {
      const result = await updateCatalogItemAction(id, "", input);
      if (!result.ok) throw new Error(result.error);
      await refresh();
      return result.data;
    },
    [refresh],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const result = await deleteCatalogItemAction(id);
      if (!result.ok) throw new Error(result.error);
      await refresh();
    },
    [refresh],
  );

  const toggleDepartment = useCallback(
    async (itemId: string, departmentCode: string, assigned: boolean) => {
      const key = `${itemId}:${departmentCode}`;
      setTogglingKey(key);
      const previous = items;
      setItems((current) => updateItemDepartments(current, itemId, departmentCode, assigned));
      setError(null);

      try {
        const result = assigned
          ? await assignCatalogItemAction(itemId, departmentCode)
          : await removeCatalogItemAction(itemId, departmentCode);
        if (!result.ok) throw new Error(result.error);
      } catch (err) {
        setItems(previous);
        const message = err instanceof Error ? err.message : "ดำเนินการไม่สำเร็จ";
        setError(message);
        throw err;
      } finally {
        setTogglingKey(null);
      }
    },
    [items],
  );

  return {
    items,
    loading,
    error,
    togglingKey,
    createItem,
    updateItem,
    deleteItem,
    toggleDepartment,
    refresh,
  };
}
