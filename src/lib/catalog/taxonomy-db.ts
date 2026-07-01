import { createClient } from "@/lib/supabase/client";
import type { CatalogGroupRow, CatalogSubgroupRow } from "@/lib/catalog/taxonomy-types";

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function fetchCatalogTaxonomy(): Promise<{
  groups: CatalogGroupRow[];
  subgroups: CatalogSubgroupRow[];
}> {
  const supabase = createClient();

  const [groupsResult, subgroupsResult, itemCountsResult] = await Promise.all([
    supabase
      .from("item_groups")
      .select("id, name, code, sort_order")
      .is("deleted_at", null)
      .order("sort_order")
      .order("name"),
    supabase
      .from("item_subgroups")
      .select("id, name, code, sort_order, group_id, item_groups!inner(name)")
      .is("deleted_at", null)
      .order("sort_order")
      .order("name"),
    supabase.from("items").select("subgroup_id").is("deleted_at", null),
  ]);

  if (groupsResult.error) throw groupsResult.error;
  if (subgroupsResult.error) throw subgroupsResult.error;
  if (itemCountsResult.error) throw itemCountsResult.error;

  const subgroupCountByGroup = new Map<string, number>();
  const itemCountBySubgroup = new Map<string, number>();

  for (const row of itemCountsResult.data ?? []) {
    itemCountBySubgroup.set(
      row.subgroup_id,
      (itemCountBySubgroup.get(row.subgroup_id) ?? 0) + 1,
    );
  }

  const subgroups: CatalogSubgroupRow[] = (subgroupsResult.data ?? []).map((row) => {
    const group = unwrapOne(row.item_groups as { name: string } | { name: string }[] | null);
    subgroupCountByGroup.set(row.group_id, (subgroupCountByGroup.get(row.group_id) ?? 0) + 1);
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      sortOrder: row.sort_order,
      groupId: row.group_id,
      groupName: group?.name ?? "",
      itemCount: itemCountBySubgroup.get(row.id) ?? 0,
    };
  });

  const groups: CatalogGroupRow[] = (groupsResult.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code,
    sortOrder: row.sort_order,
    subgroupCount: subgroupCountByGroup.get(row.id) ?? 0,
  }));

  return { groups, subgroups };
}
