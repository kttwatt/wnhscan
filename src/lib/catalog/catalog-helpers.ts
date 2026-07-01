import type { CatalogItem } from "@/lib/catalog/types";

import { CATALOG_ITEM_GROUPS } from "@/lib/catalog/catalog-groups";

export const DEFAULT_CATALOG_GROUPS = CATALOG_ITEM_GROUPS;
export const DEFAULT_CATALOG_SUBGROUPS = [
  "วัสดุการแพทย์",
  "วัสดุสำนักงาน",
  "อุปกรณ์การแพทย์",
  "เวชภัณฑ์สิ้นเปลือง",
] as const;

export function uniqueGroups(items: CatalogItem[]): string[] {
  const fromItems = items.map((item) => item.group);
  return [...new Set([...DEFAULT_CATALOG_GROUPS, ...fromItems])].sort((a, b) =>
    a.localeCompare(b, "th"),
  );
}

export function uniqueSubgroups(items: CatalogItem[], groupFilter?: string): string[] {
  const scoped = groupFilter ? items.filter((item) => item.group === groupFilter) : items;
  const fromItems = scoped.map((item) => item.subgroup);
  return [...new Set([...DEFAULT_CATALOG_SUBGROUPS, ...fromItems])].sort((a, b) =>
    a.localeCompare(b, "th"),
  );
}

export function groupCatalogItems(items: CatalogItem[]): { key: string; items: CatalogItem[] }[] {
  const map = new Map<string, CatalogItem[]>();
  for (const item of items) {
    const key = `${item.group} › ${item.subgroup}`;
    const bucket = map.get(key) ?? [];
    bucket.push(item);
    map.set(key, bucket);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "th"))
    .map(([key, groupItems]) => ({
      key,
      items: groupItems.sort((a, b) => a.code.localeCompare(b.code)),
    }));
}

/** รายการในฐานข้อมูลกลางที่ยังไม่อยู่ในหน่วยงาน (กรองฝั่ง client — หลีกเลี่ยง .not in ที่มี id จำนวนมาก) */
export function itemsNotYetInDepartment<T extends { id: string }>(
  allItems: T[],
  assignedItemIds: Iterable<string>,
): T[] {
  const assigned = new Set(assignedItemIds);
  return allItems.filter((item) => !assigned.has(item.id));
}
