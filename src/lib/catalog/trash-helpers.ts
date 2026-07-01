export const TRASH_RETENTION_DAYS = 30;

export function daysSinceDeleted(deletedAt: string): number {
  const deleted = new Date(deletedAt);
  const now = new Date();
  return Math.floor((now.getTime() - deleted.getTime()) / (1000 * 60 * 60 * 24));
}

export function daysUntilPermanentDelete(deletedAt: string): number {
  return Math.max(0, TRASH_RETENTION_DAYS - daysSinceDeleted(deletedAt));
}

export function canPermanentlyDelete(deletedAt: string): boolean {
  return daysSinceDeleted(deletedAt) >= TRASH_RETENTION_DAYS;
}

export function formatDeletedAt(deletedAt: string): string {
  return new Date(deletedAt).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
