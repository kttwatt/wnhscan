"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SCAN_LOG_CHANGED_EVENT } from "@/lib/scan/scan-log";
import {
  getScanLogsSnapshot,
  refreshScanLogs,
  subscribeScanLogs,
} from "@/lib/hooks/scan-logs-store";

const subscribeMounted = () => () => {};

export function useScanLogs(departmentCode?: string) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => subscribeScanLogs(departmentCode, onStoreChange),
    [departmentCode],
  );
  const getSnapshot = useCallback(
    () => getScanLogsSnapshot(departmentCode),
    [departmentCode],
  );

  const logs = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const mounted = useSyncExternalStore(
    subscribeMounted,
    () => true,
    () => false,
  );

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    await refreshScanLogs(departmentCode, true);
  }, [departmentCode]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    void refreshScanLogs(departmentCode);
    const onChange = () => void refreshScanLogs(departmentCode, true);
    window.addEventListener(SCAN_LOG_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(SCAN_LOG_CHANGED_EVENT, onChange);
  }, [departmentCode]);

  return { logs, mounted, refresh };
}
