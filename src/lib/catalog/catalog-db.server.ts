import { createClient } from "@/lib/supabase/server";
import {
  canPermanentlyDelete,
  TRASH_RETENTION_DAYS,
} from "@/lib/catalog/trash-helpers";
import type { CatalogItem, CatalogItemInput } from "@/lib/catalog/types";

type ItemRow = {
  id: string;
  code: string;
  name: string;
  unit: string;
  price: number | string | null;
  barcode: string | null;
  subgroup_id: string;
  item_subgroups: { id: string; name: string; item_groups: { name: string } | { name: string }[] | null } | null;
};

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapItemRow(row: ItemRow, departmentIds: string[]): CatalogItem {
  const subgroup = unwrapOne(row.item_subgroups);
  const group = unwrapOne(subgroup?.item_groups);

  return {
    id: row.id,
    code: row.code,
    name: row.name,
    barcode: row.barcode ?? row.code,
    unit: row.unit,
    price: row.price != null ? String(row.price) : undefined,
    departmentIds,
    group: group?.name ?? "",
    subgroup: subgroup?.name ?? "",
    subgroupId: subgroup?.id ?? row.subgroup_id,
  };
}

function normalizeInput(input: CatalogItemInput): CatalogItemInput {
  return {
    ...input,
    code: input.code.trim(),
    name: input.name.trim(),
    barcode: input.barcode.trim() || input.code.trim(),
    unit: input.unit.trim(),
    price: input.price?.trim() || undefined,
    group: input.group.trim(),
    subgroup: input.subgroup.trim(),
  };
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

async function fetchDepartmentCodesForItems(itemIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (itemIds.length === 0) return map;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("department_items")
    .select("item_id, departments!inner(code)")
    .in("item_id", itemIds)
    .is("deleted_at", null);

  if (error) throw error;

  for (const row of data ?? []) {
    const dept = unwrapOne(row.departments as { code: string } | { code: string }[] | null);
    if (!dept?.code) continue;
    const list = map.get(row.item_id) ?? [];
    if (!list.includes(dept.code)) list.push(dept.code);
    map.set(row.item_id, list);
  }

  return map;
}

async function resolveSubgroupId(groupName: string, subgroupName: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("item_subgroups")
    .select("id, name, item_groups!inner(name)")
    .eq("name", subgroupName)
    .is("deleted_at", null);

  if (error) throw error;

  const match = (data ?? []).find((sg) => {
    const group = unwrapOne(sg.item_groups as { name: string } | { name: string }[] | null);
    return group?.name === groupName;
  });

  if (!match) {
    throw new Error("ไม่พบหมวดย่อยที่เลือกในฐานข้อมูล");
  }
  return match.id;
}

export async function assignCatalogItemToDepartment(
  itemId: string,
  departmentCode: string,
): Promise<void> {
  const departmentId = await getDepartmentUuid(departmentCode);
  const userId = await getCurrentUserId();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("department_items")
    .select("id, deleted_at")
    .eq("department_id", departmentId)
    .eq("item_id", itemId)
    .maybeSingle();

  if (existing && !existing.deleted_at) {
    throw new Error("รายการนี้อยู่ในหน่วยงานแล้ว");
  }

  if (existing?.deleted_at) {
    const { error } = await supabase
      .from("department_items")
      .update({ deleted_at: null, added_by: userId, added_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("department_items").insert({
    department_id: departmentId,
    item_id: itemId,
    added_by: userId,
  });
  if (error) throw error;
}

export async function removeCatalogItemFromDepartment(
  itemId: string,
  departmentCode: string,
): Promise<void> {
  const departmentId = await getDepartmentUuid(departmentCode);
  const supabase = await createClient();

  const { error } = await supabase
    .from("department_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("department_id", departmentId)
    .eq("item_id", itemId)
    .is("deleted_at", null);

  if (error) throw error;
}

export async function createMasterCatalogItem(input: CatalogItemInput): Promise<CatalogItem> {
  const data = normalizeInput(input);
  if (!data.code || !data.name || !data.unit || !data.group || !data.subgroup) {
    throw new Error("กรุณากรอกข้อมูลที่จำเป็นให้ครบ");
  }

  const subgroupId = await resolveSubgroupId(data.group, data.subgroup);
  const supabase = await createClient();

  const { data: created, error } = await supabase
    .from("items")
    .insert({
      code: data.code,
      name: data.name,
      barcode: data.barcode,
      unit: data.unit,
      price: data.price ? Number(data.price) : 0,
      subgroup_id: subgroupId,
    })
    .select(
      `
      id, code, name, unit, price, barcode, subgroup_id,
      item_subgroups!inner(id, name, item_groups!inner(name))
    `,
    )
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "สร้างรายการไม่สำเร็จ");
  }

  return mapItemRow(created as unknown as ItemRow, []);
}

export async function softDeleteCatalogItem(itemId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", itemId)
    .is("deleted_at", null);

  if (error) throw error;
}

export async function restoreCatalogItem(itemId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("items")
    .update({ deleted_at: null })
    .eq("id", itemId)
    .not("deleted_at", "is", null);

  if (error) throw error;
}

export async function permanentlyDeleteCatalogItem(itemId: string): Promise<void> {
  const supabase = await createClient();
  const { data: row, error: fetchError } = await supabase
    .from("items")
    .select("deleted_at")
    .eq("id", itemId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!row?.deleted_at) {
    throw new Error("รายการไม่ได้อยู่ในถังขยะ");
  }
  if (!canPermanentlyDelete(row.deleted_at)) {
    throw new Error(`รอครบ ${TRASH_RETENTION_DAYS} วันก่อนลบถาวรได้`);
  }

  const { error } = await supabase.from("items").delete().eq("id", itemId);
  if (error) throw error;
}

export async function purgeExpiredTrashItems(): Promise<number> {
  const supabase = await createClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - TRASH_RETENTION_DAYS);

  const { data, error } = await supabase
    .from("items")
    .delete()
    .not("deleted_at", "is", null)
    .lt("deleted_at", cutoff.toISOString())
    .select("id");

  if (error) throw error;
  return data?.length ?? 0;
}

export async function createCatalogItem(
  departmentCode: string,
  input: CatalogItemInput,
): Promise<CatalogItem> {
  const data = normalizeInput(input);
  if (!data.code || !data.name || !data.unit || !data.group || !data.subgroup) {
    throw new Error("กรุณากรอกข้อมูลที่จำเป็นให้ครบ");
  }

  const subgroupId = await resolveSubgroupId(data.group, data.subgroup);
  const supabase = await createClient();

  const { data: created, error } = await supabase
    .from("items")
    .insert({
      code: data.code,
      name: data.name,
      barcode: data.barcode,
      unit: data.unit,
      price: data.price ? Number(data.price) : 0,
      subgroup_id: subgroupId,
    })
    .select(
      `
      id, code, name, unit, price, barcode, subgroup_id,
      item_subgroups!inner(id, name, item_groups!inner(name))
    `,
    )
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "สร้างรายการไม่สำเร็จ");
  }

  await assignCatalogItemToDepartment(created.id, departmentCode);
  return mapItemRow(created as unknown as ItemRow, [departmentCode]);
}

export async function updateCatalogItem(
  itemId: string,
  departmentCode: string,
  input: CatalogItemInput,
): Promise<CatalogItem> {
  const data = normalizeInput(input);
  if (!data.code || !data.name || !data.unit || !data.group || !data.subgroup) {
    throw new Error("กรุณากรอกข้อมูลที่จำเป็นให้ครบ");
  }

  const subgroupId = await resolveSubgroupId(data.group, data.subgroup);
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from("items")
    .update({
      code: data.code,
      name: data.name,
      barcode: data.barcode,
      unit: data.unit,
      price: data.price ? Number(data.price) : 0,
      subgroup_id: subgroupId,
    })
    .eq("id", itemId)
    .select(
      `
      id, code, name, unit, price, barcode, subgroup_id,
      item_subgroups!inner(id, name, item_groups!inner(name))
    `,
    )
    .single();

  if (error || !updated) {
    throw new Error(error?.message ?? "บันทึกไม่สำเร็จ");
  }

  const deptMap = await fetchDepartmentCodesForItems([itemId]);
  const departments = deptMap.get(itemId) ?? (departmentCode ? [departmentCode] : []);
  return mapItemRow(updated as unknown as ItemRow, departments);
}
