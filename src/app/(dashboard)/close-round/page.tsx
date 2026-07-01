import { AccessDenied } from "@/components/auth/access-denied";
import { canAccessCloseRound } from "@/lib/auth/access";
import { getProfile } from "@/lib/auth/get-profile";
import { CloseRoundPageClient } from "./close-round-page-client";

export default async function CloseRoundPage() {
  const profile = await getProfile();

  if (!profile || !canAccessCloseRound(profile)) {
    return (
      <AccessDenied message="หน้านี้สำหรับผู้จัดการแผนกและผู้ดูแลระบบเท่านั้น" />
    );
  }

  return <CloseRoundPageClient />;
}
