export type ScanMatchResult = "match" | "mismatch" | "ignored";

export function evaluateScanMatch(
  scanned: string,
  expected: { code: string; barcode: string },
): ScanMatchResult {
  const value = scanned.trim();
  if (!value) return "ignored";
  if (value === expected.barcode || value === expected.code) return "match";
  return "mismatch";
}
