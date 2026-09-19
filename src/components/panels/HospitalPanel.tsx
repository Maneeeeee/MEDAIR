import type { Hospital, MedicalItem } from "../../types";
import { cityById } from "../../data/cities";
import { StatusPill } from "../ui/StatusPill";
import { StatTile } from "../ui/StatTile";
import { Button } from "../ui/Button";
import { Activity, Clock, Plane, Phone, X } from "lucide-react";
import { HospitalGlyph } from "../ui/Icons";
import { relativeTime } from "../../lib/utils";

const STATUS_STYLES: Record<
  MedicalItem["status"],
  { label: string; variant: "ok" | "warning" | "critical" | "neutral" }
> = {
  available: { label: "Available", variant: "ok" },
  limited: { label: "Limited", variant: "warning" },
  critical: { label: "Critical", variant: "critical" },
  out: { label: "Out", variant: "critical" },
};

export function HospitalPanel({
  hospital,
  onClose,
  filteredMatch,
}: {
  hospital: Hospital;
  onClose: () => void;
  filteredMatch?: boolean;
}) {
  const city = cityById(hospital.cityId);
  const totalFleet =
    hospital.fleet.active +
    hospital.fleet.available +
    hospital.fleet.inFlight +
    hospital.fleet.maintenance;
  const chargedPct = (hospital.batteries.charged / hospital.batteries.total) * 100;
  const chargingPct = (hospital.batteries.charging / hospital.batteries.total) * 100;
  const lowPct = (hospital.batteries.low / hospital.batteries.total) * 100;

  return (
    <div className="panel animate-slideUp flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-paper-300 p-5">
        <div className="flex items-start gap-3.5">
          <div className="rounded-lg bg-primary-50 p-2.5">
            <HospitalGlyph size={22} />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold leading-tight text-ink-900">
              {hospital.name}
            </h2>
            <div className="mt-1 text-[12px] text-ink-600">{city.name}</div>
            <div className="mt-2.5">
              <StatusPill variant="ok">
                Operational · {hospital.operationalHours}
              </StatusPill>
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

      {filteredMatch && (
        <div className="border-b border-primary-200 bg-primary-50 px-5 py-2.5 text-[12px] text-primary-700">
          <span className="mr-1.5 font-semibold">⚡</span>
          Matches the active &quot;Critical inventory&quot; quick filter.
        </div>
      )}

      {/* Quick facts */}
      <div className="grid grid-cols-3 gap-2.5 border-b border-paper-300 p-5">
        <StatTile
          label="Patients"
          value={hospital.patients}
          tone="info"
          icon={<Activity size={12} />}
        />
        <StatTile
          label="Emergencies"
          value={hospital.emergencyRequests}
          tone={hospital.emergencyRequests > 0 ? "warning" : "neutral"}
          icon={<Activity size={12} />}
        />
        <StatTile
          label="Updated"
          value={relativeTime(hospital.lastInventoryUpdate).replace(" ago", "")}
          hint="ago"
          tone="neutral"
          icon={<Clock size={12} />}
        />
      </div>

      <div className="space-y-6 overflow-y-auto p-5">
        {/* Contact */}
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-lg bg-paper-100 px-4 py-3 text-[13px]">
          <span className="label-eyebrow">Address</span>
          <span className="text-right text-ink-800">{hospital.address}</span>
          <span className="label-eyebrow">Emergency</span>
          <span className="mono text-right text-ink-900">{hospital.phone}</span>
        </div>

        {/* Inventory */}
        <div>
          <h3 className="label-eyebrow mb-3 flex items-center justify-between">
            Medical Inventory
            <span className="mono text-ink-600">{hospital.inventory.length}</span>
          </h3>
          <div className="overflow-hidden rounded-lg border border-paper-300 bg-paper-50">
            <table className="w-full text-[12.5px]">
              <thead className="bg-paper-100 text-[10px] uppercase tracking-[0.08em] text-ink-600">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Item</th>
                  <th className="px-3 py-2 text-left font-medium">Cat.</th>
                  <th className="px-3 py-2 text-right font-medium">Qty</th>
                  <th className="px-3 py-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-200">
                {hospital.inventory.map((item) => {
                  const s = STATUS_STYLES[item.status];
                  return (
                    <tr key={item.id} className="hover:bg-paper-100">
                      <td className="px-3 py-2 text-ink-800">{item.name}</td>
                      <td className="px-3 py-2 text-[11px] uppercase tracking-wider text-ink-600">
                        {item.category.replace("-", " ")}
                      </td>
                      <td className="mono px-3 py-2 text-right tabular-nums text-ink-900">
                        {item.quantity}{" "}
                        <span className="text-[10px] text-ink-600">{item.unit}</span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <StatusPill variant={s.variant}>{s.label}</StatusPill>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fleet */}
        <div>
          <h3 className="label-eyebrow mb-3">Drone Fleet</h3>
          <div className="grid grid-cols-4 gap-2.5">
            <StatTile label="Active" value={hospital.fleet.active} tone="warning" icon={<Plane size={12} />} />
            <StatTile label="Avail." value={hospital.fleet.available} tone="info" />
            <StatTile label="In flight" value={hospital.fleet.inFlight} tone="info" />
            <StatTile
              label="Maint."
              value={hospital.fleet.maintenance}
              tone={hospital.fleet.maintenance > 0 ? "critical" : "neutral"}
            />
          </div>
          <div className="mt-2 text-right text-[11px] text-ink-600">
            Total · {totalFleet}
          </div>
        </div>

        {/* Batteries */}
        <div>
          <h3 className="label-eyebrow mb-3">Batteries</h3>
          <div className="overflow-hidden rounded-lg border border-paper-300 bg-paper-50">
            <div className="flex h-2 w-full">
              <div className="bg-ok-500" style={{ width: `${chargedPct}%` }} />
              <div className="bg-warn-500" style={{ width: `${chargingPct}%` }} />
              <div className="bg-critical-500" style={{ width: `${lowPct}%` }} />
            </div>
            <div className="grid grid-cols-4 gap-2 px-3 py-2.5 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="text-ink-600">Total</span>
                <span className="mono text-ink-900">{hospital.batteries.total}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-ok-500" />
                <span className="text-ink-600">Charged</span>
                <span className="mono text-ink-900">{hospital.batteries.charged}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-warn-500" />
                <span className="text-ink-600">Charging</span>
                <span className="mono text-ink-900">{hospital.batteries.charging}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-critical-500" />
                <span className="text-ink-600">Low</span>
                <span className="mono text-ink-900">{hospital.batteries.low}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-2 border-t border-paper-300 p-4">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary" className="flex-1">
          <Phone size={13} /> Request delivery
        </Button>
      </div>
    </div>
  );
}
