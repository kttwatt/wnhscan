import type { CartSaveItem, PendingQueueItem } from "@/lib/pending/pending-store";
import {
  mergeDateKeys,
  normalizeDateRange,
  toDateKey,
  todayDateKey,
} from "@/lib/scan/scan-log-queries";
import { readLocalJson, writeLocalJson } from "@/lib/storage/local-json";

export type PendingSaveBatch = {
  id: string;
  departmentId: string;
  savedAt: string;
  items: CartSaveItem[];
};

export type PendingSaveHistoryRow = CartSaveItem & {
  batchId: string;
  savedAt: string;
};

export type QueueHistoryStatusFilter = "all" | "pending" | "scanned";

const HISTORY_KEY = "wnhscan:pending-save-history";
const historyMemory = { current: [] as PendingSaveBatch[] };

function readBatches(): PendingSaveBatch[] {
  return readLocalJson(HISTORY_KEY, historyMemory.current, historyMemory);
}

function writeBatches(batches: PendingSaveBatch[]) {
  writeLocalJson(HISTORY_KEY, batches, historyMemory);
}

export function appendPendingSaveBatch(departmentId: string, items: CartSaveItem[]): PendingSaveBatch {
  const batch: PendingSaveBatch = {
    id: crypto.randomUUID(),
    departmentId,
    savedAt: new Date().toISOString(),
    items: items.map((item) => ({ ...item })),
  };
  const batches = readBatches();
  batches.push(batch);
  writeBatches(batches);
  return batch;
}

export function listPendingSaveHistory(departmentId: string): PendingSaveBatch[] {
  return readBatches()
    .filter((batch) => batch.departmentId === departmentId)
    .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}

export function flattenPendingSaveHistory(batches: PendingSaveBatch[]): PendingSaveHistoryRow[] {
  return batches
    .flatMap((batch) =>
      batch.items.map((item) => ({
        ...item,
        batchId: batch.id,
        savedAt: batch.savedAt,
      })),
    )
    .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}

export function listSaveHistoryDateKeys(rows: PendingSaveHistoryRow[]): string[] {
  return mergeDateKeys(rows.map((row) => toDateKey(row.savedAt)));
}

export function defaultSaveHistoryDateRange(rows: PendingSaveHistoryRow[]): { from: string; to: string } {
  const keys = listSaveHistoryDateKeys(rows);
  const today = todayDateKey();
  const earliest = keys.length > 0 ? keys[keys.length - 1]! : today;
  return { from: earliest, to: today };
}

export function filterPendingSaveBatches(
  batches: PendingSaveBatch[],
  opts: {
    dateFrom: string;
    dateTo: string;
    pendingCodes: Set<string>;
    status: QueueHistoryStatusFilter;
  },
): PendingSaveBatch[] {
  const range = normalizeDateRange(opts.dateFrom, opts.dateTo);

  return batches
    .filter((batch) => {
      const key = toDateKey(batch.savedAt);
      if (key < range.from || key > range.to) return false;
      if (opts.status === "scanned") {
        return batch.items.some((item) => !opts.pendingCodes.has(item.code));
      }
      if (opts.status === "pending") {
        return batch.items.some((item) => opts.pendingCodes.has(item.code));
      }
      return true;
    })
    .map((batch) => ({
      ...batch,
      items: batch.items.filter((item) => {
        const isPending = opts.pendingCodes.has(item.code);
        if (opts.status === "pending") return isPending;
        if (opts.status === "scanned") return !isPending;
        return true;
      }),
    }))
    .filter((batch) => batch.items.length > 0);
}

export function groupSaveBatchesByDate(batches: PendingSaveBatch[]): [string, PendingSaveBatch[]][] {
  const groups = new Map<string, PendingSaveBatch[]>();
  for (const batch of batches) {
    const key = toDateKey(batch.savedAt);
    const list = groups.get(key) ?? [];
    list.push(batch);
    groups.set(key, list);
  }
  return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a));
}

/** ซิงก์จำนวนจากคิวปัจจุบันเข้าชุดประวัติ — ใช้หลังแก้ไขย้อนหลัง */
export function applyLiveQuantitiesToBatches(
  batches: PendingSaveBatch[],
  pendingItems: Pick<PendingQueueItem, "code" | "name" | "barcode" | "group" | "quantity">[] = [],
): PendingSaveBatch[] {
  const pendingByCode = new Map(pendingItems.map((item) => [item.code, item]));

  return batches.map((batch) => ({
    ...batch,
    items: batch.items.map((item) => {
      const live = pendingByCode.get(item.code);
      if (!live) return item;
      return {
        code: live.code,
        name: live.name,
        barcode: live.barcode,
        group: live.group,
        quantity: live.quantity,
      };
    }),
  }));
}

/** ชุดบันทึกที่ยังมีรายการรอสแกน — ใช้จำนวนจากคิวปัจจุบัน */
export function listActivePendingBatches(
  departmentId: string,
  pendingItems: { code: string; name: string; barcode: string; group: string; quantity: number; pendingSince: string }[],
): PendingSaveBatch[] {
  const pendingByCode = new Map(pendingItems.map((item) => [item.code, item]));
  const pendingCodes = new Set(pendingItems.map((item) => item.code));
  const codesInBatches = new Set<string>();

  const fromHistory = listPendingSaveHistory(departmentId)
    .map((batch) => ({
      ...batch,
      items: batch.items
        .filter((item) => pendingCodes.has(item.code))
        .map((item) => {
          codesInBatches.add(item.code);
          const live = pendingByCode.get(item.code)!;
          return {
            code: live.code,
            name: live.name,
            barcode: live.barcode,
            group: live.group,
            quantity: live.quantity,
          };
        }),
    }))
    .filter((batch) => batch.items.length > 0);

  const orphans = pendingItems.filter((item) => !codesInBatches.has(item.code));
  if (orphans.length === 0) return fromHistory;

  const orphanGroups = new Map<string, typeof orphans>();
  for (const item of orphans) {
    const list = orphanGroups.get(item.pendingSince) ?? [];
    list.push(item);
    orphanGroups.set(item.pendingSince, list);
  }

  const orphanBatches: PendingSaveBatch[] = [...orphanGroups.entries()].map(
    ([savedAt, groupItems], index) => ({
      id: `orphan-${savedAt}-${index}`,
      departmentId,
      savedAt,
      items: groupItems.map((item) => ({
        code: item.code,
        name: item.name,
        barcode: item.barcode,
        group: item.group,
        quantity: item.quantity,
      })),
    }),
  );

  return [...fromHistory, ...orphanBatches].sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
  );
}
