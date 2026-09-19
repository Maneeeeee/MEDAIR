import type { DroneStation } from "../types";

// Drone launch / recharge stations. Major hubs plus key rural-corridor
// launch points from the dossier §3.5 (Yerevan↔Jermuk, Yerevan↔Sisian,
// Yerevan↔Vardenis, regional hops).
export const droneStations: DroneStation[] = [
  {
    id: "st-yerevan-hub",
    cityId: "yerevan",
    name: "Yerevan Central Hub",
    lat: 40.1789,
    lng: 44.4902,
    dronesHome: 4,
    batteriesHome: 12,
  },
  {
    id: "st-gyumri",
    cityId: "gyumri",
    name: "Gyumri Launch Site",
    lat: 40.7961,
    lng: 43.8417,
    dronesHome: 2,
    batteriesHome: 4,
  },
  {
    id: "st-jermuk",
    cityId: "jermuk",
    name: "Jermuk Launch Site",
    lat: 39.8475,
    lng: 45.6736,
    dronesHome: 1,
    batteriesHome: 2,
  },
  {
    id: "st-sisian",
    cityId: "sisian",
    name: "Sisian Launch Site",
    lat: 39.5245,
    lng: 46.0389,
    dronesHome: 1,
    batteriesHome: 2,
  },
  {
    id: "st-vardenis",
    cityId: "vardenis",
    name: "Vardenis Launch Site",
    lat: 40.1856,
    lng: 45.7339,
    dronesHome: 1,
    batteriesHome: 2,
  },
  {
    id: "st-kapan",
    cityId: "kapan",
    name: "Kapan Launch Site",
    lat: 39.2106,
    lng: 46.4106,
    dronesHome: 1,
    batteriesHome: 3,
  },
  {
    id: "st-vanadzor",
    cityId: "vanadzor",
    name: "Vanadzor Launch Site",
    lat: 40.8158,
    lng: 44.4936,
    dronesHome: 1,
    batteriesHome: 2,
  },
];

export const stationById = (id: string) =>
  droneStations.find((s) => s.id === id) ?? droneStations[0];
