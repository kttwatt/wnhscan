"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, ShoppingCart, Trash2 } from "lucide-react";
import type { CatalogItem } from "@/lib/catalog/types";
import { formatItemGroup } from "@/lib/catalog/search-items";
import { resolveScanInput } from "@/lib/catalog/resolve-scan-input";
import { playBeep } from "@/lib/scan/play-beep";
import { Code128Barcode } from "@/components/catalog/code128-barcode";
import { Button } from "@/components/ui/button";
import { ItemSearchField } from "@/components/ui/item-search-field";

export type CartRow = {
  code: string;
  name: string;
  barcode: string;
  group: string;
  quantity: number;
};

type QueuePanelProps = {
  departmentId: string;
  items: CatalogItem[];
  query: string;
  onQueryChange: (value: string) => void;
  results: CatalogItem[];
  onAddToCart: (item: CatalogItem) => void;
  cart: CartRow[];
  onIncrementQuantity: (code: string) => void;
  onSetQuantity: (code: string, quantity: number) => void;
  onRemoveFromCart: (code: string) => void;
  onSavePending: () => void;
  saving?: boolean;
};

const qtyInputClassName =
  "h-8 w-12 rounded-md border border-border bg-blue-light/60 px-1 text-center text-sm font-semibold tabular-nums text-navy-900 outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20";

function CartQuantityInput({
  code,
  quantity,
  name,
  onSetQuantity,
}: {
  code: string;
  quantity: number;
  name: string;
  onSetQuantity: (code: string, quantity: number) => void;
}) {
  const [text, setText] = useState(String(quantity));

  useEffect(() => {
    setText(String(quantity));
  }, [quantity]);

  function commit() {
    const n = parseInt(text, 10);
    if (text === "" || Number.isNaN(n) || n < 1) {
      onSetQuantity(code, 1);
      setText("1");
      return;
    }
    onSetQuantity(code, n);
    setText(String(n));
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={text}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "" || /^\d+$/.test(v)) setText(v);
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        }
      }}
      className={qtyInputClassName}
      aria-label={`จำนวน ${name}`}
    />
  );
}

export function QueuePanel({
  departmentId,
  items,
  query,
  onQueryChange,
  results,
  onAddToCart,
  cart,
  onIncrementQuantity,
  onSetQuantity,
  onRemoveFromCart,
  onSavePending,
  saving = false,
}: QueuePanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const showResults = query.trim().length > 0;
  const totalQty = cart.reduce((sum, row) => sum + row.quantity, 0);
  const [searchError, setSearchError] = useState<string | null>(null);

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  function handleAddToCart(item: CatalogItem) {
    onAddToCart(item);
    playBeep();
    setSearchError(null);
    focusInput();
  }

  function tryResolveQuery(value: string) {
    const result = resolveScanInput(items, value);
    if (result.kind === "exact") {
      handleAddToCart(result.item);
      onQueryChange("");
      return true;
    }
    if (result.kind === "ambiguous") {
      setSearchError("พบหลายรายการ — เลือกจากรายการด้านล่าง");
      return false;
    }
    setSearchError("ไม่พบรายการในหน่วยงาน " + departmentId);
    return false;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    tryResolveQuery(query);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      onQueryChange("");
      setSearchError(null);
    }
  }

  return (
    <div className="card-whitespace">
      <div>
        <h2 className="text-lg font-bold text-navy-900">จดรายการไว้ก่อน</h2>
        <p className="mt-1 text-sm text-text-secondary">
          ค้นหาวัสดุ ใส่ตะกร้า แล้วกดบันทึก
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <ItemSearchField
          id="queue-item-search"
          value={query}
          onChange={(value) => {
            onQueryChange(value);
            setSearchError(null);
          }}
          placeholder={`ค้นหาจากรายการพัสดุในหน่วยงาน ${departmentId} — รหัส, ชื่อ`}
          className="mt-5"
          autoFocus
          introBlinkOnMount
          inputRef={inputRef}
          onKeyDown={handleKeyDown}
        >
        {showResults ? (
          <ul className="absolute left-4 right-4 top-full z-20 mt-2 max-h-64 divide-y divide-border overflow-y-auto rounded-xl border border-border bg-white shadow-xl ring-1 ring-black/5">
            {results.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-text-secondary">
                ไม่พบรายการในหน่วยงาน {departmentId}
              </li>
            ) : (
              results.map((item) => (
                <li
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleAddToCart(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleAddToCart(item);
                    }
                  }}
                  className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-blue-light/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-primary/30"
                  aria-label={`ใส่ตระกร้า ${item.name}`}
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
                      handleAddToCart(item);
                    }}
                    aria-label={`ใส่ตระกร้า ${item.name}`}
                    title="ใส่ตระกร้า"
                  >
                    <ShoppingCart className="h-4 w-4" strokeWidth={2.25} />
                  </Button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </ItemSearchField>

        {searchError ? (
          <p className="mt-2 text-sm font-medium text-red-600" role="alert">
            {searchError}
          </p>
        ) : null}
      </form>

      <div className="mt-6 border-t border-border pt-6">
        {cart.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-blue-light/20 px-6 py-10 text-center">
            <ShoppingCart className="mx-auto h-8 w-8 text-text-muted" />
            <p className="mt-3 font-medium text-navy-900">ตระกร้าว่าง</p>
            <p className="mt-1 text-sm text-text-secondary">
              ค้นหาวัสดุด้านบน แล้วกด ใส่ตระกร้า
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-navy-900">
                ตระกร้าจดไว้ก่อน · {cart.length} รายการ ({totalQty} ชิ้น)
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-text-secondary">
                    <th className="pb-3 font-medium">หมวด</th>
                    <th className="pb-3 font-medium">รหัส / ชื่อ</th>
                    <th className="pb-3 font-medium">บาร์โค้ด</th>
                    <th className="pb-3 text-center font-medium">จำนวน</th>
                    <th className="w-12 pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cart.map((item) => (
                    <tr key={item.code} className="hover:bg-blue-light/15">
                      <td className="py-2 pr-4 text-xs text-text-muted">{item.group}</td>
                      <td className="py-2 pr-4 font-medium text-navy-900">
                        <span className="text-blue-primary">{item.code}</span> — {item.name}
                      </td>
                      <td className="py-2 pr-4">
                        <Code128Barcode value={item.barcode} variant="mini" />
                      </td>
                      <td className="py-2">
                        <div className="flex items-center justify-center gap-1">
                          <CartQuantityInput
                            code={item.code}
                            quantity={item.quantity}
                            name={item.name}
                            onSetQuantity={onSetQuantity}
                          />
                          <button
                            type="button"
                            onClick={() => onIncrementQuantity(item.code)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-card text-navy-900 transition-colors hover:border-blue-primary/30 hover:bg-blue-light"
                            aria-label={`เพิ่มจำนวน ${item.name}`}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => onRemoveFromCart(item.code)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                          aria-label={`ลบ ${item.name} จากตระกร้า`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="primary" onClick={onSavePending} disabled={saving}>
                {saving ? "กำลังบันทึก…" : "บันทึก"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
