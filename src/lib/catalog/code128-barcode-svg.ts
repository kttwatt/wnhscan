import JsBarcode from "jsbarcode";

const VARIANT_OPTS = {
  booklet: {
    format: "CODE128" as const,
    width: 2.25,
    height: 64,
    displayValue: false,
    fontSize: 8,
    fontOptions: "bold" as const,
    margin: 1,
    background: "transparent",
    lineColor: "#000000",
  },
} as const;

function barcodeCacheKey(variant: keyof typeof VARIANT_OPTS, value: string, format: "svg" | "png"): string {
  const opts = VARIANT_OPTS[variant];
  return `${format}:${variant}:${opts.width}:${opts.height}:${value}`;
}

const svgCache = new Map<string, string>();
const pngCache = new Map<string, { dataUrl: string; width: number; height: number }>();

/** สร้าง PNG บาร์โค้ดสำหรับ PDF (เร็วกว่า html2canvas มาก) */
export function renderCode128Png(
  value: string,
  variant: keyof typeof VARIANT_OPTS = "booklet",
): { dataUrl: string; width: number; height: number } | null {
  if (!value) return null;
  const cacheKey = barcodeCacheKey(variant, value, "png");
  const cached = pngCache.get(cacheKey);
  if (cached) return cached;

  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  try {
    JsBarcode(canvas, value, VARIANT_OPTS[variant]);
    const result = {
      dataUrl: canvas.toDataURL("image/png"),
      width: canvas.width,
      height: canvas.height,
    };
    pngCache.set(cacheKey, result);
    return result;
  } catch {
    return null;
  }
}

/** อุ่น cache PNG ก่อนส่งออก PDF */
export function warmCode128PngCache(values: Iterable<string>, variant: keyof typeof VARIANT_OPTS = "booklet"): void {
  for (const value of values) {
    renderCode128Png(value, variant);
  }
}

/** สร้าง SVG บาร์โค้ดแบบ sync + cache (เร็วกว่า useEffect ต่อรายการ) */
export function renderCode128Svg(value: string, variant: keyof typeof VARIANT_OPTS = "booklet"): string {
  if (!value) return "";
  const cacheKey = barcodeCacheKey(variant, value, "svg");
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
