"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Loader2, Printer, X } from "lucide-react";
import { CatalogPrintBarcode } from "@/components/catalog/catalog-print-barcode";
import { Button } from "@/components/ui/button";
import { buildPrintPages, type PrintBlock } from "@/lib/catalog/catalog-print-pagination";
import { warmCode128SvgCache } from "@/lib/catalog/code128-barcode-svg";
import { downloadCatalogPdf } from "@/lib/catalog/download-catalog-pdf";
import { formatDepartmentLabel } from "@/lib/auth/departments";
import type { CatalogItem } from "@/lib/catalog/types";

type CatalogPrintPreviewProps = {
  open: boolean;
  onClose: () => void;
  departmentId: string;
  groupedItems: { key: string; items: CatalogItem[] }[];
  totalCount: number;
  filteredCount: number;
  scopeLabel?: string;
};

function formatPrintDate(): string {
  return new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function PrintSheetHeader({
  deptLabel,
  totalCount,
  filteredCount,
  isFiltered,
}: {
  deptLabel: string;
  totalCount: number;
  filteredCount: number;
  isFiltered: boolean;
}) {
  return (
    <header className="catalog-print-header border-b border-border pb-3 print:border-black/20">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted print:text-black/60">
        สมุดรายการวัสดุ
      </p>
      <h1 className="mt-0.5 text-xl font-bold text-navy-900 print:text-lg">{deptLabel}</h1>
      <p className="mt-0.5 text-xs text-text-secondary print:text-black/70">
        พิมพ์เมื่อ {formatPrintDate()}
        {isFiltered ? ` · กรองแล้ว ${filteredCount} รายการ` : ` · ทั้งหมด ${totalCount} รายการ`}
      </p>
    </header>
  );
}

function PrintBlockView({ block }: { block: PrintBlock }) {
  if (block.type === "group-title") {
    return (
      <h2 className="catalog-print-group-title col-span-2 mb-1 border-b border-border pb-1 text-xs font-bold text-navy-900 print:border-black/20 print:text-[11px]">
        {block.key} ({block.count}){block.continued ? " — ต่อ" : ""}
      </h2>
    );
  }

  const { item } = block;
  return (
    <article className="catalog-print-item flex min-h-[26mm] flex-col items-center justify-center border border-border px-2 py-2 print:min-h-[26mm] print:border-black/20">
      <CatalogPrintBarcode value={item.barcode} />
      <p className="mt-1 w-full text-center font-mono text-[10px] font-semibold leading-tight text-navy-900 print:text-[9px]">
        {item.code}
      </p>
      <p className="mt-0.5 w-full text-center text-[11px] leading-snug text-navy-900 print:text-[10px]">
        {item.name}
      </p>
    </article>
  );
}

export function CatalogPrintPreview({
  open,
  onClose,
  departmentId,
  groupedItems,
  totalCount,
  filteredCount,
  scopeLabel,
}: CatalogPrintPreviewProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [preparing, setPreparing] = useState(false);

  const pages = useMemo(
    () => (open && filteredCount > 0 ? buildPrintPages(groupedItems) : []),
    [open, groupedItems, filteredCount],
  );

  useEffect(() => {
    if (!open || filteredCount === 0) {
      setPreparing(false);
      return;
    }

    setPreparing(true);
    const barcodes = groupedItems.flatMap((g) => g.items.map((item) => item.barcode));
    const timer = window.setTimeout(() => {
      warmCode128SvgCache(barcodes);
      setPreparing(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open, groupedItems, filteredCount]);

  if (!open) return null;

  const deptLabel = formatDepartmentLabel(departmentId);
  const isFiltered = filteredCount < totalCount;
  const pageCount = pages.length;
  const canPrint = filteredCount > 0 && !preparing;
  const canDownload = canPrint && !downloading;

  function handlePrint() {
    if (!canPrint) return;
    window.print();
  }

  async function handleDownloadPdf() {
    const el = sheetRef.current;
    if (!el || !canDownload) return;
    setDownloading(true);
    try {
      await downloadCatalogPdf(el, departmentId);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div
      className="catalog-print-root fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-900/50 p-4 print:static print:block print:overflow-visible print:bg-white print:p-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="catalog-print-title"
    >
      <div className="catalog-print-dialog relative my-4 w-full max-w-[210mm] rounded-xl border border-border bg-surface-card shadow-xl print:my-0 print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        <div className="catalog-print-toolbar flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4 print:hidden">
          <div>
            <h2 id="catalog-print-title" className="font-semibold text-navy-900">
              ตัวอย่างก่อนพิมพ์
            </h2>
            <p className="mt-0.5 text-sm text-text-secondary">
              {deptLabel} · {scopeLabel ?? "พิมพ์ทั้งหมด"} · A4 2 คอลัมน์
              {isFiltered ? ` · ${filteredCount} จาก ${totalCount} รายการ` : ` · ${totalCount} รายการ`}
              {pageCount > 0 ? ` · ${pageCount} หน้า` : ""}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              ตรวจสอบ layout แล้วกด พิมพ์ ดาวน์โหลด PDF หรือ Ctrl+P
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={handlePrint} disabled={!canPrint}>
              <Printer className="h-4 w-4" /> พิมพ์
            </Button>
            <Button
              variant="secondary"
              onClick={() => void handleDownloadPdf()}
              disabled={!canDownload}
              aria-busy={downloading}
              aria-label={downloading ? "กำลังสร้างไฟล์ .PDF" : "ดาวน์โหลด PDF"}
            >
              {downloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  กำลังสร้างไฟล์ .PDF
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  ดาวน์โหลด PDF
                </>
              )}
            </Button>
            <Button variant="secondary" onClick={onClose}>
              <X className="h-4 w-4" /> ปิด
            </Button>
          </div>
        </div>

        <div
          ref={sheetRef}
          id="catalog-print-sheet"
          className="catalog-print-sheet bg-white print:px-0 print:py-0"
        >
          {filteredCount === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-text-secondary">ไม่มีรายการที่จะพิมพ์</p>
          ) : preparing ? (
            <div className="flex items-center justify-center gap-2 px-6 py-24 text-sm text-text-secondary">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              กำลังจัดหน้า A4…
            </div>
          ) : (
            <div className="catalog-print-pages space-y-4 print:space-y-0">
              {pages.map((page) => (
                <div
                  key={page.pageNumber}
                  className="catalog-print-page mx-auto box-border min-h-[297mm] w-full border border-border bg-white p-[10mm] shadow-sm print:min-h-[297mm] print:border-0 print:p-[10mm] print:shadow-none"
                >
                  {page.showHeader ? (
                    <PrintSheetHeader
                      deptLabel={deptLabel}
                      totalCount={totalCount}
                      filteredCount={filteredCount}
                      isFiltered={isFiltered}
                    />
                  ) : (
                    <p className="catalog-print-page-footer mb-2 text-right text-[9px] text-text-muted print:text-black/50">
                      {deptLabel} · หน้า {page.pageNumber}
                    </p>
                  )}
                  <div className="catalog-print-grid mt-3 grid grid-cols-2 gap-2.5 print:mt-2 print:gap-2">
                    {page.blocks.map((block, index) => (
                      <PrintBlockView
                        key={
                          block.type === "item"
                            ? block.item.id
                            : `${block.key}-${block.continued ? "c" : "h"}-${index}`
                        }
                        block={block}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
