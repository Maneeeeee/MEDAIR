import type { LayerKey, QuickFilterKey } from "../../types";
import { Search } from "lucide-react";

const LAYERS: { key: LayerKey; label: string; hint: string }[] = [
  { key: "drones", label: "Active drones", hint: "Live quadcopter glyphs" },
  { key: "hospitals", label: "Hospitals", hint: "Medical centres" },
  { key: "stations", label: "Drone stations", hint: "Launch / recharge" },
  { key: "routes", label: "Flight routes", hint: "Active mission paths" },
  { key: "emergencies", label: "Emergency requests", hint: "Critical dispatches" },
  { key: "cities", label: "Cities", hint: "Population centres" },
  { key: "hydrology", label: "Hydrology", hint: "Lake Sevan + major rivers" },
  { key: "restricted", label: "Restricted zones", hint: "No-fly CTRs" },
];

const QUICK: { key: QuickFilterKey; label: string; hint: string }[] = [
  {
    key: "in-flight",
    label: "In-flight only",
    hint: "Show only drones currently mid-mission",
  },
  {
    key: "low-battery",
    label: "Low battery (<25%)",
    hint: "Surface drones needing immediate recharge",
  },
  {
    key: "critical-inventory",
    label: "Critical inventory",
    hint: "Hospitals holding below threshold of any item",
  },
  {
    key: "within-50km",
    label: "Within 50 km of destination",
    hint: "Drones nearing arrival",
  },
];

export function FilterPanel({
  layers,
  onToggleLayer,
  query,
  onQueryChange,
  recent,
  onPickRecent,
  quickFilters,
  onToggleQuickFilter,
}: {
  layers: Record<LayerKey, boolean>;
  onToggleLayer: (k: LayerKey) => void;
  query: string;
  onQueryChange: (s: string) => void;
  recent: string[];
  onPickRecent: (s: string) => void;
  quickFilters: Record<QuickFilterKey, boolean>;
  onToggleQuickFilter: (k: QuickFilterKey) => void;
}) {
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-5">
      <div className="space-y-2.5">
        <label className="label-eyebrow block">Search</label>
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500"
          />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="City, hospital, drone, item…"
            aria-label="Search cities, hospitals, drones, or items"
            className="w-full rounded-lg border border-paper-300 bg-paper-50 py-2.5 pl-10 pr-3.5 text-[13px] text-ink-900 placeholder:text-ink-500 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        {recent.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recent.slice(0, 4).map((r) => (
              <button
                key={r}
                onClick={() => onPickRecent(r)}
                className="rounded-full border border-paper-300 bg-paper-100 px-2.5 py-0.5 text-[11px] text-ink-700 hover:border-primary-300 hover:text-primary-700"
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        <h3 className="label-eyebrow">Layers</h3>
        <div className="space-y-1">
          {LAYERS.map((l) => (
            <label
              key={l.key}
              className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 hover:bg-paper-100"
            >
              <div className="flex flex-col">
                <span className="text-[13px] text-ink-900">{l.label}</span>
                <span className="text-[11px] text-ink-600">{l.hint}</span>
              </div>
              <button
                type="button"
                onClick={() => onToggleLayer(l.key)}
                role="switch"
                aria-checked={layers[l.key]}
                aria-label={`Toggle ${l.label} layer`}
                className={`relative h-5 w-9 rounded-full border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
                  layers[l.key]
                    ? "border-primary-400 bg-primary-500"
                    : "border-paper-300 bg-paper-200"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all ${
                    layers[l.key]
                      ? "left-[18px] bg-white shadow-soft"
                      : "left-0.5 bg-paper-50"
                  }`}
                />
              </button>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <h3 className="label-eyebrow">Quick filters</h3>
        <div className="space-y-1">
          {QUICK.map((q) => (
            <label
              key={q.key}
              className="flex cursor-pointer items-start gap-3 rounded-lg px-2.5 py-2 hover:bg-paper-100"
              title={q.hint}
            >
              <input
                type="checkbox"
                checked={quickFilters[q.key]}
                onChange={() => onToggleQuickFilter(q.key)}
                aria-label={q.hint}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-paper-300 bg-paper-50 text-primary-500 focus:ring-primary-500/30"
              />
              <div className="flex flex-col">
                <span className="text-[13px] text-ink-800">{q.label}</span>
                <span className="text-[11px] text-ink-600">{q.hint}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2 border-t border-paper-300 pt-4 text-[11px] text-ink-600">
        <div className="flex justify-between">
          <span>Operator</span>
          <span className="mono text-ink-800">CAC / EASA SORA</span>
        </div>
        <div className="flex justify-between">
          <span>Airspace</span>
          <span className="mono text-ink-800">Class G</span>
        </div>
        <div className="flex justify-between">
          <span>BVLOS</span>
          <span className="mono text-ok-600">Authorized</span>
        </div>
      </div>
    </div>
  );
}
