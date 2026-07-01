import { listPendingAction } from "@/lib/pending/pending-actions";
import { getPendingForDepartment, type PendingQueueItem } from "@/lib/pending/pending-store";
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
