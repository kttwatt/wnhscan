"use client";

import { useMemo, useState } from "react";
import { CloseRoundBanner } from "@/components/dashboard/close-round-banner";
import { ScanVolumeStatsGrid } from "@/components/dashboard/scan-volume-stats";
import { CloseRoundFlowDiagram } from "@/components/close-round/close-round-flow-diagram";
import { PendingQueueModal } from "@/components/department/pending-queue-modal";
import { ScanLogModal } from "@/components/department/scan-log-modal";
import { PageHeader } from "@/components/layout/page-header";
import { DepartmentSwitcher } from "@/components/layout/department-switcher";
import { useDepartmentScope } from "@/lib/hooks/use-department-scope";
import { usePendingQueue } from "@/lib/hooks/use-pending-queue";
import { useScanVolumeStats } from "@/lib/hooks/use-scan-volume-stats";
import type { ScanVolumeStatKey } from "@/lib/scan/scan-log-queries";

export function CloseRoundPageClient() {
  const { departmentId, setDepartmentId, departments, locked } = useDepartmentScope();
  const [pendingModalOpen, setPendingModalOpen] = useState(false);
  const [scanLogModalOpen, setScanLogModalOpen] = useState(false);
  const [selectedStatKey, setSelectedStatKey] = useState<ScanVolumeStatKey | null>(null);
  const pending = usePendingQueue(departmentId);
  const volumeStats = useScanVolumeStats(departmentId);

  const pendingItems = pending.items;
  const pendingTotalQty = useMemo(
    () => pendingItems.reduce((sum, row) => sum + row.quantity, 0),
    [pendingItems],
  );

  const pendingEdit = useMemo(
    () => ({
      onUpdateQuantity: pending.updateQuantity,
      onRemoveItem: pending.removeItem,
    }),
    [pending.updateQuantity, pending.removeItem],
  );

  function openScanLog(key: ScanVolumeStatKey) {
    setSelectedStatKey(key);
    setScanLogModalOpen(true);
  }

  function removeCompleted(codes: string[]) {
    pending.removeCompleted(codes);
  }

  return (
    <>
      <PageHeader
        title="ปิดรอบสแกน"
        description="ดูคิวจดไว้ก่อนและบันทึกสแกนเข้าระบบ"
        action={
          <div className="flex flex-wrap items-center gap-3">
            <DepartmentSwitcher
              value={departmentId}
              departments={departments}
              locked={locked}
              onChange={setDepartmentId}
            />
          </div>
        }
      />

      <div className="flex flex-1 flex-col gap-6 p-8">
        {pendingTotalQty > 0 ? (
          <CloseRoundBanner
            departmentId={departmentId}
            pendingQty={pendingTotalQty}
            showCloseRoundAction
            onAction={() => {
              pending.refresh();
              setPendingModalOpen(true);
            }}
          />
        ) : null}

        <div className="card-whitespace space-y-8">
          <ScanVolumeStatsGrid
            stats={volumeStats}
            selectedKey={scanLogModalOpen ? selectedStatKey : null}
            onSelect={openScanLog}
            layout="strip"
            pendingQty={pendingTotalQty}
          />

          <CloseRoundFlowDiagram
            pendingTotalQty={pendingTotalQty}
            weekScannedCount={volumeStats.week}
            pendingModalOpen={pendingModalOpen}
            scanLogModalOpen={scanLogModalOpen && selectedStatKey === "week"}
            onOpenPending={() => {
              pending.refresh();
              setPendingModalOpen(true);
            }}
            onOpenScanLog={() => openScanLog("week")}
          />
        </div>
      </div>

      {pendingModalOpen ? (
        <PendingQueueModal
          open
          onClose={() => setPendingModalOpen(false)}
          departmentId={departmentId}
          items={pendingItems}
          onRemoveCompleted={removeCompleted}
          edit={pendingEdit}
        />
      ) : null}

      {scanLogModalOpen ? (
        <ScanLogModal
          open
          onClose={() => {
            setScanLogModalOpen(false);
            setSelectedStatKey(null);
          }}
          departmentId={departmentId}
          initialStatKey={selectedStatKey}
        />
      ) : null}
    </>
  );
}
