"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchCatalogSubgroups } from "@/lib/catalog/catalog-db";
import type { CatalogSubgroupOption } from "@/lib/catalog/types";

let cachedSubgroups: CatalogSubgroupOption[] | null = null;
let loadPromise: Promise<CatalogSubgroupOption[]> | null = null;

function loadErrorMessage(err: unknown): string {
  if (err instanceof TypeError && err.message === "Failed to fetch") {
    return "เชื่อมต่อฐานข้อมูลไม่ได้ — ตรวจสอบเครือข่ายหรือลองรีเฟรช";
  }
  if (err instanceof Error && err.message) return err.message;
  return "โหลดหมวดย่อยไม่สำเร็จ";
}

async function loadCatalogSubgroups(): Promise<CatalogSubgroupOption[]> {
  if (cachedSubgroups) return cachedSubgroups;

  if (!loadPromise) {
    loadPromise = fetchCatalogSubgroups()
      .then((data) => {
        cachedSubgroups = data;
        return data;
      })
      .catch((err) => {
        loadPromise = null;
        throw err;
      });
  }

  return loadPromise;
}

/** โหลดหมวดย่อยจากฐานข้อมูล (query เบา — ไม่ดึง items ทั้งหมด) */
export function useCatalogSubgroups() {
  const [subgroups, setSubgroups] = useState<CatalogSubgroupOption[]>(cachedSubgroups ?? []);
  const [loading, setLoading] = useState(cachedSubgroups === null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    cachedSubgroups = null;
    loadPromise = null;
    setLoading(true);
    try {
      const data = await loadCatalogSubgroups();
      setSubgroups(data);
      setError(null);
    } catch (err) {
      setSubgroups([]);
      setError(loadErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cachedSubgroups) {
      setSubgroups(cachedSubgroups);
      setLoading(false);
      return;
    }
    void refresh();
  }, [refresh]);

  return { subgroups, loading, error, refresh };
}
