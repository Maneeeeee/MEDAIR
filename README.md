# MEDAIR ARMENIA — Medical Drone Delivery Network

A front-end-only prototype of a real-time medical-drone coordination center for the Republic of Armenia. Built to demonstrate the operational UX of a centralized antivenom, blood, vaccine, and lab-sample drone network covering Armenia's mountainous marzer.

> **No backend.** All drones, hospitals, batteries, KPIs, and emergency dispatches are simulated client-side from realistic mock data — anchored in the dossier §3 corridors (Yerevan ↔ Jermuk / Sisian / Vardenis) and §1 medical payloads (lyophilised antivenom, blood, UN3373 sample transport, MMR vaccine).

## Stack

- **Vite + React 19 + TypeScript**
- **Tailwind CSS** (custom design tokens: dark cockpit palette)
- **react-leaflet + Leaflet** for the map (CARTO dark tiles, no API key)
- **lucide-react** for icons

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in /dist
npm run preview  # preview the production build
```

## What's in the box

| Surface | File |
|---|---|
| App shell, header, KPI bar, sidebar wiring | `src/App.tsx` |
| Header + network KPIs | `src/components/layout/` |
| Filter / layer / search panel | `src/components/panels/FilterPanel.tsx` |
| Hospital info panel (inventory + fleet + batteries) | `src/components/panels/HospitalPanel.tsx` |
| Drone detail panel (telemetry + cargo + flight stepper) | `src/components/panels/DronePanel.tsx` |
| Emergency request panel (critical banner, items, drone) | `src/components/panels/EmergencyPanel.tsx` |
| Contact / operations center modal | `src/components/modals/ContactModal.tsx` |
| Map view + all marker types | `src/components/map/` |
| Live simulation (drone flight, battery drain, KPI jitter) | `src/hooks/useDroneSimulation.ts`, `src/lib/simulation.ts` |
| Mock data | `src/data/*.ts` |

## Design tokens

```
Background     #0a0e1a     Panel surface  #0f1626     Border       #1e293b
Cyan / medical #22d3ee     Amber / drone  #fbbf24     Red / critical #ef4444
Emerald / ok   #10b981     Slate text     #cbd5e1     Slate muted   #64748b
```

Typography: **Inter** for UI, **JetBrains Mono** for IDs, telemetry numbers, distances, ETAs.

## Try the interaction flows

1. **Hospital** — click any cyan medical-cross marker on the map → hospital info panel opens on the right (inventory, fleet, batteries).
2. **Drone** — click any amber quadcopter glyph → flight stepper, telemetry grid, cargo manifest, recall control.
3. **City** — type "Gyumri" or "Jermuk" in the search → map flies to it and the hospital panel opens.
4. **Emergency** — click a red emergency pulse on the map → critical banner panel opens with the assigned drone and route progress.

Keyboard: <kbd>⌘K</kbd> / <kbd>Ctrl K</kbd> focuses the search input.

## Connecting a real backend

The data layer (`src/data/`) is intentionally a flat mock. To swap in a real backend:

1. Replace each `*.ts` data file with a fetch/loader that calls the equivalent REST endpoint, returning the same shapes defined in `src/types/index.ts`.
2. Replace `src/hooks/useDroneSimulation.ts` with a websocket / SSE subscription that streams live drone telemetry and triggers the same `advanceDrone` reducer (or a server-side tick that mirrors its semantics).
3. Replace the `onRecallDrone` alert in `App.tsx` with a `POST /drones/:id/recall` call.
4. Keep the `src/components/**` UI unchanged — they read only the typed shapes.
