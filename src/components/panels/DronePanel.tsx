import type { Drone } from "../../types";
import { cityById } from "../../data/cities";
import { StatusPill } from "../ui/StatusPill";
import { StatTile } from "../ui/StatTile";
import { Button } from "../ui/Button";
import { DroneGlyph } from "../ui/Icons";
import {
  Battery,
  Gauge,
  Compass,
  ArrowDownToLine,
  X,
  PlaneTakeoff,
  Signal,
} from "lucide-react";
import { formatEta, formatKm } from "../../lib/utils";

const STATUS_LABEL: Record<
  Drone["status"],
  { label: string; variant: "ok" | "warning" | "info" | "neutral" | "critical" }
> = {
  "in-flight": { label: "In Flight", variant: "warning" },
  returning: { label: "Returning", variant: "info" },
  loading: { label: "Loading", variant: "info" },
  idle: { label: "Idle", variant: "ok" },
  maintenance: { label: "Maintenance", variant: "critical" },
};

const batteryColor = (pct: number) =>
  pct > 50 ? "bg-ok-500" : pct > 25 ? "bg-warn-500" : "bg-critical-500";

export function DronePanel({
  drone,
  onClose,
  onRecall,
}: {
  drone: Drone;
  onClose: () => void;
  onRecall: (id: string) => void;
}) {
  const origin = cityById(drone.originCityId);
  const destination = cityById(drone.destinationCityId);
  const status = STATUS_LABEL[drone.status];
  const remainingKm = Math.max(0, drone.totalDistanceKm - drone.distanceTraveledKm);
  const progressPct = Math.round(drone.progress * 100);
  const isOnRoute = drone.status === "in-flight" || drone.status === "returning";

  return (
    <div className="panel animate-slideUp flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-paper-300 p-5">
        <div className="flex items-start gap-3.5">
          <div className="rounded-lg bg-warn-50 p-2.5 text-warn-600">
            <DroneGlyph size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="mono text-[15px] font-semibold tracking-tight text-ink-900">
                {drone.id}
              </h2>
              <StatusPill variant={status.variant}>{status.label}</StatusPill>
            </div>
            <div className="mt-1 text-[12px] text-ink-600">
              Updated {new Date(drone.updatedAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-ink-600 hover:bg-paper-150 hover:text-ink-900"
          aria-label="Close panel"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-6 overflow-y-auto p-5">
        {/* Flight progress */}
        <div>
          <h3 className="label-eyebrow mb-3">Flight</h3>
          <div className="rounded-lg bg-paper-100 p-4">
            <div className="flex items-center justify-between text-[12.5px]">
              <div className="flex flex-col">
                <span className="label-eyebrow">Origin</span>
                <span className="mt-1 font-medium text-ink-900">{origin.name}</span>
              </div>
              <div className="flex flex-1 flex-col items-center px-3">
                <div className="relative h-1.5 w-full rounded-full bg-paper-300">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-warn-500 transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                  <div
                    className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-warn-500 bg-paper-50 shadow-soft"
                    style={{ left: `${progressPct}%` }}
                  />
                </div>
                <div className="mono mt-2 text-[10.5px] text-ink-600">
                  {drone.distanceTraveledKm} / {formatKm(drone.totalDistanceKm)} ·{" "}
                  {progressPct}%
                </div>
              </div>
              <div className="flex flex-col text-right">
                <span className="label-eyebrow">Destination</span>
                <span className="mt-1 font-medium text-ink-900">{destination.name}</span>
              </div>
            </div>
            {isOnRoute && (
              <div className="mt-3 flex items-center justify-between border-t border-paper-200 pt-3 text-[12px]">
                <span className="text-ink-600">Remaining</span>
                <span className="mono text-ink-900">
                  {formatKm(remainingKm)} · ETA {formatEta(drone.etaMin)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Telemetry */}
        <div>
          <h3 className="label-eyebrow mb-3">Telemetry</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <StatTile
              label="Speed"
              value={drone.speed}
              hint="km/h"
              tone="warning"
              icon={<Gauge size={12} />}
            />
            <StatTile
              label="Altitude"
              value={drone.altitude}
              hint="m AGL"
              tone="info"
            />
            <StatTile
              label="Direction"
              value={`${drone.heading}°`}
              tone="neutral"
              icon={<Compass size={12} />}
            />
            <StatTile
              label="Battery"
              value={`${Math.round(drone.battery)}%`}
              tone={
                drone.battery > 50 ? "ok" : drone.battery > 25 ? "warning" : "critical"
              }
              icon={<Battery size={12} />}
            />
            <StatTile
              label="Distance"
              value={formatKm(drone.distanceTraveledKm)}
              hint="flown"
              tone="info"
            />
            <StatTile
              label="ETA"
              value={formatEta(drone.etaMin)}
              tone="info"
              icon={<ArrowDownToLine size={12} />}
            />
          </div>

          {/* Battery bar */}
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-300">
              <div
                className={`h-full transition-all ${batteryColor(drone.battery)}`}
                style={{ width: `${drone.battery}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-ink-600">
              <span className="flex items-center gap-1.5">
                <Signal size={10} />
                Signal <span className="mono text-ink-800">{drone.signal}</span>
              </span>
              <span>Home: {drone.homeStationId.replace("st-", "").toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Cargo */}
        <div>
          <h3 className="label-eyebrow mb-3">
            Cargo <span className="mono text-ink-600">({drone.cargo.length})</span>
          </h3>
          {drone.cargo.length === 0 ? (
            <div className="rounded-lg border border-dashed border-paper-300 p-4 text-center text-[12px] text-ink-600">
              No cargo manifest
            </div>
          ) : (
            <div className="space-y-2">
              {drone.cargo.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg bg-paper-100 px-3.5 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-500" />
                    <span className="text-[13px] text-ink-800">{c.label}</span>
                  </div>
                  <span className="mono text-[13px] text-primary-600">
                    {c.quantity} {c.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-paper-300 p-4">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        {drone.status === "in-flight" && (
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => onRecall(drone.id)}
          >
            <PlaneTakeoff size={13} /> Recall drone
          </Button>
        )}
      </div>
    </div>
  );
}
