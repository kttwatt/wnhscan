"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  addPendingAction,
  listPendingAction,
  removePendingAction,
  updatePendingQuantityAction,
} from "@/lib/pending/pending-actions";
import {
  addToPendingFromCart,
  getPendingForDepartment,
  PENDING_CHANGED_EVENT,
  removePendingCodes,
  updatePendingItemQuantity,
  type CartSaveItem,
  type PendingQueueItem,
} from "@/lib/pending/pending-store";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function usePendingQueue(departmentId: string) {
  const [items, setItems] = useState<PendingQueueItem[]>([]);
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    if (!departmentId) {
      setItems([]);
      return;
    }
    if (isSupabaseConfigured()) {
      const result = await listPendingAction(departmentId);
      if (result.ok) setItems(result.data);
      return;
    }
    setItems(getPendingForDepartment(departmentId));
  }, [departmentId]);

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

  const saveCartToPending = useCallback(
    async (cartItems: CartSaveItem[]) => {
      if (isSupabaseConfigured()) {
        await addPendingAction(departmentId, cartItems);
      } else {
        addToPendingFromCart(departmentId, cartItems);
      }
      await refresh();
    },
    [departmentId, refresh],
  );

  const removeCompleted = useCallback(
    async (codes: string[]) => {
      if (isSupabaseConfigured()) {
        await removePendingAction(departmentId, codes);
      } else {
        removePendingCodes(departmentId, codes);
      }
      await refresh();
    },
    [departmentId, refresh],
  );

  const updateQuantity = useCallback(
    async (code: string, quantity: number) => {
      if (isSupabaseConfigured()) {
        await updatePendingQuantityAction(departmentId, code, quantity);
      } else {
        updatePendingItemQuantity(departmentId, code, quantity);
      }
      await refresh();
    },
    [departmentId, refresh],
  );

  const removeItem = useCallback(
    async (code: string) => {
      if (isSupabaseConfigured()) {
        await removePendingAction(departmentId, [code]);
      } else {
        removePendingCodes(departmentId, [code]);
      }
      await refresh();
    },
    [departmentId, refresh],
  );

  return {
    items,
    saveCartToPending,
    removeCompleted,
    updateQuantity,
    removeItem,
    refresh,
  };
}
