"use client";

import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { listScanBatchesAction } from "@/lib/scan/scan-actions";
import { SCAN_LOG_CHANGED_EVENT, type ScanLogEntry } from "@/lib/scan/scan-log";

export function useScanLogs(departmentCode?: string) {
  const [logs, setLogs] = useState<ScanLogEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLogs([]);
      return;
    }
    const result = await listScanBatchesAction(departmentCode);
    if (result.ok) setLogs(result.data);
  }, [departmentCode]);

  useEffect(() => {
    setMounted(true);
    void refresh();
    const onChange = () => void refresh();
    window.addEventListener(SCAN_LOG_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(SCAN_LOG_CHANGED_EVENT, onChange);
  }, [refresh]);

  return { logs, mounted, refresh };
}
