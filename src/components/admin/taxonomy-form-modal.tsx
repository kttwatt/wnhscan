"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GroupInput, SubgroupInput } from "@/lib/catalog/taxonomy-types";

export type TaxonomyFormKind = "group" | "subgroup";

type TaxonomyFormModalProps = {
  kind: TaxonomyFormKind;
  mode: "create" | "edit";
  open: boolean;
  parentGroupName?: string;
  initial: GroupInput | SubgroupInput;
  error: string | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: GroupInput | SubgroupInput) => void;
};

export function TaxonomyFormModal({
  kind,
  mode,
  open,
  parentGroupName,
  initial,
  error,
  saving,
  onClose,
  onSubmit,
}: TaxonomyFormModalProps) {
  const [name, setName] = useState(initial.name);
  const [code, setCode] = useState(initial.code ?? "");
  const [sortOrder, setSortOrder] = useState(initial.sortOrder ?? "0");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const advancedId = useId();

  const title =
    kind === "group"
      ? mode === "edit"
        ? "แก้ไขหมวดใหญ่"
        : "เพิ่มหมวดใหญ่"
      : mode === "edit"
        ? "แก้ไขหมวดย่อย"
        : "เพิ่มหมวดย่อย";

  useEffect(() => {
    if (!open) return;
    setName(initial.name);
    setCode(initial.code ?? "");
    setSortOrder(initial.sortOrder ?? "0");
    setAdvancedOpen(Boolean(initial.code || (initial.sortOrder && initial.sortOrder !== "0")));
    const timer = window.setTimeout(() => nameRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open, initial]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (kind === "group") {
      onSubmit({ name, code, sortOrder });
    } else {
      const subgroupInitial = initial as SubgroupInput;
      onSubmit({ name, code, sortOrder, groupId: subgroupInitial.groupId });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
      <div className="relative w-full max-w-md rounded-xl border border-border bg-surface-card p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="btn-ghost absolute right-3 top-3"
          aria-label="ปิด"
        >
          <X className="h-5 w-5" />
        </button>
        <p className="pr-10 font-semibold text-navy-900">{title}</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {kind === "subgroup" && parentGroupName ? (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-navy-900">หมวดใหญ่</span>
              <input
                readOnly
                value={parentGroupName}
                className="w-full rounded-lg border border-border bg-surface-page px-3 py-2.5 text-sm text-text-secondary"
              />
            </label>
          ) : null}

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-navy-900">
              {kind === "group" ? "ชื่อหมวดใหญ่" : "ชื่อหมวดย่อย"}
              <span className="text-red-500"> *</span>
            </span>
            <input
              ref={nameRef}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
            />
          </label>

          <div>
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-sm font-medium text-text-secondary hover:text-navy-900"
              aria-expanded={advancedOpen}
              aria-controls={advancedId}
            >
              ตั้งค่าเพิ่มเติม
              <ChevronDown
                className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`}
              />
            </button>
            {advancedOpen ? (
              <div id={advancedId} className="mt-3 space-y-3 border-t border-border pt-3">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-navy-900">รหัส</span>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-navy-900">ลำดับ</span>
                  <input
                    inputMode="numeric"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
                  />
                </label>
              </div>
            ) : null}
          </div>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "กำลังบันทึก…" : "บันทึก"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
