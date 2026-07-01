import { formatDepartmentLabel } from "@/lib/auth/departments";

const INVALID_FILENAME_CHARS = /[/\\:*?"<>|]/g;

export function catalogPdfFilename(departmentId: string): string {
  const deptLabel = formatDepartmentLabel(departmentId).replace(INVALID_FILENAME_CHARS, "-");
  return `สมุดรายการวัสดุ-${deptLabel}.pdf`;
}
