"use client";

import type { ReactNode, RefObject } from "react";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

const inputClassName =
  "w-full rounded-xl border-2 border-blue-primary/20 bg-white py-3.5 pl-14 pr-4 text-base text-navy-900 shadow-sm outline-none transition-all placeholder:text-text-muted hover:border-blue-primary/35 hover:shadow-md focus:border-blue-primary focus:shadow-md focus:ring-4 focus:ring-blue-primary/15 disabled:cursor-not-allowed disabled:opacity-60";

type ItemSearchFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
  /** block = gradient box + label; inline = input only for filter bars */
  layout?: "block" | "inline";
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  introBlinkOnMount?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  children?: ReactNode;
};

export function ItemSearchField({
  id,
  value,
  onChange,
  placeholder,
  label = "ค้นหาวัสดุ",
  layout = "block",
  className = "",
  disabled = false,
  autoFocus = false,
  introBlinkOnMount = false,
  inputRef,
  onKeyDown,
  children,
}: ItemSearchFieldProps) {
  const [introBlink, setIntroBlink] = useState(introBlinkOnMount);

  useEffect(() => {
    if (!introBlinkOnMount) return;
    const timer = window.setTimeout(() => setIntroBlink(false), 1650);
    return () => window.clearTimeout(timer);
  }, [introBlinkOnMount]);

  const blockClassName = introBlink ? "animate-search-intro-blink" : "";
  const input = (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg bg-blue-primary/10">
        <Search className="h-5 w-5 text-blue-primary" strokeWidth={2.25} />
      </span>
      <input
        ref={inputRef}
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={inputClassName}
        autoComplete="off"
        autoFocus={autoFocus}
        disabled={disabled}
      />
    </div>
  );

  if (layout === "inline") {
    return (
      <div className={`relative min-w-[220px] flex-1 ${className}`}>
        {input}
        {children}
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-xl border border-blue-primary/15 bg-gradient-to-br from-blue-light/80 via-white to-blue-light/40 p-4 shadow-sm ${blockClassName} ${className}`}
    >
      {label ? (
        <label htmlFor={id} className="mb-2 block text-sm font-semibold text-navy-900">
          {label}
        </label>
      ) : null}
      {input}
      {children}
    </div>
  );
}
