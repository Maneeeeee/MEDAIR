import L from "leaflet";

/**
 * Marker colours — every value is a CSS-variable string so the markers
 * re-paint when [data-theme] on <html> flips between light and dark.
 *
 *   in-flight   → warn        (amber)
 *   returning   → primary     (medical cyan / warm teal)
 *   loading     → fg-muted    (warm grey / slate)
 *   idle        → ok          (emerald / sage)
 *   maintenance → fg-muted    (warm grey / slate)
 *
 *   battery ok    → ok
 *   battery low   → warn
 *   battery empty → critical
 *
 * Hospital / station / city / emergency rings use tinted backgrounds at
 * low opacity — these mirror the status palette used everywhere else.
 *
 * Style language is Flightradar-style: solid neon strokes + soft halos,
 * tight typography, no warm paper anywhere in dark mode.
 */
const PALETTE = {
  // Drone status
  warn500:        "rgb(var(--warn) / 1)",
  warnAlpha12:    "rgb(var(--warn) / 0.14)",
  warnAlpha35:    "rgb(var(--warn) / 0.45)",
  warnAlpha70:    "rgb(var(--warn) / 0.70)",
  primary500:     "rgb(var(--primary) / 1)",
  primaryAlpha18: "rgb(var(--primary) / 0.18)",
  primaryAlpha35: "rgb(var(--primary) / 0.45)",
  primaryAlpha65: "rgb(var(--primary) / 0.65)",
  ok500:          "rgb(var(--ok) / 1)",
  okAlpha25:      "rgb(var(--ok) / 0.25)",
  okAlpha70:      "rgb(var(--ok) / 0.70)",
  ink500:         "rgb(var(--fg-muted) / 1)",
  critical500:    "rgb(var(--critical) / 1)",
  criticalAlpha18:  "rgb(var(--critical) / 0.18)",
  criticalAlpha35:  "rgb(var(--critical) / 0.45)",
  criticalAlpha70:  "rgb(var(--critical) / 0.75)",

  // Aviation accent (white-ish, used for halo + label backgrounds)
  aviationBg:       "rgb(var(--map-1) / 0.92)",
  aviationLabelFg:  "rgb(var(--fg) / 1)",
  aviationLabelDim: "rgb(var(--fg-secondary) / 1)",

  /* Background of city dots + text-shadow: matches the surrounding map
     surface so labels read as "punched through" the geography. */
  paperBg:        "rgb(var(--bg) / 1)",
};

const DRONE_STATUS_COLOR: Record<
  "in-flight" | "returning" | "loading" | "idle" | "maintenance",
  string
> = {
  "in-flight": PALETTE.warn500,
  returning: PALETTE.primary500,
  loading: PALETTE.ink500,
  idle: PALETTE.ok500,
  maintenance: PALETTE.ink500,
};

const batteryColor = (pct: number) =>
  pct > 50 ? PALETTE.ok500 : pct > 25 ? PALETTE.warn500 : PALETTE.critical500;

/* Focusable wrapper styles — added inside the icon HTML so the marker can
   receive keyboard focus (A1 audit item) and visibly show a focus ring.
   Leaflet doesn't natively support tabindex on Markers, so we add it
   inside the DivIcon HTML via the data attribute and a clickable wrapper. */
const FOCUSABLE_WRAPPER_STYLES = `
  cursor: pointer;
  outline: none;
  border-radius: 999px;
`;
const FOCUS_RING = `
  &:focus-visible, &:focus {
    box-shadow: 0 0 0 3px rgb(var(--primary) / 0.55);
  }
`;

/* ============================================================
 * Drone icon — aviation-style.
 *
 * A triangle pointing in the direction of travel (mirrors how
 * Flightradar24 paints aircraft), with:
 *   • a single circular halo that breathes while in-flight
 *   • a thin crisp outline + filled core in the status colour
 *   • a small ID badge below the marker (mono, semi-transparent
 *     aviation-bg so it reads as "data label" rather than a tooltip)
 *   • a battery bar chevron under the wing — colour-coded
 *
 * The whole thing rotates with `heading`. The ID label is placed
 * outside the rotating wrapper so it always reads horizontally.
 * ============================================================ */
export const droneIcon = (opts: {
  heading: number;
  status: "in-flight" | "returning" | "loading" | "idle" | "maintenance";
  battery: number;
  id: string;
  size?: number;
}) => {
  const { heading, status, battery, id, size = 38 } = opts;
  const color = DRONE_STATUS_COLOR[status];
  const haloColor = color;
  const bc = batteryColor(battery);
  const isFlying = status === "in-flight" || status === "returning";

  const html = `
    <div class="drone-marker-inner" tabindex="0" role="button"
         aria-label="Drone ${id}, ${status}, battery ${Math.round(battery)}%"
         style="${FOCUSABLE_WRAPPER_STYLES}position:relative;width:${size}px;height:${size + 18}px;${FOCUS_RING}">
      <div style="position:absolute;left:0;top:0;width:${size}px;height:${size}px;transform:rotate(${heading}deg);">
        ${
          isFlying
            ? `<div style="position:absolute;inset:-4px;border-radius:50%;border:2px solid ${color};opacity:0.55;animation:pulseRing 2s cubic-bezier(0.4,0,0.6,1) infinite;"></div>`
            : ""
        }
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 0 4px ${haloColor});">
          <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <!-- Aviation triangle, pointing up (north = 0°) — rotated by parent -->
            <path d="M12 1.5 L18.4 21.5 L12 17.5 L5.6 21.5 Z"
                  fill="${color}" fill-opacity="0.18"
                  stroke="${color}" stroke-width="1.5"
                  stroke-linejoin="round" />
            <!-- Battery chevron (status indicator on the body) -->
            <path d="M10.4 14 L12 16.6 L13.6 14"
                  stroke="${bc}" stroke-width="1.6"
                  stroke-linecap="round" stroke-linejoin="round" fill="none" />
          </svg>
        </div>
      </div>
      <!-- ID label — stays horizontal regardless of heading -->
      <div style="position:absolute;left:50%;top:${size - 2}px;transform:translate(-50%, 0);
                  font-family:'JetBrains Mono',ui-monospace,monospace;
                  font-size:9.5px;font-weight:700;
                  letter-spacing:0.04em;
                  padding:1.5px 4px;
                  border-radius:3px;
                  background:${PALETTE.aviationBg};
                  color:${PALETTE.aviationLabelFg};
                  border:1px solid ${color}66;
                  white-space:nowrap;
                  text-shadow:0 0 4px ${color}80;">
        ${id}
      </div>
    </div>
  `;
  return L.divIcon({
    html,
    className: "drone-marker",
    iconSize: [size, size + 18],
    iconAnchor: [size / 2, size / 2],
  });
};

/* ============================================================
 * Hospital icon — small ringed cross.
 * Same Flightradar vocabulary: a clean cyan ring + a halo pulse,
 * crisp 1px outline.
 * ============================================================ */
export const hospitalIcon = (size = 26) =>
  L.divIcon({
    html: `
      <div tabindex="0" role="button" aria-label="Hospital"
           style="${FOCUSABLE_WRAPPER_STYLES}position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;${FOCUS_RING}">
        <div style="position:absolute;inset:-3px;border-radius:50%;border:1.5px solid ${PALETTE.primaryAlpha65};opacity:0.85;animation:pulseRing 2.6s cubic-bezier(0.4,0,0.6,1) infinite;"></div>
        <div style="position:relative;width:${size - 4}px;height:${size - 4}px;border-radius:50%;background:${PALETTE.primaryAlpha18};border:1.5px solid ${PALETTE.primary500};display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 0 4px ${PALETTE.primaryAlpha65});">
          <svg width="${size - 12}" height="${size - 12}" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="${PALETTE.primary500}" stroke-width="2.4" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
    `,
    className: "hospital-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

/* ============================================================
 * Station icon — small chevron + ring.
 * Flightradar uses a triangle/chevron for ground stations; we
 * echo that with a small filled diamond.
 * ============================================================ */
export const stationIcon = (size = 20) =>
  L.divIcon({
    html: `
      <div tabindex="0" role="button" aria-label="Drone station"
           style="${FOCUSABLE_WRAPPER_STYLES}position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;${FOCUS_RING}">
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 0 4px ${PALETTE.warnAlpha35});">
          <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3 L21 12 L12 21 L3 12 Z"
                  fill="${PALETTE.warnAlpha12}"
                  stroke="${PALETTE.warn500}"
                  stroke-width="1.5"
                  stroke-linejoin="round" />
            <circle cx="12" cy="12" r="2" fill="${PALETTE.warn500}"/>
          </svg>
        </div>
      </div>
    `,
    className: "station-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

/* ============================================================
 * City icon — small dot + label.
 * In dark mode the label is in aviation-bg + ink-fg for legibility
 * against any country colour.
 * ============================================================ */
export const cityIcon = (label: string, population?: number) => {
  const showPop = !!population && population > 0;
  return L.divIcon({
    html: `
      <div tabindex="0" role="button" aria-label="City ${label}"
           style="${FOCUSABLE_WRAPPER_STYLES}display:flex;align-items:center;gap:5px;transform:translate(-50%,-50%);${FOCUS_RING}">
        <div style="width:5px;height:5px;background:${PALETTE.ink500};border-radius:50%;box-shadow:0 0 0 2px ${PALETTE.paperBg}, 0 0 4px rgb(var(--fg-muted) / 0.6);"></div>
        <div style="font-family:'JetBrains Mono',ui-monospace,monospace;
                    font-size:9.5px;font-weight:600;
                    letter-spacing:0.05em;
                    text-transform:uppercase;
                    padding:1.5px 4px;
                    border-radius:3px;
                    background:${PALETTE.aviationBg};
                    color:${PALETTE.aviationLabelFg};
                    border:1px solid rgb(var(--border) / 1);
                    white-space:nowrap;">
          ${label}${
            showPop
              ? ` <span style="opacity:0.6;font-weight:500">${Math.round(population / 1000)}k</span>`
              : ""
          }
        </div>
      </div>
    `,
    className: "city-marker",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

/* ============================================================
 * Emergency icon — red pulsing alert.
 * ============================================================ */
export const emergencyIcon = (size = 28) =>
  L.divIcon({
    html: `
      <div tabindex="0" role="button" aria-label="Critical emergency"
           style="${FOCUSABLE_WRAPPER_STYLES}position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;${FOCUS_RING}">
        <div style="position:absolute;inset:-4px;border-radius:50%;border:2px solid ${PALETTE.criticalAlpha70};opacity:0.85;animation:pulseRing 1.5s cubic-bezier(0.4,0,0.6,1) infinite;"></div>
        <div style="position:relative;width:${size - 8}px;height:${size - 8}px;border-radius:50%;background:${PALETTE.criticalAlpha18};border:1.5px solid ${PALETTE.critical500};display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 0 6px ${PALETTE.criticalAlpha70});">
          <svg width="${size - 14}" height="${size - 14}" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 7v5l3 2" stroke="${PALETTE.critical500}" stroke-width="2.2" stroke-linecap="round"/>
            <circle cx="12" cy="12" r="9" stroke="${PALETTE.critical500}" stroke-width="1.8"/>
          </svg>
        </div>
      </div>
    `,
    className: "emergency-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
