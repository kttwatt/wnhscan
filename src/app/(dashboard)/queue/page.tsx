"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { QueuePanel, type CartRow } from "@/components/queue/queue-panel";
import { QueuePendingHistory } from "@/components/queue/queue-pending-history";
import { CloseRoundBanner } from "@/components/dashboard/close-round-banner";
import { ItemSummaryModal, SCAN_SUMMARY_COPY } from "@/components/scan/item-summary-modal";
import { PageHeader } from "@/components/layout/page-header";
import { DepartmentSwitcher } from "@/components/layout/department-switcher";
import { useSession } from "@/components/auth/session-provider";
import type { CatalogItem } from "@/lib/catalog/types";
import { canAccessCloseRound } from "@/lib/auth/access";
import { useCatalogItems } from "@/lib/hooks/use-catalog-items";
import { formatItemGroup, searchItems } from "@/lib/catalog/search-items";
import { usePendingQueue } from "@/lib/hooks/use-pending-queue";
import { useQueueSaveHistory } from "@/lib/hooks/use-queue-save-history";
import { useDepartmentScope } from "@/lib/hooks/use-department-scope";

export default function QueuePage() {
  const profile = useSession();
  const { departmentId, setDepartmentId, departments, locked } = useDepartmentScope();
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartRow[]>([]);
  const [savedSummary, setSavedSummary] = useState<CartRow[] | null>(null);

  const pending = usePendingQueue(departmentId);
  const historyRows = useQueueSaveHistory(departmentId);
  const pendingCodes = useMemo(
    () => new Set(pending.items.map((item) => item.code)),
    [pending.items],
  );
  const pendingTotalQty = useMemo(
    () => pending.items.reduce((sum, row) => sum + row.quantity, 0),
    [pending.items],
  );
  const canCloseRound = canAccessCloseRound(profile);

  const { items: deptItems } = useCatalogItems(departmentId);
  const searchResults = useMemo(
    () => searchItems(deptItems, searchQuery),
    [deptItems, searchQuery],
  );

  function addToCart(item: CatalogItem) {
    const existing = cart.find((row) => row.code === item.code);
    if (existing) {
      incrementQuantity(item.code);
      setSearchQuery("");
      return;
    }

    setCart((prev) => [
      ...prev,
      {
        code: item.code,
        name: item.name,
        barcode: item.barcode,
        group: formatItemGroup(item),
        quantity: 1,
      },
    ]);
    setSearchQuery("");
    setSavedSummary(null);
  }

  function incrementQuantity(code: string) {
    setCart((prev) =>
      prev.map((row) =>
        row.code === code ? { ...row, quantity: row.quantity + 1 } : row,
      ),
    );
  }

  function setQuantity(code: string, quantity: number) {
    const q = Math.max(1, Math.floor(quantity));
    setCart((prev) =>
      prev.map((row) => (row.code === code ? { ...row, quantity: q } : row)),
    );
  }

  function removeFromCart(code: string) {
    setCart((prev) => prev.filter((row) => row.code !== code));
  }

  async function saveCartToPending() {
    if (cart.length === 0) return;
    const snapshot = cart.map((row) => ({ ...row }));
    await pending.saveCartToPending(cart);
    setCart([]);
    setSavedSummary(snapshot);
  }

  const pendingSaveCopy = SCAN_SUMMARY_COPY.pending_save;
  const pendingEdit = useMemo(
    () => ({
      onUpdateQuantity: pending.updateQuantity,
      onRemoveItem: pending.removeItem,
    }),
    [pending.updateQuantity, pending.removeItem],
  );

  return (
    <>
      <PageHeader
        title="จดไว้ก่อน"
        description="จดรายการไว้ก่อนสแกน — ผู้จัดการสแกนจากหน้า ปิดรอบสแกน"
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="text-sm font-semibold text-blue-primary hover:underline">
              กลับหน้าหลัก
            </Link>
            <DepartmentSwitcher
              value={departmentId}
              departments={departments}
              locked={locked}
              onChange={setDepartmentId}
            />
          </div>
        }
      />

      <div className="flex flex-1 flex-col gap-6 p-8">
        <QueuePanel
          departmentId={departmentId}
          items={deptItems}
          query={searchQuery}
          onQueryChange={setSearchQuery}
          results={searchResults}
          onAddToCart={addToCart}
          cart={cart}
          onIncrementQuantity={incrementQuantity}
          onSetQuantity={setQuantity}
          onRemoveFromCart={removeFromCart}
          onSavePending={saveCartToPending}
        />

        {pendingTotalQty > 0 ? (
          <CloseRoundBanner
            departmentId={departmentId}
            pendingQty={pendingTotalQty}
            showCloseRoundAction={canCloseRound}
          />
        ) : null}

        <QueuePendingHistory
          departmentId={departmentId}
          rows={historyRows}
          pendingCodes={pendingCodes}
          pendingItems={pending.items}
          edit={pendingEdit}
        />

        <ItemSummaryModal
          open={savedSummary !== null}
          title={pendingSaveCopy.title}
          description={pendingSaveCopy.description}
          successMessage={pendingSaveCopy.successMessage}
          items={savedSummary ?? []}
          onClose={() => setSavedSummary(null)}
        />
      </div>
    </>
  );
}
