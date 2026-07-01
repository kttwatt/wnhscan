"use server";

import { listScanBatches, saveScanBatch } from "@/lib/scan/scan-db.server";
import type { ScanLogEntry, ScanLogItem } from "@/lib/scan/scan-log";
import type { ScanMode } from "@/lib/scan/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function listScanBatchesAction(
  departmentCode?: string,
  limit?: number,
): Promise<ActionResult<ScanLogEntry[]>> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "ยังไม่ได้ตั้งค่า Supabase" };
  }

  try {
    const data = await listScanBatches(departmentCode, limit);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "โหลดประวัติไม่สำเร็จ" };
  }
}

export async function saveScanBatchAction(params: {
  departmentCode?: string;
  mode: ScanMode;
  items: ScanLogItem[];
  removePendingCodes?: string[];
}): Promise<ActionResult<ScanLogEntry>> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "ยังไม่ได้ตั้งค่า Supabase" };
  }

  try {
    const data = await saveScanBatch({
      departmentCode: params.departmentCode ?? "",
      mode: params.mode,
      items: params.items,
      removePendingCodes: params.removePendingCodes,
    });
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "บันทึกการสแกนไม่สำเร็จ" };
  }
}
