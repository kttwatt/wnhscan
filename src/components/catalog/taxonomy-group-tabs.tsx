"use client";

type TaxonomyGroupTab = {
  id: string;
  label: string;
  hint?: string;
};

type TaxonomyGroupTabsProps = {
  tabs: TaxonomyGroupTab[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
  loading?: boolean;
};

export function TaxonomyGroupTabs({
  tabs,
  value,
  onChange,
  className = "",
  loading = false,
}: TaxonomyGroupTabsProps) {
  return (
    <div
      className={`overflow-x-auto rounded-lg bg-blue-light/50 p-1.5 ${className}`}
      role="tablist"
      aria-label="หมวดใหญ่"
      aria-busy={loading}
    >
      <div className="flex min-w-max gap-2">
        {tabs.map((tab) => {
          const active = !loading && tab.id === value;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={loading}
              onClick={() => onChange(tab.id)}
              className={`shrink-0 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors sm:px-4 ${
                loading
                  ? "cursor-wait animate-pulse bg-white/70 text-text-secondary"
                  : active
                    ? "bg-blue-primary text-white shadow-sm"
                    : "bg-white/70 text-text-secondary hover:bg-white hover:text-navy-900"
              }`}
            >
              {loading ? (
                <>
                  <span className="whitespace-nowrap">{tab.label}</span>
                  <span className="ml-1 inline-block h-3 w-5 align-middle rounded bg-border/70" />
                </>
              ) : (
                <>
                  <span className="whitespace-nowrap">{tab.label}</span>
                  {tab.hint ? (
                    <span
                      className={`ml-1 text-xs font-normal ${active ? "text-white/80" : "text-text-muted"}`}
                    >
                      ({tab.hint})
                    </span>
                  ) : null}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
