import type { MapPreset } from "../../App";

interface MapPresetSwitcherProps {
  preset: MapPreset | "custom";
  onPick: (p: MapPreset) => void;
}

const PRESETS: {
  id: MapPreset;
  label: string;
  hint: string;
  shortcut: string;
}[] = [
  {
    id: "atlas",
    label: "Atlas",
    hint: "Full basemap — every layer on  (press 1)",
    shortcut: "1",
  },
  {
    id: "cockpit",
    label: "Cockpit",
    hint: "Minimal ops — drones + routes + emergencies  (press 2)",
    shortcut: "2",
  },
  {
    id: "mono",
    label: "Mono",
    hint: "Geography only — hospitals + cities + hydrology  (press 3)",
    shortcut: "3",
  },
];

/**
 * Top-right segmented control for the three map view presets. Sits above
 * Leaflet's zoom buttons (z-[1050] so it doesn't fight the controls' z-1000).
 * Highlights the active preset; if the user manually toggles a layer the
 * switcher shows a `Custom` indicator (no preset is "active").
 */
export function MapPresetSwitcher({ preset, onPick }: MapPresetSwitcherProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Map view preset"
      className="pointer-events-auto inline-flex items-center rounded-md border border-paper-300 bg-paper-50/90 p-0.5 shadow-soft backdrop-blur-md"
      data-theme-dark-bg="panel"
    >
      {PRESETS.map((p) => {
        const isActive = preset === p.id;
        return (
          <button
            key={p.id}
            role="radio"
            aria-checked={isActive}
            aria-label={p.hint}
            title={p.hint}
            onClick={() => onPick(p.id)}
            className={`mono inline-flex items-center gap-1 rounded px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] uppercase transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
              isActive
                ? "bg-primary-500 text-white shadow-soft"
                : "text-ink-700 hover:bg-paper-150 hover:text-ink-900"
            }`}
          >
            <span>{p.label}</span>
            <span
              className={`mono ml-0.5 rounded px-1 text-[9px] tracking-normal ${
                isActive
                  ? "bg-white/15 text-white/70"
                  : "bg-paper-200 text-ink-600"
              }`}
            >
              {p.shortcut}
            </span>
          </button>
        );
      })}
      {preset === "custom" && (
        <span className="mono ml-1 mr-1 rounded px-1.5 py-1 text-[10px] tracking-[0.16em] uppercase text-ink-600">
          Custom
        </span>
      )}
    </div>
  );
}