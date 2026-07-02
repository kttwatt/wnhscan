"use client";

import { memo, useMemo } from "react";
import { renderCode128Svg } from "@/lib/catalog/code128-barcode-svg";

type CatalogPrintBarcodeProps = {
  value: string;
  className?: string;
};

export const CatalogPrintBarcode = memo(function CatalogPrintBarcode({
  value,
  className = "",
}: CatalogPrintBarcodeProps) {
  const svgHtml = useMemo(() => renderCode128Svg(value, "booklet"), [value]);

  if (!svgHtml) {
    return (
      <span className={`font-mono text-[10px] text-navy-900 ${className}`} aria-label={`บาร์โค้ด ${value}`}>
        {value}
      </span>
    );
  }

  return (
    <div
      className={`flex w-full max-w-full items-center justify-center [&>svg]:block [&>svg]:h-auto [&>svg]:max-h-[18mm] [&>svg]:min-h-[14mm] [&>svg]:w-full [&>svg]:max-w-full ${className}`}
      role="img"
      aria-label={`บาร์โค้ด ${value}`}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
});
