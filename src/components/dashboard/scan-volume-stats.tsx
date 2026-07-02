"use client";

import { StatCard, type StatTone } from "@/components/ui/stat-card";
import type { ScanVolumeStats } from "@/lib/hooks/use-scan-volume-stats";
import type { ScanVolumeStatKey } from "@/lib/scan/scan-log-queries";

const STAT_ITEMS: {
  key: ScanVolumeStatKey;
  label: string;
}[] = [
  { key: "today", label: "สแกนวันนี้" },
  { key: "week", label: "สแกนสัปดาห์นี้" },
  { key: "weekInstant", label: "สแกนทันที · 7 วัน" },
  { key: "weekQueue", label: "ปิดรอบแล้ว · 7 วัน" },
];

function resolveStatTone(
  key: ScanVolumeStatKey,
  value: number,
  pendingQty?: number,
): StatTone {
  if (key === "weekQueue") {
    if (pendingQty != null && pendingQty > 0) return "warning";
    return value > 0 ? "success" : "default";
  }

  if (key === "today" && value === 0) return "default";
  return value > 0 ? "info" : "default";
}

type ScanVolumeStatsProps = {
  stats: ScanVolumeStats;
  selectedKey?: ScanVolumeStatKey | null;
  onSelect: (key: ScanVolumeStatKey) => void;
  className?: string;
  /** strip = แถวเดียว 4 ช่อง minimal */
  layout?: "grid" | "strip";
  /** ใช้ปรับโทนเร่งด่วนของปิดรอบแล้ว เมื่อยังมีรายการรอสแกน */
  pendingQty?: number;
};

export function ScanVolumeStatsGrid({
  stats,
  selectedKey = null,
  onSelect,
  className = "",
  layout = "grid",
  pendingQty,
}: ScanVolumeStatsProps) {
  const cards = STAT_ITEMS.map((item) => {
    const value = stats[item.key];
    const tone = resolveStatTone(item.key, value, pendingQty);
    return (
      <StatCard
        key={item.key}
        label={item.label}
        value={value}
        tone={tone}
        selected={selectedKey === item.key}
        embedded={layout === "strip"}
        onClick={() => onSelect(item.key)}
      />
    );
  });

  if (layout === "strip") {
    return (
      <div
        className={`grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border sm:flex sm:gap-0 sm:bg-transparent sm:divide-x sm:divide-border sm:border sm:border-border ${className}`}
      >
        {cards}
      </div>
    );
  }

  return <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>{cards}</div>;
}

export { STAT_ITEMS as SCAN_VOLUME_STAT_ITEMS };
