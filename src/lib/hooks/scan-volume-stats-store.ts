import { getScanVolumeStatsAction } from "@/lib/scan/scan-actions";
import type { ScanVolumeStats } from "@/lib/hooks/use-scan-volume-stats";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Listener = (stats: ScanVolumeStats) => void;

type Entry = {
  stats: ScanVolumeStats;
  listeners: Set<Listener>;
  inFlight: Promise<void> | null;
};

const EMPTY_STATS: ScanVolumeStats = {
  today: 0,
  week: 0,
  weekInstant: 0,
  weekQueue: 0,
};

const entries = new Map<string, Entry>();

function getEntry(departmentId: string): Entry {
  let entry = entries.get(departmentId);
  if (!entry) {
    entry = { stats: EMPTY_STATS, listeners: new Set(), inFlight: null };
    entries.set(departmentId, entry);
  }
  return entry;
}

export function getScanVolumeStatsSnapshot(departmentId: string): ScanVolumeStats {
  return entries.get(departmentId)?.stats ?? EMPTY_STATS;
}

export function subscribeScanVolumeStats(
  departmentId: string,
  listener: Listener,
): () => void {
  const entry = getEntry(departmentId);
  entry.listeners.add(listener);
  return () => {
    entry.listeners.delete(listener);
  };
}

export function refreshScanVolumeStats(departmentId: string, force = false): Promise<void> {
  if (!departmentId) return Promise.resolve();
  const entry = getEntry(departmentId);
  if (entry.inFlight && !force) return entry.inFlight;

  const load = async () => {
    if (isSupabaseConfigured()) {
      const result = await getScanVolumeStatsAction(departmentId);
      if (result.ok) entry.stats = result.data;
    } else {
      entry.stats = EMPTY_STATS;
    }
    for (const listener of entry.listeners) listener(entry.stats);
  };

  const promise = load().finally(() => {
    entry.inFlight = null;
  });
  entry.inFlight = promise;
  return promise;
}
