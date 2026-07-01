"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DepartmentSwitcher } from "@/components/layout/department-switcher";
import { ScanBatchStrip } from "@/components/scan/scan-batch-strip";
import { ScanCommandField } from "@/components/scan/scan-command-field";
import { SequentialScanModal } from "@/components/scan/sequential-scan-modal";
import { ScanLogHistoryPanel } from "@/components/scan/scan-log-history-panel";
import { formatItemGroup } from "@/lib/catalog/search-items";
import { sortCatalogItems } from "@/lib/catalog/sort-items";
import type { CatalogItem } from "@/lib/catalog/types";
import { useCatalogItems } from "@/lib/hooks/use-catalog-items";
import { useDepartmentScope } from "@/lib/hooks/use-department-scope";
import { useScanBatch } from "@/lib/hooks/use-scan-batch";
import { useScanWizard } from "@/lib/hooks/use-scan-wizard";
import type { ScanWizardItem } from "@/lib/scan/types";

function toScanItem(item: CatalogItem): ScanWizardItem {
  return {
    code: item.code,
    name: item.name,
    barcode: item.barcode,
    group: formatItemGroup(item),
    quantity: 1,
  };
}

export default function ScanPage() {
  const { departmentId, setDepartmentId, departments, locked } = useDepartmentScope();
  const [deptNotice, setDeptNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const wizard = useScanWizard();
  const {
    items: batchItems,
    count: batchCount,
    totalQty: batchTotalQty,
    add: addToBatch,
    remove: removeFromBatch,
    increment: incrementBatch,
    clear: clearBatch,
    pruneMissing: pruneBatchMissing,
  } = useScanBatch();

  const { items: catalogItems } = useCatalogItems(departmentId);

  const deptItems = useMemo(
    () => sortCatalogItems(catalogItems),
    [catalogItems],
  );

  const deptCodesKey = useMemo(
    () => deptItems.map((item) => item.code).join("\0"),
    [deptItems],
  );

  useEffect(() => {
    pruneBatchMissing(deptItems.map((item) => item.code));
  }, [deptCodesKey, deptItems, pruneBatchMissing]);

  useEffect(() => {
    if (!deptNotice) return;
    const timer = window.setTimeout(() => setDeptNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [deptNotice]);

  const startScan = useCallback(() => {
    if (batchCount === 0) return;
    wizard.start("instant_scan", batchItems, { departmentId });
  }, [batchCount, batchItems, departmentId, wizard]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (wizard.open || batchCount === 0) return;
      const tag = (e.target as HTMLElement)?.tagName;
      const inField = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      const startShortcut =
        e.key === "F2" || (inField && e.key === "Enter" && (e.ctrlKey || e.metaKey));
      if (startShortcut) {
        e.preventDefault();
        startScan();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [batchCount, startScan, wizard.open]);

  function handleAddItem(item: CatalogItem) {
    addToBatch(toScanItem(item));
  }

  function handleScanSave() {
    wizard.save(() => {
      clearBatch();
      requestAnimationFrame(() => inputRef.current?.focus());
    });
  }

  function handleDepartmentChange(nextId: string) {
    if (nextId !== departmentId && batchCount > 0) {
      clearBatch();
      setDeptNotice("เปลี่ยนแผนกแล้ว — รายการที่เลือกถูกล้าง");
    }
    setDepartmentId(nextId);
  }

  return (
    <>
      <PageHeader
        title="สแกนทันที"
        description="สแกนบาร์โค้ดจากรายการและบันทึกเข้าระบบ IPISS ทันที"
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="text-sm font-semibold text-blue-primary hover:underline">
              กลับหน้าหลัก
            </Link>
            <DepartmentSwitcher
              value={departmentId}
              departments={departments}
              locked={locked}
              onChange={handleDepartmentChange}
            />
          </div>
        }
      />

      <div className="flex flex-1 flex-col gap-6 p-8">
        <div className="card-whitespace">
          <h2 className="text-lg font-bold text-navy-900">สแกนจากรายการวัสดุ</h2>
          <p className="mt-1 text-sm text-text-secondary">
            สแกนหรือค้นหาเพื่อเพิ่มรายการ แล้วกดเริ่มสแกน
          </p>

          {deptNotice ? (
            <p
              className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
              role="status"
            >
              {deptNotice}
            </p>
          ) : null}

          <ScanCommandField
            departmentId={departmentId}
            items={deptItems}
            disabled={wizard.open}
            onAddItem={handleAddItem}
            inputRef={inputRef}
          />

          <ScanBatchStrip
            items={batchItems}
            totalQty={batchTotalQty}
            onRemove={removeFromBatch}
            onIncrement={incrementBatch}
            onStart={startScan}
            disabled={wizard.open}
          />
        </div>

        <ScanLogHistoryPanel
          departmentId={departmentId}
          mode="instant_scan"
          title="ประวัติ"
          description={`รายการที่สแกนและบันทึกเข้าระบบทันที — หน่วยงาน ${departmentId}`}
          emptyMessage="ยังไม่มีประวัติสแกนทันทีในช่วงที่เลือก"
        />
      </div>

      <SequentialScanModal
        open={wizard.open}
        mode={wizard.mode}
        items={wizard.items}
        index={wizard.index}
        current={wizard.current}
        isVerified={wizard.isVerified}
        isFirst={wizard.isFirst}
        isLast={wizard.isLast}
        saving={wizard.saving}
        showSummary={wizard.showSummary}
        onClose={wizard.close}
        onMatchScan={wizard.matchScan}
        onNext={wizard.next}
        onPrev={wizard.prev}
        onQuantityChange={wizard.setQuantity}
        onSave={handleScanSave}
      />
    </>
  );
}
