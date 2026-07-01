import { AccessDenied } from "@/components/auth/access-denied";
import { canAccessDepartmentPage } from "@/lib/auth/access";
import { getProfile } from "@/lib/auth/get-profile";
import { DepartmentPageClient } from "./department-page-client";

export default async function DepartmentPage() {
  const profile = await getProfile();

  if (!profile || !canAccessDepartmentPage(profile)) {
    return (
      <AccessDenied message="หน้านี้สำหรับผู้จัดการแผนกและผู้ดูแลระบบเท่านั้น" />
    );
  }

  return <DepartmentPageClient />;
}
