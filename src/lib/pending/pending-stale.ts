export type PendingStaleLevel = "none" | "warning" | "critical";

/** UTC date key (YYYY-MM-DD) — stable across server/client timezones. */
function utcDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysPending(pendingSince: string, now = new Date()): number {
  const sinceKey = utcDateKey(pendingSince);
  const todayKey = utcDateKey(now.toISOString());
  const sinceMs = Date.parse(`${sinceKey}T00:00:00Z`);
  const todayMs = Date.parse(`${todayKey}T00:00:00Z`);
  return Math.max(0, Math.round((todayMs - sinceMs) / 86_400_000));
}

export function getPendingStaleLevel(pendingSince: string): PendingStaleLevel {
  const days = daysPending(pendingSince);
  if (days >= 7) return "critical";
  if (days >= 1) return "warning";
  return "none";
}

export function countPendingByMinDays(
  items: { pendingSince: string }[],
  minDays: number,
): number {
  return items.filter((item) => daysPending(item.pendingSince) >= minDays).length;
}
