"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarToggle } from "@/components/layout/sidebar-toggle";
import { SessionProvider } from "@/components/auth/session-provider";
import type { UserProfile } from "@/lib/auth/types";

export function DashboardShell({
  profile,
  children,
}: {
  profile: UserProfile;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  function toggleSidebar() {
    setSidebarOpen((v) => !v);
  }

  return (
    <SessionProvider profile={profile}>
      <div className="flex min-h-screen">
        <AppSidebar open={sidebarOpen} onToggle={toggleSidebar} />

        <div className="relative flex min-w-0 flex-1 flex-col">
          {!sidebarOpen ? (
            <div className="flex items-center border-b border-border bg-surface-card px-4 py-3">
              <SidebarToggle open={false} onClick={() => setSidebarOpen(true)} />
            </div>
          ) : null}
          <main className="relative flex flex-1 flex-col bg-surface-page">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
