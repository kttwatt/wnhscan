import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "yellow" | "danger";

const variants: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
  yellow:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-accent px-5 py-2.5 text-sm font-semibold text-navy-900 transition-opacity hover:opacity-90",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button type="button" className={`${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
