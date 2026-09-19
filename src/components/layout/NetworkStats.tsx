import type { LiveKpis } from "../../hooks/useDroneSimulation";

/* NetworkStats — header KPI strip.
   Soft humanist treatment: rounded cards with shadows, no brackets, label
   is now a proper label (not all-caps instrumentation). Numbers in mono
   stand out from the body type. */
export function NetworkStats({
  kpis,
  compact = false,
  inline = false,
}: {
  kpis: LiveKpis;
  compact?: boolean;
  /** Render as snap-scrollable pill row (used inside mobile header). */
  inline?: boolean;
}) {
  const stats = [
    {
      label: "Active",
      sublabel: "drones",
      value: kpis.active.toString().padStart(2, "0"),
      tone: "text-warn-600",
      dot: "bg-warn-500",
    },
    {
      label: "In flight",
      sublabel: "mid-mission",
      value: kpis.inFlight.toString().padStart(2, "0"),
      tone: "text-ok-600",
      dot: "bg-ok-500",
    },
    {
      label: "Stations",
      sublabel: "online",
      value: kpis.stations.toString().padStart(2, "0"),
      tone: "text-primary-600",
      dot: "bg-primary-500",
    },
    {
      label: "Deliveries",
      sublabel: "today",
      value: kpis.deliveriesToday.toString().padStart(2, "0"),
      tone: "text-ink-900",
      dot: "bg-ink-500",
    },
  ];
  return (
    <div
      className={`flex items-stretch ${
        compact ? "gap-2" : "gap-3 p-4"
      } ${inline ? "shrink-0" : ""}`}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className={`flex shrink-0 items-center gap-2.5 rounded-lg bg-paper-100 px-3 shadow-soft ${
            compact ? "py-1.5" : "py-2.5"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
          <div className="flex items-baseline gap-1.5 leading-none">
            <span className="text-[12px] font-medium text-ink-700">{s.label}</span>
            <span className={`mono text-sm font-semibold tabular-nums ${s.tone}`}>
              {s.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
