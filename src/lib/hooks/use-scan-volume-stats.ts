"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { ScanVolumeStatKey } from "@/lib/scan/scan-log-queries";
import { SCAN_LOG_CHANGED_EVENT } from "@/lib/scan/scan-log";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  getScanVolumeStatsSnapshot,
  refreshScanVolumeStats,
  subscribeScanVolumeStats,
} from "@/lib/hooks/scan-volume-stats-store";

export type ScanVolumeStats = Record<ScanVolumeStatKey, number>;

export function useScanVolumeStats(departmentId: string): ScanVolumeStats {
  const subscribe = useCallback(
    (onStoreChange: () => void) => subscribeScanVolumeStats(departmentId, onStoreChange),
    [departmentId],
  );
  const getSnapshot = useCallback(
    () => getScanVolumeStatsSnapshot(departmentId),
    [departmentId],
  );

  const stats = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (!departmentId || !isSupabaseConfigured()) return;
    void refreshScanVolumeStats(departmentId);
    const onChange = () => void refreshScanVolumeStats(departmentId, true);
    window.addEventListener(SCAN_LOG_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(SCAN_LOG_CHANGED_EVENT, onChange);
  }, [departmentId]);

  return stats;
}
