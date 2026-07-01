import { createClient } from "@/lib/supabase/client";
import { itemsNotYetInDepartment } from "@/lib/catalog/catalog-helpers";
import type {
  CatalogGroupOption,
  CatalogItem,
  CatalogSubgroupOption,
  TrashCatalogItem,
} from "@/lib/catalog/types";

type ItemSubgroupJoin = {
  id: string;
  name: string;
  item_groups: { name: string } | { name: string }[] | null;
};

type ItemRow = {
  id: string;
  code: string;
  name: string;
  unit: string;
  price: number | string | null;
  barcode: string | null;
  subgroup_id: string;
  item_subgroups: ItemSubgroupJoin | ItemSubgroupJoin[] | null;
};

type DepartmentItemRow = {
  id: string;
  item_id: string;
  items: ItemRow | ItemRow[] | null;
};

const departmentIdCache = new Map<string, string>();

const CATALOG_ITEM_DETAIL_SELECT = `
      id, code, name, unit, price, barcode, subgroup_id,
      item_subgroups!inner(id, name, item_groups!inner(name))
    `;

const CATALOG_PAGE_SIZE = 500;

async function fetchAllActiveCatalogItemRows(
  supabase: ReturnType<typeof createClient>,
): Promise<ItemRow[]> {
  const rows: ItemRow[] = [];
  let offset = 0;

  for (;;) {
    const { data, error } = await supabase
      .from("items")
      .select(CATALOG_ITEM_DETAIL_SELECT)
      .is("deleted_at", null)
      .order("code")
      .range(offset, offset + CATALOG_PAGE_SIZE - 1);

    if (error) throw error;

    const page = (data ?? []) as ItemRow[];
    rows.push(...page);
    if (page.length < CATALOG_PAGE_SIZE) break;
    offset += CATALOG_PAGE_SIZE;
  }

  return rows;
}

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

async function getDepartmentUuid(departmentCode: string): Promise<string> {
  const cached = departmentIdCache.get(departmentCode);
  if (cached) return cached;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("id")
    .eq("code", departmentCode)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    throw new Error(`ไม่พบหน่วยงาน ${departmentCode}`);
  }

  departmentIdCache.set(departmentCode, data.id);
  return data.id;
}

async function fetchDepartmentCodesForItems(itemIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (itemIds.length === 0) return map;

  const supabase = createClient();
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

export async function fetchCatalogItemsForDepartment(departmentCode: string): Promise<CatalogItem[]> {
  const departmentId = await getDepartmentUuid(departmentCode);
  const supabase = createClient();

  const { data, error } = await supabase
    .from("department_items")
    .select(
      `
      id,
      item_id,
      items!inner(
        id, code, name, unit, price, barcode, subgroup_id, deleted_at,
        item_subgroups!inner(id, name, item_groups!inner(name))
      )
    `,
    )
    .eq("department_id", departmentId)
    .is("deleted_at", null)
    .is("items.deleted_at", null);

  if (error) throw error;

  const rows = (data ?? []) as DepartmentItemRow[];
  return rows
    .map((row) => {
      const item = unwrapOne(row.items);
      if (!item) return null;
      return mapItemRow(item, [departmentCode]);
    })
    .filter((item): item is CatalogItem => item !== null)
    .sort((a, b) => a.code.localeCompare(b.code));
}

export async function fetchMasterCatalogItems(): Promise<CatalogItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("items")
    .select(
      `
      id, code, name, unit, price, barcode, subgroup_id,
      item_subgroups!inner(id, name, item_groups!inner(name))
    `,
    )
    .is("deleted_at", null)
    .order("code");

  if (error) throw error;

  const rows = (data ?? []) as ItemRow[];
  const deptMap = await fetchDepartmentCodesForItems(rows.map((r) => r.id));

  return rows.map((row) => mapItemRow(row, deptMap.get(row.id) ?? []));
}

export async function fetchTrashCatalogItems(): Promise<TrashCatalogItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("items")
    .select(
      `
      id, code, name, unit, price, barcode, subgroup_id, deleted_at,
      item_subgroups!inner(id, name, item_groups!inner(name))
    `,
    )
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as (ItemRow & { deleted_at: string })[];
  const deptMap = await fetchDepartmentCodesForItems(rows.map((r) => r.id));

  return rows.map((row) => ({
    ...mapItemRow(row, deptMap.get(row.id) ?? []),
    deletedAt: row.deleted_at,
  }));
}

/** ดึงรายการวัสดุทั้งหมดในฐานข้อมูลกลาง (active) */
export async function fetchAllActiveCatalogItems(): Promise<CatalogItem[]> {
  const supabase = createClient();
  const rows = await fetchAllActiveCatalogItemRows(supabase);
  return rows.map((row) => mapItemRow(row, []));
}

/** ดึงรายการจากฐานข้อมูลกลางที่ยังไม่ได้เพิ่มเข้าหน่วยงาน */
export async function fetchItemsNotYetInDepartment(
  departmentCode: string,
  assignedItemIds?: string[],
): Promise<CatalogItem[]> {
  const allItems = await fetchAllActiveCatalogItems();

  if (assignedItemIds) {
    return itemsNotYetInDepartment(allItems, assignedItemIds);
  }

  const departmentId = await getDepartmentUuid(departmentCode);
  const supabase = createClient();

  const { data: inDeptRows, error: inDeptError } = await supabase
    .from("department_items")
    .select("item_id")
    .eq("department_id", departmentId)
    .is("deleted_at", null);

  if (inDeptError) throw inDeptError;

  const assignedIds = (inDeptRows ?? []).map((row) => row.item_id);
  return itemsNotYetInDepartment(allItems, assignedIds);
}

/** @deprecated ใช้ fetchItemsNotYetInDepartment แทน */
export const fetchCatalogItemsNotInDepartment = fetchItemsNotYetInDepartment;

export async function fetchCatalogGroups(): Promise<CatalogGroupOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("item_groups")
    .select("id, name")
    .is("deleted_at", null)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function fetchCatalogSubgroups(): Promise<CatalogSubgroupOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("item_subgroups")
    .select("id, name, group_id, item_groups!inner(name)")
    .is("deleted_at", null)
    .order("name");

  if (error) throw error;

  return (data ?? []).map((row) => {
    const group = unwrapOne(row.item_groups as { name: string } | { name: string }[] | null);
    return {
      id: row.id,
      name: row.name,
      groupId: row.group_id,
      groupName: group?.name ?? "",
    };
  });
}
