import type { CatalogItem } from "@/lib/catalog/types";
import { searchItems } from "@/lib/catalog/search-items";

export type ResolveScanInputResult =
  | { kind: "exact"; item: CatalogItem }
  | { kind: "ambiguous"; items: CatalogItem[] }
  | { kind: "none" };

export function resolveScanInput(
  items: CatalogItem[],
  query: string,
): ResolveScanInputResult {
  const q = query.trim();
  if (!q) return { kind: "none" };

  const byBarcode = items.find((item) => item.barcode === q);
  if (byBarcode) return { kind: "exact", item: byBarcode };

  const byCode = items.find((item) => item.code === q);
  if (byCode) return { kind: "exact", item: byCode };

  const results = searchItems(items, q);
  if (results.length === 1) {
    return { kind: "exact", item: results[0] };
  }

  if (results.length > 0) {
    return { kind: "ambiguous", items: results };
  }

  return { kind: "none" };
}
