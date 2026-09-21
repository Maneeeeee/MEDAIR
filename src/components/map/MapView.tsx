import { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  GeoJSON,
  Marker,
  Popup,
  Polyline,
  Circle,
  Tooltip,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type {
  City,
  Drone,
  DroneStation,
  EmergencyRequest,
  Hospital,
  LayerKey,
  RestrictedZone,
} from "../../types";
import { bearingDeg, lerpLatLng } from "../../lib/utils";
import {
  cityIcon,
  droneIcon,
  emergencyIcon,
  hospitalIcon,
  stationIcon,
} from "./MarkerIcons";
import regionGeoJSON from "../../data/geo/region.json";
import armeniaGeoJSON from "../../data/geo/armenia.json";
import lakesGeoJSON from "../../data/geo/lakes.json";
import riversGeoJSON from "../../data/geo/rivers.json";

interface MapViewProps {
  cities: City[];
  hospitals: Hospital[];
  drones: Drone[];
  stations: DroneStation[];
  routes: { fromCityId: string; toCityId: string }[];
  emergencies: EmergencyRequest[];
  restricted: RestrictedZone[];
  cityById: (id: string) => City;
  layers: Record<LayerKey, boolean>;
  selectedDroneId: string | null;
  selectedHospitalId: string | null;
  selectedCityId: string | null;
  onPickDrone: (id: string) => void;
  onPickHospital: (id: string) => void;
  onPickCity: (id: string) => void;
  onPickEmergency: (id: string) => void;
}

const ARMENIA_CENTER: [number, number] = [40.05, 44.95];

/* =============================================================
 * GlowingArmeniaBorder
 *
 * Renders the Armenia polygon as three stacked SVG paths so the
 * combined effect reads as a luminous neon outline with a soft
 * pulsing aura:
 *
 *   1. Halo    — wide, very low opacity, breathing animation
 *   2. Mid     — medium width + opacity, fixed glow
 *   3. Core    — thin crisp line + cyan fill
 *
 * react-leaflet's <GeoJSON> doesn't expose `className`, so we
 * attach CSS classes to the underlying SVG <path> elements via a
 * ref + a small `onEachFeature` no-op.
 * ============================================================= */
function GlowingArmeniaBorder() {
  return (
    <>
      <GeoJSON
        key="armenia-halo"
        data={armeniaGeoJSON as any}
        style={{
          color: "rgb(var(--armenia-glow) / 0.55)",
          weight: 18,
          opacity: 0.4,
          fillColor: "transparent",
          fillOpacity: 0,
          lineCap: "round",
          lineJoin: "round",
          interactive: false,
        }}
        onEachFeature={(_, layer) => {
          const el = (layer as L.Path & { _path?: SVGPathElement })._path;
          if (el) el.classList.add("fr-armenia-halo");
        }}
      />
      <GeoJSON
        key="armenia-mid"
        data={armeniaGeoJSON as any}
        style={{
          color: "rgb(var(--armenia-glow) / 0.9)",
          weight: 8,
          opacity: 0.75,
          fillColor: "transparent",
          fillOpacity: 0,
          lineCap: "round",
          lineJoin: "round",
          interactive: false,
        }}
        onEachFeature={(_, layer) => {
          const el = (layer as L.Path & { _path?: SVGPathElement })._path;
          if (el) el.classList.add("fr-armenia-mid");
        }}
      />
      <GeoJSON
        key="armenia-core"
        data={armeniaGeoJSON as any}
        style={{
          color: "rgb(var(--armenia-stroke) / 1)",
          weight: 2.5,
          opacity: 1,
          fillColor: "rgb(var(--armenia-fill) / 1)",
          fillOpacity: 0.18,
          lineCap: "round",
          lineJoin: "round",
        }}
        onEachFeature={(_, layer) => {
          const el = (layer as L.Path & { _path?: SVGPathElement })._path;
          if (el) el.classList.add("fr-armenia-core");
        }}
      />
    </>
  );
}

function FitBoundsOnFirstLoad({ cities }: { cities: City[] }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || cities.length === 0) return;
    done.current = true;
    // Fit to the Armenia polygon (not just the cities) so the full country
    // outline is visible on first load, with the cities centred inside it.
    const armeniaLayer = L.geoJSON(armeniaGeoJSON as any);
    const polyBounds = armeniaLayer.getBounds();
    const cityBounds = L.latLngBounds(
      cities.map((c) => [c.lat, c.lng] as [number, number])
    );
    const combined = polyBounds.isValid() ? polyBounds.extend(cityBounds) : cityBounds;
    map.fitBounds(combined.pad(0.05));
  }, [cities, map]);
  return null;
}

function FlyToSelected({
  drones,
  selectedDroneId,
  selectedHospitalId,
  selectedCityId,
  hospitals,
  cityById,
}: {
  drones: Drone[];
  selectedDroneId: string | null;
  selectedHospitalId: string | null;
  selectedCityId: string | null;
  hospitals: Hospital[];
  cityById: (id: string) => City;
}) {
  const map = useMap();
  const prevSignature = useRef("");
  const dronesRef = useRef(drones);
  const hospitalsRef = useRef(hospitals);
  const cityByIdRef = useRef(cityById);
  dronesRef.current = drones;
  hospitalsRef.current = hospitals;
  cityByIdRef.current = cityById;

  const signature =
    `${selectedDroneId ?? ""}|${selectedHospitalId ?? ""}|${selectedCityId ?? ""}`;

  useEffect(() => {
    if (prevSignature.current === signature) return;
    prevSignature.current = signature;

    if (selectedDroneId) {
      const d = dronesRef.current.find((x) => x.id === selectedDroneId);
      if (!d) return;
      const o = cityByIdRef.current(d.originCityId);
      const t = cityByIdRef.current(d.destinationCityId);
      const cur = lerpLatLng(
        { lat: o.lat, lng: o.lng },
        { lat: t.lat, lng: t.lng },
        d.progress
      );
      map.flyTo([cur.lat, cur.lng], Math.max(map.getZoom(), 9), {
        duration: 0.8,
      });
      return;
    }
    if (selectedHospitalId) {
      const h = hospitalsRef.current.find((x) => x.id === selectedHospitalId);
      if (!h) return;
      const c = cityByIdRef.current(h.cityId);
      map.flyTo([c.lat, c.lng], 11, { duration: 0.6 });
      return;
    }
    if (selectedCityId) {
      const c = cityByIdRef.current(selectedCityId);
      map.flyTo([c.lat, c.lng], 11, { duration: 0.6 });
    }
  }, [
    signature,
    selectedDroneId,
    selectedHospitalId,
    selectedCityId,
    map,
  ]);
  return null;
}

export function MapView(props: MapViewProps) {
  const {
    cities,
    hospitals,
    drones,
    stations,
    routes,
    emergencies,
    restricted,
    cityById,
    layers,
    selectedDroneId,
    selectedHospitalId,
    selectedCityId,
    onPickDrone,
    onPickHospital,
    onPickCity,
    onPickEmergency,
  } = props;

  // Build polylines for active routes. Tail = travelled, head = remaining.
  const activeRouteSegments = useMemo(() => {
    return drones
      .filter((d) => d.status === "in-flight" || d.status === "returning")
      .map((d) => {
        const o = cityById(d.originCityId);
        const t = cityById(d.destinationCityId);
        const cur = lerpLatLng(
          { lat: o.lat, lng: o.lng },
          { lat: t.lat, lng: t.lng },
          d.progress
        );
        return {
          id: d.id,
          status: d.status,
          tail: d.status === "in-flight" ? [cur, { lat: t.lat, lng: t.lng }] : [{ lat: o.lat, lng: o.lng }, cur],
          head: d.status === "in-flight" ? [{ lat: o.lat, lng: o.lng }, cur] : [cur, { lat: t.lat, lng: t.lng }],
        };
      });
  }, [drones, cityById]);

  return (
    <MapContainer
      center={ARMENIA_CENTER}
      zoom={8}
      minZoom={6}
      maxZoom={14}
      zoomControl={false}
      attributionControl
      className="h-full w-full"
    >
      {/* Country basemap — embedded GeoJSON, no tile server required.
          Drawn as a flat deep slate fill so the Flightradar aesthetic
          reads instantly: dark background, neon country borders,
          illuminated Armenia. */}
      <GeoJSON
        key="region"
        data={regionGeoJSON as any}
        style={{
          color: "rgb(var(--country-stroke) / 1)",
          weight: 1,
          opacity: 0.75,
          fillColor: "rgb(var(--country-fill) / 1)",
          fillOpacity: 1,
        }}
      />

      {/* Real hydrology — Natural Earth CC0 data. */}
      {layers.hydrology && (
        <>
          <GeoJSON
            key="lakes"
            data={lakesGeoJSON as any}
            style={{
              color: "rgb(var(--water-stroke) / 1)",
              weight: 1.2,
              opacity: 0.95,
              fillColor: "rgb(var(--water-fill) / 1)",
              fillOpacity: 0.95,
            }}
          />
          <GeoJSON
            key="rivers"
            data={riversGeoJSON as any}
            style={{
              color: "rgb(var(--water-stroke) / 1)",
              weight: 1.4,
              opacity: 0.85,
              fillColor: "transparent",
              fillOpacity: 0,
            }}
          />
        </>
      )}

      {/* =============================================================
         Armenia border — Flightradar-style glowing outline.
         Three stacked GeoJSON layers, each pointing at the same polygon:
            1. .fr-armenia-halo  — wide, very soft, breathes
            2. .fr-armenia-mid   — medium, brighter
            3. .fr-armenia-core  — thin crisp line
         The CSS rules in index.css apply progressive drop-shadow filters
         to each layer so the combined effect is a luminous neon outline
         with a soft pulsing aura. We disable the polygon fill on the
         outer two layers and only use it on the core so the cyan wash
         stays contained.
         ============================================================= */}
      <GlowingArmeniaBorder />

      <ZoomControl position="bottomright" />
      <FitBoundsOnFirstLoad cities={cities} />
      <FlyToSelected
        drones={drones}
        selectedDroneId={selectedDroneId}
        selectedHospitalId={selectedHospitalId}
        selectedCityId={selectedCityId}
        hospitals={hospitals}
        cityById={cityById}
      />

      {/* Restricted zones */}
      {layers.restricted &&
        restricted.map((z) => (
          <Circle
            key={z.id}
            center={[z.centerLat, z.centerLng]}
            radius={z.radiusKm * 1000}
            pathOptions={{
              color: "rgb(var(--critical) / 1)",
              weight: 1,
              opacity: 0.55,
              fillColor: "rgb(var(--critical) / 1)",
              fillOpacity: 0.07,
              dashArray: "4 6",
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1}>
              <div className="text-xs">
                <div className="font-semibold text-critical-600">{z.name}</div>
                <div className="text-ink-600">{z.reason}</div>
              </div>
            </Tooltip>
          </Circle>
        ))}

      {/* Static route overlay — Flightradar style: solid neon,
          tight opacity, no dashes. The line is a visible "corridor"
          that reads as infrastructure on the map. */}
      {layers.routes &&
        routes.map((r, i) => {
          const a = cityById(r.fromCityId);
          const b = cityById(r.toCityId);
          return (
            <Polyline
              key={`${r.fromCityId}-${r.toCityId}-${i}`}
              positions={[
                [a.lat, a.lng],
                [b.lat, b.lng],
              ]}
              pathOptions={{
                color: "rgb(var(--primary) / 1)",
                weight: 1.5,
                opacity: 0.32,
              }}
            />
          );
        })}

      {/* Active route segments.
            tail  = portion already flown (solid amber, dim) — the "history"
            head  = portion still to fly   (solid amber, bright) — the future
          The split lets the eye follow the drone's progress at a glance. */}
      {layers.routes &&
        activeRouteSegments.map((seg) => (
          <Polyline
            key={`active-tail-${seg.id}`}
            positions={seg.tail}
            pathOptions={{
              color: "rgb(var(--warn) / 1)",
              weight: 2.2,
              opacity: 0.45,
            }}
          />
        ))}
      {layers.routes &&
        activeRouteSegments.map((seg) => (
          <Polyline
            key={`active-head-${seg.id}`}
            positions={seg.head}
            pathOptions={{
              color: "rgb(var(--warn) / 1)",
              weight: 3,
              opacity: 0.95,
            }}
          />
        ))}

      {/* Cities */}
      {layers.cities &&
        cities.map((c) => (
          <Marker
            key={c.id}
            position={[c.lat, c.lng]}
            icon={cityIcon(c.name, c.population)}
            eventHandlers={{ click: () => onPickCity(c.id) }}
            zIndexOffset={-100}
          />
        ))}

      {/* Hospitals */}
      {layers.hospitals &&
        hospitals.map((h) => (
          <Marker
            key={h.id}
            position={[cityById(h.cityId).lat, cityById(h.cityId).lng]}
            icon={hospitalIcon()}
            eventHandlers={{ click: () => onPickHospital(h.id) }}
          >
            <Tooltip direction="top" offset={[0, -14]} opacity={1}>
              <div className="text-xs">
                <div className="font-semibold text-primary-700">{h.name}</div>
                <div className="text-ink-600">
                  {h.operationalHours} · Patients {h.patients}
                </div>
              </div>
            </Tooltip>
          </Marker>
        ))}

      {/* Drone stations */}
      {layers.stations &&
        stations.map((s) => (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={stationIcon()}
            eventHandlers={{ click: () => onPickCity(s.cityId) }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <div className="text-xs">
                <div className="font-semibold text-warn-700">{s.name}</div>
                <div className="text-ink-600">
                  Drones {s.dronesHome} · Batteries {s.batteriesHome}
                </div>
              </div>
            </Tooltip>
          </Marker>
        ))}

      {/* Emergencies */}
      {layers.emergencies &&
        emergencies
          .filter((e) => e.status !== "delivered")
          .map((e) => {
            const h = hospitals.find((x) => x.id === e.hospitalId);
            if (!h) return null;
            const c = cityById(h.cityId);
            return (
              <Marker
                key={e.id}
                position={[c.lat, c.lng]}
                icon={emergencyIcon()}
                eventHandlers={{ click: () => onPickEmergency(e.id) }}
                zIndexOffset={600}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                  <div className="text-xs">
                    <div className="font-semibold text-critical-600">
                      EMERGENCY · {e.priority.toUpperCase()}
                    </div>
                    <div className="text-ink-600">{h.name}</div>
                  </div>
                </Tooltip>
              </Marker>
            );
          })}

      {/* Drones — animated position */}
      {layers.drones &&
        drones.map((d) => {
          const o = cityById(d.originCityId);
          const t = cityById(d.destinationCityId);
          const cur = lerpLatLng(
            { lat: o.lat, lng: o.lng },
            { lat: t.lat, lng: t.lng },
            d.progress
          );
          const heading = bearingDeg(
            { lat: cur.lat, lng: cur.lng },
            { lat: t.lat, lng: t.lng }
          );
          return (
            <Marker
              key={d.id}
              position={[cur.lat, cur.lng]}
              icon={droneIcon({
                heading: Math.round(heading),
                status: d.status,
                battery: d.battery,
                id: d.id,
              })}
              eventHandlers={{ click: () => onPickDrone(d.id) }}
              zIndexOffset={d.status === "in-flight" ? 500 : 100}
            >
              <Tooltip
                direction="top"
                offset={[0, -14]}
                opacity={1}
                className="!bg-paper-50/95"
              >
                <div className="min-w-[170px] text-xs text-ink-800">
                  <div className="mono flex items-center justify-between font-bold text-warn-700">
                    <span>{d.id}</span>
                    <span className="text-[10px] uppercase text-ink-600">
                      {d.status.replace("-", " ")}
                    </span>
                  </div>
                  <div className="mt-1 text-ink-700">
                    {d.speed} km/h · {d.altitude} m · {Math.round(heading)}°
                  </div>
                  <div className="text-ink-700">
                    {cityById(d.originCityId).name} →{" "}
                    {cityById(d.destinationCityId).name}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px]">
                    <span className="text-primary-700">
                      Battery {Math.round(d.battery)}%
                    </span>
                    <span className="text-ok-600">ETA {d.etaMin} min</span>
                  </div>
                </div>
              </Tooltip>
              <Popup>
                <div className="text-xs text-ink-800">
                  Click to open {d.id} panel
                </div>
              </Popup>
            </Marker>
          );
        })}
    </MapContainer>
  );
}
