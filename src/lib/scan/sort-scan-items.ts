import type { ScanWizardItem } from "./types";

function groupParts(group: string): [string, string] {
  const parts = group.split(" › ");
  return [parts[0] ?? group, parts[1] ?? ""];
}

/** Sort by หมวด → หมวดย่อย → รหัส (§2.2.2) */
export function sortScanItems<T extends ScanWizardItem>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const [ag, asg] = groupParts(a.group);
    const [bg, bsg] = groupParts(b.group);
    const byGroup = ag.localeCompare(bg, "th");
    if (byGroup !== 0) return byGroup;
    const bySubgroup = asg.localeCompare(bsg, "th");
    if (bySubgroup !== 0) return bySubgroup;
    return a.code.localeCompare(b.code);
  });
}
