# Redesign Brief — MEDAIR ARMENIA

For: a complete visual redesign with a new colour palette and design system.
Mode: **Operate** (this is still a control console, not a marketing surface).
The surface stays. The world changes.

---

## 1. Job and audience

Concept pitch for external observers (regulators, public-health press, Armenian
health-authority stakeholders). The viewer sits alone with the dashboard for 2-10
minutes after a live presentation ends. The artefact must read as "the real
operation" without a narrator.

## 2. Outcome and proof

The viewer closes the tab and asks "is this real?". Success is the visceral question
of whether the operation exists, not a rating of how polished the artefact is.

## 3. Selected direction

**Visual authority:** soft medical / clinical humanist. The aesthetic family is the
humanist wing of editorial medical publications (think *The Lancet* redesign,
*Nature* feature spreads, modern hospital signage) — not the ops-dashboard family
the incumbent occupied.

**Three signals this commits to:**

1. **Warm, light surface.** Off-white paper-stock base (`#fafaf7`-ish), warm grey
   surfaces (`#f0eee8`-ish), warm dark ink (`#2a2520`-ish). No near-black. No cold
   navy. The screen reads as "lit room" not "cockpit".

2. **Single restrained accent + warm status palette.** Primary accent stays in the
   medical spectrum but warmer and more grounded — a teal-leaning green or a soft
   medical emerald rather than the current cyan. Status colours follow the same
   shift: amber stays amber but warmer, red shifts to coral/oxblood, success shifts
   to sage. All functional, all warm. No purple, no neon.

3. **Humanist typography with real contrast.** IBM Plex Sans stays (it is already
   humanist), but its weight ramp opens up: thin (200/300) for editorial counterpoint,
   regular for body, semibold/bold for hierarchy. Display headlines get either a
   larger IBM Plex Serif pairing for editorial moments or a heavy weight Plex Sans
   treatment. Mono reserved for figures only — not for body labels.

**Anti-patterns the new world refuses:**

- No corner brackets, no hexagonal monograms, no `[ LIVE ]` industrial framing
- No `rgba(...)` over `bg-ink-XXX` panels stacked three deep
- No `tracking-[0.18em]` uppercase on every label — that read as instrumentation,
  not as a humanised control surface
- No glow filters, no inner-stroke boxes, no neon outer glows
- No "kebab-case-uppercase" labels (`OPERATIONAL · 24/7`) without the human context

**Structural thesis:** the operation breathes. The incumbent compressed everything
into a dense cockpit; the new world gives the data breathing room. Generous
whitespace, larger surfaces, asymmetric layout where the eye should land, type that
makes hierarchy obvious without needing colour or borders.

## 4. Scope and boundaries

**In scope (replace fully):**

- Colour palette (light, warm, off-white base)
- Typography scale (expanded weight ramp, larger display sizes, mono reserved for
  figures)
- Surface treatments (cards, panels, modals) — softer, more rounded, more shadow
  than border
- Header, network stats, panels, modals, map area treatment
- Status pills, buttons, inputs, toggles
- Critical banner, KPI tiles, inventory tables
- Logo mark stays (the hex+cross+orbit is good); just gets a softer treatment

**Out of scope (do not touch):**

- Layout structure: header bar, left filter rail, centre map, right panel
- Interactions: click-to-zoom on critical banner, dispatch wizard flow, search
  aliases, quick filters, layer toggles
- Map functionality: GeoJSON polygons, FitBoundsOnFirstLoad, snap-back fix, drone
  flight simulation, hospital panel data shape
- Data shape: 14 hospitals, 8 drones, inventory types, status values
- Brand: `MEDAIR ARMENIA` name (locked per PRODUCT.md)
- All previously-fixed bugs: map auto-snap, no watermark, hospital phones realistic

**Anti-goals (the redesign must not do these):**

- Do not add a "light/dark mode" toggle — pick one (warm light) and ship it
- Do not introduce new product features, new panels, or new data fields
- Do not regress any of the previous session's fixes

## 5. States and ranges

Real content ranges, as they exist today:

- 14 hospitals · 14 cities · 8 drones · 5-7 stations · 30-50 inventory items per
  hospital · 0-5 active emergencies
- Map viewport: Armenia fits at ~zoom 7-8; corridor views zoom 9-10; hospital
  detail zoom 11-13
- Right panel widths: 320px collapsed / 380px open
- Left filter rail: 256px desktop
- Mobile: filter becomes overlay, right panel becomes bottom sheet

## 6. Interaction and layout

**Hierarchy:** Display sizes carry the brand. Body sizes carry the data. Mono sizes
carry the figures. Borders carry relationships only when type and whitespace cannot.

**Topology:** keep the incumbent 3-pane topology (filters left / map centre /
context right) — proven in stakeholder pitches. Adjust the *weight* of each pane,
not its position. Filters become lighter (more whitespace, less chrome). Map
backdrop becomes warmer (off-white with subtle warm-tinted land/sea tones instead
of dark gradient). Right panel becomes more typographic (larger hospital names,
less status chrome).

**Responsiveness:** mobile stays in the same paradigm (filter overlay + bottom
sheet) — the brief fixes the design language, not the responsive strategy. Tablet
(768-1024px) slide-in patterns are still on the audit backlog and can be left for
a polish pass.

**Affordances:** subtle. The new world is "less shouting, more inviting". Buttons
have colour but no shadow stacks. Hover states are colour shifts, not lifts.

**Feedback:** the critical banner keeps its purpose (active emergencies), its
motion softens further (a slower, gentler pulse, not a flicker). LIVE indicator
becomes a softer pulsing dot — not a framed "instrument".

## 7. Constraints and open decisions

**Constraints:**

- Web platform, React 19 + Vite 8 + TypeScript 5 + Tailwind 4 + react-leaflet 5
- Static deployment, no backend, no external services
- WCAG AA contrast minimum on every surface/text pairing (warm light surfaces
  make this trivially achievable — verify in the new palette)
- Animations still gated by `prefers-reduced-motion`
- IBM Plex Sans + JetBrains Mono are already loaded — keep both
- Map uses inline GeoJSON (no tile servers) — apply the warm palette to the
  country outlines too (e.g. warm grey fill, darker warm grey borders)

**Open decisions for the builder:**

- Specific hex values for the new warm palette (propose in implementation, not
  in brief)
- Whether to add IBM Plex Serif for editorial counterpoints or stay with weight
  contrast in Plex Sans (recommend the latter — keeps the file count low)
- Exact corner radius scale (propose 8/12/16/24 for cards/buttons/sheets/major
  surfaces)
- Whether the map backdrop goes full warm-white or stays slightly tinted (likely
  tinted to keep the geography visible)

---

## Recommended next action

Reply with `approve` (or one correction) and I'll proceed to:

1. Replace `tailwind.config.js` colour tokens + `index.css` base surfaces
2. Rebuild Header, NetworkStats, StatTile, StatusPill, Button, HospitalPanel,
   DronePanel, FilterPanel, App critical banner
3. Rebuild GeoJSON map styling to warm palette
4. Update logo treatment if needed
5. Build + deploy
6. Verify in browser at desktop + mobile

If you want a different direction than "soft humanist warm light", now is the
moment to redirect — the brief gets harder to revise after the tokens ship.
