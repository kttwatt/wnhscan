import type { CatalogItem } from "@/lib/catalog/types";

export type PrintBlock =
  | { type: "group-title"; key: string; count: number; continued?: boolean }
  | { type: "item"; item: CatalogItem };

export type PrintPage = {
  pageNumber: number;
  blocks: PrintBlock[];
  showHeader: boolean;
};

/** ช่องต่อหน้า A4 (2 คอล.) — หน้าแรกหัก header */
const SLOTS_FIRST_PAGE = 16;
const SLOTS_OTHER_PAGES = 18;
/** หัวข้อหมวด = 1 แถวเต็ม (2 ช่อง) */
const GROUP_TITLE_SLOTS = 2;

function maxSlots(isFirstPage: boolean): number {
  return isFirstPage ? SLOTS_FIRST_PAGE : SLOTS_OTHER_PAGES;
}

/** แบ่งรายการเป็น A4 หลายหน้า — 2 คอลัมน์, ขึ้นหน้าใหม่เมื่อเต็ม */
export function buildPrintPages(
  groupedItems: { key: string; items: CatalogItem[] }[],
): PrintPage[] {
  const pages: PrintPage[] = [];
  let blocks: PrintBlock[] = [];
  let slotsUsed = 0;
  let isFirstPage = true;

  function flushPage() {
    if (blocks.length === 0) return;
    pages.push({
      pageNumber: pages.length + 1,
      blocks: [...blocks],
      showHeader: isFirstPage,
    });
    blocks = [];
    slotsUsed = 0;
    isFirstPage = false;
  }

  function ensureSpace(needed: number) {
    if (slotsUsed + needed > maxSlots(isFirstPage) && blocks.length > 0) {
      flushPage();
    }
  }

  for (const group of groupedItems) {
    let titleAdded = false;

    function addGroupTitle(continued = false) {
      ensureSpace(GROUP_TITLE_SLOTS);
      blocks.push({
        type: "group-title",
        key: group.key,
        count: group.items.length,
        continued,
      });
      slotsUsed += GROUP_TITLE_SLOTS;
      titleAdded = true;
    }

    for (const item of group.items) {
      if (!titleAdded) addGroupTitle(false);
      ensureSpace(1);
      if (slotsUsed + 1 > maxSlots(isFirstPage) && blocks.length > 0) {
        flushPage();
        addGroupTitle(true);
      }
      blocks.push({ type: "item", item });
      slotsUsed += 1;
    }
  }

  flushPage();
  return pages;
}
