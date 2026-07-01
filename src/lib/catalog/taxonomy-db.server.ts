import { createClient } from "@/lib/supabase/server";
import type { CatalogGroupRow, CatalogSubgroupRow, GroupInput, SubgroupInput } from "@/lib/catalog/taxonomy-types";

function normalizeGroupInput(input: GroupInput): { name: string; code: string | null; sortOrder: number } {
  const name = input.name.trim();
  const code = input.code?.trim() || null;
  const sortOrder = input.sortOrder?.trim() ? Number(input.sortOrder) : 0;
  if (!name) throw new Error("กรุณาระบุชื่อกลุ่มวัสดุ");
  if (Number.isNaN(sortOrder)) throw new Error("ลำดับต้องเป็นตัวเลข");
  return { name, code, sortOrder };
}

function normalizeSubgroupInput(input: SubgroupInput): {
  name: string;
  code: string | null;
  sortOrder: number;
  groupId: string;
} {
  const name = input.name.trim();
  const code = input.code?.trim() || null;
  const sortOrder = input.sortOrder?.trim() ? Number(input.sortOrder) : 0;
  const groupId = input.groupId.trim();
  if (!name) throw new Error("กรุณาระบุชื่อกลุ่มย่อย");
  if (!groupId) throw new Error("กรุณาเลือกกลุ่มวัสดุ");
  if (Number.isNaN(sortOrder)) throw new Error("ลำดับต้องเป็นตัวเลข");
  return { name, code, sortOrder, groupId };
}

export async function createItemGroup(input: GroupInput): Promise<CatalogGroupRow> {
  const data = normalizeGroupInput(input);
  const supabase = await createClient();

  const { data: created, error } = await supabase
    .from("item_groups")
    .insert({
      name: data.name,
      code: data.code,
      sort_order: data.sortOrder,
    })
    .select("id, name, code, sort_order")
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "สร้างกลุ่มวัสดุไม่สำเร็จ");
  }

  return {
    id: created.id,
    name: created.name,
    code: created.code,
    sortOrder: created.sort_order,
    subgroupCount: 0,
  };
}

export async function updateItemGroup(groupId: string, input: GroupInput): Promise<CatalogGroupRow> {
  const data = normalizeGroupInput(input);
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from("item_groups")
    .update({
      name: data.name,
      code: data.code,
      sort_order: data.sortOrder,
    })
    .eq("id", groupId)
    .select("id, name, code, sort_order")
    .single();

  if (error || !updated) {
    throw new Error(error?.message ?? "บันทึกกลุ่มวัสดุไม่สำเร็จ");
  }

  const { count } = await supabase
    .from("item_subgroups")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId)
    .is("deleted_at", null);

  return {
    id: updated.id,
    name: updated.name,
    code: updated.code,
    sortOrder: updated.sort_order,
    subgroupCount: count ?? 0,
  };
}

export async function createItemSubgroup(input: SubgroupInput): Promise<CatalogSubgroupRow> {
  const data = normalizeSubgroupInput(input);
  const supabase = await createClient();

  const { data: group, error: groupError } = await supabase
    .from("item_groups")
    .select("id, name")
    .eq("id", data.groupId)
    .is("deleted_at", null)
    .single();

  if (groupError || !group) {
    throw new Error("ไม่พบกลุ่มวัสดุที่เลือก");
  }

  const { data: created, error } = await supabase
    .from("item_subgroups")
    .insert({
      group_id: data.groupId,
      name: data.name,
      code: data.code,
      sort_order: data.sortOrder,
    })
    .select("id, name, code, sort_order, group_id")
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "สร้างกลุ่มย่อยไม่สำเร็จ");
  }

  return {
    id: created.id,
    name: created.name,
    code: created.code,
    sortOrder: created.sort_order,
    groupId: created.group_id,
    groupName: group.name,
    itemCount: 0,
  };
}

export async function updateItemSubgroup(
  subgroupId: string,
  input: SubgroupInput,
): Promise<CatalogSubgroupRow> {
  const data = normalizeSubgroupInput(input);
  const supabase = await createClient();

  const { data: group, error: groupError } = await supabase
    .from("item_groups")
    .select("id, name")
    .eq("id", data.groupId)
    .is("deleted_at", null)
    .single();

  if (groupError || !group) {
    throw new Error("ไม่พบกลุ่มวัสดุที่เลือก");
  }

  const { data: updated, error } = await supabase
    .from("item_subgroups")
    .update({
      group_id: data.groupId,
      name: data.name,
      code: data.code,
      sort_order: data.sortOrder,
    })
    .eq("id", subgroupId)
    .select("id, name, code, sort_order, group_id")
    .single();

  if (error || !updated) {
    throw new Error(error?.message ?? "บันทึกกลุ่มย่อยไม่สำเร็จ");
  }

  const { count } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("subgroup_id", subgroupId)
    .is("deleted_at", null);

  return {
    id: updated.id,
    name: updated.name,
    code: updated.code,
    sortOrder: updated.sort_order,
    groupId: updated.group_id,
    groupName: group.name,
    itemCount: count ?? 0,
  };
}
