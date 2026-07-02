"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useSession } from "@/components/auth/session-provider";
import { CloseRoundBanner } from "@/components/dashboard/close-round-banner";
import { ScanFlowHero } from "@/components/dashboard/scan-flow-hero";
import { ScanVolumeStatsGrid } from "@/components/dashboard/scan-volume-stats";
import { ScanLogModal } from "@/components/department/scan-log-modal";
import { PageHeader } from "@/components/layout/page-header";
import { DepartmentSwitcher } from "@/components/layout/department-switcher";
import { canAccessCloseRound } from "@/lib/auth/access";
import { useDepartmentScope } from "@/lib/hooks/use-department-scope";
import { usePendingQueue } from "@/lib/hooks/use-pending-queue";
import { useScanVolumeStats } from "@/lib/hooks/use-scan-volume-stats";
import { countPendingByMinDays } from "@/lib/pending/pending-stale";
import type { ScanVolumeStatKey } from "@/lib/scan/scan-log-queries";

export default function HomePage() {
  const profile = useSession();
  const { departmentId, setDepartmentId, departments, locked } = useDepartmentScope();
  const [scanLogModalOpen, setScanLogModalOpen] = useState(false);
  const [selectedStatKey, setSelectedStatKey] = useState<ScanVolumeStatKey | null>(null);

  const pending = usePendingQueue(departmentId);
  const pendingItems = pending.items;
  const volumeStats = useScanVolumeStats(departmentId);

  const pendingTotalQty = useMemo(
    () => pendingItems.reduce((sum, row) => sum + row.quantity, 0),
    [pendingItems],
  );
  const overdueSevenDays = useMemo(
    () => countPendingByMinDays(pendingItems, 7),
    [pendingItems],
  );

  const showPendingBanner = pendingTotalQty > 0;
  const canCloseRound = canAccessCloseRound(profile);

  function openScanLog(key: ScanVolumeStatKey) {
    setSelectedStatKey(key);
    setScanLogModalOpen(true);
  }

  return (
    <>
      <PageHeader
        title="หน้าหลัก"
        description="ภาพรวมแผนก"
        action={
          <DepartmentSwitcher
            value={departmentId}
            departments={departments}
            locked={locked}
            onChange={setDepartmentId}
          />
        }
      />

      <div className="flex flex-1 flex-col gap-6 p-8">
        <ScanFlowHero departmentId={departmentId} />

        <ScanVolumeStatsGrid
          stats={volumeStats}
          selectedKey={scanLogModalOpen ? selectedStatKey : null}
          onSelect={openScanLog}
          pendingQty={canCloseRound ? pendingTotalQty : undefined}
        />

        {showPendingBanner ? (
          <CloseRoundBanner
            departmentId={departmentId}
            pendingQty={pendingTotalQty}
            showCloseRoundAction={canCloseRound}
          />
        ) : null}

        {overdueSevenDays > 0 ? (
          <div className="card-whitespace flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold text-navy-900">รายการค้างสแกนเร่งด่วน</p>
              <p className="mt-1 text-sm text-text-secondary">
                มี {overdueSevenDays} รายการจดไว้ก่อนเกิน 7 วันในแผนก {departmentId}
              </p>
              <Link
                href="/queue"
                className="mt-3 inline-block text-sm font-semibold text-blue-primary hover:underline"
              >
                ดูคิวจดไว้ก่อน →
              </Link>
            </div>
          </div>
        ) : null}
      </div>

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
