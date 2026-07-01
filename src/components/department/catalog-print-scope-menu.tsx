"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CatalogPrintScope } from "@/lib/catalog/catalog-print-scope";
import type { TaxonomyFilterGroup } from "@/lib/catalog/taxonomy-filter";

type CatalogPrintScopeMenuProps = {
  groups: TaxonomyFilterGroup[];
  totalCount: number;
  disabled?: boolean;
  onSelect: (scope: CatalogPrintScope) => void;
};

type MenuView =
  | { step: "root" }
  | { step: "group" }
  | { step: "subgroup-group" }
  | { step: "subgroup"; group: string };

const menuItemClassName =
  "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-page disabled:cursor-not-allowed disabled:opacity-40";

export function CatalogPrintScopeMenu({
  groups,
  totalCount,
  disabled = false,
  onSelect,
}: CatalogPrintScopeMenuProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<MenuView>({ step: "root" });
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setView({ step: "root" });
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setView({ step: "root" });
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
    setView({ step: "root" });
  }

  function pick(scope: CatalogPrintScope) {
    onSelect(scope);
    closeMenu();
  }

  const groupsWithItems = groups.filter((g) => g.count > 0);

  function renderRoot() {
    return (
      <>
        <button
          type="button"
          className={menuItemClassName}
          disabled={totalCount === 0}
          onClick={() => pick({ type: "all" })}
        >
          <span className="font-medium text-navy-900">พิมพ์ทั้งหมด</span>
          <span className="text-xs text-text-secondary">{totalCount} รายการ</span>
        </button>
        <button
          type="button"
          className={menuItemClassName}
          disabled={groupsWithItems.length === 0}
          onClick={() => setView({ step: "group" })}
        >
          <span className="font-medium text-navy-900">เลือกหมวด</span>
          <span className="text-xs text-text-secondary">›</span>
        </button>
        <button
          type="button"
          className={menuItemClassName}
          disabled={groupsWithItems.length === 0}
          onClick={() => setView({ step: "subgroup-group" })}
        >
          <span className="font-medium text-navy-900">หมวดย่อย</span>
          <span className="text-xs text-text-secondary">›</span>
        </button>
      </>
    );
  }

  function renderGroupList(onPick: (group: TaxonomyFilterGroup) => void) {
    return groupsWithItems.map((group) => (
      <button
        key={group.name}
        type="button"
        className={menuItemClassName}
        onClick={() => onPick(group)}
      >
        <span className="text-navy-900">{group.name}</span>
        <span className="text-xs text-text-secondary">{group.count} รายการ</span>
      </button>
    ));
  }

  function renderSubgroupList(group: TaxonomyFilterGroup) {
    const subgroupsWithItems = group.subgroups.filter((sg) => sg.count > 0);
    if (subgroupsWithItems.length === 0) {
      return (
        <p className="px-3 py-4 text-sm text-text-secondary">ไม่มีหมวดย่อยใน {group.name}</p>
      );
    }
    return subgroupsWithItems.map((sg) => (
      <button
        key={sg.name}
        type="button"
        className={menuItemClassName}
        onClick={() => pick({ type: "subgroup", group: group.name, subgroup: sg.name })}
      >
        <span className="text-navy-900">{sg.name}</span>
        <span className="text-xs text-text-secondary">{sg.count} รายการ</span>
      </button>
    ));
  }

  function renderPanel() {
    if (view.step === "root") return renderRoot();

    if (view.step === "group") {
      return (
        <>
          <button
            type="button"
            className={`${menuItemClassName} text-text-secondary`}
            onClick={() => setView({ step: "root" })}
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span>เลือกหมวด</span>
          </button>
          {renderGroupList((group) => pick({ type: "group", group: group.name }))}
        </>
      );
    }

    if (view.step === "subgroup-group") {
      return (
        <>
          <button
            type="button"
            className={`${menuItemClassName} text-text-secondary`}
            onClick={() => setView({ step: "root" })}
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span>หมวดย่อย · เลือกหมวด</span>
          </button>
          {renderGroupList((group) => setView({ step: "subgroup", group: group.name }))}
        </>
      );
    }

    const activeGroup = groups.find((g) => g.name === view.group);
    return (
      <>
        <button
          type="button"
          className={`${menuItemClassName} text-text-secondary`}
          onClick={() => setView({ step: "subgroup-group" })}
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          <span>หมวดย่อย · {view.group}</span>
        </button>
        {activeGroup ? renderSubgroupList(activeGroup) : null}
      </>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <Button
        variant="secondary"
        disabled={disabled || totalCount === 0}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => {
          setOpen((prev) => !prev);
          setView({ step: "root" });
        }}
      >
        <Eye className="h-4 w-4" /> ตัวอย่างก่อนพิมพ์
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>

      {open ? (
        <div
          role="menu"
          className="absolute left-0 top-full z-40 mt-1 min-w-[240px] rounded-xl border border-border bg-surface-card p-1.5 shadow-lg"
        >
          {renderPanel()}
        </div>
      ) : null}
    </div>
  );
}
