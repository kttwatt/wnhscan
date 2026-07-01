import { catalogPdfFilename } from "@/lib/catalog/catalog-pdf-filename";

type Html2PdfWorker = {
  set: (opts: object) => Html2PdfWorker;
  from: (element: HTMLElement) => Html2PdfWorker;
  outputPdf: (type: string) => Promise<Blob>;
};

const PDF_OPTIONS = {
  margin: [10, 10, 10, 10],
  image: { type: "jpeg", quality: 0.98 },
  html2canvas: {
    scale: 2,
    useCORS: true,
    logging: false,
  },
  jsPDF: {
    unit: "mm",
    format: "a4",
    orientation: "portrait",
  },
  pagebreak: {
    mode: ["css", "legacy"],
    before: ".catalog-print-page",
    avoid: [".catalog-print-item", ".catalog-print-group-title", ".catalog-print-header"],
  },
};

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

export async function downloadCatalogPdf(
  element: HTMLElement,
  departmentId: string,
): Promise<void> {
  const html2pdf = (await import("html2pdf.js")).default as () => Html2PdfWorker;
  const filename = catalogPdfFilename(departmentId);

  const blob = await html2pdf()
    .set({ ...PDF_OPTIONS, filename })
    .from(element)
    .outputPdf("blob");

  triggerBlobDownload(blob, filename);
}
