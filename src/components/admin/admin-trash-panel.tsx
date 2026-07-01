"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArchiveRestore, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemSearchField } from "@/components/ui/item-search-field";
import { TRASH_RETENTION_DAYS, formatDeletedAt } from "@/lib/catalog/trash-helpers";
import {
  canPermanentlyDelete,
  daysUntilPermanentDelete,
  filterTrashItems,
  useTrashCatalogItems,
} from "@/lib/hooks/use-trash-catalog-items";
import type { TrashCatalogItem } from "@/lib/catalog/types";

export function AdminTrashPanel() {
  const {
    items,
    loading,
    error,
    message,
    expiredCount,
    restoreItem,
    permanentlyDeleteItem,
    purgeExpired,
  } = useTrashCatalogItems();

  const [searchQuery, setSearchQuery] = useState("");
  const [restoreTarget, setRestoreTarget] = useState<TrashCatalogItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TrashCatalogItem | null>(null);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const filteredItems = useMemo(
    () => filterTrashItems(items, searchQuery),
    [items, searchQuery],
  );

  async function confirmRestore() {
    if (!restoreTarget) return;
    setBusy(true);
    try {
      await restoreItem(restoreTarget.id);
      setRestoreTarget(null);
    } catch (err) {
      // error surfaced via hook refresh
      void err;
    } finally {
      setBusy(false);
    }
  }

  async function confirmPermanentDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await permanentlyDeleteItem(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      void err;
    } finally {
      setBusy(false);
    }
  }

  async function confirmPurge() {
    setBusy(true);
    try {
      await purgeExpired();
      setPurgeOpen(false);
    } catch (err) {
      void err;
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="card-whitespace">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-text-secondary">
              รายการวัสดุที่ย้ายจาก{" "}
              <Link href="/admin/catalog" className="font-medium text-blue-primary hover:underline">
                ฐานข้อมูลกลาง
              </Link>{" "}
              — กู้คืนได้ตลอด · ลบถาวรได้หลังครบ {TRASH_RETENTION_DAYS} วัน
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setPurgeOpen(true)}
            disabled={expiredCount === 0 || loading}
          >
            <Trash2 className="h-4 w-4" /> ลบถาวรรายการครบ {TRASH_RETENTION_DAYS} วัน
            {expiredCount > 0 ? ` (${expiredCount})` : ""}
          </Button>
        </div>

        <div className="mt-4">
          <ItemSearchField
            id="trash-item-search"
            layout="inline"
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="ค้นหา ชื่อ / รหัส / บาร์โค้ด..."
          />
          <p className="mt-3 text-xs text-text-secondary">
            {searchQuery.trim()
              ? `แสดง ${filteredItems.length} จาก ${items.length} รายการ`
              : `ทั้งหมด ${items.length} รายการในถังขยะ`}
          </p>
        </div>

        {message ? (
          <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{message}</p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        {loading ? (
          <p className="mt-8 text-center text-sm text-text-secondary">กำลังโหลดถังขยะ…</p>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-border bg-surface-page px-6 py-14 text-center">
            <Trash2 className="mx-auto h-12 w-12 text-text-muted" />
            <p className="mt-4 text-lg font-semibold text-navy-900">ถังขยะว่าง</p>
            <p className="mt-1 text-sm text-text-secondary">
              รายการที่ลบจากฐานข้อมูลกลางจะปรากฏที่นี่
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="mt-8 rounded-xl border border-border bg-surface-page px-6 py-10 text-center">
            <p className="font-medium text-navy-900">ไม่พบรายการตามคำค้นหา</p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-surface-page">
                <tr className="border-b border-border text-text-secondary">
                  {["รหัส", "ชื่อ", "หมวด", "ลบเมื่อ", "สถานะ", ""].map((h) => (
                    <th key={h || "actions"} className="px-4 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const canDelete = canPermanentlyDelete(item.deletedAt);
                  const daysLeft = daysUntilPermanentDelete(item.deletedAt);
                  return (
                    <tr key={item.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3 font-medium text-blue-primary">{item.code}</td>
                      <td className="px-4 py-3 text-navy-900">{item.name}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        {item.group} / {item.subgroup}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {formatDeletedAt(item.deletedAt)}
                      </td>
                      <td className="px-4 py-3">
                        {canDelete ? (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                            พร้อมลบถาวร
                          </span>
                        ) : (
                          <span className="rounded-full bg-surface-page px-2.5 py-1 text-xs font-medium text-text-secondary">
                            เหลือ {daysLeft} วัน
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" onClick={() => setRestoreTarget(item)}>
                            <ArchiveRestore className="h-4 w-4" /> กู้คืน
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setDeleteTarget(item)}
                            disabled={!canDelete}
                            title={
                              canDelete
                                ? "ลบถาวร"
                                : `รออีก ${daysLeft} วันก่อนลบถาวรได้`
                            }
                          >
                            <Trash2
                              className={`h-4 w-4 ${canDelete ? "text-red-500" : "text-text-muted"}`}
                            />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {restoreTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-surface-card p-6 shadow-xl">
            <p className="font-semibold text-navy-900">กู้คืนรายการวัสดุ?</p>
            <p className="mt-2 text-sm text-text-secondary">
              <span className="font-medium text-blue-primary">{restoreTarget.code}</span> —{" "}
              {restoreTarget.name}
              <br />
              รายการจะกลับไปแสดงใน{" "}
              <Link href="/admin/catalog" className="font-medium text-blue-primary hover:underline">
                ฐานข้อมูลกลาง
              </Link>
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setRestoreTarget(null)} disabled={busy}>
                ยกเลิก
              </Button>
              <Button variant="primary" onClick={() => void confirmRestore()} disabled={busy}>
                {busy ? "กำลังกู้คืน…" : "กู้คืน"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-surface-card p-6 shadow-xl">
            <p className="font-semibold text-navy-900">ลบถาวร?</p>
            <p className="mt-2 text-sm text-text-secondary">
              <span className="font-medium text-blue-primary">{deleteTarget.code}</span> —{" "}
              {deleteTarget.name}
              <br />
              การลบถาวรไม่สามารถย้อนกลับได้
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={busy}>
                ยกเลิก
              </Button>
              <Button variant="danger" onClick={() => void confirmPermanentDelete()} disabled={busy}>
                {busy ? "กำลังลบ…" : "ลบถาวร"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {purgeOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-surface-card p-6 shadow-xl">
            <p className="font-semibold text-navy-900">ลบถาวรรายการครบ {TRASH_RETENTION_DAYS} วัน?</p>
            <p className="mt-2 text-sm text-text-secondary">
              จะลบถาวร {expiredCount} รายการที่อยู่ในถังขยะเกิน {TRASH_RETENTION_DAYS} วัน
              — ไม่สามารถกู้คืนได้
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPurgeOpen(false)} disabled={busy}>
                ยกเลิก
              </Button>
              <Button variant="danger" onClick={() => void confirmPurge()} disabled={busy}>
                {busy ? "กำลังลบ…" : `ลบถาวร ${expiredCount} รายการ`}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
