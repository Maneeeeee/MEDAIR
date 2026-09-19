import type { Drone, CargoItem } from "../types";
import { routes } from "./routes";

// Build the fleet. Drones are pre-positioned along realistic corridors.
// Speed/altitude/battery are mock-but-coherent values.
const cargo = (items: CargoItem[]): CargoItem[] => items;

const drone = (
  id: string,
  status: Drone["status"],
  origin: string,
  destination: string,
  progress: number,
  speed: number,
  altitude: number,
  battery: number,
  cargoList: CargoItem[],
  heading: number
): Drone => {
  // Locate the route (origin → destination preferred, reverse as fallback).
  // When no canonical route exists (e.g. origin === destination, or an idle
  // drone parked at its home station), fall back to zero distance so we
  // still produce a well-formed Drone object.
  const rt = routes.find(
    (r) =>
      r.fromCityId === origin && r.toCityId === destination
  ) ?? routes.find(
    (r) =>
      r.fromCityId === destination && r.toCityId === origin
  );
  const totalKm = rt?.distanceKm ?? 0;
  const durationMin = rt?.durationMin ?? 0;
  return {
    id,
    status,
    homeStationId: `st-${origin}`,
    originCityId: origin,
    destinationCityId: destination,
    progress,
    speed,
    altitude,
    battery,
    cargo: cargo(cargoList),
    etaMin: Math.max(0, Math.round(durationMin * (1 - progress))),
    totalDistanceKm: totalKm,
    distanceTraveledKm: Math.round(totalKm * progress * 10) / 10,
    signal: "strong",
    heading,
    updatedAt: new Date().toISOString(),
  };
};

export const initialDrones: Drone[] = [
  drone(
    "AR-001",
    "in-flight",
    "yerevan",
    "jermuk",
    0.62,
    96,
    620,
    74,
    [
      { id: "c1", label: "Lyophilised Polyvalent Antivenom", category: "anti-poison", quantity: 6, unit: "vials" },
      { id: "c2", label: "Epinephrine", category: "medication", quantity: 8, unit: "ampoules" },
      { id: "c3", label: "IV Crystalloids (0.9% NaCl)", category: "medication", quantity: 2, unit: "litres" },
    ],
    128
  ),
  drone(
    "AR-002",
    "in-flight",
    "yerevan",
    "gyumri",
    0.34,
    102,
    540,
    88,
    [
      { id: "c1", label: "Blood Type O+", category: "blood", quantity: 4, unit: "units" },
      { id: "c2", label: "Viper Antivenom", category: "anti-poison", quantity: 4, unit: "vials" },
    ],
    312
  ),
  drone(
    "AR-003",
    "in-flight",
    "yerevan",
    "vardenis",
    0.18,
    88,
    480,
    92,
    [
      { id: "c1", label: "Oxytocin (PPH)", category: "medication", quantity: 12, unit: "ampoules" },
      { id: "c2", label: "Blood Type O-", category: "blood", quantity: 2, unit: "units" },
    ],
    98
  ),
  drone(
    "AR-004",
    "in-flight",
    "yerevan",
    "sisian",
    0.45,
    78,
    510,
    81,
    [
      { id: "c1", label: "MMR Vaccine", category: "vaccine", quantity: 30, unit: "doses" },
      { id: "c2", label: "Broad-spectrum Antibiotics", category: "medication", quantity: 20, unit: "doses" },
    ],
    158
  ),
  drone(
    "AR-005",
    "returning",
    "vanadzor",
    "vanadzor",
    0,
    0,
    0,
    56,
    [],
    0
  ),
  drone(
    "AR-006",
    "loading",
    "yerevan",
    "kapan",
    0,
    0,
    0,
    100,
    [
      { id: "c1", label: "Blood Type A+", category: "blood", quantity: 6, unit: "units" },
    ],
    0
  ),
  drone(
    "AR-007",
    "idle",
    "yerevan",
    "yerevan",
    0,
    0,
    0,
    98,
    [],
    0
  ),
  drone(
    "AR-008",
    "in-flight",
    "vanadzor",
    "dilijan",
    0.55,
    72,
    410,
    64,
    [
      { id: "c1", label: "UN3373 Sample Transport Kit", category: "lab-sample", quantity: 4, unit: "kits" },
    ],
    74
  ),
];

export const droneById = (id: string) =>
  initialDrones.find((d) => d.id === id);
