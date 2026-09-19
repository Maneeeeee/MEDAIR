import { useMemo, useState, useEffect } from "react";
import { Header } from "./components/layout/Header";
import { FilterPanel } from "./components/panels/FilterPanel";
import { HospitalPanel } from "./components/panels/HospitalPanel";
import { DronePanel } from "./components/panels/DronePanel";
import { EmergencyPanel } from "./components/panels/EmergencyPanel";
import { ContactModal } from "./components/modals/ContactModal";
import { DispatchWizard } from "./components/modals/DispatchWizard";
import { MapView } from "./components/map/MapView";
import { MapPresetSwitcher } from "./components/map/MapPresetSwitcher";
import { useTheme } from "./hooks/useTheme";
import { useToast } from "./components/ui/Toast";
import { cities, cityById } from "./data/cities";
import { hospitals } from "./data/hospitals";
import { droneStations } from "./data/stations";
import { routes } from "./data/routes";
import { initialEmergencies } from "./data/emergencies";
import { restrictedZones } from "./data/restricted";
import { useDroneSimulation } from "./hooks/useDroneSimulation";
import { initialDrones } from "./data/drones";
import type { LayerKey, QuickFilterKey } from "./types";
import { AlertTriangle, X } from "lucide-react";
import { haversineKm } from "./lib/utils";

const DEFAULT_LAYERS: Record<LayerKey, boolean> = {
  drones: true,
  hospitals: true,
  stations: true,
  routes: true,
  emergencies: true,
  cities: true,
  restricted: false,
  hydrology: true,
};

/**
 * Map view presets — each one toggles the layer set in one click. Hand-picked
 * combinations that read as different "viewing modes":
 *   Atlas  — full basemap: drones, hospitals, stations, routes, emergencies,
 *            cities, hydrology. Restricted zones off (rarely relevant). The
 *            default rich view.
 *   Cockpit — minimal ops: drones, routes, emergencies, hydrology. No cities,
 *             no hospitals. Reads as "night-shift monitoring".
 *   Mono   — geography only: hospitals, cities, hydrology. No drones / routes
 *            / emergencies. Reads as "planning / briefing".
 */
export type MapPreset = "atlas" | "cockpit" | "mono" | "custom";
const MAP_PRESETS: Partial<Record<MapPreset, Partial<Record<LayerKey, boolean>>>> = {
  atlas: {
    drones: true,
    hospitals: true,
    stations: true,
    routes: true,
    emergencies: true,
    cities: true,
    restricted: false,
    hydrology: true,
  },
  cockpit: {
    drones: true,
    hospitals: false,
    stations: false,
    routes: true,
    emergencies: true,
    cities: false,
    restricted: false,
    hydrology: true,
  },
  mono: {
    drones: false,
    hospitals: true,
    stations: false,
    routes: false,
    emergencies: false,
    cities: true,
    restricted: false,
    hydrology: true,
  },
};

const DEFAULT_QUICK: Record<QuickFilterKey, boolean> = {
  "in-flight": false,
  "low-battery": false,
  "critical-inventory": false,
  "within-50km": false,
};

/**
 * Inventory-item alias map. Lets the user search for colloquial terms
 * ("snake antivenom") and find every antivenom SKU stocked at any hospital,
 * even though the canonical inventory names differ.
 */
const ITEM_ALIASES: Record<string, string[]> = {
  "snake antivenom": ["antivenom"],
  antivenom: ["antivenom"],
  "anti-venom": ["antivenom"],
  "anti venom": ["antivenom"],
  "viper antivenom": ["antivenom"],
  "blood": ["blood"],
  "blood o+": ["blood-op"],
  "blood o-": ["blood-on"],
  "blood a+": ["blood-ap"],
  epinephrine: ["epinephrine"],
  epi: ["epinephrine"],
  adrenaline: ["epinephrine"],
  insulin: ["insulin"],
  antibiotics: ["antibiotics"],
  vaccine: ["vaccine-mmr"],
  mmr: ["vaccine-mmr"],
  oxytocin: ["oxytocin"],
  pph: ["oxytocin"],
  "lab sample": ["lab-un3373"],
  "lab samples": ["lab-un3373"],
  un3373: ["lab-un3373"],
  "iv fluids": ["iv-fluids"],
  saline: ["iv-fluids"],
};

export default function App() {
  const { drones, kpis } = useDroneSimulation(initialDrones);
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  const [preset, setPreset] = useState<MapPreset>("atlas");
  const [quickFilters, setQuickFilters] = useState(DEFAULT_QUICK);

  const applyPreset = (p: MapPreset) => {
    setPreset(p);
    setLayers((prev) => ({ ...prev, ...MAP_PRESETS[p] }));
  };

  // Detect "custom" state — once the user toggles any layer away from the
  // active preset, mark it as custom so the switcher stops auto-flipping.
  const layersMatchPreset = useMemo(() => {
    const cfg = MAP_PRESETS[preset];
    if (!cfg) return false; // "custom" never matches itself
    return Object.entries(cfg).every(([k, v]) => layers[k as LayerKey] === v);
  }, [layers, preset]);

  const toggleLayer = (k: LayerKey) => {
    setLayers((prev) => ({ ...prev, [k]: !prev[k] }));
    // Manual toggle moves us out of any preset
    setPreset((cur) => (cur === "custom" ? cur : "custom"));
  };
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>("h-yerevan-mc");
  const [selectedDroneId, setSelectedDroneId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedEmergencyId, setSelectedEmergencyId] = useState<string | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([
    "Gyumri",
    "AR-003",
    "Snake Antivenom",
  ]);

  const toggleQuickFilter = (k: QuickFilterKey) =>
    setQuickFilters((prev) => ({ ...prev, [k]: !prev[k] }));

  const onPickHospital = (id: string) => {
    setSelectedHospitalId(id);
    setSelectedDroneId(null);
    setSelectedEmergencyId(null);
    const h = hospitals.find((x) => x.id === id);
    if (h) setSelectedCityId(h.cityId);
  };

  const onPickDrone = (id: string) => {
    setSelectedDroneId(id);
    setSelectedHospitalId(null);
    setSelectedEmergencyId(null);
    const d = drones.find((x) => x.id === id);
    if (d) setSelectedCityId(null);
  };

  const onPickCity = (id: string) => {
    setSelectedCityId(id);
    setSelectedDroneId(null);
    setSelectedHospitalId(null);
    setSelectedEmergencyId(null);
    const h = hospitals.find((x) => x.cityId === id);
    if (h) setSelectedHospitalId(h.id);
  };

  const onPickEmergency = (id: string) => {
    setSelectedEmergencyId(id);
    setSelectedDroneId(null);
    setSelectedHospitalId(null);
  };

  const onRecallDrone = (id: string) => {
    toast.show(`Recall command sent to ${id}. Pilot acknowledged.`, {
      variant: "success",
    });
  };

  // ─── Quick-filter derived data ──────────────────────────────────────────
  // Compute filtered drones + hospitals based on the active quick-filter set.
  const filteredDrones = useMemo(() => {
    let list = drones;
    if (quickFilters["in-flight"]) {
      list = list.filter(
        (d) => d.status === "in-flight" || d.status === "returning"
      );
    }
    if (quickFilters["low-battery"]) {
      list = list.filter((d) => d.battery < 25);
    }
    if (quickFilters["within-50km"]) {
      list = list.filter((d) => {
        const o = cityById(d.originCityId);
        const t = cityById(d.destinationCityId);
        const curLat = o.lat + (t.lat - o.lat) * d.progress;
        const curLng = o.lng + (t.lng - o.lng) * d.progress;
        return haversineKm({ lat: curLat, lng: curLng }, t) <= 50;
      });
    }
    return list;
  }, [drones, quickFilters]);

  const filteredHospitals = useMemo(() => {
    if (!quickFilters["critical-inventory"]) return hospitals;
    return hospitals.filter((h) =>
      h.inventory.some((it) => it.status === "critical" || it.status === "out")
    );
  }, [quickFilters]);

  // ─── Search with alias mapping ──────────────────────────────────────────
  const expandAlias = (raw: string): string[] => {
    const ql = raw.trim().toLowerCase();
    if (ITEM_ALIASES[ql]) return ITEM_ALIASES[ql];
    // Token-level expansion for multi-word queries
    const tokens = ql.split(/\s+/);
    const expanded = new Set<string>();
    tokens.forEach((t) => {
      if (ITEM_ALIASES[t]) ITEM_ALIASES[t].forEach((id) => expanded.add(id));
    });
    return Array.from(expanded);
  };

  const onSearchSubmit = (q: string) => {
    const ql = q.trim().toLowerCase();
    if (!ql) return;
    setRecentSearches((prev) => [q, ...prev.filter((x) => x !== q)].slice(0, 5));
    // Drone ID exact match first (most specific)
    const d = drones.find((x) => x.id.toLowerCase() === ql);
    if (d) return onPickDrone(d.id);
    // City exact match
    const c = cities.find((x) => x.name.toLowerCase() === ql);
    if (c) return onPickCity(c.id);
    // Hospital name contains
    const h = hospitals.find((x) => x.name.toLowerCase().includes(ql));
    if (h) return onPickHospital(h.id);
    // Inventory alias match — opens the first hospital stocking the item
    const aliasIds = expandAlias(q);
    if (aliasIds.length > 0) {
      const match = hospitals.find((hh) =>
        hh.inventory.some((it) => aliasIds.includes(it.id))
      );
      if (match) {
        toast.show(`Showing inventory match for "${q}"`, { variant: "info" });
        return onPickHospital(match.id);
      }
    }
    // Loose city name contains (English or Armenian)
    const cLoose = cities.find(
      (x) =>
        x.name.toLowerCase().includes(ql) ||
        x.province?.toLowerCase().includes(ql)
    );
    if (cLoose) return onPickCity(cLoose.id);
  };

  const searchResults = useMemo(() => {
    const ql = searchQuery.trim().toLowerCase();
    if (!ql) return { cities: [], hospitals: [], drones: [], stations: [], items: [] as { itemId: string; itemLabel: string; hospitalId: string; hospitalName: string }[] };
    const aliasIds = expandAlias(searchQuery);
    return {
      cities: cities
        .filter(
          (c) =>
            c.name.toLowerCase().includes(ql) ||
            c.province?.toLowerCase().includes(ql)
        )
        .slice(0, 3),
      hospitals: hospitals.filter((h) => h.name.toLowerCase().includes(ql)).slice(0, 3),
      drones: drones.filter((d) => d.id.toLowerCase().includes(ql)).slice(0, 3),
      stations: droneStations.filter((s) => s.name.toLowerCase().includes(ql)).slice(0, 3),
      items: aliasIds.length
        ? hospitals
            .flatMap((h) =>
              h.inventory
                .filter((it) => aliasIds.includes(it.id))
                .map((it) => ({
                  itemId: it.id,
                  itemLabel: it.name,
                  hospitalId: h.id,
                  hospitalName: h.name,
                }))
            )
            .slice(0, 4)
        : [],
    };
  }, [searchQuery, drones]);

  const selectedHospital = hospitals.find((h) => h.id === selectedHospitalId);
  const selectedDrone = drones.find((d) => d.id === selectedDroneId);
  const selectedEmergency = initialEmergencies.find(
    (e) => e.id === selectedEmergencyId
  );
  const hasSelection = !!selectedDrone || !!selectedEmergency || !!selectedHospital;

  // Track hover state for tooltip demonstration (already via Leaflet Tooltip).
  // Keyboard shortcuts:
  //   cmd/ctrl + K  → focus search
  //   1 / 2 / 3     → switch to Atlas / Cockpit / Mono preset (when not
  //                   typing in an input)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Search-focus shortcut — works anywhere
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const el = document.querySelector(
          "input[placeholder^='City']"
        ) as HTMLInputElement | null;
        el?.focus();
        return;
      }
      // Preset shortcuts — only when not actively typing
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable === true;
      if (isTyping) return;
      if (e.key === "1") applyPreset("atlas");
      else if (e.key === "2") applyPreset("cockpit");
      else if (e.key === "3") applyPreset("mono");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const activeEmergencyCount = initialEmergencies.filter(
    (e) => e.priority === "critical" && e.status !== "delivered"
  ).length;

  // Click the top banner → zoom to the first active critical emergency
  // (and highlight it in the right panel).
  const onJumpToActiveEmergencies = () => {
    const firstActive = initialEmergencies.find(
      (e) => e.priority === "critical" && e.status !== "delivered"
    );
    if (firstActive) onPickEmergency(firstActive.id);
  };

  // Highlight-only hospital IDs that the quick filter surfaced — used so
  // the HospitalPanel can show a "Filtered match" banner.
  const filteredHospitalIds = useMemo(
    () => new Set(filteredHospitals.map((h) => h.id)),
    [filteredHospitals]
  );

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-paper-50 text-ink-900">
      <Header
        kpis={kpis}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenContact={() => setContactOpen(true)}
        onOpenDispatch={() => setDispatchOpen(true)}
        onToggleFilters={() => setFiltersOpen((v) => !v)}
      />

      {/* Critical banner — click to filter + zoom to active emergencies.
          Soft humanist treatment: warm coral wash, no aggressive flicker.
          The alert reads as "this matters" rather than "this is broken". */}
      {activeEmergencyCount > 0 && (
        <button
          type="button"
          onClick={onJumpToActiveEmergencies}
          aria-label={`Filter map to ${activeEmergencyCount} active critical emergency dispatch${activeEmergencyCount === 1 ? "" : "es"}`}
          className="group flex w-full items-center justify-center gap-2.5 border-b border-critical-500/25 bg-critical-50 px-5 py-2.5 text-[13px] font-medium text-critical-600 transition-colors hover:bg-critical-500/15 focus:bg-critical-500/15 focus:outline-none focus:ring-2 focus:ring-critical-500/30 animate-breathe"
        >
          <AlertTriangle size={14} className="shrink-0" />
          <span className="mono font-semibold">{activeEmergencyCount.toString().padStart(2, "0")}</span>
          <span>critical emergency dispatch{activeEmergencyCount === 1 ? "" : "es"} in progress</span>
          <span className="hidden text-critical-600/70 sm:inline">· response teams engaged</span>
          <span className="ml-auto text-[11px] text-ink-600 group-hover:text-critical-600">
            click to focus →
          </span>
        </button>
      )}

      <div className="relative flex flex-1 overflow-hidden">
        {/* Filter sidebar — collapsible on mobile */}
        <aside
          className={`${
            filtersOpen ? "absolute inset-y-0 left-0 z-[1100]" : "hidden"
          } w-72 shrink-0 border-r border-paper-300 bg-paper-50 md:static md:flex md:flex-col md:w-64 xl:w-72`}
        >
          <FilterPanel
            layers={layers}
            onToggleLayer={toggleLayer}
            query={searchQuery}
            onQueryChange={(s) => {
              setSearchQuery(s);
              if (s.length >= 3) onSearchSubmit(s);
            }}
            recent={recentSearches}
            onPickRecent={(s) => {
              setSearchQuery(s);
              onSearchSubmit(s);
            }}
            quickFilters={quickFilters}
            onToggleQuickFilter={toggleQuickFilter}
          />
        </aside>

        {/* Map */}
        <div className="relative flex-1">
          <MapView
            cities={cities}
            hospitals={filteredHospitals}
            drones={filteredDrones}
            stations={droneStations}
            routes={routes}
            emergencies={initialEmergencies}
            restricted={restrictedZones}
            cityById={cityById}
            layers={layers}
            selectedDroneId={selectedDroneId}
            selectedHospitalId={selectedHospitalId}
            selectedCityId={selectedCityId}
            onPickDrone={onPickDrone}
            onPickHospital={onPickHospital}
            onPickCity={onPickCity}
            onPickEmergency={onPickEmergency}
          />

          {/* Map preset switcher — top-right segmented control. Wrapper is
              click-through so it never blocks the map; the switcher itself
              re-enables pointer events on its inner buttons. */}
          <div className="absolute right-3 top-3 z-[1050] flex justify-end">
            <MapPresetSwitcher
              preset={layersMatchPreset ? preset : "custom"}
              onPick={applyPreset}
            />
          </div>

          {/* Quick-filter active indicator */}
          {Object.values(quickFilters).some(Boolean) && (
            <div className="absolute left-4 top-4 z-[1100] flex items-center gap-2 rounded-lg border border-paper-300 bg-paper-50/90 px-3 py-1.5 shadow-soft backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              <span className="text-[12px] font-medium text-primary-700">
                {filteredDrones.length}/{drones.length} drones ·{" "}
                {filteredHospitals.length}/{hospitals.length} hospitals
              </span>
            </div>
          )}

          {/* Search results dropdown */}
          {searchQuery.length >= 1 && (
            <div className="absolute right-4 top-4 z-[1500] w-80 lg:right-[340px] xl:right-[400px] panel-strong animate-slideUp overflow-hidden">
              <div className="border-b border-paper-300 px-3.5 py-2 text-[11px] font-medium text-ink-700">
                Results for <span className="mono text-ink-900">&quot;{searchQuery}&quot;</span>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {searchResults.drones.length > 0 && (
                  <div className="label-eyebrow px-3.5 pt-3">
                    Drones
                  </div>
                )}
                {searchResults.drones.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => onPickDrone(d.id)}
                    className="flex w-full items-center justify-between px-3.5 py-2 text-left text-[13px] hover:bg-paper-150"
                  >
                    <span className="mono text-warn-600">{d.id}</span>
                    <span className="text-ink-600">
                      {cityById(d.originCityId).name} → {cityById(d.destinationCityId).name}
                    </span>
                  </button>
                ))}
                {searchResults.hospitals.length > 0 && (
                  <div className="label-eyebrow px-3.5 pt-3">
                    Hospitals
                  </div>
                )}
                {searchResults.hospitals.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => onPickHospital(h.id)}
                    className="flex w-full items-center justify-between px-3.5 py-2 text-left text-[13px] hover:bg-paper-150"
                  >
                    <span className="text-ink-900">{h.name}</span>
                    <span className="text-ink-600">{cityById(h.cityId).name}</span>
                  </button>
                ))}
                {searchResults.cities.length > 0 && (
                  <div className="label-eyebrow px-3.5 pt-3">
                    Cities
                  </div>
                )}
                {searchResults.cities.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onPickCity(c.id)}
                    className="flex w-full items-center justify-between px-3.5 py-2 text-left text-[13px] hover:bg-paper-150"
                  >
                    <span className="text-ink-900">{c.name}</span>
                    <span className="text-ink-600 mono">{c.population.toLocaleString()}</span>
                  </button>
                ))}
                {searchResults.stations.length > 0 && (
                  <div className="label-eyebrow px-3.5 pt-3">
                    Drone stations
                  </div>
                )}
                {searchResults.stations.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onPickCity(s.cityId)}
                    className="flex w-full items-center justify-between px-3.5 py-2 text-left text-[13px] hover:bg-paper-150"
                  >
                    <span className="text-ink-900">{s.name}</span>
                    <span className="text-ink-600">{cityById(s.cityId).name}</span>
                  </button>
                ))}
                {searchResults.items.length > 0 && (
                  <div className="label-eyebrow px-3.5 pt-3">
                    Inventory matches
                  </div>
                )}
                {searchResults.items.map((it) => (
                  <button
                    key={`${it.itemId}-${it.hospitalId}`}
                    onClick={() => onPickHospital(it.hospitalId)}
                    className="flex w-full items-center justify-between px-3.5 py-2 text-left text-[13px] hover:bg-paper-150"
                  >
                    <span className="text-primary-700">{it.itemLabel}</span>
                    <span className="text-ink-600">{it.hospitalName}</span>
                  </button>
                ))}
                {searchResults.drones.length === 0 &&
                  searchResults.hospitals.length === 0 &&
                  searchResults.cities.length === 0 &&
                  searchResults.stations.length === 0 &&
                  searchResults.items.length === 0 && (
                    <div className="px-3.5 py-5 text-center text-[12px] text-ink-600">
                      No matches for &quot;{searchQuery}&quot;. Try a city,
                      drone ID, or medical item (e.g. &quot;antivenom&quot;,
                      &quot;blood&quot;, &quot;insulin&quot;).
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* Right detail panel */}
        <aside
          className={`w-[320px] shrink-0 flex-col border-l border-paper-300 bg-paper-50/90 backdrop-blur-md xl:w-[380px] ${
            hasSelection
              ? "absolute inset-y-0 right-0 z-[1100] flex md:flex lg:static lg:flex"
              : "hidden lg:flex"
          }`}
        >
          {selectedDrone && (
            <DronePanel
              drone={selectedDrone}
              onClose={() => setSelectedDroneId(null)}
              onRecall={onRecallDrone}
            />
          )}
          {!selectedDrone && selectedEmergency && (
            <EmergencyPanel
              emergency={selectedEmergency}
              hospital={hospitals.find(
                (h) => h.id === selectedEmergency.hospitalId
              )}
              drone={
                selectedEmergency.droneId
                  ? drones.find((d) => d.id === selectedEmergency.droneId)
                  : undefined
              }
              onClose={() => setSelectedEmergencyId(null)}
            />
          )}
          {!selectedDrone && !selectedEmergency && selectedHospital && (
            <HospitalPanel
              hospital={selectedHospital}
              onClose={() => setSelectedHospitalId(null)}
              filteredMatch={
                quickFilters["critical-inventory"] &&
                filteredHospitalIds.has(selectedHospital.id)
              }
            />
          )}
          {!selectedDrone && !selectedEmergency && !selectedHospital && (
            <DefaultSidePanel
              onOpenContact={() => setContactOpen(true)}
              onOpenDispatch={() => setDispatchOpen(true)}
              activeCount={activeEmergencyCount}
            />
          )}
        </aside>

        {/* Mobile bottom sheet */}
        <div className="absolute inset-x-0 bottom-0 z-[1100] block md:hidden">
          <MobileSheet
            drones={drones}
            hospital={selectedHospital}
            onPickDrone={onPickDrone}
            onClose={() => setSelectedHospitalId(null)}
          />
        </div>
      </div>

      {contactOpen && <ContactModal onClose={() => setContactOpen(false)} />}
      {dispatchOpen && (
        <DispatchWizard
          stations={droneStations}
          hospitals={hospitals}
          cityById={cityById}
          onClose={() => setDispatchOpen(false)}
          onDispatched={(payload) => {
            toast.show(
              `Emergency dispatch launched: ${payload.droneId} → ${payload.destinationName} (${payload.etaMin} min ETA)`,
              { variant: "success", duration: 6000 }
            );
            onPickHospital(payload.hospitalId);
            setDispatchOpen(false);
          }}
        />
      )}
    </div>
  );
}

function DefaultSidePanel({
  onOpenContact,
  onOpenDispatch,
  activeCount,
}: {
  onOpenContact: () => void;
  onOpenDispatch: () => void;
  activeCount: number;
}) {
  return (
    <div className="flex h-full flex-col gap-3 p-5">
      <div className="panel animate-slideUp p-5">
        <div className="label-eyebrow">Live network</div>
        <div className="mt-3 space-y-2 text-[13px] text-ink-800">
          <div className="flex justify-between">
            <span>Active drones</span>
            <span className="mono text-warn-600">08</span>
          </div>
          <div className="flex justify-between">
            <span>In flight</span>
            <span className="mono text-ok-600">05</span>
          </div>
          <div className="flex justify-between">
            <span>Medical stations</span>
            <span className="mono text-primary-700">14</span>
          </div>
          <div className="flex justify-between">
            <span>Deliveries today</span>
            <span className="mono text-ink-900">37</span>
          </div>
          <div className="flex justify-between border-t border-paper-300 pt-2">
            <span>Critical dispatches</span>
            <span className="mono text-critical-600">{activeCount}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onOpenDispatch}
        className="rounded-lg border border-critical-500/30 bg-critical-50 px-4 py-2.5 text-[13px] font-medium text-critical-600 transition-colors hover:bg-critical-500/15 hover:border-critical-500/50"
      >
        + New emergency dispatch
      </button>

      <div className="panel animate-slideUp p-5">
        <div className="label-eyebrow">Tip</div>
        <div className="mt-2.5 text-[13px] text-ink-700">
          Click a hospital or drone on the map to see details. Use{" "}
          <kbd className="rounded border border-paper-300 bg-paper-100 px-1.5 py-0.5 mono text-[11px] text-ink-800">
            ⌘K
          </kbd>{" "}
          to focus the search.
        </div>
      </div>

      <button
        onClick={onOpenContact}
        className="mt-auto rounded-lg bg-primary-500 px-4 py-2.5 text-[13px] font-medium text-white shadow-soft transition-colors hover:bg-primary-600"
      >
        Open operations center
      </button>
    </div>
  );
}

function MobileSheet({
  drones,
  hospital,
  onPickDrone,
  onClose,
}: {
  drones: { id: string; status: string; battery: number; originCityId: string; destinationCityId: string }[];
  hospital: { name: string; fleet: { active: number; inFlight: number; maintenance: number } } | null | undefined;
  onPickDrone: (id: string) => void;
  onClose: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  // Re-show the sheet when the selected hospital changes (i.e., user picked
  // something else on the map).
  useEffect(() => {
    setDismissed(false);
  }, [hospital?.name]);
  if (dismissed) return null;
  const inFlight = drones.filter((d) => d.status === "in-flight").slice(0, 3);
  return (
    <div className="pointer-events-auto rounded-t-2xl border-t border-paper-300 bg-paper-50/95 p-4 shadow-float backdrop-blur-md">
      <div className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-paper-300" />
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="label-eyebrow">
            {hospital?.name ?? "Network"}
          </span>
          <span className="mono text-[14px] font-bold text-ink-900">
            {hospital
              ? `${hospital.fleet.active} active · ${hospital.fleet.inFlight} in flight`
              : `${inFlight.length} missions active`}
          </span>
        </div>
        <div className="flex-1" />
        {inFlight.slice(0, 2).map((d) => (
          <button
            key={d.id}
            onClick={() => onPickDrone(d.id)}
            className="rounded-md border border-warn-500/35 bg-warn-500/[0.08] px-2 py-1 text-[10px] mono text-warn-700 outline-none transition-colors hover:bg-warn-500/15 focus-visible:ring-2 focus-visible:ring-primary-500/40"
          >
            {d.id}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            onClose();
          }}
          aria-label="Dismiss bottom sheet"
          className="ml-1 rounded-md p-1 text-ink-600 outline-none transition-colors hover:bg-paper-150 hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-primary-500/40"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
