"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createGroupAction,
  createSubgroupAction,
  updateGroupAction,
  updateSubgroupAction,
} from "@/lib/catalog/taxonomy-actions";
import { fetchCatalogTaxonomy } from "@/lib/catalog/taxonomy-db";
import type {
  CatalogGroupRow,
  CatalogSubgroupRow,
  GroupInput,
  SubgroupInput,
} from "@/lib/catalog/taxonomy-types";

let cachedTaxonomy: { groups: CatalogGroupRow[]; subgroups: CatalogSubgroupRow[] } | null = null;
let taxonomyLoadPromise: Promise<{ groups: CatalogGroupRow[]; subgroups: CatalogSubgroupRow[] }> | null =
  null;

function loadErrorMessage(err: unknown): string {
  if (err instanceof TypeError && err.message === "Failed to fetch") {
    return "เชื่อมต่อฐานข้อมูลไม่ได้ — ตรวจสอบเครือข่ายหรือลองรีเฟรช";
  }
  if (err instanceof Error && err.message) return err.message;
  return "โหลดหมวดวัสดุไม่สำเร็จ";
}

async function loadCatalogTaxonomy() {
  if (cachedTaxonomy) return cachedTaxonomy;

  if (!taxonomyLoadPromise) {
    taxonomyLoadPromise = fetchCatalogTaxonomy()
      .then((data) => {
        cachedTaxonomy = data;
        return data;
      })
      .catch((err) => {
        taxonomyLoadPromise = null;
        throw err;
      });
  }

  return taxonomyLoadPromise;
}

export function useCatalogTaxonomy() {
  const [groups, setGroups] = useState<CatalogGroupRow[]>([]);
  const [subgroups, setSubgroups] = useState<CatalogSubgroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadCatalogTaxonomy();
      setGroups(data.groups);
      setSubgroups(data.subgroups);
      setError(null);
    } catch (err) {
      setError(loadErrorMessage(err));
      setGroups([]);
      setSubgroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runMutation = useCallback(
    async <T,>(fn: () => Promise<{ ok: boolean; data?: T; error?: string }>) => {
      const result = await fn();
      if (!result.ok) throw new Error(result.error ?? "ดำเนินการไม่สำเร็จ");
      cachedTaxonomy = null;
      taxonomyLoadPromise = null;
      await refresh();
      return result.data as T;
    },
    [refresh],
  );

  const createGroup = useCallback(
    (input: GroupInput) => runMutation(() => createGroupAction(input)),
    [runMutation],
  );

  const updateGroup = useCallback(
    (groupId: string, input: GroupInput) => runMutation(() => updateGroupAction(groupId, input)),
    [runMutation],
  );

  const createSubgroup = useCallback(
    (input: SubgroupInput) => runMutation(() => createSubgroupAction(input)),
    [runMutation],
  );

  const updateSubgroup = useCallback(
    (subgroupId: string, input: SubgroupInput) =>
      runMutation(() => updateSubgroupAction(subgroupId, input)),
    [runMutation],
  );

  return {
    groups,
    subgroups,
    loading,
    error,
    createGroup,
    updateGroup,
    createSubgroup,
    updateSubgroup,
    refresh,
  };
}
