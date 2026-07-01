"use client";

import { Loader2 } from "lucide-react";

type PageTab = {
  id: string;
  label: string;
  loading?: boolean;
};

type PageTabsProps = {
  tabs: PageTab[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
};

export function PageTabs({ tabs, value, onChange, className = "" }: PageTabsProps) {
  return (
    <div
      className={`flex gap-2 rounded-lg bg-blue-light/50 p-1.5 ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-busy={tab.loading || undefined}
            onClick={() => onChange(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors ${
              active
                ? "bg-blue-primary text-white shadow-sm"
                : "bg-white/70 text-text-secondary hover:bg-white hover:text-navy-900"
            }`}
          >
            <span>{tab.label}</span>
            {tab.loading ? (
              <Loader2
                className={`h-4 w-4 shrink-0 animate-spin ${active ? "text-white/90" : "text-text-muted"}`}
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
