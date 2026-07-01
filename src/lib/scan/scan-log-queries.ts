import type { ScanLogEntry } from "@/lib/scan/scan-log";
import type { ScanMode } from "@/lib/scan/types";

export type ScanLogTypeFilter = "all" | ScanMode;

export const SCAN_MODE_LABELS: Record<ScanMode, string> = {
  instant_scan: "สแกนทันที",
  queue_scan: "ปิดรอบแล้ว",
};

export function toDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayDateKey(): string {
  return toDateKey(new Date().toISOString());
}

/** Shift a YYYY-MM-DD key by N calendar days (local). */
export function shiftDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toDateKey(date.toISOString());
}

/** Rolling 7-day window ending today (inclusive). */
export function weekDateRange(now = new Date()): { from: string; to: string } {
  const to = toDateKey(now.toISOString());
  return { from: shiftDateKey(to, -6), to };
}

export type ScanVolumeStatKey = "today" | "week" | "weekInstant" | "weekQueue";

export type ScanLogModalPreset = {
  mode: ScanLogTypeFilter;
  dateFrom: string;
  dateTo: string;
};

export function presetForVolumeStat(key: ScanVolumeStatKey): ScanLogModalPreset {
  const today = todayDateKey();
  const week = weekDateRange();
  switch (key) {
    case "today":
      return { mode: "all", dateFrom: today, dateTo: today };
    case "week":
      return { mode: "all", dateFrom: week.from, dateTo: week.to };
    case "weekInstant":
      return { mode: "instant_scan", dateFrom: week.from, dateTo: week.to };
    case "weekQueue":
      return { mode: "queue_scan", dateFrom: week.from, dateTo: week.to };
  }
}

export function mergeDateKeys(...lists: string[][]): string[] {
  const keys = new Set<string>();
  for (const list of lists) {
    for (const key of list) keys.add(key);
  }
  keys.add(todayDateKey());
  return [...keys].sort((a, b) => b.localeCompare(a));
}

export function listLogDateKeys(
  logs: ScanLogEntry[],
  departmentId: string,
  mode?: ScanLogTypeFilter,
): string[] {
  const keys = new Set(
    filterScanLogs(logs, { departmentId, mode }).map((log) => toDateKey(log.savedAt)),
  );
  keys.add(todayDateKey());
  return [...keys].sort((a, b) => b.localeCompare(a));
}

/** ช่วงเริ่มต้น: วันแรกที่มี log → วันนี้ */
export function defaultLogDateRange(
  logs: ScanLogEntry[],
  departmentId: string,
  mode?: ScanLogTypeFilter,
): { from: string; to: string } {
  const keys = listLogDateKeys(logs, departmentId, mode);
  const today = todayDateKey();
  const earliest = keys.length > 0 ? keys[keys.length - 1]! : today;
  return { from: earliest, to: today };
}

export function formatLogDateHeading(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "long",
  }).format(new Date(y, m - 1, d));
}

export function formatLogTime(iso: string): string {
  return new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** วันที่และเวลาที่บันทึกจดไว้ก่อน */
export function formatBatchSavedAt(iso: string): string {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function formatDateRangeSummary(fromKey: string, toKey: string): string {
  const fromLabel = formatLogDateHeading(fromKey);
  const toLabel = formatLogDateHeading(toKey);
  const today = todayDateKey();
  if (fromKey === toKey) {
    return fromKey === today ? `${fromLabel} (วันนี้)` : fromLabel;
  }
  return `${fromLabel} – ${toLabel}`;
}

export function normalizeDateRange(fromKey: string, toKey: string): { from: string; to: string } {
  if (fromKey <= toKey) return { from: fromKey, to: toKey };
  return { from: toKey, to: fromKey };
}

export function filterScanLogs(
  logs: ScanLogEntry[],
  opts: {
    departmentId: string;
    mode?: ScanLogTypeFilter;
    dateFrom?: string;
    dateTo?: string;
  },
): ScanLogEntry[] {
  const range =
    opts.dateFrom && opts.dateTo
      ? normalizeDateRange(opts.dateFrom, opts.dateTo)
      : null;

  return logs
    .filter((log) => log.departmentId === opts.departmentId)
    .filter((log) => {
      if (!opts.mode || opts.mode === "all") return true;
      return log.mode === opts.mode;
    })
    .filter((log) => {
      if (!range) return true;
      const key = toDateKey(log.savedAt);
      return key >= range.from && key <= range.to;
    })
    .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}

export function groupScanLogsByDate(logs: ScanLogEntry[]): [string, ScanLogEntry[]][] {
  const groups = new Map<string, ScanLogEntry[]>();
  for (const log of logs) {
    const key = toDateKey(log.savedAt);
    const list = groups.get(key) ?? [];
    list.push(log);
    groups.set(key, list);
  }
  return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a));
}

export function countScannedItems(logs: ScanLogEntry[], departmentId: string): number {
  return sumScannedQuantity(logs, { departmentId });
}

export function sumScannedQuantity(
  logs: ScanLogEntry[],
  opts: {
    departmentId: string;
    mode?: ScanLogTypeFilter;
    dateFrom?: string;
    dateTo?: string;
  },
): number {
  return filterScanLogs(logs, opts).reduce(
    (sum, log) => sum + log.items.reduce((n, item) => n + item.quantity, 0),
    0,
  );
}
