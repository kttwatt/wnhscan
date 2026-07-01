"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { canAccessCloseRound, selectableDepartments } from "@/lib/auth/access";
import { useSession } from "@/components/auth/session-provider";
import { countPendingAction } from "@/lib/pending/pending-actions";
import {
  countPendingQtyForDepartments,
  PENDING_CHANGED_EVENT,
} from "@/lib/pending/pending-store";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** จำนวนชิ้นจดไว้ก่อนทั้งหมดในขอบเขตผู้ใช้ — badge เมนู ปิดรอบสแกน */
export function useCloseRoundPendingCount(): number {
  const profile = useSession();
  const pathname = usePathname();
  const departments = useMemo(() => selectableDepartments(profile), [profile]);
  const canShow = canAccessCloseRound(profile);
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!canShow) {
      setCount(0);
      return;
    }
    if (isSupabaseConfigured()) {
      const result = await countPendingAction(departments);
      if (result.ok) setCount(result.data);
      return;
    }
    setCount(countPendingQtyForDepartments(departments));
  }, [canShow, departments]);

  useEffect(() => {
    void refresh();
  }, [refresh, pathname]);

  useEffect(() => {
    const onPendingChanged = () => void refresh();
    window.addEventListener(PENDING_CHANGED_EVENT, onPendingChanged);
    window.addEventListener("focus", onPendingChanged);
    return () => {
      window.removeEventListener(PENDING_CHANGED_EVENT, onPendingChanged);
      window.removeEventListener("focus", onPendingChanged);
    };
  }, [refresh]);

  return count;
}
