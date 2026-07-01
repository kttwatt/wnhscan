"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  PendingQueueBatchCard,
  PendingSaveBatchCard,
  type PendingItemEditHandlers,
} from "@/components/queue/pending-save-batch-card";
import { SequentialScanModal } from "@/components/scan/sequential-scan-modal";
import { Button } from "@/components/ui/button";
import { listActivePendingBatches, type PendingSaveBatch } from "@/lib/pending/pending-save-history";
import type { PendingQueueItem } from "@/lib/pending/pending-store";
import { useScanWizard } from "@/lib/hooks/use-scan-wizard";
import type { ScanWizardItem } from "@/lib/scan/types";

type PendingQueueModalProps = {
  open: boolean;
  onClose: () => void;
  departmentId: string;
  items: PendingQueueItem[];
  onRemoveCompleted?: (codes: string[]) => void;
  allowStartScan?: boolean;
  edit?: PendingItemEditHandlers;
};

function batchToScanItems(batch: PendingSaveBatch): ScanWizardItem[] {
  return batch.items.map((row) => ({
    code: row.code,
    name: row.name,
    barcode: row.barcode,
    group: row.group,
    quantity: row.quantity,
  }));
}

export function PendingQueueModal({
  open,
  onClose,
  departmentId,
  items,
  onRemoveCompleted,
  allowStartScan = true,
  edit,
}: PendingQueueModalProps) {
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  const [scanningBatch, setScanningBatch] = useState<PendingSaveBatch | null>(null);
  const wizard = useScanWizard();

  const batches = useMemo(
    () => listActivePendingBatches(departmentId, items),
    [departmentId, items],
  );
  const totalQty = useMemo(
    () => items.reduce((sum, row) => sum + row.quantity, 0),
    [items],
  );
  const pendingCodes = useMemo(() => new Set(items.map((row) => row.code)), [items]);

  useEffect(() => {
    if (!open) {
      setExpandedBatchId(null);
      setScanningBatch(null);
    }
  }, [open]);

  if (!open) return null;

  function handleClose() {
    onClose();
  }

  function toggleBatch(batchId: string) {
    setExpandedBatchId((current) => (current === batchId ? null : batchId));
  }

  function startBatchScan(batch: PendingSaveBatch) {
    setScanningBatch(batch);
    wizard.start("queue_scan", batchToScanItems(batch), { departmentId });
  }

  function handleSaveComplete() {
    if (!scanningBatch) return;
    const savedCodes = scanningBatch.items.map((item) => item.code);
    onRemoveCompleted?.(savedCodes);
    setScanningBatch(null);
  }

  const isEmpty = batches.length === 0;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pending-queue-title"
      >
        <div className="relative flex max-h-[min(90vh,640px)] w-full max-w-3xl flex-col rounded-xl border border-border bg-surface-card shadow-xl">
          <button
            type="button"
            onClick={handleClose}
            className="btn-ghost absolute right-3 top-3 z-10"
            aria-label="ปิด"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="border-b border-border px-6 py-5 pr-14">
            <p id="pending-queue-title" className="font-semibold text-navy-900">
              รายการรอสแกน
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {batches.length} ชุด · {items.length} รายการ · {totalQty} ชิ้น
              {edit ? " — แก้จำนวนหรือลบรายการได้ก่อนเริ่มสแกน" : ""}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isEmpty ? (
              <p className="py-8 text-center text-sm text-text-secondary">
                ไม่มีรายการจดไว้ก่อนในหน่วยงานนี้
              </p>
            ) : (
              <div className="space-y-3">
                {batches.map((batch) =>
                  allowStartScan ? (
                    <PendingQueueBatchCard
                      key={batch.id}
                      batch={batch}
                      open={expandedBatchId === batch.id}
                      onToggleOpen={() => toggleBatch(batch.id)}
                      onStartScan={() => startBatchScan(batch)}
                      edit={edit}
                    />
                  ) : (
                    <PendingSaveBatchCard
                      key={batch.id}
                      batch={batch}
                      pendingCodes={pendingCodes}
                      edit={edit}
                    />
                  ),
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border px-6 py-4">
            <Button variant="secondary" onClick={handleClose}>
              ปิด
            </Button>
          </div>
        </div>
      </div>

      {allowStartScan ? (
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
          onClose={() => {
            wizard.close();
            setScanningBatch(null);
          }}
          onMatchScan={wizard.matchScan}
          onNext={wizard.next}
          onPrev={wizard.prev}
          onQuantityChange={wizard.setQuantity}
          onSave={() => wizard.save(handleSaveComplete)}
        />
      ) : null}
    </>
  );
}
