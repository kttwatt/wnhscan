import type { CatalogItem } from "@/lib/catalog/types";

export function sortCatalogItems(items: CatalogItem[]): CatalogItem[] {
  return [...items].sort((a, b) => {
    const byGroup = a.group.localeCompare(b.group, "th");
    if (byGroup !== 0) return byGroup;
    const bySubgroup = a.subgroup.localeCompare(b.subgroup, "th");
    if (bySubgroup !== 0) return bySubgroup;
    return a.code.localeCompare(b.code);
  });
}
