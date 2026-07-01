"use client";

import { Pencil, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CatalogGroupRow, CatalogSubgroupRow } from "@/lib/catalog/taxonomy-types";

type TaxonomyOverviewProps = {
  groups: CatalogGroupRow[];
  subgroupsByGroup: Map<string, CatalogSubgroupRow[]>;
  searchQuery: string;
  onEditGroup: (group: CatalogGroupRow) => void;
  onCreateSubgroup: (groupId: string) => void;
  onEditSubgroup: (subgroup: CatalogSubgroupRow) => void;
};

function sortSubgroups(rows: CatalogSubgroupRow[]) {
  return [...rows].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name, "th");
  });
}

function matchesSearch(name: string, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return name.toLowerCase().includes(q);
}

export function TaxonomyOverview({
  groups,
  subgroupsByGroup,
  searchQuery,
  onEditGroup,
  onCreateSubgroup,
  onEditSubgroup,
}: TaxonomyOverviewProps) {
  const trimmedQuery = searchQuery.trim();
  const visibleSections = groups
    .map((group) => {
      const allSubgroups = sortSubgroups(subgroupsByGroup.get(group.id) ?? []);
      const filtered = trimmedQuery
        ? allSubgroups.filter((sg) => matchesSearch(sg.name, trimmedQuery))
        : allSubgroups;
      return { group, subgroups: filtered, totalCount: allSubgroups.length };
    })
    .filter(({ subgroups }) => !trimmedQuery || subgroups.length > 0);

  if (visibleSections.length === 0) {
    return (
      <p className="mt-6 py-8 text-center text-sm text-text-secondary">
        {trimmedQuery
          ? `ไม่พบหมวดย่อยที่ตรงกับ "${trimmedQuery}"`
          : "ยังไม่มีหมวดใหญ่ — กดเพิ่มหมวดใหญ่เพื่อเริ่มต้น"}
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {visibleSections.map(({ group, subgroups, totalCount }) => (
        <section key={group.id} className="overflow-hidden rounded-lg border border-border">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-page/50 px-4 py-3">
            <div>
              <h3 className="font-semibold text-navy-900">{group.name}</h3>
              <p className="text-xs text-text-secondary">
                {trimmedQuery
                  ? `แสดง ${subgroups.length} จาก ${totalCount} หมวดย่อย`
                  : `${totalCount} หมวดย่อย`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => onEditGroup(group)} title="แก้ไขหมวดใหญ่">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="secondary" onClick={() => onCreateSubgroup(group.id)}>
                <Plus className="h-4 w-4" /> หมวดย่อย
              </Button>
            </div>
          </div>

          {subgroups.length === 0 ? (
            <p className="px-4 py-6 text-sm text-text-secondary">
              ยังไม่มีหมวดย่อยในหมวดนี้ — กด หมวดย่อย เพื่อเพิ่ม
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {subgroups.map((sg) => (
                <li
                  key={sg.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-page/30"
                >
                  <span className="min-w-0 flex-1 text-sm font-medium text-navy-900">
                    {sg.name}
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-text-secondary">
                    {sg.itemCount} รายการ
                  </span>
                  <Button
                    variant="ghost"
                    onClick={() => onEditSubgroup(sg)}
                    title="แก้ไขหมวดย่อย"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

export function TaxonomyOverviewSkeleton() {
  return (
    <div className="mt-6 space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="overflow-hidden rounded-lg border border-border">
          <div className="border-b border-border bg-surface-page/50 px-4 py-3">
            <div className="h-5 w-40 animate-pulse rounded bg-border" />
            <div className="mt-2 h-3 w-24 animate-pulse rounded bg-border" />
          </div>
          <div className="space-y-0 divide-y divide-border">
            {[1, 2].map((j) => (
              <div key={j} className="flex items-center gap-3 px-4 py-3">
                <div className="h-4 flex-1 animate-pulse rounded bg-border" />
                <div className="h-4 w-16 animate-pulse rounded bg-border" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TaxonomyToolbar({
  searchQuery,
  onSearchChange,
  onCreateGroup,
  groupCount,
  subgroupCount,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onCreateGroup: () => void;
  groupCount: number;
  subgroupCount: number;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={onCreateGroup}>
          <Plus className="h-4 w-4" /> เพิ่มหมวดใหญ่
        </Button>
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาหมวดย่อย…"
            className="w-full rounded-lg border border-border py-2.5 pl-9 pr-3 text-sm"
          />
        </div>
      </div>
      {groupCount > 0 ? (
        <p className="mt-3 text-sm text-text-secondary">
          {groupCount} หมวดใหญ่ · {subgroupCount} หมวดย่อย
        </p>
      ) : null}
    </>
  );
}
