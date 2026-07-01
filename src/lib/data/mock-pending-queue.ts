/** Mock pending barcodes — replace with Supabase `barcodes` where status = 'pending' */
export type PendingBarcode = {
  code: string;
  name: string;
  barcode: string;
  group: string;
  departmentIds: string[];
  /** ISO timestamp when item entered pending queue */
  pendingSince: string;
};

/** Fixed timestamps so mock staleness is stable for SSR hydration. */
export const MOCK_PENDING_BARCODES: PendingBarcode[] = [
  {
    code: "10000313",
    name: 'Needle Disp.no.20x1.5"',
    barcode: "10000313",
    group: "วัสดุ › วัสดุการแพทย์",
    departmentIds: ["OR1", "OR2", "OR3", "OPD"],
    pendingSince: "2026-06-15T10:00:00.000Z",
  },
  {
    code: "10000294",
    name: 'Micropore 1" ม้วน',
    barcode: "10000294",
    group: "วัสดุ › วัสดุการแพทย์",
    departmentIds: ["OR1", "OR2", "OR3", "OPD"],
    pendingSince: "2026-06-21T10:00:00.000Z",
  },
  {
    code: "10001039",
    name: "คลิปดำ 108",
    barcode: "10001039",
    group: "วัสดุ › วัสดุสำนักงาน",
    departmentIds: ["OR1", "OR2", "OR3", "OPD"],
    pendingSince: "2026-06-23T10:00:00.000Z",
  },
];

/** @deprecated Use getPendingForDepartment from @/lib/pending/pending-store */
export function pendingForDepartment(departmentId: string): PendingBarcode[] {
  return MOCK_PENDING_BARCODES.filter((row) => row.departmentIds.includes(departmentId));
}
