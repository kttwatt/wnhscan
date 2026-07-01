import JsBarcode from "jsbarcode";

const VARIANT_OPTS = {
  booklet: {
    format: "CODE128" as const,
    width: 1.35,
    height: 38,
    displayValue: false,
    fontSize: 8,
    fontOptions: "bold" as const,
    margin: 2,
    background: "transparent",
    lineColor: "#000000",
  },
} as const;

const svgCache = new Map<string, string>();

/** สร้าง SVG บาร์โค้ดแบบ sync + cache (เร็วกว่า useEffect ต่อรายการ) */
export function renderCode128Svg(value: string, variant: keyof typeof VARIANT_OPTS = "booklet"): string {
  if (!value) return "";
  const cacheKey = `${variant}:${value}`;
  const cached = svgCache.get(cacheKey);
  if (cached) return cached;

  if (typeof document === "undefined") return "";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  try {
    JsBarcode(svg, value, VARIANT_OPTS[variant]);
    const html = svg.outerHTML;
    svgCache.set(cacheKey, html);
    return html;
  } catch {
    return "";
  }
}

/** อุ่น cache ก่อน render สมุดพิมพ์ */
export function warmCode128SvgCache(values: Iterable<string>, variant: keyof typeof VARIANT_OPTS = "booklet"): void {
  for (const value of values) {
    renderCode128Svg(value, variant);
  }
}
