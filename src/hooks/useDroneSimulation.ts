import { useEffect, useRef, useState } from "react";
import type { Drone } from "../types";
import { advanceDrone, jitterKpi } from "../lib/simulation";

/**
 * Drives the live simulation: every TICK_MS, advance every in-flight drone
 * and jitter the network KPI counters. Returns the live drone array and
 * the live KPI snapshot.
 */
export interface LiveKpis {
  active: number;
  inFlight: number;
  stations: number;
  deliveriesToday: number;
}

const TICK_MS = 1500;

export function useDroneSimulation(initial: Drone[]) {
  const [drones, setDrones] = useState<Drone[]>(initial);
  // Bounds for the `active` jitter are derived from the actual fleet size —
  // a hardcoded floor of 5 was a lie for fleets smaller than 5.
  const activeMin = 0;
  const activeMax = initial.length;
  const [kpis, setKpis] = useState<LiveKpis>(() => ({
    active: initial.filter((d) => d.status !== "maintenance").length,
    inFlight: initial.filter((d) => d.status === "in-flight").length,
    stations: 7,
    deliveriesToday: 37,
  }));
  const lastTs = useRef(performance.now());

  useEffect(() => {
    let raf: number | null = null;
    let cancelled = false;

    const step = () => {
      if (cancelled) return;
      const now = performance.now();
      const dt = now - lastTs.current;
      // Skip pathological jumps (tab focus etc.) to keep state stable.
      if (dt >= TICK_MS) {
        lastTs.current = now;
        const ctx = { dtMs: Math.min(dt, TICK_MS * 3), now: Date.now() };
        setDrones((prev) => prev.map((d) => advanceDrone(d, ctx)));
        setKpis((prev) => ({
          active: Math.max(
            activeMin,
            Math.min(
              activeMax,
              prev.active + (Math.random() > 0.92 ? (Math.random() > 0.5 ? 1 : -1) : 0)
            )
          ),
          inFlight: prev.inFlight,
          stations: prev.stations,
          deliveriesToday: jitterKpi(prev.deliveriesToday, 0),
        }));
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
    };
    // initial is read-only snapshot at mount; fine to depend once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { drones, kpis };
}
