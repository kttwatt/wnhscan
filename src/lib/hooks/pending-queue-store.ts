import { listPendingAction } from "@/lib/pending/pending-actions";
import {
  getPendingForDepartment,
  type CartSaveItem,
  type PendingQueueItem,
} from "@/lib/pending/pending-store";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Listener = (items: PendingQueueItem[]) => void;

type Entry = {
  items: PendingQueueItem[];
  listeners: Set<Listener>;
  inFlight: Promise<void> | null;
};

/** Stable empty reference so useSyncExternalStore snapshots don't loop. */
const EMPTY_ITEMS: PendingQueueItem[] = [];
const entries = new Map<string, Entry>();

function getEntry(departmentId: string): Entry {
  let entry = entries.get(departmentId);
  if (!entry) {
    entry = { items: EMPTY_ITEMS, listeners: new Set(), inFlight: null };
    entries.set(departmentId, entry);
  }
  return entry;
}

export function getPendingSnapshot(departmentId: string): PendingQueueItem[] {
  return entries.get(departmentId)?.items ?? EMPTY_ITEMS;
}

export function subscribePending(
  departmentId: string,
  listener: Listener,
): () => void {
  const entry = getEntry(departmentId);
  entry.listeners.add(listener);
  return () => {
    entry.listeners.delete(listener);
  };
}

export function refreshPending(departmentId: string, force = false): Promise<void> {
  if (!departmentId) return Promise.resolve();
  const entry = getEntry(departmentId);
  if (entry.inFlight && !force) return entry.inFlight;

  const load = async () => {
    if (isSupabaseConfigured()) {
      const result = await listPendingAction(departmentId);
      if (result.ok) entry.items = result.data;
    } else {
      entry.items = getPendingForDepartment(departmentId);
    }
    for (const listener of entry.listeners) listener(entry.items);
  };

  const promise = load().finally(() => {
    entry.inFlight = null;
  });
  entry.inFlight = promise;
  return promise;
}

/** อัปเดต snapshot ทันทีหลังบันทึกตะกร้า — ไม่ต้องรอ round-trip ที่สอง */
export function applyCartToPendingStore(
  departmentId: string,
  cartItems: CartSaveItem[],
): void {
  if (!departmentId || cartItems.length === 0) return;

  const entry = getEntry(departmentId);
  const byCode = new Map(entry.items.map((item) => [item.code, item]));
  const now = new Date().toISOString();

  for (const item of cartItems) {
    const existing = byCode.get(item.code);
    if (existing) {
      byCode.set(item.code, {
        ...existing,
        quantity: existing.quantity + item.quantity,
      });
    } else {
      byCode.set(item.code, {
        code: item.code,
        name: item.name,
        barcode: item.barcode,
        group: item.group,
        departmentIds: [departmentId],
        pendingSince: now,
        quantity: item.quantity,
      });
    }
  }

  entry.items = [...byCode.values()].sort(
    (a, b) => new Date(b.pendingSince).getTime() - new Date(a.pendingSince).getTime(),
  );
  for (const listener of entry.listeners) listener(entry.items);
}
