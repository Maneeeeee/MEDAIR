import type { RestrictedZone } from "../types";

// Simplified restricted / no-fly zones: airports and a mountainous
// military corridor. Used to render dashed exclusion circles.
export const restrictedZones: RestrictedZone[] = [
  {
    id: "rz-zvartnots",
    name: "Zvartnots CTR",
    centerLat: 40.1473,
    centerLng: 44.3959,
    radiusKm: 6,
    reason: "Aerodrome controlled zone",
  },
  {
    id: "rz-shirak",
    name: "Shirak CTR",
    centerLat: 40.7506,
    centerLng: 43.8593,
    radiusKm: 5,
    reason: "Aerodrome controlled zone",
  },
  {
    id: "rz-yeraz",
    name: "Yeraz Military Reserve",
    centerLat: 40.35,
    centerLng: 45.1,
    radiusKm: 8,
    reason: "Active military reservation",
  },
];
