"use server";

import { revalidatePath } from "next/cache";
import { canManageCatalogMaster } from "@/lib/auth/access";
import { getProfileRow, toAccessProfile } from "@/lib/auth/get-profile";
import type { CatalogGroupRow, CatalogSubgroupRow, GroupInput, SubgroupInput } from "@/lib/catalog/taxonomy-types";
import {
  createItemGroup,
  createItemSubgroup,
  updateItemGroup,
  updateItemSubgroup,
} from "@/lib/catalog/taxonomy-db.server";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

function revalidateTaxonomyPaths() {
  revalidatePath("/admin/subgroup-mapping");
  revalidatePath("/admin/catalog");
  revalidatePath("/department");
}

async function requireCatalogAdmin() {
  const profile = await getProfileRow();
  if (!profile) throw new Error("กรุณาเข้าสู่ระบบ");
  const userProfile = await toAccessProfile(profile);
  if (!canManageCatalogMaster(userProfile)) {
    throw new Error("เฉพาะผู้ดูแลระบบเท่านั้น");
  }
  return profile;
}

export async function createGroupAction(input: GroupInput): Promise<ActionResult<CatalogGroupRow>> {
  try {
    await requireCatalogAdmin();
    const data = await createItemGroup(input);
    revalidateTaxonomyPaths();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "สร้างไม่สำเร็จ" };
  }
}

export async function updateGroupAction(
  groupId: string,
  input: GroupInput,
): Promise<ActionResult<CatalogGroupRow>> {
  try {
    await requireCatalogAdmin();
    const data = await updateItemGroup(groupId, input);
    revalidateTaxonomyPaths();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "บันทึกไม่สำเร็จ" };
  }
}

export async function createSubgroupAction(
  input: SubgroupInput,
): Promise<ActionResult<CatalogSubgroupRow>> {
  try {
    await requireCatalogAdmin();
    const data = await createItemSubgroup(input);
    revalidateTaxonomyPaths();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "สร้างไม่สำเร็จ" };
  }
}

export async function updateSubgroupAction(
  subgroupId: string,
  input: SubgroupInput,
): Promise<ActionResult<CatalogSubgroupRow>> {
  try {
    await requireCatalogAdmin();
    const data = await updateItemSubgroup(subgroupId, input);
    revalidateTaxonomyPaths();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "บันทึกไม่สำเร็จ" };
  }
}
