import { readLocalJson, writeLocalJson } from "@/lib/storage/local-json";
import { appendPendingSaveBatch } from "@/lib/pending/pending-save-history";

export type PendingQueueItem = {
  code: string;
  name: string;
  barcode: string;
  group: string;
  departmentIds: string[];
  pendingSince: string;
  quantity: number;
};

export type CartSaveItem = {
  code: string;
  name: string;
  barcode: string;
  group: string;
  quantity: number;
};

type StoredUserPending = {
  code: string;
  name: string;
  barcode: string;
  group: string;
  departmentId: string;
  pendingSince: string;
  quantity: number;
};

const USER_ADDED_KEY = "wnhscan:pending-user-added";
const REMOVED_KEY = "wnhscan:pending-removed";
export const PENDING_CHANGED_EVENT = "wnhscan:pending-changed";

const userAddedMemory = { current: [] as StoredUserPending[] };
const removedMemory = { current: [] as string[] };

function removedKey(departmentId: string, code: string): string {
  return `${departmentId}:${code}`;
}

function notifyPendingChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PENDING_CHANGED_EVENT));
}

function readUserAdded(): StoredUserPending[] {
  return readLocalJson(USER_ADDED_KEY, userAddedMemory.current, userAddedMemory);
}

function writeUserAdded(entries: StoredUserPending[]) {
  writeLocalJson(USER_ADDED_KEY, entries, userAddedMemory);
}

function readRemoved(): Set<string> {
  const keys = readLocalJson(REMOVED_KEY, removedMemory.current, removedMemory);
  return new Set(keys);
}

function writeRemoved(keys: Set<string>) {
  writeLocalJson(REMOVED_KEY, [...keys], removedMemory);
}

function isRemoved(departmentId: string, code: string, removed: Set<string>): boolean {
  return removed.has(removedKey(departmentId, code));
}

function toQueueItem(row: StoredUserPending): PendingQueueItem {
  return {
    code: row.code,
    name: row.name,
    barcode: row.barcode,
    group: row.group,
    departmentIds: [row.departmentId],
    pendingSince: row.pendingSince,
    quantity: row.quantity,
  };
}

export function getPendingForDepartment(departmentId: string): PendingQueueItem[] {
  const removed = readRemoved();
  return readUserAdded()
    .filter(
      (row) => row.departmentId === departmentId && !isRemoved(departmentId, row.code, removed),
    )
    .map(toQueueItem)
    .sort((a, b) => new Date(b.pendingSince).getTime() - new Date(a.pendingSince).getTime());
}

/** รวมจำนวนชิ้น pending ทุกแผนกที่ส่งมา — ใช้ badge ปิดรอบสแกน */
export function countPendingQtyForDepartments(departmentIds: string[]): number {
  return departmentIds.reduce(
    (sum, departmentId) =>
      sum +
      getPendingForDepartment(departmentId).reduce((n, row) => n + row.quantity, 0),
    0,
  );
}

export function addToPendingFromCart(departmentId: string, items: CartSaveItem[]): void {
  if (items.length === 0) return;

  const removed = readRemoved();
  const userAdded = readUserAdded();
  const now = new Date().toISOString();

  for (const item of items) {
    removed.delete(removedKey(departmentId, item.code));

    const existingIdx = userAdded.findIndex(
      (row) => row.code === item.code && row.departmentId === departmentId,
    );

    if (existingIdx >= 0) {
      userAdded[existingIdx] = {
        ...userAdded[existingIdx],
        quantity: userAdded[existingIdx].quantity + item.quantity,
      };
    } else {
      userAdded.push({
        code: item.code,
        name: item.name,
        barcode: item.barcode,
        group: item.group,
        departmentId,
        pendingSince: now,
        quantity: item.quantity,
      });
    }
  }

  writeRemoved(removed);
  writeUserAdded(userAdded);
  appendPendingSaveBatch(departmentId, items);
  notifyPendingChanged();
}

export function removePendingCodes(departmentId: string, codes: string[]): void {
  if (codes.length === 0) return;

  const codeSet = new Set(codes);
  const removed = readRemoved();
  for (const code of codes) removed.add(removedKey(departmentId, code));

  const userAdded = readUserAdded().filter(
    (row) => !(row.departmentId === departmentId && codeSet.has(row.code)),
  );
  writeRemoved(removed);
  writeUserAdded(userAdded);
  notifyPendingChanged();
}

/** แก้จำนวนรายการรอสแกนก่อนปิดรอบ — ลบออกถ้าจำนวนน้อยกว่า 1 */
export function updatePendingItemQuantity(
  departmentId: string,
  code: string,
  quantity: number,
): void {
  if (quantity < 1) {
    removePendingCodes(departmentId, [code]);
    return;
  }

  const userAdded = readUserAdded();
  const idx = userAdded.findIndex(
    (row) => row.code === code && row.departmentId === departmentId,
  );
  if (idx < 0) return;

  userAdded[idx] = { ...userAdded[idx], quantity: Math.floor(quantity) };
  writeUserAdded(userAdded);
  notifyPendingChanged();
}
