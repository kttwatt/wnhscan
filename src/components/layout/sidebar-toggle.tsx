"use client";

import { Menu, PanelLeftClose } from "lucide-react";

type SidebarToggleProps = {
  open: boolean;
  onClick: () => void;
  variant?: "dark" | "light";
};

export function SidebarToggle({ open, onClick, variant = "light" }: SidebarToggleProps) {
  const isDark = variant === "dark";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-label={open ? "ปิดเมนู" : "เมนู"}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
        isDark
          ? "text-white/80 hover:bg-white/10 hover:text-white"
          : "text-navy-900 hover:bg-blue-light hover:text-blue-primary"
      }`}
    >
      {open ? (
        <PanelLeftClose className="h-5 w-5 shrink-0" strokeWidth={1.75} />
      ) : (
        <Menu className="h-5 w-5 shrink-0" strokeWidth={1.75} />
      )}
      <span>{open ? "ปิด" : "menu"}</span>
    </button>
  );
}
