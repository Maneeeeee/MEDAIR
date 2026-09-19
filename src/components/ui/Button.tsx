import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "destructive" | "ghost";

/* Soft humanist button — solid primary, soft outlines for the rest.
   Less uppercase tracking (the brief flagged this), no neon glow.
   Focus-visible ring uses the primary teal at 30% so the keyboard focus
   indicator is always legible on every variant. */
const variants: Record<Variant, string> = {
  primary:
    "bg-primary-500 border border-primary-500 text-white hover:bg-primary-600 hover:border-primary-600 focus-visible:ring-2 focus-visible:ring-primary-500/40 shadow-soft",
  secondary:
    "bg-paper-50 border border-paper-300 text-ink-800 hover:bg-paper-150 hover:border-paper-400 focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:border-primary-400",
  destructive:
    "bg-critical-500 border border-critical-500 text-white hover:bg-critical-600 hover:border-critical-600 focus-visible:ring-2 focus-visible:ring-critical-500/40 shadow-soft",
  ghost:
    "bg-transparent border border-transparent text-ink-700 hover:text-ink-900 hover:bg-paper-150 focus-visible:ring-2 focus-visible:ring-primary-500/30",
};

export function Button({
  variant = "secondary",
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3.5 py-2 text-[12px] font-medium tracking-tight outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
