"use client";

import { useMemo } from "react";
import {
  sumScannedQuantity,
  todayDateKey,
  weekDateRange,
  type ScanVolumeStatKey,
} from "@/lib/scan/scan-log-queries";
import { useScanLogs } from "@/lib/hooks/use-scan-logs";

export type ScanVolumeStats = Record<ScanVolumeStatKey, number>;

const EMPTY_STATS: ScanVolumeStats = {
  today: 0,
  week: 0,
  weekInstant: 0,
  weekQueue: 0,
};

export function useScanVolumeStats(departmentId: string): ScanVolumeStats {
  const { logs, mounted } = useScanLogs(departmentId);

  return useMemo(() => {
    if (!mounted) return EMPTY_STATS;

    const today = todayDateKey();
    const week = weekDateRange();
    const base = { departmentId };

    return {
      today: sumScannedQuantity(logs, { ...base, dateFrom: today, dateTo: today }),
      week: sumScannedQuantity(logs, { ...base, ...week }),
      weekInstant: sumScannedQuantity(logs, { ...base, mode: "instant_scan", ...week }),
      weekQueue: sumScannedQuantity(logs, { ...base, mode: "queue_scan", ...week }),
    };
  }, [departmentId, logs, mounted]);
}
