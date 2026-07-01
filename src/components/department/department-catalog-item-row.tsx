"use client";

import { memo } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CatalogItem } from "@/lib/catalog/types";

type DepartmentCatalogItemRowProps = {
  item: CatalogItem;
  onDelete: (item: CatalogItem) => void;
};

export const DepartmentCatalogItemRow = memo(function DepartmentCatalogItemRow({
  item,
  onDelete,
}: DepartmentCatalogItemRowProps) {
  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="px-4 py-3 font-medium text-blue-primary">{item.code}</td>
      <td className="px-4 py-3 text-navy-900">{item.name}</td>
      <td className="px-4 py-3 font-mono text-xs text-text-secondary">{item.barcode}</td>
      <td className="px-4 py-3 text-text-secondary">{item.unit}</td>
      <td className="px-4 py-3 tabular-nums text-text-secondary">{item.price ?? "—"}</td>
      <td className="px-4 py-3">
        <div className="flex justify-end">
          <Button variant="ghost" onClick={() => onDelete(item)}>
            <Trash2 className="h-4 w-4 text-red-500" /> ลบ
          </Button>
        </div>
      </td>
    </tr>
  );
});
