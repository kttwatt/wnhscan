export const NAV_ITEMS = [
  { label: "หน้าหลัก", href: "/", icon: "layout-dashboard" as const },
  { label: "สแกนทันที", href: "/scan", icon: "scan-line" as const },
  { label: "จดไว้ก่อน", href: "/queue", icon: "clock" as const },
  {
    label: "ปิดรอบสแกน",
    href: "/close-round",
    icon: "clipboard-check" as const,
    managerOrAdminOnly: true,
    badgeKey: "close-round" as const,
  },
  {
    label: "แผนก",
    href: "/department",
    icon: "building-2" as const,
    managerOrAdminOnly: true,
    dynamicDepartmentLabel: true,
  },
  { label: "ผู้ดูแลระบบ", href: "/admin", icon: "shield" as const, adminOnly: true },
] as const;
