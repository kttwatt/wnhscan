"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  flattenPendingSaveHistory,
  listPendingSaveHistory,
  type PendingSaveHistoryRow,
} from "@/lib/pending/pending-save-history";
import { PENDING_CHANGED_EVENT } from "@/lib/pending/pending-store";

export function useQueueSaveHistory(departmentId: string): PendingSaveHistoryRow[] {
  const pathname = usePathname();
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    refresh();
  }, [departmentId, pathname, refresh]);

  useEffect(() => {
    const onChange = () => refresh();
    window.addEventListener(PENDING_CHANGED_EVENT, onChange);
    window.addEventListener("focus", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(PENDING_CHANGED_EVENT, onChange);
      window.removeEventListener("focus", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  return useMemo(() => {
    void version;
    return flattenPendingSaveHistory(listPendingSaveHistory(departmentId));
  }, [departmentId, version]);
}
