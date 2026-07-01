import Link from "next/link";
import { AccessDenied } from "@/components/auth/access-denied";
import { AdminTaxonomyPanel } from "@/components/admin/admin-taxonomy-panel";
import { PageHeader } from "@/components/layout/page-header";
import { canAccessAdmin } from "@/lib/auth/access";
import { getProfile } from "@/lib/auth/get-profile";

export default async function AdminSubgroupMappingPage() {
  const profile = await getProfile();

  if (!profile || !canAccessAdmin(profile)) {
    return (
      <AccessDenied message="หน้านี้สำหรับผู้ดูแลระบบ (admin) เท่านั้น" />
    );
  }

  return (
    <>
      <PageHeader
        title="จัดการหมวดวัสดุ"
        description="หมวดใหญ่และหมวดย่อยในฐานข้อมูลกลาง — ดูภาพรวมและแก้ไขได้จากหน้านี้"
        action={
          <Link href="/admin" className="text-sm font-semibold text-blue-primary hover:underline">
            กลับ
          </Link>
        }
      />
      <div className="p-8 pt-0">
        <AdminTaxonomyPanel />
      </div>
    </>
  );
}
