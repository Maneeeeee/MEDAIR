import type { EmergencyRequest, Hospital, Drone } from "../../types";
import { StatusPill } from "../ui/StatusPill";
import { Button } from "../ui/Button";
import { X, Activity, AlertTriangle, Radio, MapPin } from "lucide-react";
import { cityById } from "../../data/cities";
import { relativeTime } from "../../lib/utils";

const PRIORITY: Record<
  EmergencyRequest["priority"],
  { variant: "critical" | "warning" | "info"; label: string }
> = {
  critical: { variant: "critical", label: "Critical" },
  high: { variant: "warning", label: "High" },
  normal: { variant: "info", label: "Normal" },
};

const STATUS_LABEL: Record<EmergencyRequest["status"], string> = {
  requested: "Requested",
  "drone-assigned": "Drone Assigned",
  "en-route": "En Route",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function EmergencyPanel({
  emergency,
  hospital,
  drone,
  onClose,
}: {
  emergency: EmergencyRequest;
  hospital?: Hospital;
  drone?: Drone;
  onClose: () => void;
}) {
  const priority = PRIORITY[emergency.priority];
  const isCritical = emergency.priority === "critical";
  return (
    <div className="panel animate-slideUp flex h-full flex-col">
      {isCritical && (
        <div className="flex items-center justify-center gap-2 border-b border-critical-500/30 bg-critical-500/[0.08] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-critical-600">
          <AlertTriangle size={14} />
          Critical emergency · Response required
        </div>
      )}

      <div className="flex items-start justify-between gap-3 border-b border-paper-300 p-5">
        <div>
          <div className="label-eyebrow">Emergency request</div>
          <div className="mono mt-1 text-[15px] font-bold text-ink-900">
            {emergency.id}
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-[12px] text-ink-600">
            <Activity size={11} />
            <span>Requested {relativeTime(emergency.requestedAt)}</span>
            <StatusPill variant={priority.variant}>{priority.label}</StatusPill>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-ink-600 outline-none transition-colors hover:bg-paper-150 hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-primary-500/40"
          aria-label="Close panel"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4 overflow-y-auto p-5">
        {hospital && (
          <div className="rounded-lg border border-paper-300 bg-paper-50 p-3.5">
            <div className="label-eyebrow">Requesting facility</div>
            <div className="mt-1.5 text-[14px] font-semibold text-ink-900">
              {hospital.name}
            </div>
            <div className="text-[12px] text-ink-600">
              {cityById(hospital.cityId).name}, {cityById(hospital.cityId).province} marz
            </div>
            <div className="mono mt-1.5 text-[12px] text-primary-700">{hospital.phone}</div>
          </div>
        )}

        <div>
          <h3 className="label-eyebrow mb-2.5">Required items</h3>
          <div className="space-y-1.5">
            {emergency.items.map((it, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-paper-300 bg-paper-50 px-3.5 py-2"
              >
                <span className="text-[13px] text-ink-800">{it.item}</span>
                <span className="mono text-[13px] text-primary-700">
                  {it.quantity} {it.unit}
                </span>
              </div>
            ))}
          </div>
        </div>

        {drone && (
          <div>
            <h3 className="label-eyebrow mb-2.5">Assigned drone</h3>
            <div className="rounded-lg border border-warn-500/35 bg-warn-500/[0.06] p-3.5">
              <div className="flex items-center justify-between">
                <span className="mono text-[14px] font-bold text-warn-700">
                  {drone.id}
                </span>
                <StatusPill variant="warning">{STATUS_LABEL[emergency.status]}</StatusPill>
              </div>
              <div className="mt-2 flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-1.5 text-ink-700">
                  <MapPin size={11} className="text-ink-500" />
                  <span className="uppercase">
                    {cityById(drone.originCityId).name}
                  </span>
                </div>
                <Radio size={11} className="text-ink-500" />
                <div className="flex items-center gap-1.5 text-ink-700">
                  <MapPin size={11} className="text-ink-500" />
                  <span className="uppercase">
                    {cityById(drone.destinationCityId).name}
                  </span>
                </div>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-paper-300">
                <div
                  className="h-full rounded-full bg-warn-500"
                  style={{ width: `${Math.round(drone.progress * 100)}%` }}
                />
              </div>
              <div className="mono mt-1.5 flex items-center justify-between text-[11px] text-ink-600">
                <span>Battery {Math.round(drone.battery)}%</span>
                <span>ETA {drone.etaMin} min</span>
              </div>
            </div>
          </div>
        )}

        {emergency.context && (
          <div className="rounded-lg border border-paper-300 bg-paper-50 p-3.5 text-[13px] text-ink-800">
            <div className="label-eyebrow mb-1.5">Context</div>
            {emergency.context}
          </div>
        )}

        {emergency.requestedBy && (
          <div className="text-[12px] text-ink-600">
            Requested by{" "}
            <span className="font-medium text-ink-800">{emergency.requestedBy}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-paper-300 p-4">
        <Button variant="secondary">Acknowledge</Button>
        <Button variant="secondary">Reassign</Button>
        <Button variant="primary" className="ml-auto">
          View full log
        </Button>
      </div>
    </div>
  );
}
