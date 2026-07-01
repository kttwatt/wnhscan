"use server";

import type { CartSaveItem, PendingQueueItem } from "@/lib/pending/pending-store";
import {
  addPendingFromCart,
  countPendingQtyForDepartmentCodes,
  listPendingForDepartment,
  removePendingCodesForDepartment,
  updatePendingQuantity,
} from "@/lib/pending/pending-db.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

function actionErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

export async function listPendingAction(
  departmentCode: string,
): Promise<ActionResult<PendingQueueItem[]>> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "ยังไม่ได้ตั้งค่า Supabase" };
  }

  try {
    const data = await listPendingForDepartment(departmentCode);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: actionErrorMessage(err, "โหลดคิวไม่สำเร็จ") };
  }
}

export async function countPendingAction(
  departmentCodes: string[],
): Promise<ActionResult<number>> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "ยังไม่ได้ตั้งค่า Supabase" };
  }

  try {
    const data = await countPendingQtyForDepartmentCodes(departmentCodes);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: actionErrorMessage(err, "โหลดคิวไม่สำเร็จ") };
  }
}

export async function addPendingAction(
  departmentCode: string,
  items: CartSaveItem[],
): Promise<ActionResult<null>> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "ยังไม่ได้ตั้งค่า Supabase" };
  }

  try {
    await addPendingFromCart(departmentCode, items);
    return { ok: true, data: null };
  } catch (err) {
    return { ok: false, error: actionErrorMessage(err, "บันทึกคิวไม่สำเร็จ") };
  }
}

export async function updatePendingQuantityAction(
  departmentCode: string,
  code: string,
  quantity: number,
): Promise<ActionResult<null>> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "ยังไม่ได้ตั้งค่า Supabase" };
  }

  try {
    await updatePendingQuantity(departmentCode, code, quantity);
    return { ok: true, data: null };
  } catch (err) {
    return { ok: false, error: actionErrorMessage(err, "บันทึกไม่สำเร็จ") };
  }
}

export async function removePendingAction(
  departmentCode: string,
  codes: string[],
): Promise<ActionResult<null>> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "ยังไม่ได้ตั้งค่า Supabase" };
  }

  try {
    await removePendingCodesForDepartment(departmentCode, codes);
    return { ok: true, data: null };
  } catch (err) {
    return { ok: false, error: actionErrorMessage(err, "ลบรายการไม่สำเร็จ") };
  }
}
