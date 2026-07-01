"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Package, Users } from "lucide-react";
import { CatalogTaxonomySidebar } from "@/components/catalog/catalog-taxonomy-sidebar";
import { DepartmentCatalogAssignRow } from "@/components/department/department-catalog-assign-row";
import { DepartmentCatalogItemRow } from "@/components/department/department-catalog-item-row";
import { CatalogPrintPreview } from "@/components/department/catalog-print-preview";
import { CatalogPrintScopeMenu } from "@/components/department/catalog-print-scope-menu";
import { DepartmentUsersModal } from "@/components/department/department-users-modal";
import { Button } from "@/components/ui/button";
import { ItemSearchField } from "@/components/ui/item-search-field";
import { PageTabs } from "@/components/ui/page-tabs";
import { CATALOG_ITEM_GROUPS } from "@/lib/catalog/catalog-groups";
import { groupCatalogItems } from "@/lib/catalog/catalog-helpers";
import {
  catalogPrintScopeLabel,
  filterItemsForPrintScope,
  type CatalogPrintScope,
} from "@/lib/catalog/catalog-print-scope";
import {
  buildTaxonomyFilterFromItems,
  buildTaxonomyFilterFromTaxonomy,
  defaultCatalogGroupFilter,
} from "@/lib/catalog/taxonomy-filter";
import { searchItems } from "@/lib/catalog/search-items";
import { sortCatalogItems } from "@/lib/catalog/sort-items";
import type { CatalogItem } from "@/lib/catalog/types";
import { useCatalogItems } from "@/lib/hooks/use-catalog-items";
import { useCatalogSubgroups } from "@/lib/hooks/use-catalog-subgroups";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { useDepartmentUsers } from "@/lib/hooks/use-department-users";
import { useItemsNotYetInDepartment } from "@/lib/hooks/use-items-not-yet-in-department";

type DepartmentCatalogPanelProps = {
  departmentId: string;
};

type CatalogTabId = "assigned" | "available";

const TABLE_HEADERS = ["รหัส", "ชื่อ", "บาร์โค้ด", "หน่วย", "ราคา", ""] as const;

function filterCatalogItems(
  source: CatalogItem[],
  groupFilter: string,
  subgroupFilter: string | null,
  search: string,
): CatalogItem[] {
  let result = sortCatalogItems(source);
  result = result.filter((item) => item.group === groupFilter);
  if (subgroupFilter) result = result.filter((item) => item.subgroup === subgroupFilter);
  const q = search.trim();
  if (q) result = searchItems(result, q);
  return result;
}

export function DepartmentCatalogPanel({ departmentId }: DepartmentCatalogPanelProps) {
  const { items, loading, error, removeItem, assignItem } = useCatalogItems(departmentId);
  const { subgroups: taxonomySubgroups, loading: taxonomySubgroupsLoading, error: taxonomyError } =
    useCatalogSubgroups();
  const [activeTab, setActiveTab] = useState<CatalogTabId>("assigned");
  const [availableTabVisited, setAvailableTabVisited] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 200);
  const [groupFilter, setGroupFilter] = useState<string>(CATALOG_ITEM_GROUPS[0]);
  const [subgroupFilter, setSubgroupFilter] = useState<string | null>(null);
  const [groupInitialized, setGroupInitialized] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CatalogItem | null>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [printScope, setPrintScope] = useState<CatalogPrintScope>({ type: "all" });
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  const assignedItemIds = useMemo(() => items.map((item) => item.id), [items]);
  const {
    items: availableItems,
    loading: availableLoading,
    error: availableError,
    refresh: refreshAvailable,
  } = useItemsNotYetInDepartment(assignedItemIds, activeTab === "available");

  const { users: deptUsers, loading: usersLoading } = useDepartmentUsers(departmentId, usersOpen);

  const activeSourceItems = activeTab === "assigned" ? items : availableItems;

  const taxonomyGroups = useMemo(() => {
    if (taxonomySubgroups.length > 0) {
      return buildTaxonomyFilterFromTaxonomy(taxonomySubgroups, activeSourceItems);
    }
    return buildTaxonomyFilterFromItems(activeSourceItems);
  }, [taxonomySubgroups, activeSourceItems]);

  useEffect(() => {
    if (activeTab === "available") setAvailableTabVisited(true);
  }, [activeTab]);

  useEffect(() => {
    setGroupInitialized(false);
    setAvailableTabVisited(false);
  }, [departmentId]);

  useEffect(() => {
    if (groupInitialized) return;
    if (taxonomySubgroups.length === 0 && activeSourceItems.length === 0) return;
    setGroupFilter(defaultCatalogGroupFilter(taxonomyGroups));
    setGroupInitialized(true);
  }, [taxonomyGroups, taxonomySubgroups.length, activeSourceItems.length, groupInitialized]);

  useEffect(() => {
    setGroupInitialized(false);
  }, [activeTab, departmentId]);

  const filteredItems = useMemo(
    () => filterCatalogItems(items, groupFilter, subgroupFilter, debouncedSearch),
    [items, groupFilter, subgroupFilter, debouncedSearch],
  );

  const filteredAvailableItems = useMemo(
    () => filterCatalogItems(availableItems, groupFilter, subgroupFilter, debouncedSearch),
    [availableItems, groupFilter, subgroupFilter, debouncedSearch],
  );

  const groupedItems = useMemo(() => groupCatalogItems(filteredItems), [filteredItems]);
  const groupedAvailableItems = useMemo(
    () => groupCatalogItems(filteredAvailableItems),
    [filteredAvailableItems],
  );

  const printTaxonomyGroups = useMemo(() => {
    if (taxonomySubgroups.length > 0) {
      return buildTaxonomyFilterFromTaxonomy(taxonomySubgroups, items);
    }
    return buildTaxonomyFilterFromItems(items);
  }, [taxonomySubgroups, items]);

  const printItems = useMemo(
    () => filterItemsForPrintScope(items, printScope),
    [items, printScope],
  );

  const printGroupedItems = useMemo(() => groupCatalogItems(printItems), [printItems]);

  const hasActiveFilter = Boolean(searchQuery.trim() || subgroupFilter);
  const isSearching = searchQuery.trim() !== debouncedSearch.trim();
  const isAssignedTab = activeTab === "assigned";
  const tabSourceCount = isAssignedTab ? items.length : availableItems.length;
  const tabFilteredCount = isAssignedTab ? filteredItems.length : filteredAvailableItems.length;

  const catalogTabs = useMemo(
    () => [
      {
        id: "assigned",
        label:
          loading && items.length === 0
            ? "รายการในแผนก"
            : `รายการในแผนก ${items.length} รายการ`,
        loading,
      },
      {
        id: "available",
        label:
          availableTabVisited && !availableLoading
            ? `เพิ่มได้จากฐานข้อมูล ${availableItems.length} รายการ`
            : "เพิ่มได้จากฐานข้อมูล",
        loading: availableTabVisited && availableLoading,
      },
    ],
    [items.length, availableItems.length, availableTabVisited, loading, availableLoading],
  );

  const handleDelete = useCallback((item: CatalogItem) => {
    setDeleteTarget(item);
  }, []);

  async function confirmDelete() {
    if (!deleteTarget) return;
    await removeItem(deleteTarget.id);
    setDeleteTarget(null);
    if (activeTab === "available") await refreshAvailable();
  }

  async function handleAssign(item: CatalogItem) {
    setAssigningId(item.id);
    setAssignError(null);
    try {
      await assignItem(item.id);
      await refreshAvailable();
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : "เพิ่มรายการไม่สำเร็จ");
    } finally {
      setAssigningId(null);
    }
  }

  const usersLabel =
    usersOpen && usersLoading
      ? "ผู้ใช้ในแผนก…"
      : usersOpen && !usersLoading
        ? `ผู้ใช้ในแผนก (${deptUsers.length})`
        : "ผู้ใช้ในแผนก";

  const isTabLoading = isAssignedTab ? loading : availableLoading;
  const taxonomyBarLoading = isTabLoading || taxonomySubgroupsLoading;
  const activeGroupedItems = isAssignedTab ? groupedItems : groupedAvailableItems;
  const showTaxonomySection =
    taxonomyBarLoading || (isAssignedTab ? items.length > 0 || hasActiveFilter : true);
  const showAssignedEmpty = !taxonomyBarLoading && isAssignedTab && items.length === 0;

  return (
    <>
      <div className="card-whitespace">
        <PageTabs tabs={catalogTabs} value={activeTab} onChange={(id) => setActiveTab(id as CatalogTabId)} />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {isAssignedTab ? (
            <CatalogPrintScopeMenu
              groups={printTaxonomyGroups}
              totalCount={items.length}
              disabled={loading}
              onSelect={(scope) => {
                setPrintScope(scope);
                setPrintOpen(true);
              }}
            />
          ) : null}

          <div className="min-w-[200px] flex-1 sm:min-w-[240px]">
            <ItemSearchField
              id="catalog-item-search"
              layout="inline"
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="ค้นหา ชื่อ / รหัส / บาร์โค้ด..."
            />
          </div>

          <button
            type="button"
            onClick={() => setUsersOpen(true)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-primary hover:underline"
          >
            <Users className="h-4 w-4" />
            {usersLabel}
          </button>
        </div>

        <p className="mt-3 text-xs text-text-secondary">
          {hasActiveFilter
            ? `แสดง ${tabFilteredCount} จาก ${tabSourceCount} รายการ${isSearching ? " (กำลังค้นหา…)" : ""}`
            : `ทั้งหมด ${tabSourceCount} รายการ`}
        </p>

        {error || taxonomyError || assignError || (!isAssignedTab && availableError) ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error ?? assignError ?? availableError ?? taxonomyError}
          </p>
        ) : null}

        {showAssignedEmpty ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-page px-6 py-14 text-center">
            <Package className="h-12 w-12 text-text-muted" />
            <p className="mt-4 text-lg font-semibold text-navy-900">ยังไม่มีวัสดุในหน่วยงานนี้</p>
            <p className="mt-1 max-w-md text-sm text-text-secondary">
              ไปที่แท็บ &quot;เพิ่มได้จากฐานข้อมูล&quot; เพื่อเลือกรายการจากฐานข้อมูลกลาง
            </p>
            <Button variant="primary" className="mt-4" onClick={() => setActiveTab("available")}>
              ไปที่แท็บเพิ่มได้
            </Button>
          </div>
        ) : showTaxonomySection ? (
          <div className="mt-6 flex flex-col gap-4">
            <CatalogTaxonomySidebar
              groups={taxonomyGroups}
              selection={{ group: groupFilter, subgroup: subgroupFilter }}
              loading={taxonomyBarLoading}
              onChange={({ group, subgroup }) => {
                setGroupFilter(group);
                setSubgroupFilter(subgroup);
              }}
            />

            {taxonomyBarLoading ? (
              <p className="py-6 text-center text-sm text-text-secondary">
                {isAssignedTab ? "กำลังโหลดรายการวัสดุ…" : "กำลังโหลดรายการที่เพิ่มได้…"}
              </p>
            ) : tabFilteredCount === 0 ? (
              <div className="rounded-xl border border-border bg-surface-page px-6 py-10 text-center">
                <p className="font-medium text-navy-900">
                  {!isAssignedTab && tabSourceCount === 0
                    ? "เพิ่มครบทุกรายการในฐานข้อมูลกลางแล้ว"
                    : "ไม่พบรายการตามตัวกรอง"}
                </p>
                {isAssignedTab || tabSourceCount > 0 ? (
                  <p className="mt-1 text-sm text-text-secondary">ลองเปลี่ยนคำค้นหาหรือหมวดย่อย</p>
                ) : null}
              </div>
            ) : (
              <div className="min-w-0 space-y-6">
                {activeGroupedItems.map(({ key, items: groupItems }) => (
                  <section key={key}>
                    <p className="mb-3 text-xs font-semibold text-text-muted">
                      ── {key} ({groupItems.length}) ──
                    </p>
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full min-w-[800px] text-left text-sm">
                        <thead className="bg-surface-page">
                          <tr className="border-b border-border text-text-secondary">
                            {TABLE_HEADERS.map((h) => (
                              <th key={h || "actions"} className="px-4 py-3 font-semibold">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {groupItems.map((item) =>
                            isAssignedTab ? (
                              <DepartmentCatalogItemRow
                                key={item.id}
                                item={item}
                                onDelete={handleDelete}
                              />
                            ) : (
                              <DepartmentCatalogAssignRow
                                key={item.id}
                                item={item}
                                assigning={assigningId === item.id}
                                onAssign={(row) => void handleAssign(row)}
                              />
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <CatalogPrintPreview
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        departmentId={departmentId}
        groupedItems={printGroupedItems}
        totalCount={items.length}
        filteredCount={printItems.length}
        scopeLabel={catalogPrintScopeLabel(printScope)}
      />

      <DepartmentUsersModal
        open={usersOpen}
        departmentId={departmentId}
        users={deptUsers}
        loading={usersLoading}
        onClose={() => setUsersOpen(false)}
      />

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-surface-card p-6 shadow-xl">
            <p className="font-semibold text-navy-900">ลบวัสดุออกจากแผนก?</p>
            <p className="mt-2 text-sm text-text-secondary">
              <span className="font-medium text-blue-primary">{deleteTarget.code}</span> —{" "}
              {deleteTarget.name}
              <br />
              รายการจะหายจากหน่วยงาน {departmentId}
              <br />
              ข้อมูลในฐานข้อมูลกลางยังอยู่ — เพิ่มกลับได้ภายหลัง
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                ยกเลิก
              </Button>
              <Button variant="danger" onClick={() => void confirmDelete()}>
                ลบออกจากหน่วยงาน
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
