import type { ReactNode } from "react";

type Variant = "ok" | "warning" | "critical" | "neutral" | "info";

/* StatusPill — soft pill with subtle tinted background. No glow filter, no
   currentColor shadow. Just colour wash + matching text. */
const styles: Record<Variant, string> = {
  ok: "bg-ok-50 text-ok-600 border border-ok-500/25",
  warning: "bg-warn-50 text-warn-600 border border-warn-500/25",
  critical: "bg-critical-50 text-critical-600 border border-critical-500/25",
  neutral: "bg-paper-150 text-ink-700 border border-paper-300",
  info: "bg-primary-50 text-primary-700 border border-primary-500/25",
};

export function StatusPill({
  variant = "neutral",
  children,
  className = "",
}: {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`pill ${styles[variant]} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
