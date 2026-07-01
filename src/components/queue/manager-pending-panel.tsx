"use client";

import { ArrowRight } from "lucide-react";
import { Code128Barcode } from "@/components/catalog/code128-barcode";
import { PendingStaleIcon } from "@/components/queue/pending-stale-icon";
import { Button } from "@/components/ui/button";
import type { PendingQueueItem } from "@/lib/pending/pending-store";

type ManagerPendingPanelProps = {
  items: PendingQueueItem[];
  selectedCount: number;
  isSelected: (code: string) => boolean;
  onToggleSelect: (code: string) => void;
  allSelected: boolean;
  onToggleSelectAll: () => void;
  onStartScan: () => void;
  canStartScan: boolean;
};

export function ManagerPendingPanel({
  items,
  selectedCount,
  isSelected,
  onToggleSelect,
  allSelected,
  onToggleSelectAll,
  onStartScan,
  canStartScan,
}: ManagerPendingPanelProps) {
  return (
    <div className="card-whitespace">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy-900">คิวจดไว้ก่อนในระบบ</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {items.length} รายการจดไว้ก่อน — เลือกแล้วเริ่มสแกน
          </p>
        </div>
        <Button variant="primary" disabled={!canStartScan} onClick={onStartScan}>
          เริ่มสแกน {selectedCount > 0 ? `(${selectedCount})` : ""}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="mt-6 py-8 text-center text-sm text-text-secondary">
          ไม่มีรายการจดไว้ก่อนในหน่วยงานนี้
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={onToggleSelectAll}>
              {allSelected ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
            </Button>
            {selectedCount > 0 ? (
              <span className="rounded-full bg-blue-light px-3 py-1 text-xs font-semibold text-blue-primary">
                เลือกแล้ว {selectedCount} รายการ
              </span>
            ) : (
              <span className="text-xs text-text-secondary">เลือกรายการที่ต้องการสแกน</span>
            )}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary">
                  <th className="w-10 pb-3" />
                  <th className="pb-3 font-medium">รหัส / ชื่อ</th>
                  <th className="pb-3 font-medium">บาร์โค้ด</th>
                  <th className="pb-3 text-center font-medium">จำนวน</th>
                  <th className="pb-3 font-medium">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => {
                  const selected = isSelected(item.code);
                  return (
                    <tr
                      key={item.code}
                      className={`cursor-pointer transition-colors hover:bg-blue-light/25 ${
                        selected ? "bg-blue-light/50 ring-1 ring-inset ring-blue-primary/20" : ""
                      }`}
                      onClick={() => onToggleSelect(item.code)}
                    >
                      <td className="py-3.5 pr-2">
                        <input
                          type="checkbox"
                          checked={selected}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => onToggleSelect(item.code)}
                          className="h-4 w-4 rounded border-border text-blue-primary focus:ring-blue-primary"
                          aria-label={`เลือก ${item.name}`}
                        />
                      </td>
                      <td className="py-3.5 pr-4 font-medium text-navy-900">
                        <p className="text-xs text-text-muted">{item.group}</p>
                        <span className="text-blue-primary">{item.code}</span> — {item.name}
                      </td>
                      <td className="py-3.5 pr-4">
                        <Code128Barcode value={item.barcode} variant="mini" />
                      </td>
                      <td className="py-3.5 text-center font-semibold tabular-nums text-navy-900">
                        {item.quantity}
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-yellow-light px-2 py-0.5 text-xs font-semibold text-navy-900">
                            จดไว้ก่อน
                          </span>
                          <PendingStaleIcon pendingSince={item.pendingSince} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
