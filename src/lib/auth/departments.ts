/** @deprecated Fallback when `activeDepartmentCodes` is empty — prefer DB-loaded codes */
export const ALL_DEPARTMENTS = ["OR", "AN"] as const;

export type DepartmentId = (typeof ALL_DEPARTMENTS)[number];

/** ชื่อหน่วยงาน — ไม่มีใน map จะแสดงแค่รหัส */
export const DEPARTMENT_LABELS: Partial<Record<DepartmentId, string>> = {
  OR: "ห้องผ่าตัด",
  AN: "วิสัญญี",
};

export function formatDepartmentLabel(id: string): string {
  const name = DEPARTMENT_LABELS[id as DepartmentId];
  return name ? `${name} (${id})` : id;
}
