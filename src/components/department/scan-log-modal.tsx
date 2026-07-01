"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { ScanLogBatch } from "@/components/scan/scan-log-batch";
import { ScanLogDateRangeFilter } from "@/components/scan/scan-log-date-range-filter";
import { useScanLogs } from "@/lib/hooks/use-scan-logs";
import {
  filterScanLogs,
  formatLogDateHeading,
  groupScanLogsByDate,
  listLogDateKeys,
  defaultLogDateRange,
  presetForVolumeStat,
  type ScanLogTypeFilter,
  type ScanVolumeStatKey,
} from "@/lib/scan/scan-log-queries";

const TYPE_FILTERS: { id: ScanLogTypeFilter; label: string }[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "instant_scan", label: "สแกนทันที" },
  { id: "queue_scan", label: "ปิดรอบแล้ว" },
];

type ScanLogModalProps = {
  open: boolean;
  onClose: () => void;
  departmentId: string;
  initialStatKey?: ScanVolumeStatKey | null;
};

export function ScanLogModal({
  open,
  onClose,
  departmentId,
  initialStatKey = null,
}: ScanLogModalProps) {
  const [typeFilter, setTypeFilter] = useState<ScanLogTypeFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { logs, mounted, refresh } = useScanLogs(departmentId);

  useEffect(() => {
    if (!open || !mounted) return;
    void refresh();
    if (initialStatKey) {
      const preset = presetForVolumeStat(initialStatKey);
      setTypeFilter(preset.mode);
      setDateFrom(preset.dateFrom);
      setDateTo(preset.dateTo);
      return;
    }
    const { from, to } = defaultLogDateRange(logs, departmentId);
    setTypeFilter("all");
    setDateFrom(from);
    setDateTo(to);
  }, [open, departmentId, initialStatKey, mounted, refresh, logs]);

  const dateOptions = useMemo(
    () => listLogDateKeys(logs, departmentId),
    [logs, departmentId],
  );

  const filtered = useMemo(() => {
    if (!dateFrom || !dateTo) return [];
    return filterScanLogs(logs, {
      departmentId,
      mode: typeFilter,
      dateFrom,
      dateTo,
    });
  }, [logs, departmentId, typeFilter, dateFrom, dateTo]);

  const grouped = useMemo(() => groupScanLogsByDate(filtered), [filtered]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-log-title"
    >
      <div className="relative flex max-h-[min(90vh,720px)] w-full max-w-3xl flex-col rounded-xl border border-border bg-surface-card shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-text-muted transition-colors hover:bg-blue-light hover:text-navy-900"
          aria-label="ปิด"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="border-b border-border px-6 py-5 pr-12">
          <p id="scan-log-title" className="font-semibold text-navy-900">
            บันทึกการสแกน — แผนก {departmentId}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            สแกนทันทีและปิดรอบแล้ว · แบ่งตามวันที่สแกน · กรองประเภทและวันที่
          </p>
        </div>

        <div className="space-y-4 border-b border-border px-6 py-4">
          <div className="flex gap-2 rounded-lg bg-blue-light/50 p-1.5">
            {TYPE_FILTERS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                  typeFilter === tab.id
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

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {grouped.length === 0 ? (
            <p className="py-12 text-center text-sm text-text-secondary">
              ไม่พบบันทึกการสแกนในช่วงที่เลือก
            </p>
          ) : (
            <div className="space-y-6">
              {grouped.map(([dateKey, dayLogs]) => (
                <section key={dateKey}>
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
          )}
        </div>
      </div>
    </div>
  );
}
