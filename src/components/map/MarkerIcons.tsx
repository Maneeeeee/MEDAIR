import L from "leaflet";

/**
 * Marker colours — every value is a CSS-variable string so the markers
 * re-paint when [data-theme] on <html> flips between light and dark.
 * Modern browsers resolve `var()` inside SVG presentation attributes
 * (fill / stroke) AND inside inline HTML styles. So both the SVG drone
 * strokes and the HTML halo backgrounds track the active palette.
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
 */
const PALETTE = {
  warn500:        "rgb(var(--warn) / 1)",
  warnAlpha12:    "rgb(var(--warn) / 0.12)",
  warnAlpha35:    "rgb(var(--warn) / 0.35)",
  primary500:     "rgb(var(--primary) / 1)",
  primaryAlpha18: "rgb(var(--primary) / 0.18)",
  primaryAlpha35: "rgb(var(--primary) / 0.35)",
  ok500:          "rgb(var(--ok) / 1)",
  ink500:         "rgb(var(--fg-muted) / 1)",
  critical500:    "rgb(var(--critical) / 1)",
  criticalAlpha18:  "rgb(var(--critical) / 0.18)",
  criticalAlpha35:  "rgb(var(--critical) / 0.35)",
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
    box-shadow: 0 0 0 3px rgb(var(--primary) / 0.45);
  }
`;

export const droneIcon = (opts: {
  heading: number;
  status: "in-flight" | "returning" | "loading" | "idle" | "maintenance";
  battery: number;
  size?: number;
}) => {
  const { heading, status, battery, size = 36 } = opts;
  const color = DRONE_STATUS_COLOR[status];
  const bc = batteryColor(battery);

  const html = `
    <div class="drone-marker-inner" tabindex="0" role="button" aria-label="Drone ${status}, battery ${Math.round(battery)}%" style="${FOCUSABLE_WRAPPER_STYLES}position:relative;width:${size}px;height:${size}px;transform:rotate(${heading}deg);${FOCUS_RING}">
      ${
        status === "in-flight"
          ? `<div style="position:absolute;inset:0;border-radius:50%;border:2px solid ${PALETTE.warnAlpha35};animation:pulseRing 2s cubic-bezier(0.4,0,0.6,1) infinite;"></div>`
          : ""
      }
      <div style="position:absolute;inset:4px;display:flex;align-items:center;justify-content:center;">
        <svg width="${size - 8}" height="${size - 8}" viewBox="0 0 24 24" fill="none">
          <circle cx="5" cy="5" r="3" stroke="${color}" stroke-width="1.5" />
          <circle cx="19" cy="5" r="3" stroke="${color}" stroke-width="1.5" />
          <circle cx="5" cy="19" r="3" stroke="${color}" stroke-width="1.5" />
          <circle cx="19" cy="19" r="3" stroke="${color}" stroke-width="1.5" />
          <path d="M5 5L12 12L19 5M5 19L12 12L19 19" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" />
          <rect x="10" y="10" width="4" height="4" rx="0.5" transform="rotate(45 12 12)" fill="${color}" />
        </svg>
      </div>
      <div style="position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);height:2px;width:14px;background:${bc};border-radius:1px;box-shadow:0 0 4px ${bc};"></div>
      <div style="position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);height:2px;width:14px;background:${bc};border-radius:1px;box-shadow:0 0 4px ${bc};"></div>
    </div>
  `;
  return L.divIcon({
    html,
    className: "drone-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

export const hospitalIcon = (size = 28) =>
  L.divIcon({
    html: `
      <div tabindex="0" role="button" aria-label="Hospital" style="${FOCUSABLE_WRAPPER_STYLES}position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;${FOCUS_RING}">
        <div style="position:absolute;inset:0;border-radius:50%;border:2px solid ${PALETTE.primaryAlpha35};animation:pulseRing 2.4s cubic-bezier(0.4,0,0.6,1) infinite;"></div>
        <div style="position:relative;width:${size - 6}px;height:${size - 6}px;border-radius:50%;background:${PALETTE.primaryAlpha18};display:flex;align-items:center;justify-content:center;">
          <svg width="${size - 12}" height="${size - 12}" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="${PALETTE.primary500}" stroke-width="2.4" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
    `,
    className: "hospital-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

export const stationIcon = (size = 22) =>
  L.divIcon({
    html: `
      <div tabindex="0" role="button" aria-label="Drone station" style="${FOCUSABLE_WRAPPER_STYLES}position:relative;width:${size}px;height:${size}px;${FOCUS_RING}">
        <div style="position:absolute;inset:0;border-radius:3px;background:${PALETTE.warnAlpha12};border:1px solid ${PALETTE.warn500};"></div>
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" style="position:absolute;inset:0;">
          <circle cx="12" cy="12" r="2" fill="${PALETTE.warn500}"/>
        </svg>
      </div>
    `,
    className: "station-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

export const cityIcon = (label: string) =>
  L.divIcon({
    html: `
      <div tabindex="0" role="button" aria-label="City ${label}" style="${FOCUSABLE_WRAPPER_STYLES}display:flex;align-items:center;gap:4px;transform:translate(-50%,-100%);${FOCUS_RING}">
        <div style="width:6px;height:6px;background:${PALETTE.ink500};border-radius:50%;box-shadow:0 0 0 2px ${PALETTE.paperBg};"></div>
        <div style="font-size:10px;color:${PALETTE.ink500};text-shadow:0 1px 2px ${PALETTE.paperBg};white-space:nowrap;">${label}</div>
      </div>
    `,
    className: "city-marker",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });

export const emergencyIcon = (size = 26) =>
  L.divIcon({
    html: `
      <div tabindex="0" role="button" aria-label="Critical emergency" style="${FOCUSABLE_WRAPPER_STYLES}position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;${FOCUS_RING}">
        <div style="position:absolute;inset:0;border-radius:50%;border:2px solid ${PALETTE.criticalAlpha35};animation:pulseRing 1.6s cubic-bezier(0.4,0,0.6,1) infinite;"></div>
        <div style="position:relative;width:${size - 8}px;height:${size - 8}px;border-radius:50%;background:${PALETTE.criticalAlpha18};display:flex;align-items:center;justify-content:center;">
          <svg width="${size - 14}" height="${size - 14}" viewBox="0 0 24 24" fill="none">
            <path d="M12 7v5l3 2" stroke="${PALETTE.critical500}" stroke-width="2.2" stroke-linecap="round"/>
            <circle cx="12" cy="12" r="9" stroke="${PALETTE.critical500}" stroke-width="1.5"/>
          </svg>
        </div>
      </div>
    `,
    className: "emergency-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
