"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Clock, ScanLine } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

type CloseRoundFlowDiagramProps = {
  pendingTotalQty: number;
  weekScannedCount: number;
  pendingModalOpen: boolean;
  scanLogModalOpen: boolean;
  onOpenPending: () => void;
  onOpenScanLog: () => void;
};

function FlowSourceNode({
  label,
  icon,
  href,
  onClick,
  badge,
  tone,
  selected = false,
}: {
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
  tone: "scan" | "queue";
  selected?: boolean;
}) {
  const toneClass =
    tone === "scan"
      ? "border-blue-primary/25 bg-gradient-to-br from-blue-light/90 via-white to-blue-light/40 hover:border-blue-primary/45 hover:shadow-md hover:shadow-blue-primary/10"
      : "border-yellow-accent/35 bg-gradient-to-br from-yellow-light via-white to-yellow-light/60 hover:border-yellow-accent/55 hover:shadow-md hover:shadow-yellow-accent/10";

  const iconWrapClass =
    tone === "scan"
      ? "bg-blue-primary/10 text-blue-primary"
      : "bg-yellow-accent/15 text-yellow-accent";

  const badgeColor = tone === "scan" ? "text-blue-primary" : "text-yellow-accent";
  const selectedClass = selected ? "border-blue-primary ring-2 ring-blue-primary/20" : "";

  const inner = (
    <>
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconWrapClass}`}
      >
        {icon}
      </span>
      <span className="mt-3 text-sm font-semibold text-navy-900">{label}</span>
      <span className={`mt-1 min-h-8 text-2xl font-bold tracking-tight ${badgeColor}`}>
        {badge ?? "\u00A0"}
      </span>
    </>
  );

  const className = `flex h-full min-h-[120px] w-full flex-col items-center justify-center rounded-xl border px-4 py-4 text-center transition-all sm:min-h-[148px] sm:px-5 sm:py-5 ${toneClass} ${selectedClass}`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={`${className} cursor-pointer`}>
      {inner}
    </button>
  );
}

function FlowConnector() {
  return (
    <>
      <div className="relative mx-auto h-10 w-full max-w-xs sm:hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-blue-primary/40 to-blue-primary/25" />
        <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-primary shadow-sm shadow-blue-primary/30" />
        <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-blue-primary/35" />
      </div>

      <div className="relative hidden h-20 w-full sm:block" aria-hidden="true">
        <div className="absolute left-1/4 top-0 h-10 w-px -translate-x-1/2 bg-gradient-to-b from-blue-primary/15 to-blue-primary/45" />
        <div className="absolute left-3/4 top-0 h-10 w-px -translate-x-1/2 bg-gradient-to-b from-yellow-accent/20 to-blue-primary/45" />
        <div className="absolute left-1/4 right-1/4 top-10 h-px bg-gradient-to-r from-blue-primary/35 via-blue-primary/50 to-blue-primary/35" />
        <div className="absolute left-1/2 top-10 h-10 w-px -translate-x-1/2 bg-gradient-to-b from-blue-primary/55 to-blue-primary/25" />
        <span className="absolute left-1/2 top-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-primary shadow-sm shadow-blue-primary/30" />
        <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-blue-primary/35" />
      </div>
    </>
  );
}

export function CloseRoundFlowDiagram({
  pendingTotalQty,
  weekScannedCount,
  pendingModalOpen,
  scanLogModalOpen,
  onOpenPending,
  onOpenScanLog,
}: CloseRoundFlowDiagramProps) {
  return (
    <div className="mx-auto w-full max-w-2xl py-2 sm:py-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-0">
        <div className="flex flex-col gap-2">
          <FlowSourceNode
            label="สแกนทันที"
            tone="scan"
            href="/scan"
            icon={<ScanLine className="h-5 w-5" strokeWidth={2.25} />}
          />
          <p className="px-1 text-center text-xs leading-relaxed text-text-muted sm:min-h-10">
            บันทึกเข้าระบบทันที
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <FlowSourceNode
            label="จดไว้ก่อน"
            tone="queue"
            badge={pendingTotalQty}
            selected={pendingModalOpen}
            onClick={onOpenPending}
            icon={<Clock className="h-5 w-5" strokeWidth={2.25} />}
          />
          <p className="px-1 text-center text-xs leading-relaxed text-text-muted sm:min-h-10">
            คลิก จดไว้ก่อน เพื่อดูคิวและเริ่มสแกน
          </p>
        </div>
      </div>

      <FlowConnector />

      <div className="flex w-full max-w-xs flex-col px-1 sm:max-w-sm [&>button]:w-full">
        <StatCard
          label="สแกนสัปดาห์นี้"
          value={weekScannedCount}
          tone="info"
          selected={scanLogModalOpen}
          onClick={onOpenScanLog}
        />
      </div>
    </div>
  );
}
