"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Package, Pencil, Plus, Trash2 } from "lucide-react";
import { BarcodeLabel } from "@/components/catalog/barcode-label";
import { DepartmentItemFormModal } from "@/components/department/department-item-form-modal";
import { Button } from "@/components/ui/button";
import { ItemSearchField } from "@/components/ui/item-search-field";
import type { DepartmentRow } from "@/lib/auth/departments-db";
import {
  groupCatalogItems,
  uniqueGroups,
  uniqueSubgroups,
} from "@/lib/catalog/catalog-helpers";
import { searchItems } from "@/lib/catalog/search-items";
import { sortCatalogItems } from "@/lib/catalog/sort-items";
import type { CatalogItem } from "@/lib/catalog/types";
import { useMasterCatalogItems } from "@/lib/hooks/use-master-catalog-items";

type AdminCatalogPanelProps = {
  departments: DepartmentRow[];
};

export function AdminCatalogPanel({ departments }: AdminCatalogPanelProps) {
  const {
    items,
    loading,
    error,
    togglingKey,
    createItem,
    updateItem,
    deleteItem,
    toggleDepartment,
  } = useMasterCatalogItems();

  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [subgroupFilter, setSubgroupFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CatalogItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CatalogItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const editingItem = useMemo(
    () => (editTarget ? items.find((item) => item.id === editTarget.id) ?? editTarget : null),
    [items, editTarget],
  );

  const groupOptions = useMemo(() => uniqueGroups(items), [items]);
  const subgroupOptions = useMemo(
    () => uniqueSubgroups(items, groupFilter || undefined),
    [items, groupFilter],
  );

  const filteredItems = useMemo(() => {
    let result = sortCatalogItems(items);
    if (groupFilter) result = result.filter((item) => item.group === groupFilter);
    if (subgroupFilter) result = result.filter((item) => item.subgroup === subgroupFilter);
    const q = searchQuery.trim();
    if (q) result = searchItems(result, q);
    return result;
  }, [items, groupFilter, subgroupFilter, searchQuery]);

  const groupedItems = useMemo(() => groupCatalogItems(filteredItems), [filteredItems]);
  const hasActiveFilter = Boolean(searchQuery.trim() || groupFilter || subgroupFilter);

  async function handleSave(input: Parameters<typeof createItem>[0]) {
    if (editTarget) {
      await updateItem(editTarget.id, input);
    } else {
      await createItem(input);
    }
    setEditTarget(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteItem(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  function openCreate() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function openEdit(item: CatalogItem) {
    setEditTarget(item);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditTarget(null);
  }

  return (
    <>
      <div className="card-whitespace">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text-secondary">
            จัดการรายการวัสดุในฐานข้อมูลกลาง — สร้าง แก้ไข กำหนดหน่วยงาน และย้ายไปถังขยะ
          </p>
          <Button variant="primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> สร้างรายการใหม่
          </Button>
        </div>

        <div className="mt-4 rounded-xl border border-blue-primary/15 bg-gradient-to-br from-blue-light/80 via-white to-blue-light/40 p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-navy-900">ค้นหาและกรองรายการ</p>
          <div className="flex flex-wrap items-end gap-3">
            <ItemSearchField
              id="admin-catalog-search"
              layout="inline"
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="ค้นหา ชื่อ / รหัส / บาร์โค้ด..."
            />
            <select
              value={groupFilter}
              onChange={(e) => {
                setGroupFilter(e.target.value);
                setSubgroupFilter("");
              }}
              className="rounded-xl border-2 border-blue-primary/20 bg-white px-4 py-3.5 text-sm shadow-sm outline-none transition-all hover:border-blue-primary/35 focus:border-blue-primary focus:ring-4 focus:ring-blue-primary/15"
            >
              <option value="">หมวดใหญ่ — ทั้งหมด</option>
              {groupOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <select
              value={subgroupFilter}
              onChange={(e) => setSubgroupFilter(e.target.value)}
              className="rounded-xl border-2 border-blue-primary/20 bg-white px-4 py-3.5 text-sm shadow-sm outline-none transition-all hover:border-blue-primary/35 focus:border-blue-primary focus:ring-4 focus:ring-blue-primary/15"
            >
              <option value="">หมวดย่อย — ทั้งหมด</option>
              {subgroupOptions.map((sg) => (
                <option key={sg} value={sg}>
                  {sg}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-3 text-xs text-text-secondary">
            {hasActiveFilter
              ? `แสดง ${filteredItems.length} จาก ${items.length} รายการ`
              : `ทั้งหมด ${items.length} รายการ`}
          </p>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        {loading ? (
          <p className="mt-8 text-center text-sm text-text-secondary">กำลังโหลดฐานข้อมูลกลาง…</p>
        ) : items.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-page px-6 py-14 text-center">
            <Package className="h-12 w-12 text-text-muted" />
            <p className="mt-4 text-lg font-semibold text-navy-900">ยังไม่มีรายการในฐานข้อมูลกลาง</p>
            <Button className="mt-6" variant="primary" onClick={openCreate}>
              <Plus className="h-4 w-4" /> สร้างรายการแรก
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="mt-8 rounded-xl border border-border bg-surface-page px-6 py-10 text-center">
            <p className="font-medium text-navy-900">ไม่พบรายการตามตัวกรอง</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {groupedItems.map(({ key, items: groupItems }) => (
              <section key={key}>
                <p className="mb-3 text-xs font-semibold text-text-muted">
                  ── {key} ({groupItems.length}) ──
                </p>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="bg-surface-page">
                      <tr className="border-b border-border text-text-secondary">
                        <th className="px-4 py-3 font-semibold">รหัส</th>
                        <th className="px-4 py-3 font-semibold">ชื่อ</th>
                        <th className="px-4 py-3 font-semibold">บาร์โค้ด</th>
                        <th className="px-4 py-3 font-semibold">หน่วย</th>
                        <th className="px-4 py-3 font-semibold">ราคา</th>
                        <th className="px-4 py-3 font-semibold" />
                      </tr>
                    </thead>
                    <tbody>
                      {groupItems.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-border/60 last:border-0"
                        >
                          <td className="px-4 py-3 font-medium text-blue-primary">{item.code}</td>
                          <td className="px-4 py-3 text-navy-900">{item.name}</td>
                          <td className="px-4 py-3">
                            <BarcodeLabel value={item.barcode} />
                          </td>
                          <td className="px-4 py-3 text-text-secondary">{item.unit}</td>
                          <td className="px-4 py-3 tabular-nums text-text-secondary">
                            {item.price ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" onClick={() => openEdit(item)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" onClick={() => setDeleteTarget(item)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <DepartmentItemFormModal
        open={formOpen}
        item={editingItem}
        departments={departments}
        togglingKey={togglingKey}
        onToggleDepartment={
          editingItem
            ? (departmentCode, assigned) =>
                toggleDepartment(editingItem.id, departmentCode, assigned)
            : undefined
        }
        onClose={closeForm}
        onSave={handleSave}
      />

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-surface-card p-6 shadow-xl">
            <p className="font-semibold text-navy-900">ย้ายรายการไปถังขยะ?</p>
            <p className="mt-2 text-sm text-text-secondary">
              <span className="font-medium text-blue-primary">{deleteTarget.code}</span> —{" "}
              {deleteTarget.name}
              <br />
              รายการจะหายจากฐานข้อมูลกลางและทุกหน่วยงาน — กู้คืนได้จาก{" "}
              <Link href="/admin/trash" className="font-medium text-blue-primary hover:underline">
                ถังขยะ
              </Link>{" "}
              ภายใน 30 วัน
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                ยกเลิก
              </Button>
              <Button variant="danger" onClick={() => void confirmDelete()} disabled={deleting}>
                {deleting ? "กำลังลบ…" : "ย้ายไปถังขยะ"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
