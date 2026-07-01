import { countPendingAction } from "@/lib/pending/pending-actions";
import { countPendingQtyForDepartments } from "@/lib/pending/pending-store";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Listener = (count: number) => void;

type Entry = {
  count: number;
  listeners: Set<Listener>;
  inFlight: Promise<void> | null;
};

const entries = new Map<string, Entry>();

function keyFor(departments: string[]): string {
  if (departments.length === 0) return "__none__";
  return departments.slice().sort().join(",");
}

function getEntry(key: string): Entry {
  let entry = entries.get(key);
  if (!entry) {
    entry = { count: 0, listeners: new Set(), inFlight: null };
    entries.set(key, entry);
  }
  return entry;
}

export function getPendingCountSnapshot(departments: string[]): number {
  return entries.get(keyFor(departments))?.count ?? 0;
}

export function subscribePendingCount(
  departments: string[],
  listener: Listener,
): () => void {
  const entry = getEntry(keyFor(departments));
  entry.listeners.add(listener);
  return () => {
    entry.listeners.delete(listener);
  };
}

export function refreshPendingCount(
  departments: string[],
  canShow: boolean,
  force = false,
): Promise<void> {
  const key = keyFor(departments);
  const entry = getEntry(key);

  if (!canShow) {
    entry.count = 0;
    for (const listener of entry.listeners) listener(0);
    return Promise.resolve();
  }

  if (entry.inFlight && !force) return entry.inFlight;

  const load = async () => {
    if (isSupabaseConfigured()) {
      const result = await countPendingAction(departments);
      if (result.ok) entry.count = result.data;
    } else {
      entry.count = countPendingQtyForDepartments(departments);
    }
    for (const listener of entry.listeners) listener(entry.count);
  };

  const promise = load().finally(() => {
    entry.inFlight = null;
  });
  entry.inFlight = promise;
  return promise;
}
