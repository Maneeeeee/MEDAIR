# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 19 + Vite 8 + TypeScript 5 + Tailwind CSS 4 + react-leaflet 5 + Leaflet 1.9.
No backend. All flight, inventory, and emergency data is generated client-side.
Deployed as a static build to `space.minimax.io`.

## Users

**Primary: external observers evaluating the concept** — regulators (CAC / EASA SORA),
public-health press, and Armenian health-authority stakeholders. They are not flying
drones; they are reading the operation. They arrive expecting a marketing deck and find
a working control surface. The shift in expectations is the whole point of the pitch.

**Secondary (latent):** the actual operators the surface was designed against — drone
pilots, dispatchers, hospital pharmacists. The interface is operationally honest, so
they can read it too, but they are not the audience being pitched.

## Product Purpose

A working visual prototype of a real-time medical drone delivery network across
Armenia. The product makes the operational model tangible: 14 hospitals, 8 active
drones, regional corridors into the mountainous south (Jermuk, Sisian, Vardenis), live
inventory state, and active emergency dispatches. The artifact exists so a stakeholder
can sit with the dashboard for two minutes and understand how the network would behave
under load — without reading a proposal.

Success = the evaluator closes the tab and asks "is this real?". Not "this looks nice",
not "this is polished" — the visceral question of whether they are looking at a
demonstration of something that could exist tomorrow.

## Positioning

The surface itself is the proof. There are no screenshots, no recorded demo videos, no
mockup hero images. The viewer sees a live map, live flight paths, live inventory
tickers, and live critical-alert banners. The differentiator against neighbouring
"smart logistics" pitches: this one shows the cockpit, not the brochure.

Three things the incumbent cannot truthfully copy:
- Real Armenian geography and real hospital locations (Yerevan, Gyumri, Vanadzor,
  Jermuk, Sisian, Vardenis, etc.) on an actual operational map
- Realistic operational numbers (142 patients, 3 emergencies, 8 drones, 7 stations,
  37 deliveries) that read as plausible under load, not round-numbered demo placeholders
- The fleet-state tension: an evaluator sees the dashboard *between* dispatches and
  understands what "engaged" actually feels like

## Operating Context

The dashboard is the artefact a stakeholder is left alone with for 2-10 minutes after
the live pitch presentation ends. It needs to be self-explanatory: no presenter, no
narrator, no audio. Every affordance must telegraph itself through the visual surface.

Two physical contexts matter for the design:
1. **A boardroom projector at a regulator meeting** — far viewing distance, the KPIs
   and critical banner must read at first glance
2. **A reporter's laptop after the press release** — close reading, the inventory table,
   phone numbers, and corridor geometry should reward scrutiny

## Capabilities and Constraints

**Confirmed in code (live at `https://l66hlaodz3bi1.space.minimax.io`):**

- 14 hospitals across Armenia with realistic inventory, fleet, and battery telemetry
- 8 active drones with continuous flight progression (Haversine interpolation along
  origin → destination corridors at 95 km/h)
- 3-step Emergency Dispatch wizard (origin → destination + urgency → payload) with
  live distance, ETA, and battery-cost calculation
- Critical-alert banner that filters the map and zooms to active emergencies on click
- Search across cities, hospitals, drones, and inventory items with alias map
  (`snake/antivenom → antivenom`, `blood O+ → blood-op`)
- 7 toggleable map layers (drones, hospitals, stations, routes, emergencies, cities,
  restricted zones) + 4 quick filters (in-flight only, low battery, critical
  inventory, within 50 km of destination)
- Hospital, drone, and emergency side-panels with full data inspection
- Contact modal (operations center number, ops email)
- Inline GeoJSON map (no external tile servers) — Armenia + Georgia + Azerbaijan +
  Turkey + Iran outlines styled for dark cockpit

**Explicit constraints:**

- **No backend.** All state is simulated client-side via `useDroneSimulation`. Swap
  points live in `src/data/*.ts` and `src/hooks/useDroneSimulation.ts`.
- **No external map tile provider.** External servers (OSM, OSM-fr, CARTO) are
  blocked or watermarked from the deployed origin. Country outlines come from inline
  GeoJSON derived from Natural Earth (CC0).
- **No external keys, no paid APIs.** Demo must run from a single static build.
- **Animations gated by `prefers-reduced-motion`** the Tailwind plugin emits keyframes
  inside `@media (prefers-reduced-motion: no-preference)` only.
- **Hospital phone numbers are realistic Armenian numbers** (e.g. `+374 11 50-12-34`)
  not `XXX` placeholders. This is a load-bearing credibility signal.
- **Brand name is locked** as `DroneAid ARMENIA`. Do not propose renames.

**Open / deferred audit items** (do not pretend they are done):

- A1 · Map markers not keyboard-reachable
- P4 · Every-tick re-renders the whole app (useSyncExternalStore or zustand split)
- R7 · Search dropdown overlaps right rail
- T3 · Hard-coded colours in marker SVGs (should be tokenised)
- Tablet 768px — right-rail currently overlays, could slide-in
- Filter sidebar mobile — full-screen overlay rather than a slide-in sheet

## Brand Commitments

**Name:** `DroneAid ARMENIA` — locked. Display style: `DroneAid` bold black + `ARMENIA`
light-weight medical cyan with wide tracking, on a dark surface.

**Logo mark:** hexagonal network-node frame with a medical cross at centre and a
single amber orbit dot representing a drone in flight. Custom SVG, not a stock icon.
Sized at 30px in the header, never paired with an emoji.

**Voice:** operational, restrained, instrumentation language. No "seamless", no
"empowering", no marketing superlatives. Labels are nouns ("Inventory", "Telemetry",
"Flight"), not verbs ("Empowering seamless delivery"). Critical alerts are factual
("2 critical emergency dispatches in progress · response teams engaged"), not
emotive.

**Palette commitment:** one neutral base family (warm off-black ink scale
`#08090f → #5a648a`) with four functional status accents:
- `medical` cyan `#5ed5e8` — hospitals, primary medical, selected
- `drone` amber `#f5b440` — drones, in-flight, active
- `critical` red `#f56565` — critical, destructive
- `ok` emerald `#3ed9a4` — available, success

No additional colours. No purple/violet. No neon outer glows. Status colours carry
state, decoration carries mood — the two never mix.

**Typography commitment:** IBM Plex Sans as the only sans-serif, JetBrains Mono for
every figure and every uppercase label. Open-weight ramp 400/500/600/700 with the
light weight reserved for typographic counterpoint in the wordmark only. No
serif anywhere on the surface (this is a control console, not editorial).

**Visual world commitment:** dark cockpit aesthetic with industrial-control framing
(corner brackets `〔 〕` on KPI tiles, mono uppercase labels with `0.18em` tracking,
subtle radial gradient backdrop where the map is empty). Not a marketing site. Not a
SaaS dashboard template. The visual authority reads as "operations room", not "demo".

## Evidence on Hand

- **Live deployment:** `https://l66hlaodz3bi1.space.minimax.io` (in-place updates
  via drive node `442203654365411`)
- **Background dossier on the operating context:**
  `/Users/davidnalbandyan/.minimax/workspace/drone-medical-logistics-dossier.md`
  (Yerevan ↔ Jermuk/Sisian/Vardenis corridors, Armenian regulatory frame, Civil
  Aviation Committee / EASA SORA references)
- **10 Superdesign drafts** on canvas `d04776ad-f5e7-423c-b9a7-402b843954f1` —
  Operations Dashboard, Hospital Panel, Drone Detail, Critical Incident, Mobile
  Dashboard, Search & Filters, Contact Modal, Network Analytics, Drone Stations
  Directory, Command Center Ops Console
- **Real geographic data:** Armenia + 5-neighbour GeoJSON in
  `src/data/geo/{armenia,region}.json` (Natural Earth, CC0)
- **Real hospital data:** 14 hospitals with addresses, phone numbers, fleet, and
  inventory in `src/data/hospitals.ts`
- **Real city coordinates:** 14 Armenian cities in `src/data/cities.ts`

**No fabricated evidence to add in future work:** no real customer logos, no
press testimonials, no benchmark numbers, no pricing. The product is a concept
pitch; do not invent the institutional evidence the real product would need.

## Product Principles

1. **The surface is the pitch.** The viewer should never wonder whether the operation
   is real. Every detail — phone formats, corridor distances, hospital counts — must
   be plausible under inspection. Round numbers, placeholder text, or generic stock
   imagery break the pitch more than any design miss.

2. **Operate, don't persuade.** This is an operations console. The visitor's success
   is reading live state without instructions. Persuasion belongs in the verbal pitch;
   the artefact is the silent second voice that confirms it.

3. **Cockpit density wins.** A regulator scanning at projector distance and a
   reporter inspecting at laptop distance both need every figure to be findable. Card
   containers are reserved for hierarchy. Data reads as mono numerals + uppercase
   labels, separated by hairlines, never by boxes-within-boxes.

4. **Honest instrumentation.** Animations are state, not decoration. A pulse on the
   LIVE indicator means the simulation is running. A flicker on the critical banner
   means an emergency is active. Anything that animates for any other reason is
   removed.

5. **Self-contained deployment wins.** The demo must survive being opened on a
   stranger's laptop with a flaky VPN, behind a corporate firewall, six months from
   now. External tile servers, third-party APIs, or per-deployment keys all
   disqualify a feature.

## Accessibility & Inclusion

- WCAG AA contrast minimum for body text, AAA for hero KPI numerals
- Tinted (not pure-black) shadows so cards remain legible at high screen contrast
- All animations gated by `prefers-reduced-motion: no-preference`
- Tabular numerals (`font-variant-numeric: tabular-nums`) on every figure
- Map markers are NOT keyboard-reachable today — this is a known audit backlog
  item (A1) and is a real credibility risk for stakeholders who evaluate the
  interface via screen reader

Future accessibility work, in order of priority:
1. Keyboard-reachable map markers with parallel list fallback
2. High-contrast theme toggle (the current cockpit dark has no light counterpart)
3. Localisation beyond English (Armenian first, then Russian) when the surface
   moves from pitch to internal use
