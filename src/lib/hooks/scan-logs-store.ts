import { listScanBatchesAction } from "@/lib/scan/scan-actions";
import type { ScanLogEntry } from "@/lib/scan/scan-log";

type Listener = (logs: ScanLogEntry[]) => void;

type Entry = {
  logs: ScanLogEntry[];
  listeners: Set<Listener>;
  inFlight: Promise<void> | null;
};

const KEY_NO_DEPT = "__all__";
/** Stable empty reference so useSyncExternalStore snapshots don't loop. */
const EMPTY_LOGS: ScanLogEntry[] = [];
const entries = new Map<string, Entry>();

function keyFor(departmentCode?: string): string {
  return departmentCode ?? KEY_NO_DEPT;
}

function getEntry(key: string): Entry {
  let entry = entries.get(key);
  if (!entry) {
    entry = { logs: EMPTY_LOGS, listeners: new Set(), inFlight: null };
    entries.set(key, entry);
  }
  return entry;
}

export function getScanLogsSnapshot(departmentCode?: string): ScanLogEntry[] {
  return entries.get(keyFor(departmentCode))?.logs ?? EMPTY_LOGS;
}

export function subscribeScanLogs(
  departmentCode: string | undefined,
  listener: Listener,
): () => void {
  const entry = getEntry(keyFor(departmentCode));
  entry.listeners.add(listener);
  return () => {
    entry.listeners.delete(listener);
  };
}

/** Fetch once; concurrent callers share the same in-flight promise. Pass force to bypass. */
export function refreshScanLogs(
  departmentCode: string | undefined,
  force = false,
): Promise<void> {
  const key = keyFor(departmentCode);
  const entry = getEntry(key);

  if (entry.inFlight && !force) return entry.inFlight;

  const promise = listScanBatchesAction(departmentCode)
    .then((result) => {
      if (result.ok) {
        entry.logs = result.data;
        for (const listener of entry.listeners) listener(entry.logs);
      }
    })
    .finally(() => {
      entry.inFlight = null;
    });

  entry.inFlight = promise;
  return promise;
}
