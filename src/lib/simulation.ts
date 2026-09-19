import type { Drone } from "../types";

export interface TickContext {
  /** ms elapsed since last tick */
  dtMs: number;
  /** sim seconds elapsed since epoch */
  now: number;
}

// Battery drain per minute, by status. Tuned for visually readable motion.
const batteryDrainPctPerMin = (status: Drone["status"]) => {
  switch (status) {
    case "in-flight":
      return 0.18;
    case "returning":
      return 0.22;
    case "loading":
      return 0.05;
    default:
      return 0.02;
  }
};

const speedCruiseKph = 110;
const totalDistanceOfTrip = (drone: Drone) => drone.totalDistanceKm;

/**
 * Advance a drone's flight progress by the real-time delta.
 * - in-flight: progress grows at cruise speed; battery drains
 * - returning: progress shrinks toward 0
 * - loading / idle: small battery drift, no progress change
 * - when reaching destination, status flips to "returning" so the drone
 *   visibly heads home — exactly what a live tracker would do.
 */
export const advanceDrone = (drone: Drone, ctx: TickContext): Drone => {
  const dtMin = ctx.dtMs / 1000 / 60;
  const drain = batteryDrainPctPerMin(drone.status) * dtMin;
  const newBattery = Math.max(2, drone.battery - drain);

  if (drone.status === "in-flight") {
    const total = totalDistanceOfTrip(drone);
    const distancePerMin = speedCruiseKph / 60; // km per minute
    const dProgress = (distancePerMin * dtMin) / Math.max(0.1, total);
    const progress = Math.min(1, drone.progress + dProgress);
    const etaMin = Math.max(
      0,
      Math.round(((1 - progress) * total * 60) / speedCruiseKph)
    );
    return {
      ...drone,
      progress,
      battery: newBattery,
      etaMin,
      distanceTraveledKm: Math.round(total * progress * 10) / 10,
      speed: drone.speed > 0 ? drone.speed : Math.round(speedCruiseKph),
      altitude: drone.altitude,
      updatedAt: new Date(ctx.now).toISOString(),
      status: progress >= 1 ? "returning" : "in-flight",
    };
  }

  if (drone.status === "returning") {
    // Move progress back toward origin
    const total = totalDistanceOfTrip(drone);
    const distancePerMin = speedCruiseKph / 60;
    const dProgress = (distancePerMin * dtMin) / Math.max(0.1, total);
    const progress = Math.max(0, drone.progress - dProgress);
    if (progress <= 0.001) {
      // Back home → swap to idle, fresh state
      return {
        ...drone,
        progress: 0,
        battery: Math.max(40, newBattery),
        etaMin: 0,
        distanceTraveledKm: 0,
        speed: 0,
        altitude: 0,
        status: "idle",
        updatedAt: new Date(ctx.now).toISOString(),
      };
    }
    return {
      ...drone,
      progress,
      battery: newBattery,
      etaMin: Math.max(0, Math.round((progress * total * 60) / speedCruiseKph)),
      distanceTraveledKm: Math.round(total * progress * 10) / 10,
      speed: Math.round(speedCruiseKph * (0.85 + Math.random() * 0.1)),
      updatedAt: new Date(ctx.now).toISOString(),
    };
  }

  // idle / loading / maintenance
  return {
    ...drone,
    battery: newBattery,
    updatedAt: new Date(ctx.now).toISOString(),
  };
};

/** Simulated jitter for header KPI counters — keeps the dashboard feeling alive. */
export const jitterKpi = (base: number, magnitude = 1) =>
  base + Math.round((Math.random() - 0.5) * 2 * magnitude);
