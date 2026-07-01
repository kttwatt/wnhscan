import Link from "next/link";
import { AccessDenied } from "@/components/auth/access-denied";
import { AdminCatalogPanel } from "@/components/admin/admin-catalog-panel";
import { PageHeader } from "@/components/layout/page-header";
import { canAccessAdmin } from "@/lib/auth/access";
import { listDepartments } from "@/lib/auth/departments-db.server";
import { getProfile } from "@/lib/auth/get-profile";

export default async function AdminCatalogPage() {
  const profile = await getProfile();

  if (!profile || !canAccessAdmin(profile)) {
    return (
      <AccessDenied message="หน้านี้สำหรับผู้ดูแลระบบ (admin) เท่านั้น" />
    );
  }

  let departments: Awaited<ReturnType<typeof listDepartments>> = [];
  let loadError: string | null = null;
  try {
    departments = await listDepartments();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "โหลดหน่วยงานไม่สำเร็จ";
  }

  return (
    <>
      <PageHeader
        title="ฐานข้อมูลวัสดุกลาง"
        description="จัดการรายการวัสดุทั้งหมดและกำหนดหน่วยงาน"
        action={
          <Link href="/admin" className="text-sm font-semibold text-blue-primary hover:underline">
            กลับผู้ดูแลระบบ
          </Link>
        }
      />
      <div className="p-8 pt-0">
        {loadError ? (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>
        ) : null}
        <AdminCatalogPanel departments={departments} />
      </div>
    </>
  );
}
