"use client";

import { useEffect, useMemo, useState } from "react";
import { ScanLogBatch } from "@/components/scan/scan-log-batch";
import { ScanLogDateRangeFilter } from "@/components/scan/scan-log-date-range-filter";
import { useScanLogs } from "@/lib/hooks/use-scan-logs";
import {
  defaultLogDateRange,
  filterScanLogs,
  formatLogDateHeading,
  groupScanLogsByDate,
  listLogDateKeys,
} from "@/lib/scan/scan-log-queries";
import type { ScanMode } from "@/lib/scan/types";

type ScanLogHistoryPanelProps = {
  departmentId: string;
  mode: ScanMode;
  title: string;
  description: string;
  emptyMessage: string;
};

export function ScanLogHistoryPanel({
  departmentId,
  mode,
  title,
  description,
  emptyMessage,
}: ScanLogHistoryPanelProps) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { logs: scanLogs, mounted } = useScanLogs(departmentId);

  useEffect(() => {
    if (!mounted) return;
    const { from, to } = defaultLogDateRange(scanLogs, departmentId, mode);
    setDateFrom(from);
    setDateTo(to);
  }, [departmentId, mode, mounted, scanLogs]);

  const dateOptions = useMemo(
    () => listLogDateKeys(scanLogs, departmentId, mode),
    [scanLogs, departmentId, mode],
  );

  const grouped = useMemo(() => {
    if (!dateFrom || !dateTo) return [];
    const filtered = filterScanLogs(scanLogs, {
      departmentId,
      mode,
      dateFrom,
      dateTo,
    });
    return groupScanLogsByDate(filtered);
  }, [scanLogs, departmentId, mode, dateFrom, dateTo]);

  return (
    <div className="card-whitespace">
      <div>
        <h2 className="text-lg font-bold text-navy-900">{title}</h2>
        <p className="mt-1 text-sm text-text-secondary">{description}</p>
      </div>

      <div className="mt-4">
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

      {grouped.length === 0 ? (
        <p className="mt-6 py-8 text-center text-sm text-text-secondary">{emptyMessage}</p>
      ) : (
        <div className="mt-6 space-y-6">
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
  );
}
