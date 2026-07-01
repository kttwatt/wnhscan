import { createClient } from "@/lib/supabase/server";
import type { ScanLogEntry, ScanLogItem } from "@/lib/scan/scan-log";
import type { ScanMode } from "@/lib/scan/types";
import { removePendingCodesForDepartment } from "@/lib/pending/pending-db.server";

type DeptRef = { code: string } | { code: string }[] | null;

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

async function getDepartmentUuid(departmentCode: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("id")
    .eq("code", departmentCode)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    throw new Error(`ไม่พบหน่วยงาน ${departmentCode}`);
  }

  return data.id;
}

async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("กรุณาเข้าสู่ระบบ");
  return user.id;
}

type BatchRow = {
  id: string;
  mode: string;
  saved_at: string;
  user_id: string;
  departments: DeptRef;
  scan_batch_items: {
    item_code: string;
    item_name: string;
    barcode: string;
    quantity: number;
    verified: boolean;
  }[];
};

function mapBatchRow(row: BatchRow): ScanLogEntry {
  const dept = unwrapOne(row.departments);
  return {
    id: row.id,
    departmentId: dept?.code ?? undefined,
    mode: row.mode as ScanMode,
    userId: row.user_id,
    savedAt: row.saved_at,
    items: row.scan_batch_items.map(
      (item): ScanLogItem => ({
        code: item.item_code,
        name: item.item_name,
        barcode: item.barcode,
        quantity: item.quantity,
        verified: item.verified,
      }),
    ),
  };
}

export async function listScanBatches(departmentCode?: string): Promise<ScanLogEntry[]> {
  const supabase = await createClient();
  let query = supabase
    .from("scan_batches")
    .select(
      `
      id, mode, saved_at, user_id,
      departments!inner(code),
      scan_batch_items(item_code, item_name, barcode, quantity, verified)
    `,
    )
    .order("saved_at", { ascending: false });

  if (departmentCode) {
    const departmentId = await getDepartmentUuid(departmentCode);
    query = query.eq("department_id", departmentId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as BatchRow[]).map(mapBatchRow);
}

export async function saveScanBatch(params: {
  departmentCode: string;
  mode: ScanMode;
  items: ScanLogItem[];
  removePendingCodes?: string[];
}): Promise<ScanLogEntry> {
  if (!params.departmentCode) {
    throw new Error("กรุณาเลือกหน่วยงาน");
  }
  if (params.items.length === 0) {
    throw new Error("ไม่มีรายการที่จะบันทึก");
  }

  const departmentId = await getDepartmentUuid(params.departmentCode);
  const userId = await getCurrentUserId();
  const supabase = await createClient();

  const { data: batch, error: batchError } = await supabase
    .from("scan_batches")
    .insert({
      department_id: departmentId,
      user_id: userId,
      mode: params.mode,
    })
    .select("id, mode, saved_at, user_id")
    .single();

  if (batchError || !batch) {
    throw new Error(batchError?.message ?? "บันทึกการสแกนไม่สำเร็จ");
  }

  const { error: itemsError } = await supabase.from("scan_batch_items").insert(
    params.items.map((item) => ({
      batch_id: batch.id,
      item_code: item.code,
      item_name: item.name,
      barcode: item.barcode,
      quantity: item.quantity,
      verified: item.verified,
    })),
  );

  if (itemsError) {
    await supabase.from("scan_batches").delete().eq("id", batch.id);
    throw new Error(itemsError.message);
  }

  const codesToRemove =
    params.removePendingCodes ??
    (params.mode === "queue_scan" ? params.items.map((item) => item.code) : []);

  if (codesToRemove.length > 0) {
    await removePendingCodesForDepartment(params.departmentCode, codesToRemove);
  }

  return {
    id: batch.id,
    departmentId: params.departmentCode,
    mode: params.mode,
    userId: batch.user_id,
    savedAt: batch.saved_at,
    items: params.items,
  };
}
