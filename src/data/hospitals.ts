import type { Hospital, MedicalItem, InventoryStatus } from "../types";

const threshold = (
  q: number,
  limits: { ok: number; limited: number; critical: number }
): InventoryStatus => {
  if (q <= 0) return "out";
  if (q <= limits.critical) return "critical";
  if (q <= limits.limited) return "limited";
  return "available";
};

// Standard inventory template. Each hospital mutates quantities a bit so the
// dashboard shows realistic variance.
const buildInventory = (seed: number): MedicalItem[] => {
  const m = (n: number, min: number, max: number) =>
    Math.max(min, Math.floor(((seed * (n + 1)) % 1000) / (1000 / (max - min))) +
      min);
  return [
    {
      id: "blood-op",
      name: "Blood Type O+",
      category: "blood",
      unit: "units",
      quantity: m(1, 8, 16),
      threshold: 5,
      get status() {
        return threshold(this.quantity, { ok: 100, limited: 10, critical: 6 });
      },
    },
    {
      id: "blood-on",
      name: "Blood Type O-",
      category: "blood",
      unit: "units",
      quantity: m(2, 3, 10),
      threshold: 4,
      get status() {
        return threshold(this.quantity, { ok: 100, limited: 7, critical: 4 });
      },
    },
    {
      id: "blood-ap",
      name: "Blood Type A+",
      category: "blood",
      unit: "units",
      quantity: m(3, 4, 12),
      threshold: 5,
      get status() {
        return threshold(this.quantity, { ok: 100, limited: 8, critical: 5 });
      },
    },
    {
      id: "epinephrine",
      name: "Epinephrine",
      category: "medication",
      unit: "ampoules",
      quantity: m(4, 12, 40),
      threshold: 12,
      get status() {
        return threshold(this.quantity, { ok: 100, limited: 20, critical: 8 });
      },
    },
    {
      id: "insulin",
      name: "Insulin",
      category: "medication",
      unit: "vials",
      quantity: m(5, 10, 32),
      threshold: 10,
      get status() {
        return threshold(this.quantity, { ok: 100, limited: 18, critical: 6 });
      },
    },
    {
      id: "antibiotics",
      name: "Broad-spectrum Antibiotics",
      category: "medication",
      unit: "doses",
      quantity: m(6, 22, 60),
      threshold: 20,
      get status() {
        return threshold(this.quantity, { ok: 100, limited: 30, critical: 12 });
      },
    },
    {
      id: "antivenom-euro",
      name: "Viper Antivenom (V. berus)",
      category: "anti-poison",
      unit: "vials",
      quantity: m(7, 2, 12),
      threshold: 4,
      get status() {
        return threshold(this.quantity, { ok: 100, limited: 6, critical: 3 });
      },
    },
    {
      id: "antivenom-lyo",
      name: "Lyophilised Polyvalent Antivenom",
      category: "anti-poison",
      unit: "vials",
      quantity: m(8, 1, 8),
      threshold: 3,
      get status() {
        return threshold(this.quantity, { ok: 100, limited: 5, critical: 2 });
      },
    },
    {
      id: "iv-fluids",
      name: "IV Crystalloids (0.9% NaCl)",
      category: "medication",
      unit: "litres",
      quantity: m(9, 6, 24),
      threshold: 8,
      get status() {
        return threshold(this.quantity, { ok: 100, limited: 12, critical: 4 });
      },
    },
    {
      id: "vaccine-mmr",
      name: "MMR Vaccine",
      category: "vaccine",
      unit: "doses",
      quantity: m(10, 18, 80),
      threshold: 20,
      get status() {
        return threshold(this.quantity, { ok: 100, limited: 40, critical: 15 });
      },
    },
    {
      id: "oxytocin",
      name: "Oxytocin (PPH)",
      category: "medication",
      unit: "ampoules",
      quantity: m(11, 4, 18),
      threshold: 6,
      get status() {
        return threshold(this.quantity, { ok: 100, limited: 10, critical: 4 });
      },
    },
    {
      id: "lab-un3373",
      name: "UN3373 Sample Transport Kit",
      category: "lab-sample",
      unit: "kits",
      quantity: m(12, 2, 10),
      threshold: 3,
      get status() {
        return threshold(this.quantity, { ok: 100, limited: 5, critical: 2 });
      },
    },
  ];
};

// Helper to keep the data layer readable. Spread into plain objects so the
// computed `status` getters fire once. We keep the `id` so the inventory
// rows can be stably keyed in tables.
const inv = (seed: number) =>
  buildInventory(seed).map((item) => ({ ...item }));

export const hospitals: Hospital[] = [
  {
    id: "h-yerevan-mc",
    cityId: "yerevan",
    name: "Yerevan Medical Center",
    address: "22 Abovyan St, Yerevan 0001",
    phone: "+374 11 50-12-34",
    operationalHours: "24/7",
    patients: 142,
    emergencyRequests: 3,
    lastInventoryUpdate: "2026-09-16T14:32:00Z",
    inventory: inv(11),
    fleet: { active: 3, available: 1, inFlight: 2, maintenance: 0 },
    batteries: { total: 4, charged: 2, charging: 1, low: 1 },
  },
  {
    id: "h-gyumri-reg",
    cityId: "gyumri",
    name: "Gyumri Regional Hospital",
    address: "31 Shahumyan St, Gyumri",
    phone: "+374 41 21-43-87",
    operationalHours: "24/7",
    patients: 67,
    emergencyRequests: 2,
    lastInventoryUpdate: "2026-09-16T14:18:00Z",
    inventory: inv(7),
    fleet: { active: 2, available: 1, inFlight: 1, maintenance: 0 },
    batteries: { total: 3, charged: 2, charging: 1, low: 0 },
  },
  {
    id: "h-vanadzor",
    cityId: "vanadzor",
    name: "Vanadzor MC",
    address: "8 Tumanian St, Vanadzor",
    phone: "+374 32 22-19-04",
    operationalHours: "24/7",
    patients: 48,
    emergencyRequests: 1,
    lastInventoryUpdate: "2026-09-16T14:25:00Z",
    inventory: inv(3),
    fleet: { active: 2, available: 1, inFlight: 1, maintenance: 0 },
    batteries: { total: 2, charged: 1, charging: 1, low: 0 },
  },
  {
    id: "h-jermuk",
    cityId: "jermuk",
    name: "Jermuk Health Centre",
    address: "5 Shahumyan St, Jermuk",
    phone: "+374 49 41-22-09",
    operationalHours: "scheduled",
    patients: 9,
    emergencyRequests: 1,
    lastInventoryUpdate: "2026-09-16T14:30:00Z",
    inventory: inv(5),
    fleet: { active: 1, available: 1, inFlight: 0, maintenance: 0 },
    batteries: { total: 2, charged: 1, charging: 0, low: 1 },
  },
  {
    id: "h-sisian",
    cityId: "sisian",
    name: "Sisian Medical Centre",
    address: "12 Bakunci St, Sisian",
    phone: "+374 83 25-44-71",
    operationalHours: "24/7",
    patients: 24,
    emergencyRequests: 0,
    lastInventoryUpdate: "2026-09-16T14:11:00Z",
    inventory: inv(9),
    fleet: { active: 1, available: 1, inFlight: 0, maintenance: 0 },
    batteries: { total: 2, charged: 2, charging: 0, low: 0 },
  },
  {
    id: "h-vardenis",
    cityId: "vardenis",
    name: "Vardenis MC",
    address: "3 Charents St, Vardenis",
    phone: "+374 73 23-08-50",
    operationalHours: "24/7",
    patients: 18,
    emergencyRequests: 0,
    lastInventoryUpdate: "2026-09-16T14:09:00Z",
    inventory: inv(13),
    fleet: { active: 1, available: 1, inFlight: 0, maintenance: 0 },
    batteries: { total: 2, charged: 1, charging: 1, low: 0 },
  },
  {
    id: "h-kapan",
    cityId: "kapan",
    name: "Kapan Regional Hospital",
    address: "18 Shahumyan St, Kapan",
    phone: "+374 85 23-65-21",
    operationalHours: "24/7",
    patients: 38,
    emergencyRequests: 1,
    lastInventoryUpdate: "2026-09-16T14:14:00Z",
    inventory: inv(2),
    fleet: { active: 2, available: 1, inFlight: 1, maintenance: 0 },
    batteries: { total: 3, charged: 2, charging: 0, low: 1 },
  },
  {
    id: "h-goris",
    cityId: "goris",
    name: "Goris MC",
    address: "4 Mashtots St, Goris",
    phone: "+374 84 24-58-12",
    operationalHours: "24/7",
    patients: 21,
    emergencyRequests: 0,
    lastInventoryUpdate: "2026-09-16T14:17:00Z",
    inventory: inv(8),
    fleet: { active: 1, available: 1, inFlight: 0, maintenance: 0 },
    batteries: { total: 2, charged: 1, charging: 1, low: 0 },
  },
  {
    id: "h-dilijan",
    cityId: "dilijan",
    name: "Dilijan Health Centre",
    address: "10 Myasnikyan St, Dilijan",
    phone: "+374 68 22-76-93",
    operationalHours: "scheduled",
    patients: 12,
    emergencyRequests: 0,
    lastInventoryUpdate: "2026-09-16T14:21:00Z",
    inventory: inv(6),
    fleet: { active: 1, available: 1, inFlight: 0, maintenance: 0 },
    batteries: { total: 2, charged: 2, charging: 0, low: 0 },
  },
  {
    id: "h-hrazdan",
    cityId: "hrazdan",
    name: "Hrazdan MC",
    address: "21 Mashtots St, Hrazdan",
    phone: "+374 69 23-04-15",
    operationalHours: "24/7",
    patients: 27,
    emergencyRequests: 1,
    lastInventoryUpdate: "2026-09-16T14:19:00Z",
    inventory: inv(15),
    fleet: { active: 1, available: 0, inFlight: 1, maintenance: 0 },
    batteries: { total: 2, charged: 1, charging: 0, low: 1 },
  },
  {
    id: "h-armavir",
    cityId: "armavir",
    name: "Armavir MC",
    address: "7 Hanrapetutyan St, Armavir",
    phone: "+374 37 23-45-67",
    operationalHours: "24/7",
    patients: 31,
    emergencyRequests: 0,
    lastInventoryUpdate: "2026-09-16T14:16:00Z",
    inventory: inv(4),
    fleet: { active: 1, available: 1, inFlight: 0, maintenance: 0 },
    batteries: { total: 2, charged: 1, charging: 1, low: 0 },
  },
  {
    id: "h-artashat",
    cityId: "artashat",
    name: "Artashat MC",
    address: "2 Abovyan St, Artashat",
    phone: "+374 35 23-18-22",
    operationalHours: "24/7",
    patients: 23,
    emergencyRequests: 0,
    lastInventoryUpdate: "2026-09-16T14:22:00Z",
    inventory: inv(10),
    fleet: { active: 1, available: 1, inFlight: 0, maintenance: 0 },
    batteries: { total: 2, charged: 1, charging: 1, low: 0 },
  },
  {
    id: "h-sevan",
    cityId: "sevan",
    name: "Sevan Health Centre",
    address: "9 Nairi St, Sevan",
    phone: "+374 60 24-01-39",
    operationalHours: "scheduled",
    patients: 14,
    emergencyRequests: 0,
    lastInventoryUpdate: "2026-09-16T14:20:00Z",
    inventory: inv(12),
    fleet: { active: 1, available: 1, inFlight: 0, maintenance: 0 },
    batteries: { total: 2, charged: 2, charging: 0, low: 0 },
  },
  {
    id: "h-charentsavan",
    cityId: "charentsavan",
    name: "Charentsavan Health Centre",
    address: "3 Lenin St, Charentsavan",
    phone: "+374 64 24-90-07",
    operationalHours: "scheduled",
    patients: 8,
    emergencyRequests: 0,
    lastInventoryUpdate: "2026-09-16T14:23:00Z",
    inventory: inv(14),
    fleet: { active: 0, available: 0, inFlight: 0, maintenance: 0 },
    batteries: { total: 2, charged: 1, charging: 1, low: 0 },
  },
];

export const hospitalById = (id: string) =>
  hospitals.find((h) => h.id === id) ?? hospitals[0];
