"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  addPendingAction,
  removePendingAction,
  updatePendingQuantityAction,
} from "@/lib/pending/pending-actions";
import {
  addToPendingFromCart,
  recordPendingCartSaved,
  PENDING_CHANGED_EVENT,
  removePendingCodes,
  updatePendingItemQuantity,
  type CartSaveItem,
} from "@/lib/pending/pending-store";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  applyCartToPendingStore,
  getPendingSnapshot,
  refreshPending,
  subscribePending,
} from "@/lib/hooks/pending-queue-store";

export function usePendingQueue(departmentId: string) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => subscribePending(departmentId, onStoreChange),
    [departmentId],
  );
  const getSnapshot = useCallback(
    () => getPendingSnapshot(departmentId),
    [departmentId],
  );
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const refresh = useCallback(async () => {
    if (!departmentId) return;
    await refreshPending(departmentId, true);
  }, [departmentId]);

  useEffect(() => {
    if (!departmentId) return;
    void refreshPending(departmentId);
  }, [departmentId]);

  useEffect(() => {
    if (!departmentId) return;
    const onPendingChanged = () => void refreshPending(departmentId, true);
    window.addEventListener(PENDING_CHANGED_EVENT, onPendingChanged);
    window.addEventListener("focus", onPendingChanged);
    return () => {
      window.removeEventListener(PENDING_CHANGED_EVENT, onPendingChanged);
      window.removeEventListener("focus", onPendingChanged);
    };
  }, [departmentId]);

  const saveCartToPending = useCallback(
    async (cartItems: CartSaveItem[]) => {
      if (cartItems.length === 0) return;

      if (isSupabaseConfigured()) {
        const result = await addPendingAction(departmentId, cartItems);
        if (!result.ok) throw new Error(result.error);
        recordPendingCartSaved(departmentId, cartItems);
        applyCartToPendingStore(departmentId, cartItems);
        void refreshPending(departmentId, true);
        return;
      }

      addToPendingFromCart(departmentId, cartItems);
      applyCartToPendingStore(departmentId, cartItems);
    },
    [departmentId],
  );

  const removeCompleted = useCallback(
    async (codes: string[]) => {
      if (isSupabaseConfigured()) {
        await removePendingAction(departmentId, codes);
      } else {
        removePendingCodes(departmentId, codes);
      }
      await refreshPending(departmentId, true);
    },
    [departmentId],
  );

  const updateQuantity = useCallback(
    async (code: string, quantity: number) => {
      if (isSupabaseConfigured()) {
        await updatePendingQuantityAction(departmentId, code, quantity);
      } else {
        updatePendingItemQuantity(departmentId, code, quantity);
      }
      await refreshPending(departmentId, true);
    },
    [departmentId],
  );

  const removeItem = useCallback(
    async (code: string) => {
      if (isSupabaseConfigured()) {
        await removePendingAction(departmentId, [code]);
      } else {
        removePendingCodes(departmentId, [code]);
      }
      await refreshPending(departmentId, true);
    },
    [departmentId],
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
