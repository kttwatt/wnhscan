/** หมวดใหญ่ 5 หมวดมาตรฐาน (ลำดับแสดงผล) */
export const CATALOG_ITEM_GROUPS = [
  "ครุภัณฑ์",
  "วัสดุ",
  "ที่ดินและสิ่งปลูกสร้าง",
  "ใช้สอย",
  "บุคคลากร",
] as const;

export type CatalogItemGroupName = (typeof CATALOG_ITEM_GROUPS)[number];

const groupOrder = new Map<string, number>(
  CATALOG_ITEM_GROUPS.map((name, index) => [name, index]),
);

export function catalogGroupSortIndex(name: string): number {
  return groupOrder.get(name) ?? CATALOG_ITEM_GROUPS.length;
}

export function sortByCatalogGroupOrder<T extends { name: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const orderDiff = catalogGroupSortIndex(a.name) - catalogGroupSortIndex(b.name);
    if (orderDiff !== 0) return orderDiff;
    return a.name.localeCompare(b.name, "th");
  });
}
