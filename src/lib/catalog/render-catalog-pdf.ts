import { catalogPdfFilename } from "@/lib/catalog/catalog-pdf-filename";
import { renderCode128Png } from "@/lib/catalog/code128-barcode-svg";
import type { PrintBlock, PrintPage } from "@/lib/catalog/catalog-print-pagination";

export type CatalogPdfExportInput = {
  departmentId: string;
  deptLabel: string;
  pages: PrintPage[];
  totalCount: number;
  filteredCount: number;
  onProgress?: (current: number, total: number) => void;
};

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 10;
const GAP = 2.5;
const CONTENT_W = PAGE_W - MARGIN * 2;
const COL_W = (CONTENT_W - GAP) / 2;
const ITEM_H = 38;
const GROUP_TITLE_H = 7;
const HEADER_H = 26;
const FOOTER_H = 5;
const PX_PER_MM = 96 / 25.4;

type TextBitmap = { dataUrl: string; widthMm: number; heightMm: number };

const textBitmapCache = new Map<string, TextBitmap>();

function formatPrintDate(): string {
  return new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidthPx: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [text];

  const lines: string[] = [];
  let line = words[0] ?? "";

  for (let i = 1; i < words.length; i++) {
    const next = `${line} ${words[i]}`;
    if (ctx.measureText(next).width <= maxWidthPx) {
      line = next;
    } else {
      lines.push(line);
      line = words[i] ?? "";
    }
  }
  lines.push(line);
  return lines;
}

function renderTextBitmap(
  text: string,
  fontSizePx: number,
  maxWidthMm: number,
  options: { fontFamily?: string; fontWeight?: string; align?: "left" | "center" | "right" },
): TextBitmap {
  const cacheKey = `${fontSizePx}|${maxWidthMm}|${options.fontFamily ?? ""}|${options.fontWeight ?? ""}|${options.align ?? "left"}|${text}`;
  const cached = textBitmapCache.get(cacheKey);
  if (cached) return cached;

  const maxWidthPx = maxWidthMm * PX_PER_MM;
  const scale = 2;
  const fontFamily = options.fontFamily ?? "Inter, system-ui, sans-serif";
  const font = `${options.fontWeight ?? "normal"} ${fontSizePx}px ${fontFamily}`;

  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  if (!measureCtx) {
    return { dataUrl: "", widthMm: 0, heightMm: 0 };
  }
  measureCtx.font = font;
  const lines = wrapLines(measureCtx, text, maxWidthPx);
  const lineHeight = fontSizePx * 1.25;
  const heightPx = lines.length * lineHeight + 2;

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(maxWidthPx * scale);
  canvas.height = Math.ceil(heightPx * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { dataUrl: "", widthMm: 0, heightMm: 0 };
  }

  ctx.scale(scale, scale);
  ctx.font = font;
  ctx.fillStyle = "#111827";
  ctx.textBaseline = "top";
  if (options.align === "center") ctx.textAlign = "center";
  if (options.align === "right") ctx.textAlign = "right";

  lines.forEach((line, index) => {
    const x =
      options.align === "center"
        ? maxWidthPx / 2
        : options.align === "right"
          ? maxWidthPx
          : 0;
    ctx.fillText(line, x, index * lineHeight + 1, maxWidthPx);
  });

  const result: TextBitmap = {
    dataUrl: canvas.toDataURL("image/png"),
    widthMm: maxWidthMm,
    heightMm: heightPx / PX_PER_MM,
  };
  textBitmapCache.set(cacheKey, result);
  return result;
}

function drawTextImage(
  pdf: import("jspdf").jsPDF,
  text: string,
  x: number,
  y: number,
  widthMm: number,
  fontSizePx: number,
  options?: { fontFamily?: string; fontWeight?: string; align?: "left" | "center" | "right" },
) {
  const bitmap = renderTextBitmap(text, fontSizePx, widthMm, {
    fontFamily: options?.fontFamily,
    fontWeight: options?.fontWeight,
    align: options?.align ?? "center",
  });
  if (!bitmap.dataUrl) return;
  pdf.addImage(bitmap.dataUrl, "PNG", x, y, bitmap.widthMm, bitmap.heightMm);
}

function drawPageHeader(
  pdf: import("jspdf").jsPDF,
  deptLabel: string,
  totalCount: number,
  filteredCount: number,
) {
  const isFiltered = filteredCount < totalCount;
  const y = MARGIN;

  drawTextImage(pdf, "สมุดรายการวัสดุ", MARGIN, y, CONTENT_W, 8, { fontWeight: "600" });
  drawTextImage(pdf, deptLabel, MARGIN, y + 5, CONTENT_W, 14, { fontWeight: "700" });

  const meta = `พิมพ์เมื่อ ${formatPrintDate()} · ${
    isFiltered ? `กรองแล้ว ${filteredCount} รายการ` : `ทั้งหมด ${totalCount} รายการ`
  }`;
  drawTextImage(pdf, meta, MARGIN, y + 12, CONTENT_W, 8);

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.2);
  pdf.line(MARGIN, y + HEADER_H - 2, MARGIN + CONTENT_W, y + HEADER_H - 2);
}

function drawPageFooter(pdf: import("jspdf").jsPDF, deptLabel: string, pageNumber: number) {
  drawTextImage(
    pdf,
    `${deptLabel} · หน้า ${pageNumber}`,
    MARGIN,
    MARGIN,
    CONTENT_W,
    7,
    { align: "right" },
  );
}

function drawGroupTitle(pdf: import("jspdf").jsPDF, block: Extract<PrintBlock, { type: "group-title" }>, y: number) {
  const label = `${block.key} (${block.count})${block.continued ? " — ต่อ" : ""}`;
  drawTextImage(pdf, label, MARGIN, y, CONTENT_W, 9, { fontWeight: "700", align: "left" });
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.15);
  pdf.line(MARGIN, y + GROUP_TITLE_H - 1, MARGIN + CONTENT_W, y + GROUP_TITLE_H - 1);
}

function drawItemCell(
  pdf: import("jspdf").jsPDF,
  block: Extract<PrintBlock, { type: "item" }>,
  x: number,
  y: number,
) {
  const { item } = block;
  const innerW = COL_W - 4;

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.2);
  pdf.rect(x, y, COL_W, ITEM_H);

  const barcode = renderCode128Png(item.barcode);
  let contentY = y + 3;

  if (barcode) {
    const maxBarcodeW = innerW * 0.98;
    const maxBarcodeH = 18;
    const aspect = barcode.width / barcode.height;
    let bw = maxBarcodeW;
    let bh = bw / aspect;
    if (bh > maxBarcodeH) {
      bh = maxBarcodeH;
      bw = bh * aspect;
    }
    pdf.addImage(barcode.dataUrl, "PNG", x + (COL_W - bw) / 2, contentY, bw, bh);
    contentY += bh + 1.5;
  }

  drawTextImage(pdf, item.code, x + 2, contentY, innerW, 8, {
    fontFamily: "ui-monospace, monospace",
    fontWeight: "600",
  });
  contentY += 3.2;
  drawTextImage(pdf, item.name, x + 2, contentY, innerW, 9);
}

function renderPage(
  pdf: import("jspdf").jsPDF,
  page: PrintPage,
  deptLabel: string,
  totalCount: number,
  filteredCount: number,
) {
  let y = MARGIN;

  if (page.showHeader) {
    drawPageHeader(pdf, deptLabel, totalCount, filteredCount);
    y += HEADER_H + 2;
  } else {
    drawPageFooter(pdf, deptLabel, page.pageNumber);
    y += FOOTER_H + 2;
  }

  let col = 0;
  let rowY = y;

  for (const block of page.blocks) {
    if (block.type === "group-title") {
      if (col === 1) {
        col = 0;
        rowY += ITEM_H + GAP;
      }
      drawGroupTitle(pdf, block, rowY);
      rowY += GROUP_TITLE_H + GAP;
      col = 0;
      continue;
    }

    const x = MARGIN + col * (COL_W + GAP);
    drawItemCell(pdf, block, x, rowY);

    if (col === 0) {
      col = 1;
    } else {
      col = 0;
      rowY += ITEM_H + GAP;
    }
  }
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** สร้าง PDF จากข้อมูลโดยตรง — เร็วกว่า html2canvas หลายเท่า */
export async function renderCatalogPdf(input: CatalogPdfExportInput): Promise<void> {
  const { departmentId, deptLabel, pages, totalCount, filteredCount, onProgress } = input;
  if (pages.length === 0) {
    throw new Error("ไม่มีหน้าที่จะส่งออก PDF");
  }

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
    compress: true,
  });

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) pdf.addPage();
    renderPage(pdf, pages[i], deptLabel, totalCount, filteredCount);
    onProgress?.(i + 1, pages.length);
    if (i % 3 === 2) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
  }

  const blob = pdf.output("blob");
  triggerBlobDownload(blob, catalogPdfFilename(departmentId));
}
