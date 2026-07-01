import { AccessDenied } from "@/components/auth/access-denied";
import { canAccessAdmin } from "@/lib/auth/access";
import { getProfile } from "@/lib/auth/get-profile";
import { AdminPageClient } from "./admin-page-client";

export default async function AdminPage() {
  const profile = await getProfile();

  if (!profile || !canAccessAdmin(profile)) {
    return (
      <AccessDenied message="หน้านี้สำหรับผู้ดูแลระบบ (admin) เท่านั้น" />
    );
  }

  return <AdminPageClient />;
}
