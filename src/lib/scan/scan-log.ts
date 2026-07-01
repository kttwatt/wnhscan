import type { ScanMode } from "@/lib/scan/types";

export type ScanLogItem = {
  code: string;
  name: string;
  barcode: string;
  quantity: number;
  verified: boolean;
};

export type ScanLogEntry = {
  id: string;
  departmentId?: string;
  mode: ScanMode;
  items: ScanLogItem[];
  savedAt: string;
  userId?: string;
};

export const SCAN_LOG_CHANGED_EVENT = "wnhscan:scan-log-changed";
