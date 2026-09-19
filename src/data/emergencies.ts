import type { EmergencyRequest } from "../types";

// Seed emergency requests shown on the dashboard. Three priority bands
// matching the brief: critical / high / normal.
export const initialEmergencies: EmergencyRequest[] = [
  {
    id: "ER-2026-0916-0042",
    hospitalId: "h-jermuk",
    priority: "critical",
    requestedAt: "2026-09-16T14:32:00Z",
    status: "drone-assigned",
    droneId: "AR-001",
    items: [
      { item: "Lyophilised Polyvalent Antivenom", quantity: 6, unit: "vials" },
      { item: "Epinephrine", quantity: 8, unit: "ampoules" },
      { item: "IV Crystalloids (0.9% NaCl)", quantity: 2, unit: "litres" },
    ],
    context: "Patient: male, 34, suspected V. raddei bite, on-site EMS unit.",
    requestedBy: "EMS Unit 109-04 (Jermuk)",
  },
  {
    id: "ER-2026-0916-0041",
    hospitalId: "h-gyumri-reg",
    priority: "critical",
    requestedAt: "2026-09-16T14:18:00Z",
    status: "en-route",
    droneId: "AR-002",
    items: [
      { item: "Blood Type O+", quantity: 4, unit: "units" },
      { item: "Viper Antivenom", quantity: 4, unit: "vials" },
    ],
    context: "PPH protocol activated; estimated 22 min delivery.",
    requestedBy: "Gyumri OB Unit",
  },
  {
    id: "ER-2026-0916-0040",
    hospitalId: "h-vardenis",
    priority: "high",
    requestedAt: "2026-09-16T14:09:00Z",
    status: "en-route",
    droneId: "AR-003",
    items: [
      { item: "Oxytocin (PPH)", quantity: 12, unit: "ampoules" },
      { item: "Blood Type O-", quantity: 2, unit: "units" },
    ],
    context: "Maternal referral; cold-chain required.",
    requestedBy: "Vardenis OB",
  },
  {
    id: "ER-2026-0916-0039",
    hospitalId: "h-sisian",
    priority: "high",
    requestedAt: "2026-09-16T14:11:00Z",
    status: "delivered",
    droneId: "AR-004",
    items: [
      { item: "MMR Vaccine", quantity: 30, unit: "doses" },
      { item: "Broad-spectrum Antibiotics", quantity: 20, unit: "doses" },
    ],
    context: "Routine cold-chain top-up; school immunisation programme.",
    requestedBy: "Sisian PHC",
  },
  {
    id: "ER-2026-0916-0038",
    hospitalId: "h-vanadzor",
    priority: "normal",
    requestedAt: "2026-09-16T14:01:00Z",
    status: "en-route",
    droneId: "AR-008",
    items: [
      { item: "UN3373 Sample Transport Kit", quantity: 4, unit: "kits" },
    ],
    context: "Lab sample return to Yerevan reference lab.",
    requestedBy: "Vanadzor Lab",
  },
];

export const emergencyById = (id: string) =>
  initialEmergencies.find((e) => e.id === id);
