"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Barcode, Clock, ScanLine } from "lucide-react";
import { BarcodeFlowBackground } from "@/components/dashboard/barcode-flow-background";
import { playBeep } from "@/lib/scan/play-beep";

type ScanFlowHeroProps = {
  departmentId: string;
};

const BLINK_MS = 1650;

export function ScanFlowHero({ departmentId }: ScanFlowHeroProps) {
  const [pathsBlink, setPathsBlink] = useState(false);
  const blinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOriginClick = useCallback(() => {
    playBeep();
    setPathsBlink(true);
    if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
    blinkTimerRef.current = setTimeout(() => setPathsBlink(false), BLINK_MS);
  }, []);

  useEffect(
    () => () => {
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
    },
    [],
  );

  return (
    <section className="section-navy relative overflow-hidden px-6 py-6">
      <BarcodeFlowBackground />
      <div
        className="pointer-events-none absolute -right-16 -top-16 z-[1] h-48 w-48 rounded-full bg-blue-primary/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 left-1/3 z-[1] h-40 w-40 rounded-full bg-white/5 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10">
        <div className="max-w-2xl">
          <h2 className="text-xl font-bold leading-tight tracking-tight sm:text-2xl">
            สแกนบาร์โค้ดเข้าระบบ IPISS
          </h2>
          <p className="mt-1.5 text-sm text-white/70">
            เลือกเส้นทางสำหรับแผนก {departmentId} — สแกนเข้าระบบทันที หรือจดรายการไว้ก่อน
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3 sm:mt-8 sm:gap-4">
          <OriginNode onClick={handleOriginClick} />
          <HorizontalForkSvg className="w-full max-w-lg" />
          <div className="grid w-full grid-cols-2 gap-3 sm:gap-4">
            <ScanPathLink blink={pathsBlink} />
            <QueuePathLink blink={pathsBlink} />
          </div>
        </div>
      </div>
    </section>
  );
}

function OriginNode({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-lg backdrop-blur-sm transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
      aria-label="สแกนบาร์โค้ด — เลือกเส้นทางด้านล่าง"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-navy-900 shadow-sm">
        <Barcode className="h-5 w-5" />
      </span>
      <div className="text-left">
        <p className="text-sm font-semibold">สแกนบาร์โค้ด</p>
      </div>
    </button>
  );
}

function ScanPathLink({ blink }: { blink: boolean }) {
  return (
    <Link
      href="/scan"
      className={`group flex h-full flex-col items-center rounded-2xl border border-sky-300/30 bg-gradient-to-b from-sky-400/20 via-white/10 to-white/5 p-3 text-center shadow-lg transition-all hover:border-sky-200/50 hover:from-sky-400/30 hover:shadow-xl sm:flex-row sm:items-center sm:gap-3 sm:p-4 sm:text-left ${
        blink ? "animate-scan-path-hint-blink" : ""
      }`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-sky-700 shadow-md transition-transform group-hover:scale-105 sm:h-12 sm:w-12">
        <ScanLine className="h-5 w-5 sm:h-6 sm:w-6" />
      </span>
      <div className="mt-2 min-w-0 flex-1 sm:mt-0">
        <p className="text-sm font-bold text-white sm:text-base">สแกนทันที</p>
        <p className="mt-0.5 hidden text-xs text-white/65 sm:block">
          บันทึกเข้าระบบ IPISS ทันทีที่สแกน
        </p>
      </div>
      <ArrowRight className="mt-2 hidden h-5 w-5 shrink-0 text-white/50 transition-transform group-hover:translate-x-0.5 group-hover:text-white sm:mt-0 sm:block" />
    </Link>
  );
}

function QueuePathLink({ blink }: { blink: boolean }) {
  return (
    <Link
      href="/queue"
      className={`group flex h-full flex-col items-center rounded-2xl border border-amber-300/25 bg-gradient-to-b from-amber-400/15 via-white/10 to-white/5 p-3 text-center shadow-lg transition-all hover:border-amber-200/40 hover:from-amber-400/25 hover:shadow-xl sm:flex-row sm:items-center sm:gap-3 sm:p-4 sm:text-left ${
        blink ? "animate-scan-path-hint-blink" : ""
      }`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-md transition-transform group-hover:scale-105 sm:h-12 sm:w-12">
        <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
      </span>
      <div className="mt-2 min-w-0 flex-1 sm:mt-0">
        <p className="text-sm font-bold text-white sm:text-base">จดไว้ก่อน</p>
        <p className="mt-0.5 hidden text-xs text-white/65 sm:block">
          เก็บคิวไว้ก่อน แล้วสแกนปิดรอบภายหลัง
        </p>
      </div>
      <ArrowRight className="mt-2 hidden h-5 w-5 shrink-0 text-white/50 transition-transform group-hover:translate-x-0.5 group-hover:text-white sm:mt-0 sm:block" />
    </Link>
  );
}

function HorizontalForkSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 64" fill="none" className={className} aria-hidden>
      <defs>
        <marker
          id="fork-arrow-left"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0 0 L10 5 L0 10 Z" fill="rgb(186,230,253)" />
        </marker>
        <marker
          id="fork-arrow-right"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0 0 L10 5 L0 10 Z" fill="rgb(253,230,138)" />
        </marker>
      </defs>

      <path
        d="M160 4V26"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="160" cy="28" r="6" fill="rgba(255,255,255,0.92)" />
      <circle cx="160" cy="28" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />

      <path
        d="M160 28 C120 28, 88 44, 56 58"
        stroke="rgba(186,230,253,0.85)"
        strokeWidth="2.5"
        strokeLinecap="butt"
        markerEnd="url(#fork-arrow-left)"
      />
      <path
        d="M160 28 C200 28, 232 44, 264 58"
        stroke="rgba(253,230,138,0.85)"
        strokeWidth="2.5"
        strokeLinecap="butt"
        markerEnd="url(#fork-arrow-right)"
      />
    </svg>
  );
}
