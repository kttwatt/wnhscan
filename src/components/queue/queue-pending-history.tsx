"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PendingSaveBatchCard,
  type PendingItemEditHandlers,
} from "@/components/queue/pending-save-batch-card";
import { ScanLogBatch } from "@/components/scan/scan-log-batch";
import { ScanLogDateRangeFilter } from "@/components/scan/scan-log-date-range-filter";
import {
  defaultSaveHistoryDateRange,
  applyLiveQuantitiesToBatches,
  filterPendingSaveBatches,
  groupSaveBatchesByDate,
  listActivePendingBatches,
  listSaveHistoryDateKeys,
  flattenPendingSaveHistory,
  type QueueHistoryStatusFilter,
} from "@/lib/pending/pending-save-history";
import type { PendingQueueItem } from "@/lib/pending/pending-store";
import { useScanLogs } from "@/lib/hooks/use-scan-logs";
import {
  filterScanLogs,
  formatLogDateHeading,
  groupScanLogsByDate,
  mergeDateKeys,
  toDateKey,
} from "@/lib/scan/scan-log-queries";

const STATUS_FILTERS: { id: QueueHistoryStatusFilter; label: string }[] = [
  { id: "pending", label: "รอสแกน" },
  { id: "scanned", label: "ปิดรอบแล้ว" },
  { id: "all", label: "ทั้งหมด" },
];

type QueuePendingHistoryProps = {
  departmentId: string;
  pendingCodes: Set<string>;
  pendingItems: PendingQueueItem[];
  edit?: PendingItemEditHandlers;
};

export function QueuePendingHistory({
  departmentId,
  pendingCodes,
  pendingItems,
  edit,
}: QueuePendingHistoryProps) {
  const [statusFilter, setStatusFilter] = useState<QueueHistoryStatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { logs: scanLogs } = useScanLogs(departmentId);

  const saveBatches = useMemo(
    () => listActivePendingBatches(departmentId, pendingItems),
    [departmentId, pendingItems],
  );

  const historyRows = useMemo(
    () => flattenPendingSaveHistory(saveBatches),
    [saveBatches],
  );

  useEffect(() => {
    const { from, to } = defaultSaveHistoryDateRange(historyRows);
    setDateFrom(from);
    setDateTo(to);
    setStatusFilter("pending");
  }, [departmentId, historyRows]);

  const dateOptions = useMemo(() => {
    const scanDateKeys = filterScanLogs(scanLogs, {
      departmentId,
      mode: "queue_scan",
    }).map((log) => toDateKey(log.savedAt));
    return mergeDateKeys(listSaveHistoryDateKeys(historyRows), scanDateKeys);
  }, [scanLogs, departmentId, historyRows]);

  const filteredSaveBatches = useMemo(() => {
    if (!dateFrom || !dateTo) return [];
    if (statusFilter === "scanned") return [];
    const batchStatus: QueueHistoryStatusFilter =
      statusFilter === "all" ? "pending" : statusFilter;
    return applyLiveQuantitiesToBatches(
      filterPendingSaveBatches(saveBatches, {
        dateFrom,
        dateTo,
        pendingCodes,
        status: batchStatus,
      }),
      pendingItems,
    );
  }, [saveBatches, dateFrom, dateTo, pendingCodes, statusFilter, pendingItems]);

  const groupedSaves = useMemo(
    () => groupSaveBatchesByDate(filteredSaveBatches),
    [filteredSaveBatches],
  );

  const filteredScanLogs = useMemo(() => {
    if (!dateFrom || !dateTo) return [];
    if (statusFilter === "pending") return [];
    return filterScanLogs(scanLogs, {
      departmentId,
      mode: "queue_scan",
      dateFrom,
      dateTo,
    });
  }, [scanLogs, departmentId, dateFrom, dateTo, statusFilter]);

  const groupedScans = useMemo(() => groupScanLogsByDate(filteredScanLogs), [filteredScanLogs]);

  const showSaves = statusFilter !== "scanned";
  const showScans = statusFilter !== "pending";
  const isEmpty = groupedSaves.length === 0 && groupedScans.length === 0;

  return (
    <div className="card-whitespace">
      <div>
        <h2 className="text-lg font-bold text-navy-900">ประวัติจดไว้ก่อน</h2>
        <p className="mt-1 text-sm text-text-secondary">
          รายการที่บันทึกรอผู้จัดการปิดรอบ และรายการที่ปิดรอบแล้ว — หน่วยงาน {departmentId}
        </p>
        {pendingCodes.size > 0 && (statusFilter === "pending" || statusFilter === "all") ? (
          <p className="mt-3 text-sm text-text-secondary">
            แก้จำนวนหรือลบรายการได้ก่อนปิดรอบ — ขยายชุดแล้วแก้ที่แต่ละรายการ
          </p>
        ) : null}
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex gap-2 rounded-lg bg-blue-light/50 p-1.5">
          {STATUS_FILTERS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                statusFilter === tab.id
                  ? "bg-blue-primary text-white shadow-sm"
                  : "bg-white/70 text-text-secondary hover:bg-white hover:text-navy-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <ScanLogDateRangeFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          dateOptions={dateOptions}
          onApply={(from, to) => {
            setDateFrom(from);
            setDateTo(to);
          }}
        />
      </div>

      {isEmpty ? (
        <p className="mt-6 py-8 text-center text-sm text-text-secondary">
          {statusFilter === "pending"
            ? "ยังไม่มีรายการรอสแกนในช่วงที่เลือก — ใส่ตระกร้าแล้วกด บันทึก ด้านบน"
            : statusFilter === "scanned"
              ? "ยังไม่มีรายการที่ปิดรอบแล้วในช่วงที่เลือก"
              : "ยังไม่มีประวัติในช่วงที่เลือก — ใส่ตระกร้าแล้วกด บันทึก ด้านบน"}
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {showSaves && groupedSaves.length > 0 ? (
            <div className="space-y-6">
              {statusFilter === "all" ? (
                <p className="text-sm font-semibold text-navy-900">รอปิดรอบสแกน</p>
              ) : null}
              {groupedSaves.map(([dateKey, dayBatches]) => (
                <section key={`save-${dateKey}`}>
                  <p className="mb-3 text-xs font-semibold text-text-muted">
                    ── {formatLogDateHeading(dateKey)} ──
                  </p>
                  <div className="space-y-3">
                    {dayBatches.map((batch) => (
                      <PendingSaveBatchCard
                        key={batch.id}
                        batch={batch}
                        pendingCodes={pendingCodes}
                        edit={edit}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : null}

          {showScans && groupedScans.length > 0 ? (
            <div className="space-y-6">
              {statusFilter === "all" ? (
                <p className="text-sm font-semibold text-navy-900">ปิดรอบแล้ว</p>
              ) : null}
              {groupedScans.map(([dateKey, dayLogs]) => (
                <section key={`scan-${dateKey}`}>
                  <p className="mb-3 text-xs font-semibold text-text-muted">
                    ── {formatLogDateHeading(dateKey)} ──
                  </p>
                  <div className="space-y-3">
                    {dayLogs.map((log) => (
                      <ScanLogBatch key={log.id} log={log} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
