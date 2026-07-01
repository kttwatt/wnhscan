"use client";

import { useEffect, useRef } from "react";

type Code128BarcodeProps = {
  value: string;
  /** scan = large bars for USB scanner; inline = thin strip in tables; mini = dense rows with label */
  variant?: "inline" | "mini" | "compact" | "booklet" | "scan";
  className?: string;
};

const VARIANT_OPTS = {
  /** แถบบางในตาราง — ไม่แสดงตัวเลข (มีคอลัมน์รหัสอยู่แล้ว) */
  inline: { width: 1, height: 14, fontSize: 8, margin: 0, displayValue: false },
  mini: { width: 1, height: 22, fontSize: 9, margin: 2, displayValue: true },
  compact: { width: 1.5, height: 44, fontSize: 12, margin: 10, displayValue: true },
  /** สมุดรายการ A4 — บาร์โค้ดอย่างเดียว ไม่แสดงตัวเลขใต้แถบ */
  booklet: { width: 1.35, height: 38, fontSize: 8, margin: 2, displayValue: false },
  scan: { width: 4, height: 108, fontSize: 20, margin: 4, displayValue: true },
} as const;

export function Code128Barcode({
  value,
  variant = "compact",
  className = "",
}: Code128BarcodeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const opts = VARIANT_OPTS[variant];

  useEffect(() => {
    if (!svgRef.current || !value) return;
    let cancelled = false;
    const el = svgRef.current;

    void import("jsbarcode").then(({ default: JsBarcode }) => {
      if (cancelled || !el) return;
      try {
        JsBarcode(el, value, {
          format: "CODE128",
          width: opts.width,
          height: opts.height,
          displayValue: opts.displayValue,
          fontSize: opts.fontSize,
          fontOptions: "bold",
          margin: opts.margin,
          background: "transparent",
          lineColor: "#000000",
        });
      } catch {
        el.innerHTML = "";
      }
    });

    return () => {
      cancelled = true;
    };
  }, [value, opts.displayValue, opts.fontSize, opts.height, opts.margin, opts.width]);

  return (
    <svg
      ref={svgRef}
      className={`block max-w-full ${className}`}
      role="img"
      aria-label={`บาร์โค้ด ${value}`}
    />
  );
}
