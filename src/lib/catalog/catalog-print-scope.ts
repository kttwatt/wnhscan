import { sortCatalogItems } from "@/lib/catalog/sort-items";
import type { CatalogItem } from "@/lib/catalog/types";

export type CatalogPrintScope =
  | { type: "all" }
  | { type: "group"; group: string }
  | { type: "subgroup"; group: string; subgroup: string };

export function filterItemsForPrintScope(
  items: CatalogItem[],
  scope: CatalogPrintScope,
): CatalogItem[] {
  let result = sortCatalogItems(items);
  if (scope.type === "group") {
    result = result.filter((item) => item.group === scope.group);
  } else if (scope.type === "subgroup") {
    result = result.filter(
      (item) => item.group === scope.group && item.subgroup === scope.subgroup,
    );
  }
  return result;
}

export function catalogPrintScopeLabel(scope: CatalogPrintScope): string {
  if (scope.type === "all") return "พิมพ์ทั้งหมด";
  if (scope.type === "group") return `หมวด · ${scope.group}`;
  return `หมวดย่อย · ${scope.subgroup}`;
}
