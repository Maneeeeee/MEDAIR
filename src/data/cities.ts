import type { City } from "../types";

// Real Armenian cities with coordinates, sourced from public gazetteer data.
// Mountain-corridor cities (Jermuk, Sisian, Vardenis) carry elevated
// relevance for medical drone logistics per the dossier §3.
export const cities: City[] = [
  {
    id: "yerevan",
    name: "Yerevan",
    lat: 40.1872,
    lng: 44.4752,
    population: 1091000,
    province: "Yerevan",
  },
  {
    id: "gyumri",
    name: "Gyumri",
    lat: 40.7894,
    lng: 43.8475,
    population: 121000,
    province: "Shirak",
  },
  {
    id: "vanadzor",
    name: "Vanadzor",
    lat: 40.8128,
    lng: 44.4883,
    population: 81000,
    province: "Lori",
  },
  {
    id: "hrazdan",
    name: "Hrazdan",
    lat: 40.5,
    lng: 44.7667,
    population: 53000,
    province: "Kotayk",
  },
  {
    id: "armavir",
    name: "Armavir",
    lat: 40.1544,
    lng: 44.0406,
    population: 38000,
    province: "Armavir",
  },
  {
    id: "artashat",
    name: "Artashat",
    lat: 39.9611,
    lng: 44.5444,
    population: 35000,
    province: "Ararat",
  },
  {
    id: "kapan",
    name: "Kapan",
    lat: 39.2075,
    lng: 46.4058,
    population: 42000,
    province: "Syunik",
  },
  {
    id: "goris",
    name: "Goris",
    lat: 39.5089,
    lng: 46.3417,
    population: 23000,
    province: "Syunik",
  },
  {
    id: "dilijan",
    name: "Dilijan",
    lat: 40.7406,
    lng: 44.8639,
    population: 17000,
    province: "Tavush",
  },
  {
    id: "sevan",
    name: "Sevan",
    lat: 40.5475,
    lng: 44.9531,
    population: 19000,
    province: "Gegharkunik",
  },
  {
    id: "jermuk",
    name: "Jermuk",
    lat: 39.8419,
    lng: 45.6681,
    population: 6500,
    province: "Vayots Dzor",
  },
  {
    id: "sisian",
    name: "Sisian",
    lat: 39.5208,
    lng: 46.0308,
    population: 15000,
    province: "Syunik",
  },
  {
    id: "vardenis",
    name: "Vardenis",
    lat: 40.1803,
    lng: 45.7286,
    population: 12000,
    province: "Gegharkunik",
  },
  {
    id: "charentsavan",
    name: "Charentsavan",
    lat: 40.4097,
    lng: 44.6431,
    population: 21000,
    province: "Kotayk",
  },
];

export const cityById = (id: string) =>
  cities.find((c) => c.id === id) ?? cities[0];
