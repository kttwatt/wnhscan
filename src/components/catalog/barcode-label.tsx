import { Code128Barcode } from "@/components/catalog/code128-barcode";

/** Barcode chip for catalog tables — thin strip, no duplicate number */
export function BarcodeLabel({ value }: { value: string }) {
  return (
    <div className="inline-flex items-center rounded border border-border bg-white px-1 py-0.5">
      <Code128Barcode value={value} variant="inline" className="h-3.5 w-auto max-w-[72px]" />
    </div>
  );
}
