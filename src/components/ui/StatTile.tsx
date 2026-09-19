import type { ReactNode } from "react";

/* StatTile — single KPI inside a panel.
   Soft humanist treatment: no brackets, more padding, soft shadow, larger
   numeral. Tone colours the numeral only. */
export function StatTile({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  className = "",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "neutral" | "ok" | "warning" | "critical" | "info";
  className?: string;
}) {
  const accent = {
    neutral: "text-ink-900",
    ok: "text-ok-500",
    warning: "text-warn-500",
    critical: "text-critical-500",
    info: "text-primary-500",
  }[tone];
  return (
    <div
      className={`flex flex-col gap-1.5 rounded-lg bg-paper-50 px-3.5 py-3 shadow-soft ${className}`}
    >
      <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.08em] text-ink-600">
        <span>{label}</span>
        {icon ? <span className="text-ink-500">{icon}</span> : null}
      </div>
      <div className={`stat-num ${accent}`}>{value}</div>
      {hint ? <div className="text-[11px] text-ink-600">{hint}</div> : null}
    </div>
  );
}
