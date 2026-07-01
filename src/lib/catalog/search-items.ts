import type { CatalogItem } from "@/lib/catalog/types";

/** Search items by code, name, or barcode — supports numeric and text queries */
export function searchItems(
  items: CatalogItem[],
  query: string,
): CatalogItem[] {
  const q = query.trim();
  if (!q) return [];

  const lower = q.toLowerCase();

  return items.filter(
    (item) =>
      item.code.includes(q) ||
      item.barcode.includes(q) ||
      item.name.toLowerCase().includes(lower) ||
      item.subgroup.toLowerCase().includes(lower) ||
      item.group.toLowerCase().includes(lower),
  );
}

export function formatItemGroup(item: CatalogItem): string {
  return `${item.group} › ${item.subgroup}`;
}
