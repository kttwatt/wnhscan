import { ProfileIncomplete } from "@/components/auth/profile-incomplete";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getProfile } from "@/lib/auth/get-profile";
import { MOCK_PROFILE } from "@/lib/auth/mock-profile";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return <DashboardShell profile={MOCK_PROFILE}>{children}</DashboardShell>;
  }

  const profile = await getProfile();

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col bg-surface-page">
        <ProfileIncomplete />
      </div>
    );
  }

  return <DashboardShell profile={profile}>{children}</DashboardShell>;
}
