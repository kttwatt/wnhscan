import Link from "next/link";
import { AccessDenied } from "@/components/auth/access-denied";
import { PageHeader } from "@/components/layout/page-header";
import { canAccessAdmin } from "@/lib/auth/access";
import { listDepartments } from "@/lib/auth/departments-db.server";
import { getProfile, listProfiles } from "@/lib/auth/get-profile";
import { AdminUsersManager } from "./admin-users-manager";

export default async function AdminUsersPage() {
  const profile = await getProfile();

  if (!profile || !canAccessAdmin(profile)) {
    return (
      <AccessDenied message="หน้านี้สำหรับผู้ดูแลระบบ (admin) เท่านั้น" />
    );
  }

  let users: Awaited<ReturnType<typeof listProfiles>> = [];
  let departments: Awaited<ReturnType<typeof listDepartments>> = [];
  let loadError: string | null = null;
  try {
    [users, departments] = await Promise.all([listProfiles(), listDepartments()]);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ";
    users = [];
    departments = [];
  }

  return (
    <>
      <PageHeader
        title="จัดการผู้ใช้งาน"
        description="สร้างและกำหนดบทบาทผู้ใช้ในระบบ"
        action={
          <Link href="/admin" className="text-sm font-semibold text-blue-primary hover:underline">
            กลับผู้ดูแลระบบ
          </Link>
        }
      />
      <AdminUsersManager
        initialUsers={users}
        departments={departments}
        loadError={loadError}
      />
    </>
  );
}
