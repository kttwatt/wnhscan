import Link from "next/link";
import { ArrowRight, ClipboardCheck } from "lucide-react";

type CloseRoundBannerProps = {
  departmentId: string;
  pendingQty: number;
  /** ปุ่มปิดรอบ — เฉพาะผู้จัดการแผนกและผู้ดูแลระบบ */
  showCloseRoundAction?: boolean;
  /** เมื่ออยู่หน้าปิดรอบแล้ว — ใช้แทนลิงก์ไป /close-round */
  onAction?: () => void;
};

export function CloseRoundBanner({
  departmentId,
  pendingQty,
  showCloseRoundAction = false,
  onAction,
}: CloseRoundBannerProps) {
  const actionLabel = (
    <>
      ปิดรอบสแกน <ArrowRight className="h-4 w-4" />
    </>
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-yellow-accent/40 bg-yellow-light px-6 py-4">
      <div className="flex items-start gap-3">
        <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-navy-900" />
        <div>
          <p className="font-semibold text-navy-900">รอสแกน</p>
          <p className="mt-0.5 text-sm text-text-secondary">
            มี {pendingQty} ชิ้นรอสแกนในแผนก {departmentId}
          </p>
        </div>
      </div>
      {showCloseRoundAction ? (
        onAction ? (
          <button type="button" onClick={onAction} className="btn-primary shrink-0">
            {actionLabel}
          </button>
        ) : (
          <Link href="/close-round" className="btn-primary shrink-0">
            {actionLabel}
          </Link>
        )
      ) : null}
    </div>
  );
}
