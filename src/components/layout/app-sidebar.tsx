"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ClipboardCheck,
  Clock,
  LayoutDashboard,
  ScanLine,
  Shield,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/i18n/nav";
import { SidebarToggle } from "@/components/layout/sidebar-toggle";
import { LogoutButton } from "@/components/auth/logout-button";
import { useSession } from "@/components/auth/session-provider";
import { canAccessDepartmentPage, isAdmin, selectableDepartments } from "@/lib/auth/access";
import { formatDepartmentLabel } from "@/lib/auth/departments";
import { formatUserRole } from "@/lib/auth/roles";
import { useCloseRoundPendingCount } from "@/lib/hooks/use-close-round-pending-count";

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  "scan-line": ScanLine,
  clock: Clock,
  "clipboard-check": ClipboardCheck,
  "building-2": Building2,
  shield: Shield,
} as const;

type AppSidebarProps = {
  open: boolean;
  onToggle: () => void;
};

export function AppSidebar({
  open,
  onToggle,
}: AppSidebarProps) {
  const pathname = usePathname();
  const profile = useSession();
  const isManager = canAccessDepartmentPage(profile);
  const userIsAdmin = isAdmin(profile);
  const closeRoundPendingCount = useCloseRoundPendingCount();

  function navLabel(item: (typeof NAV_ITEMS)[number]): string {
    if ("dynamicDepartmentLabel" in item && item.dynamicDepartmentLabel) {
      const depts = selectableDepartments(profile);
      if (depts.length === 1) return formatDepartmentLabel(depts[0]);
    }
    return item.label;
  }

  return (
    <aside
      className={`flex shrink-0 flex-col overflow-hidden bg-navy-900 text-white transition-[width] duration-200 ease-in-out ${
        open ? "w-[220px]" : "w-0"
      }`}
    >
      <div className="flex w-[220px] min-w-[220px] flex-col min-h-screen">
        <div className="border-b border-white/10 px-4 py-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold tracking-tight text-white">WHN-Scan</p>
              <p className="mt-0.5 text-xs text-white/50">wnhscan</p>
            </div>
            <SidebarToggle open onClick={onToggle} variant="dark" />
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV_ITEMS.filter((item) => {
            if ("adminOnly" in item && item.adminOnly && !userIsAdmin) return false;
            if ("managerOnly" in item && item.managerOnly && !isManager) return false;
            if (
              "managerOrAdminOnly" in item &&
              item.managerOrAdminOnly &&
              !isManager &&
              !userIsAdmin
            ) {
              return false;
            }
            return true;
          }).map(
            (item) => {
              const Icon = iconMap[item.icon];
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const badge =
                "badgeKey" in item &&
                item.badgeKey === "close-round" &&
                closeRoundPendingCount > 0
                  ? closeRoundPendingCount
                  : null;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
                  <span className="flex-1">{navLabel(item)}</span>
                  {badge !== null ? (
                    <span className="rounded-full bg-yellow-accent px-2 py-0.5 text-xs font-bold text-navy-900">
                      {badge}
                    </span>
                  ) : null}
                </Link>
              );
            },
          )}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-lg bg-navy-800 px-3 py-3">
            <p className="text-xs text-white/50">ผู้ใช้งาน</p>
            <p className="mt-0.5 truncate text-sm font-medium text-white">{profile.email}</p>
            <p className="mt-1 text-xs text-white/40">{formatUserRole(profile.role)}</p>
            <LogoutButton />
          </div>
        </div>
      </div>
    </aside>
  );
}
