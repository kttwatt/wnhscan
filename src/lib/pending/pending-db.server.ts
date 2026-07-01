import { createClient } from "@/lib/supabase/server";
import type { CartSaveItem, PendingQueueItem } from "@/lib/pending/pending-store";

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

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

type PendingRow = {
  item_code: string;
  item_name: string;
  barcode: string;
  item_group: string;
  pending_since: string;
  quantity: number;
};

function mapPendingRow(row: PendingRow, departmentCode: string): PendingQueueItem {
  return {
    code: row.item_code,
    name: row.item_name,
    barcode: row.barcode,
    group: row.item_group,
    departmentIds: [departmentCode],
    pendingSince: row.pending_since,
    quantity: row.quantity,
  };
}

export async function listPendingForDepartment(
  departmentCode: string,
): Promise<PendingQueueItem[]> {
  const departmentId = await getDepartmentUuid(departmentCode);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pending_queue_items")
    .select("item_code, item_name, barcode, item_group, pending_since, quantity")
    .eq("department_id", departmentId)
    .order("pending_since", { ascending: false });

  if (error) throw error;
  return (data as PendingRow[]).map((row) => mapPendingRow(row, departmentCode));
}

// NOTE: A SQL-side SUM would need an RPC/migration (out of scope for the
// perf quick-wins pass). Query already selects only `quantity`, so the JS
// reduce is the lightest option without a schema change.
export async function countPendingQtyForDepartmentCodes(
  departmentCodes: string[],
): Promise<number> {
  if (departmentCodes.length === 0) return 0;

  const supabase = await createClient();
  const { data: departments, error: deptError } = await supabase
    .from("departments")
    .select("id, code")
    .in("code", departmentCodes)
    .is("deleted_at", null);

  if (deptError) throw deptError;
  if (!departments?.length) return 0;

  const departmentIds = departments.map((d) => d.id);
  const { data, error } = await supabase
    .from("pending_queue_items")
    .select("quantity")
    .in("department_id", departmentIds);

  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + row.quantity, 0);
}

export async function addPendingFromCart(
  departmentCode: string,
  items: CartSaveItem[],
): Promise<void> {
  if (items.length === 0) return;

  const departmentId = await getDepartmentUuid(departmentCode);
  const userId = await getCurrentUserId();
  const supabase = await createClient();

  const codes = items.map((item) => item.code);
  const { data: existingRows, error: readError } = await supabase
    .from("pending_queue_items")
    .select("item_code, quantity")
    .eq("department_id", departmentId)
    .in("item_code", codes);

  if (readError) throw readError;

  const existingQtyByCode = new Map<string, number>(
    (existingRows ?? []).map((row) => [row.item_code, row.quantity]),
  );

  const rows = items.map((item) => ({
    department_id: departmentId,
    item_code: item.code,
    item_name: item.name,
    barcode: item.barcode,
    item_group: item.group,
    quantity: (existingQtyByCode.get(item.code) ?? 0) + item.quantity,
    added_by: userId,
  }));

  const { error: upsertError } = await supabase
    .from("pending_queue_items")
    .upsert(rows, { onConflict: "department_id,item_code" });

  if (upsertError) throw upsertError;
}

export async function updatePendingQuantity(
  departmentCode: string,
  code: string,
  quantity: number,
): Promise<void> {
  if (quantity < 1) {
    await removePendingCodesForDepartment(departmentCode, [code]);
    return;
  }

  const departmentId = await getDepartmentUuid(departmentCode);
  const supabase = await createClient();

  const { error } = await supabase
    .from("pending_queue_items")
    .update({ quantity: Math.floor(quantity) })
    .eq("department_id", departmentId)
    .eq("item_code", code);

  if (error) throw error;
}

export async function removePendingCodesForDepartment(
  departmentCode: string,
  codes: string[],
): Promise<void> {
  if (codes.length === 0) return;

  const departmentId = await getDepartmentUuid(departmentCode);
  const supabase = await createClient();

  const { error } = await supabase
    .from("pending_queue_items")
    .delete()
    .eq("department_id", departmentId)
    .in("item_code", codes);

  if (error) throw error;
}
