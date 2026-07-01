"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchDepartments,
  formatDepartmentDisplay,
  type DepartmentRow,
} from "@/lib/auth/departments-db";
import {
  fetchCatalogGroups,
  fetchCatalogSubgroups,
} from "@/lib/catalog/catalog-db";
import { DEFAULT_CATALOG_GROUPS, DEFAULT_CATALOG_SUBGROUPS } from "@/lib/catalog/catalog-helpers";
import type { CatalogItem, CatalogItemInput } from "@/lib/catalog/types";

type DepartmentItemFormModalProps = {
  open: boolean;
  departmentId?: string;
  item?: CatalogItem | null;
  departments?: DepartmentRow[];
  togglingKey?: string | null;
  onToggleDepartment?: (departmentCode: string, assigned: boolean) => Promise<void>;
  onClose: () => void;
  onSave: (input: CatalogItemInput) => Promise<void>;
};

const EMPTY_FORM: CatalogItemInput = {
  code: "",
  name: "",
  barcode: "",
  unit: "",
  price: "",
  group: DEFAULT_CATALOG_GROUPS[0],
  subgroup: DEFAULT_CATALOG_SUBGROUPS[0],
};

export function DepartmentItemFormModal({
  open,
  departmentId,
  item,
  departments = [],
  togglingKey = null,
  onToggleDepartment,
  onClose,
  onSave,
}: DepartmentItemFormModalProps) {
  const [form, setForm] = useState<CatalogItemInput>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [groupOptions, setGroupOptions] = useState<string[]>([...DEFAULT_CATALOG_GROUPS]);
  const [subgroupOptions, setSubgroupOptions] = useState<
    { groupName: string; name: string }[]
  >(DEFAULT_CATALOG_SUBGROUPS.map((name) => ({ groupName: DEFAULT_CATALOG_GROUPS[0], name })));
  const [departmentList, setDepartmentList] = useState<DepartmentRow[]>(departments);
  const isEdit = Boolean(item);

  useEffect(() => {
    if (!open) return;

    Promise.all([fetchCatalogGroups(), fetchCatalogSubgroups()])
      .then(([groups, subgroups]) => {
        if (groups.length > 0) {
          setGroupOptions(groups.map((g) => g.name));
        }
        if (subgroups.length > 0) {
          setSubgroupOptions(
            subgroups.map((sg) => ({ groupName: sg.groupName, name: sg.name })),
          );
        }
      })
      .catch(() => {
        // Keep defaults if fetch fails
      });
  }, [open]);

  useEffect(() => {
    if (!open || !isEdit) return;

    fetchDepartments()
      .then((rows) => setDepartmentList(rows))
      .catch(() => setDepartmentList(departments));
  }, [open, isEdit, departments]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (item) {
      setForm({
        code: item.code,
        name: item.name,
        barcode: item.barcode,
        unit: item.unit,
        price: item.price ?? "",
        group: item.group,
        subgroup: item.subgroup,
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        group: groupOptions[0] ?? EMPTY_FORM.group,
        subgroup:
          subgroupOptions.find((sg) => sg.groupName === (groupOptions[0] ?? EMPTY_FORM.group))
            ?.name ?? EMPTY_FORM.subgroup,
      });
    }
  }, [open, item, groupOptions, subgroupOptions]);

  const filteredSubgroups = useMemo(
    () => subgroupOptions.filter((sg) => sg.groupName === form.group).map((sg) => sg.name),
    [subgroupOptions, form.group],
  );

  const assignedDepartments = useMemo(() => {
    if (!item) return [];
    const codes = new Set(item.departmentIds);
    return departmentList.filter((dept) => codes.has(dept.code));
  }, [departmentList, item]);

  const availableDepartments = useMemo(() => {
    if (!item) return departmentList;
    const codes = new Set(item.departmentIds);
    return departmentList.filter((dept) => !codes.has(dept.code));
  }, [departmentList, item]);

  if (!open) return null;

  function updateField<K extends keyof CatalogItemInput>(key: K, value: CatalogItemInput[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "group") {
        const firstSubgroup = subgroupOptions.find((sg) => sg.groupName === value)?.name;
        if (firstSubgroup) next.subgroup = firstSubgroup;
      }
      return next;
    });
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="catalog-item-form-title"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-surface-card shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="btn-ghost absolute right-3 top-3 z-10"
          aria-label="ปิด"
        >
          <X className="h-5 w-5" />
        </button>

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="border-b border-border px-6 py-4 pr-14">
            <p id="catalog-item-form-title" className="font-semibold text-navy-900">
              {isEdit ? "แก้ไขวัสดุในฐานข้อมูล" : "สร้างวัสดุในฐานข้อมูล"}
            </p>
            <p className="mt-0.5 text-sm text-text-secondary">
              {departmentId
                ? `หน่วยงาน ${departmentId} — บาร์โค้ด Code 128 ใช้สแกนจากสมุดหรือจอ`
                : "ฐานข้อมูลกลาง — บาร์โค้ด Code 128 ใช้สแกนจากสมุดหรือจอ"}
            </p>
          </div>

          <div className="max-h-[min(70vh,520px)] space-y-4 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-sm font-medium text-navy-900">
                  รหัสวัสดุ <span className="text-red-500">*</span>
                </span>
                <input
                  required
                  value={form.code}
                  onChange={(e) => updateField("code", e.target.value)}
                  placeholder="เช่น 10000313"
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-sm font-medium text-navy-900">
                  ชื่อวัสดุ <span className="text-red-500">*</span>
                </span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="ชื่อเต็มตามระบบ IPISS"
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-navy-900">บาร์โค้ด</span>
                <input
                  value={form.barcode}
                  onChange={(e) => updateField("barcode", e.target.value)}
                  placeholder="ว่างไว้ = ใช้รหัสวัสดุ"
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-navy-900">
                  หน่วยนับ <span className="text-red-500">*</span>
                </span>
                <input
                  required
                  value={form.unit}
                  onChange={(e) => updateField("unit", e.target.value)}
                  placeholder="อัน, กล่อง, ม้วน"
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-navy-900">ราคา (บาท)</span>
                <input
                  value={form.price}
                  onChange={(e) => updateField("price", e.target.value)}
                  placeholder="12.50"
                  inputMode="decimal"
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-navy-900">
                  หมวดใหญ่ <span className="text-red-500">*</span>
                </span>
                <select
                  required
                  value={form.group}
                  onChange={(e) => updateField("group", e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20"
                >
                  {groupOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-sm font-medium text-navy-900">
                  หมวดย่อย <span className="text-red-500">*</span>
                </span>
                <select
                  required
                  value={form.subgroup}
                  onChange={(e) => updateField("subgroup", e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20"
                >
                  {(filteredSubgroups.length > 0 ? filteredSubgroups : [form.subgroup]).map(
                    (sg) => (
                      <option key={sg} value={sg}>
                        {sg}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>

            {isEdit && item && onToggleDepartment ? (
              <div className="rounded-lg border border-border bg-surface-page px-4 py-3">
                <p className="text-sm font-medium text-navy-900">หน่วยงานที่ใช้รายการนี้</p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  เพิ่มหรือลบหน่วยงาน — รายการอัปเดตตามแผนกในฐานข้อมูล
                </p>

                {assignedDepartments.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {assignedDepartments.map((dept) => {
                      const busy = togglingKey === `${item.id}:${dept.code}`;
                      return (
                        <span
                          key={dept.id}
                          className="inline-flex items-center gap-1 rounded-full border border-blue-primary/25 bg-white py-1 pl-3 pr-1 text-sm text-navy-900"
                        >
                          {formatDepartmentDisplay(dept)}
                          <button
                            type="button"
                            disabled={busy || saving}
                            onClick={() => void onToggleDepartment(dept.code, false)}
                            className="flex h-6 w-6 items-center justify-center rounded-full text-text-secondary hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            aria-label={`ลบ ${dept.code}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-text-secondary">ยังไม่กำหนดหน่วยงาน</p>
                )}

                {availableDepartments.length > 0 ? (
                  <label className="mt-3 block">
                    <span className="sr-only">เพิ่มหน่วยงาน</span>
                    <div className="relative">
                      <Plus className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                      <select
                        value=""
                        disabled={saving || Boolean(togglingKey)}
                        onChange={(e) => {
                          const code = e.target.value;
                          if (code) void onToggleDepartment(code, true);
                        }}
                        className="w-full appearance-none rounded-lg border border-dashed border-border bg-white py-2.5 pl-9 pr-3 text-sm text-text-secondary outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 disabled:opacity-50"
                      >
                        <option value="">เพิ่มหน่วยงาน…</option>
                        {availableDepartments.map((dept) => (
                          <option key={dept.id} value={dept.code}>
                            {formatDepartmentDisplay(dept)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </label>
                ) : assignedDepartments.length > 0 && departmentList.length > 0 ? (
                  <p className="mt-2 text-xs text-text-muted">กำหนดครบทุกหน่วยงานแล้ว</p>
                ) : null}
              </div>
            ) : null}

            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "กำลังบันทึก…" : isEdit ? "บันทึกการแก้ไข" : "สร้างในฐานข้อมูล"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
