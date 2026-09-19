// Core domain types for MEDAIR ARMENIA

export type DroneStatus =
  | "idle"
  | "in-flight"
  | "loading"
  | "returning"
  | "maintenance";

export type EmergencyPriority = "critical" | "high" | "normal";
export type EmergencyStatus =
  | "requested"
  | "drone-assigned"
  | "en-route"
  | "delivered"
  | "cancelled";

export type InventoryStatus = "available" | "limited" | "critical" | "out";

export type LayerKey =
  | "drones"
  | "hospitals"
  | "stations"
  | "routes"
  | "emergencies"
  | "cities"
  | "restricted"
  | "hydrology";

export type QuickFilterKey =
  | "in-flight"
  | "low-battery"
  | "critical-inventory"
  | "within-50km";

export interface City {
  id: string;
  name: string;
  lat: number;
  lng: number;
  population: number;
  province?: string;
}

export interface MedicalItem {
  id: string;
  name: string;
  category: "blood" | "medication" | "anti-poison" | "vaccine" | "lab-sample";
  unit: string; // e.g. "units", "vials", "ampoules", "doses"
  quantity: number;
  status: InventoryStatus;
  /** Reorder threshold used to derive status. */
  threshold?: number;
}

export interface Hospital {
  id: string;
  cityId: string;
  name: string;
  address: string;
  phone: string;
  /** 24/7 vs scheduled. */
  operationalHours: "24/7" | "scheduled";
  /** Mock live counts. */
  patients: number;
  emergencyRequests: number;
  /** ISO timestamp of last inventory sync. */
  lastInventoryUpdate: string;
  inventory: MedicalItem[];
  fleet: {
    active: number;
    available: number;
    inFlight: number;
    maintenance: number;
  };
  batteries: {
    total: number;
    charged: number;
    charging: number;
    low: number;
  };
}

export interface DroneStation {
  id: string;
  cityId: string;
  name: string;
  lat: number;
  lng: number;
  dronesHome: number;
  batteriesHome: number;
}

export interface CargoItem {
  id: string;
  label: string;
  category: MedicalItem["category"];
  quantity: number;
  unit: string;
}

export interface Drone {
  id: string; // AR-001 etc.
  status: DroneStatus;
  homeStationId: string;
  originCityId: string;
  destinationCityId: string;
  /** 0..1 — fraction of trip completed */
  progress: number;
  /** km/h ground speed */
  speed: number;
  /** m AGL */
  altitude: number;
  /** bearing degrees */
  heading: number;
  /** 0..100 */
  battery: number;
  cargo: CargoItem[];
  /** Estimated minutes to destination. */
  etaMin: number;
  /** km — straight-line distance origin→destination. */
  totalDistanceKm: number;
  /** km — straight-line distance from origin to current position. */
  distanceTraveledKm: number;
  signal: "strong" | "weak" | "lost";
  /** Last update ISO. */
  updatedAt: string;
}

export interface FlightRoute {
  id: string;
  fromCityId: string;
  toCityId: string;
  /** km straight-line */
  distanceKm: number;
  /** typical flight minutes */
  durationMin: number;
}

export interface EmergencyRequest {
  id: string; // ER-2026-...
  hospitalId: string;
  priority: EmergencyPriority;
  requestedAt: string; // ISO
  status: EmergencyStatus;
  droneId?: string;
  items: { item: string; quantity: number; unit: string }[];
  context?: string;
  requestedBy?: string;
}

export interface RestrictedZone {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  reason: string;
}
