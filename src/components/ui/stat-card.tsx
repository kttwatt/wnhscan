export type StatTone = "default" | "info" | "warning" | "danger" | "success";

type StatCardProps = {
  label: string;
  value: string | number;
  tone?: StatTone;
  onClick?: () => void;
  selected?: boolean;
  /** ใช้ในแถบ stat แบบแบ่งช่อง — ไม่มีกรอบ/card แยก */
  embedded?: boolean;
};

const VALUE_COLORS: Record<StatTone, string> = {
  default: "text-navy-900",
  info: "text-blue-primary",
  warning: "text-yellow-accent",
  danger: "text-red-600",
  success: "text-emerald-600",
};

const EMBEDDED_BG: Record<StatTone, string> = {
  default: "bg-white/50",
  info: "bg-blue-light/30",
  warning: "bg-yellow-light/80",
  danger: "bg-red-50/90",
  success: "bg-emerald-50/90",
};

const EMBEDDED_ACCENT: Record<StatTone, string> = {
  default: "border-t-transparent",
  info: "border-t-blue-primary/50",
  warning: "border-t-yellow-accent",
  danger: "border-t-red-500",
  success: "border-t-emerald-500",
};

const EMBEDDED_SELECTED: Record<StatTone, string> = {
  default: "bg-surface-page ring-1 ring-inset ring-border",
  info: "bg-blue-light/55 ring-1 ring-inset ring-blue-primary/25",
  warning: "bg-yellow-light ring-1 ring-inset ring-yellow-accent/40",
  danger: "bg-red-50 ring-1 ring-inset ring-red-300/50",
  success: "bg-emerald-50 ring-1 ring-inset ring-emerald-400/40",
};

export function StatCard({
  label,
  value,
  tone = "default",
  onClick,
  selected,
  embedded = false,
}: StatCardProps) {
  const inner = (
    <>
      <p className={`font-bold tracking-tight ${embedded ? "text-2xl" : "text-3xl"} ${VALUE_COLORS[tone]}`}>
        {value}
      </p>
      <p
        className={`mt-0.5 text-text-secondary ${embedded ? "text-[11px] leading-snug sm:text-xs" : "text-sm"}`}
      >
        {label}
      </p>
    </>
  );

  const className = embedded
    ? `flex min-w-0 flex-1 flex-col items-center border-t-2 px-2 py-3 text-center transition-colors sm:px-3 sm:py-4 ${EMBEDDED_ACCENT[tone]} ${
        selected
          ? EMBEDDED_SELECTED[tone]
          : `${EMBEDDED_BG[tone]} ${onClick ? "hover:brightness-[0.98]" : ""}`
      } ${onClick ? "cursor-pointer" : ""}`
    : `flex flex-col items-center rounded-xl border bg-surface-card px-4 py-5 text-center transition-all ${
        selected
          ? "border-blue-primary ring-2 ring-blue-primary/20"
          : tone === "warning"
            ? "border-yellow-accent/35 hover:border-yellow-accent/55"
            : tone === "danger"
              ? "border-red-200 hover:border-red-300"
              : tone === "success"
                ? "border-emerald-200 hover:border-emerald-300"
                : "border-border hover:border-blue-primary/40"
      } ${onClick ? "cursor-pointer" : ""}`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }

  return <div className={className}>{inner}</div>;
}
