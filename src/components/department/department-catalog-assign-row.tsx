"use client";

import { memo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CatalogItem } from "@/lib/catalog/types";

type DepartmentCatalogAssignRowProps = {
  item: CatalogItem;
  assigning: boolean;
  onAssign: (item: CatalogItem) => void;
};

export const DepartmentCatalogAssignRow = memo(function DepartmentCatalogAssignRow({
  item,
  assigning,
  onAssign,
}: DepartmentCatalogAssignRowProps) {
  return (
    <tr className="border-b border-border/60 last:border-0 hover:bg-blue-light/20">
      <td className="px-4 py-3 font-medium text-blue-primary">{item.code}</td>
      <td className="px-4 py-3 text-navy-900">{item.name}</td>
      <td className="px-4 py-3 font-mono text-xs text-text-secondary">{item.barcode}</td>
      <td className="px-4 py-3 text-text-secondary">{item.unit}</td>
      <td className="px-4 py-3 tabular-nums text-text-secondary">{item.price ?? "—"}</td>
      <td className="px-4 py-3">
        <div className="flex justify-end">
          <Button
            variant="primary"
            className="!px-3 !py-1.5 text-xs"
            disabled={assigning}
            onClick={() => onAssign(item)}
          >
            <Plus className="h-3.5 w-3.5" />
            {assigning ? "กำลังเพิ่ม…" : "เพิ่ม"}
          </Button>
        </div>
      </td>
    </tr>
  );
});
