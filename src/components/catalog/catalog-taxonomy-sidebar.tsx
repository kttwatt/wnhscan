"use client";

import { CATALOG_ITEM_GROUPS } from "@/lib/catalog/catalog-groups";
import type { TaxonomyFilterGroup } from "@/lib/catalog/taxonomy-filter";
import { TaxonomyGroupTabs } from "@/components/catalog/taxonomy-group-tabs";

export type TaxonomySidebarSelection = {
  group: string;
  subgroup: string | null;
};

type CatalogTaxonomySidebarProps = {
  groups: TaxonomyFilterGroup[];
  selection: TaxonomySidebarSelection;
  onChange: (selection: TaxonomySidebarSelection) => void;
  className?: string;
  loading?: boolean;
};

const selectClassName =
  "w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/15 sm:max-w-md";

export function CatalogTaxonomySidebar({
  groups,
  selection,
  onChange,
  className = "",
  loading = false,
}: CatalogTaxonomySidebarProps) {
  const groupByName = new Map(groups.map((g) => [g.name, g]));
  const activeGroup = groupByName.get(selection.group) ?? groups[0];

  const tabs = CATALOG_ITEM_GROUPS.map((name) => {
    const group = groupByName.get(name);
    return {
      id: name,
      label: name,
      hint: String(group?.count ?? 0),
    };
  });

  function selectGroup(groupName: string) {
    onChange({ group: groupName, subgroup: null });
  }

  function selectSubgroup(subgroupName: string | null) {
    onChange({ group: selection.group, subgroup: subgroupName });
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <TaxonomyGroupTabs
        tabs={tabs}
        value={selection.group}
        onChange={selectGroup}
        loading={loading}
      />

      {loading ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <span className="shrink-0 text-sm font-medium text-navy-900">หมวดย่อย</span>
          <div className="h-10 w-full animate-pulse rounded-lg bg-border/60 sm:max-w-md" />
        </div>
      ) : activeGroup ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <label htmlFor="catalog-subgroup-filter" className="shrink-0 text-sm font-medium text-navy-900">
            หมวดย่อย
          </label>
          <select
            id="catalog-subgroup-filter"
            value={selection.subgroup ?? ""}
            onChange={(e) => selectSubgroup(e.target.value || null)}
            className={selectClassName}
            aria-label="หมวดย่อย"
          >
            <option value="">
              ทั้งหมดในหมวดนี้ ({activeGroup.count})
            </option>
            {activeGroup.subgroups.map((sg) => (
              <option key={sg.name} value={sg.name}>
                {sg.name} ({sg.count})
              </option>
            ))}
          </select>
          <p className="text-xs text-text-secondary sm:ml-auto">
            {activeGroup.name} · {activeGroup.count} รายการ
          </p>
        </div>
      ) : null}
    </div>
  );
}
