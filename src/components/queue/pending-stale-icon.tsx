"use client";

import { AlertTriangle } from "lucide-react";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import {
  daysPending,
  getPendingStaleLevel,
  type PendingStaleLevel,
} from "@/lib/pending/pending-stale";

const STALE_LABEL: Record<Exclude<PendingStaleLevel, "none">, string> = {
  warning: "ค้างสแกนเกิน 1 วัน",
  critical: "ค้างสแกนเกิน 7 วัน",
};

type PendingStaleIconProps = {
  pendingSince: string;
  className?: string;
};

export function PendingStaleIcon({ pendingSince, className = "h-4 w-4" }: PendingStaleIconProps) {
  const hydrated = useHydrated();
  const level = getPendingStaleLevel(pendingSince);
  if (!hydrated || level === "none") return null;

  const color = level === "critical" ? "text-red-600" : "text-yellow-accent";
  const label = STALE_LABEL[level];

  return (
    <span
      className="inline-flex"
      title={`${label} (${daysPending(pendingSince)} วัน)`}
    >
      <AlertTriangle
        className={`shrink-0 ${color} ${className}`}
        aria-label={label}
      />
    </span>
  );
}
