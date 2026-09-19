import type { FlightRoute } from "../types";
import { cities } from "./cities";

// Haversine — km straight-line between two lat/lng points.
const haversineKm = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const cityById = (id: string) => cities.find((c) => c.id === id)!;

// Build canonical Yerevan↔hub routes plus key regional hops from the dossier.
// `durationMin` is a typical cruise-speed estimate at ~110 km/h.
const route = (from: string, to: string, cruiseKph = 110): FlightRoute => {
  const a = cityById(from);
  const b = cityById(to);
  const distanceKm = Math.round(haversineKm(a, b) * 10) / 10;
  const durationMin = Math.max(8, Math.round((distanceKm / cruiseKph) * 60));
  return {
    id: `rt-${from}-${to}`,
    fromCityId: from,
    toCityId: to,
    distanceKm,
    durationMin,
  };
};

export const routes: FlightRoute[] = [
  // Anchor mountain corridors (dossier §3.5)
  route("yerevan", "jermuk"),
  route("yerevan", "sisian"),
  route("yerevan", "vardenis"),
  // Major regional hops
  route("yerevan", "gyumri"),
  route("yerevan", "vanadzor"),
  route("yerevan", "kapan"),
  route("yerevan", "hrazdan"),
  route("yerevan", "dilijan"),
  route("yerevan", "sevan"),
  route("yerevan", "armavir"),
  route("yerevan", "artashat"),
  route("gyumri", "vanadzor"),
  route("vanadzor", "dilijan"),
  route("dilijan", "sevan"),
  route("sevan", "vardenis"),
  route("vardenis", "jermuk"),
  route("jermuk", "sisian"),
  route("sisian", "goris"),
  route("goris", "kapan"),
];

export const routeByPair = (a: string, b: string) =>
  routes.find((r) => r.fromCityId === a && r.toCityId === b) ??
  routes.find((r) => r.fromCityId === b && r.toCityId === a);

export { haversineKm };
