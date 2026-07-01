import { CATALOG_ITEM_GROUPS } from "@/lib/catalog/catalog-groups";
import type { CatalogItem } from "@/lib/catalog/types";

export type TaxonomyFilterSubgroup = {
  name: string;
  count: number;
};

export type TaxonomyFilterGroup = {
  name: string;
  count: number;
  subgroups: TaxonomyFilterSubgroup[];
};

export type TaxonomySubgroupRef = {
  name: string;
  groupName: string;
};

function countItemsByGroupAndSubgroup(items: CatalogItem[]) {
  const byGroup = new Map<string, number>();
  const bySubgroup = new Map<string, number>();

  for (const item of items) {
    byGroup.set(item.group, (byGroup.get(item.group) ?? 0) + 1);
    bySubgroup.set(item.subgroup, (bySubgroup.get(item.subgroup) ?? 0) + 1);
  }

  return { byGroup, bySubgroup };
}

/** โครงหมวด 5 หมวดคงที่ + หมวดย่อยจากฐานข้อมูล + จำนวนรายการในหน่วยงาน */
export function buildTaxonomyFilterFromTaxonomy(
  subgroups: TaxonomySubgroupRef[],
  items: CatalogItem[],
): TaxonomyFilterGroup[] {
  const { byGroup, bySubgroup } = countItemsByGroupAndSubgroup(items);

  const subgroupsByGroup = new Map<string, TaxonomySubgroupRef[]>();
  for (const sg of subgroups) {
    const list = subgroupsByGroup.get(sg.groupName) ?? [];
    list.push(sg);
    subgroupsByGroup.set(sg.groupName, list);
  }

  return CATALOG_ITEM_GROUPS.map((groupName) => {
    const groupSubgroups = subgroupsByGroup.get(groupName) ?? [];
    const subgroupRows = groupSubgroups.map((sg) => ({
      name: sg.name,
      count: bySubgroup.get(sg.name) ?? 0,
    }));

    return {
      name: groupName,
      count: byGroup.get(groupName) ?? 0,
      subgroups: subgroupRows,
    };
  });
}

/** สร้างโครงหมวดจากรายการวัสดุเท่านั้น (fallback เมื่อยังไม่มี taxonomy) */
export function buildTaxonomyFilterFromItems(items: CatalogItem[]): TaxonomyFilterGroup[] {
  const { byGroup, bySubgroup } = countItemsByGroupAndSubgroup(items);
  const itemSubgroupsByGroup = new Map<string, Map<string, number>>();

  for (const item of items) {
    const subgroupMap = itemSubgroupsByGroup.get(item.group) ?? new Map<string, number>();
    subgroupMap.set(item.subgroup, (subgroupMap.get(item.subgroup) ?? 0) + 1);
    itemSubgroupsByGroup.set(item.group, subgroupMap);
  }

  return CATALOG_ITEM_GROUPS.map((groupName) => {
    const subgroupMap = itemSubgroupsByGroup.get(groupName) ?? new Map<string, number>();
    const subgroupRows = [...subgroupMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b, "th"))
      .map(([name, count]) => ({ name, count }));

    return {
      name: groupName,
      count: byGroup.get(groupName) ?? 0,
      subgroups: subgroupRows,
    };
  });
}

export function defaultCatalogGroupFilter(groups: TaxonomyFilterGroup[]): string {
  const withItems = groups.find((g) => g.count > 0);
  return withItems?.name ?? CATALOG_ITEM_GROUPS[0];
}
