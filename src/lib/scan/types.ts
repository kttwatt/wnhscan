export type ScanMode = "instant_scan" | "queue_scan";

export type ScanWizardItem = {
  code: string;
  name: string;
  barcode: string;
  group: string;
  quantity?: number;
};
