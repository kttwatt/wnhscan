"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { canAccessCloseRound, selectableDepartments } from "@/lib/auth/access";
import { useSession } from "@/components/auth/session-provider";
import { PENDING_CHANGED_EVENT } from "@/lib/pending/pending-store";
import {
  getPendingCountSnapshot,
  refreshPendingCount,
  subscribePendingCount,
} from "@/lib/hooks/close-round-pending-count-store";

/** จำนวนชิ้นจดไว้ก่อนทั้งหมดในขอบเขตผู้ใช้ — badge เมนู ปิดรอบสแกน */
export function useCloseRoundPendingCount(): number {
  const profile = useSession();
  const departments = useMemo(() => selectableDepartments(profile), [profile]);
  const canShow = canAccessCloseRound(profile);

  const subscribe = useCallback(
    (onStoreChange: () => void) => subscribePendingCount(departments, onStoreChange),
    [departments],
  );
  const getSnapshot = useCallback(
    () => getPendingCountSnapshot(departments),
    [departments],
  );

  const count = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    void refreshPendingCount(departments, canShow);
  }, [departments, canShow]);

  useEffect(() => {
    const onPendingChanged = () => void refreshPendingCount(departments, canShow, true);
    window.addEventListener(PENDING_CHANGED_EVENT, onPendingChanged);
    window.addEventListener("focus", onPendingChanged);
    return () => {
      window.removeEventListener(PENDING_CHANGED_EVENT, onPendingChanged);
      window.removeEventListener("focus", onPendingChanged);
    };
  }, [departments, canShow]);

  return count;
}
