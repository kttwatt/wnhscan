"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { ScanBarcode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemSearchField } from "@/components/ui/item-search-field";
import { formatItemGroup } from "@/lib/catalog/search-items";
import { resolveScanInput } from "@/lib/catalog/resolve-scan-input";
import type { CatalogItem } from "@/lib/catalog/types";
import { playBeep } from "@/lib/scan/play-beep";

type ScanCommandFieldProps = {
  departmentId: string;
  items: CatalogItem[];
  disabled?: boolean;
  onAddItem: (item: CatalogItem) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
};

export function ScanCommandField({
  departmentId,
  items,
  disabled = false,
  onAddItem,
  inputRef: externalRef,
}: ScanCommandFieldProps) {
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef ?? internalRef;
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const showDropdown = query.trim().length > 0 && !disabled;

  const dropdownItems = useMemo(() => {
    if (!showDropdown) return [];
    const result = resolveScanInput(items, query);
    if (result.kind === "ambiguous") return result.items;
    if (result.kind === "exact") return [result.item];
    return [];
  }, [items, query, showDropdown]);

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [inputRef]);

  const commitItem = useCallback(
    (item: CatalogItem) => {
      onAddItem(item);
      playBeep();
      setQuery("");
      setError(null);
      focusInput();
    },
    [focusInput, onAddItem],
  );

  const tryResolveQuery = useCallback(
    (value: string) => {
      const result = resolveScanInput(items, value);
      if (result.kind === "exact") {
        commitItem(result.item);
        return true;
      }
      if (result.kind === "ambiguous") {
        setError("พบหลายรายการ — เลือกจากรายการด้านล่าง");
        return false;
      }
      setError("ไม่พบรายการในหน่วยงาน " + departmentId);
      return false;
    },
    [commitItem, departmentId, items],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled || !query.trim()) return;
    tryResolveQuery(query);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setQuery("");
      setError(null);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <ItemSearchField
        id="scan-command-input"
        value={query}
        onChange={(value) => {
          setQuery(value);
          setError(null);
        }}
        placeholder={`ค้นหาจากรายการพัสดุในหน่วยงาน ${departmentId} — รหัส, ชื่อ`}
        className="mt-5"
        disabled={disabled}
        autoFocus
        introBlinkOnMount
        inputRef={inputRef}
        onKeyDown={handleKeyDown}
      >
        {showDropdown ? (
          <ul className="absolute left-4 right-4 top-full z-20 mt-2 max-h-64 divide-y divide-border overflow-y-auto rounded-xl border border-border bg-white shadow-xl ring-1 ring-black/5">
            {dropdownItems.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-text-secondary">
                ไม่พบรายการในหน่วยงาน {departmentId}
              </li>
            ) : (
              dropdownItems.map((item) => (
                <li
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => commitItem(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      commitItem(item);
                    }
                  }}
                  className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-blue-light/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-primary/30"
                  aria-label={`เพิ่ม ${item.name}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text-muted">{formatItemGroup(item)}</p>
                    <p className="font-medium text-navy-900">
                      <span className="text-blue-primary">{item.code}</span> — {item.name}
                    </p>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      บาร์โค้ด {item.barcode} · {item.unit}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    className="px-2.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      commitItem(item);
                    }}
                    aria-label={`เพิ่มรายการ ${item.name}`}
                    title="เพิ่มรายการ"
                  >
                    <ScanBarcode className="h-4 w-4" strokeWidth={2.25} />
                  </Button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </ItemSearchField>

      {error ? (
        <p className="mt-2 text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
