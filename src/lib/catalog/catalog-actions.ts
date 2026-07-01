"use server";

import { revalidatePath } from "next/cache";
import {
  canAccessDepartment,
  canManageCatalogMaster,
} from "@/lib/auth/access";
import { getProfileRow, toAccessProfile } from "@/lib/auth/get-profile";
import type { CatalogItem, CatalogItemInput } from "@/lib/catalog/types";
import {
  assignCatalogItemToDepartment,
  createCatalogItem,
  createMasterCatalogItem,
  permanentlyDeleteCatalogItem,
  purgeExpiredTrashItems,
  removeCatalogItemFromDepartment,
  restoreCatalogItem,
  softDeleteCatalogItem,
  updateCatalogItem,
} from "@/lib/catalog/catalog-db.server";

function revalidateCatalogPaths() {
  revalidatePath("/department");
  revalidatePath("/admin/catalog");
  revalidatePath("/admin/trash");
}

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function requireProfile() {
  const profile = await getProfileRow();
  if (!profile) throw new Error("กรุณาเข้าสู่ระบบ");
  return profile;
}

async function requireDepartmentManager(departmentCode: string) {
  const profile = await requireProfile();
  const userProfile = await toAccessProfile(profile);
  if (canManageCatalogMaster(userProfile) || canAccessDepartment(userProfile, departmentCode)) {
    return profile;
  }
  throw new Error("ไม่มีสิทธิ์ดำเนินการในแผนกนี้");
}

async function requireCatalogAdmin() {
  const profile = await requireProfile();
  const userProfile = await toAccessProfile(profile);
  if (!canManageCatalogMaster(userProfile)) {
    throw new Error("เฉพาะผู้ดูแลระบบเท่านั้น");
  }
  return profile;
}

export async function assignCatalogItemAction(
  itemId: string,
  departmentCode: string,
): Promise<ActionResult<null>> {
  try {
    await requireDepartmentManager(departmentCode);
    await assignCatalogItemToDepartment(itemId, departmentCode);
    revalidateCatalogPaths();
    return { ok: true, data: null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "ดำเนินการไม่สำเร็จ" };
  }
}

export async function removeCatalogItemAction(
  itemId: string,
  departmentCode: string,
): Promise<ActionResult<null>> {
  try {
    await requireDepartmentManager(departmentCode);
    await removeCatalogItemFromDepartment(itemId, departmentCode);
    revalidateCatalogPaths();
    return { ok: true, data: null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "ดำเนินการไม่สำเร็จ" };
  }
}

export async function createCatalogItemAction(
  departmentCode: string,
  input: CatalogItemInput,
): Promise<ActionResult<CatalogItem>> {
  try {
    await requireCatalogAdmin();
    const item = await createCatalogItem(departmentCode, input);
    revalidateCatalogPaths();
    return { ok: true, data: item };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "สร้างรายการไม่สำเร็จ" };
  }
}

export async function updateCatalogItemAction(
  itemId: string,
  departmentCode: string,
  input: CatalogItemInput,
): Promise<ActionResult<CatalogItem>> {
  try {
    await requireCatalogAdmin();
    const item = await updateCatalogItem(itemId, departmentCode, input);
    revalidateCatalogPaths();
    return { ok: true, data: item };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "บันทึกไม่สำเร็จ" };
  }
}

export async function createMasterCatalogItemAction(
  input: CatalogItemInput,
): Promise<ActionResult<CatalogItem>> {
  try {
    await requireCatalogAdmin();
    const item = await createMasterCatalogItem(input);
    revalidateCatalogPaths();
    return { ok: true, data: item };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "สร้างรายการไม่สำเร็จ" };
  }
}

export async function deleteCatalogItemAction(itemId: string): Promise<ActionResult<null>> {
  try {
    await requireCatalogAdmin();
    await softDeleteCatalogItem(itemId);
    revalidateCatalogPaths();
    return { ok: true, data: null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "ลบรายการไม่สำเร็จ" };
  }
}

export async function restoreCatalogItemAction(itemId: string): Promise<ActionResult<null>> {
  try {
    await requireCatalogAdmin();
    await restoreCatalogItem(itemId);
    revalidateCatalogPaths();
    return { ok: true, data: null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "กู้คืนไม่สำเร็จ" };
  }
}

export async function permanentlyDeleteCatalogItemAction(
  itemId: string,
): Promise<ActionResult<null>> {
  try {
    await requireCatalogAdmin();
    await permanentlyDeleteCatalogItem(itemId);
    revalidateCatalogPaths();
    return { ok: true, data: null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "ลบถาวรไม่สำเร็จ" };
  }
}

export async function purgeExpiredTrashAction(): Promise<ActionResult<{ count: number }>> {
  try {
    await requireCatalogAdmin();
    const count = await purgeExpiredTrashItems();
    revalidateCatalogPaths();
    return { ok: true, data: { count } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "ลบถาวรไม่สำเร็จ" };
  }
}
