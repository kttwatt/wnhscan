import Link from "next/link";
import { AccessDenied } from "@/components/auth/access-denied";
import { AdminTrashPanel } from "@/components/admin/admin-trash-panel";
import { PageHeader } from "@/components/layout/page-header";
import { canAccessAdmin } from "@/lib/auth/access";
import { getProfile } from "@/lib/auth/get-profile";

export default async function AdminTrashPage() {
  const profile = await getProfile();

  if (!profile || !canAccessAdmin(profile)) {
    return (
      <AccessDenied message="หน้านี้สำหรับผู้ดูแลระบบ (admin) เท่านั้น" />
    );
  }

  return (
    <>
      <PageHeader
        title="ถังขยะ"
        description="กู้คืนหรือลบถาวรรายการวัสดุจากฐานข้อมูลกลาง"
        action={
          <Link href="/admin" className="text-sm font-semibold text-blue-primary hover:underline">
            กลับผู้ดูแลระบบ
          </Link>
        }
      />
      <div className="p-8 pt-0">
        <AdminTrashPanel />
      </div>
    </>
  );
}
