import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  PlaneTakeoff,
  MapPin,
  X,
  Activity,
} from "lucide-react";
import type { City, DroneStation, Hospital } from "../../types";
import { haversineKm } from "../../lib/utils";
import { Button } from "../ui/Button";

export interface DispatchPayload {
  stationId: string;
  stationName: string;
  hospitalId: string;
  destinationName: string;
  urgency: "critical" | "high" | "normal";
  items: { id: string; name: string; quantity: number; unit: string }[];
  distanceKm: number;
  durationMin: number;
  batteryCostPct: number;
  droneId: string;
  etaMin: number;
}

const URGENCY_VARIANT = {
  critical: {
    selected: "border-critical-500/50 bg-critical-500/[0.12] text-critical-600",
    idle: "border-paper-300 bg-paper-50 text-ink-700 hover:border-paper-400",
    label: "Critical",
  },
  high: {
    selected: "border-warn-500/50 bg-warn-500/[0.12] text-warn-600",
    idle: "border-paper-300 bg-paper-50 text-ink-700 hover:border-paper-400",
    label: "High",
  },
  normal: {
    selected: "border-primary-500/50 bg-primary-500/[0.12] text-primary-700",
    idle: "border-paper-300 bg-paper-50 text-ink-700 hover:border-paper-400",
    label: "Normal",
  },
} as const;

const CRITICAL_PRESET = [
  { id: "antivenom-lyo", name: "Lyophilised Polyvalent Antivenom", quantity: 4, unit: "vials" },
  { id: "epinephrine", name: "Epinephrine", quantity: 6, unit: "ampoules" },
  { id: "iv-fluids", name: "IV Crystalloids (0.9% NaCl)", quantity: 2, unit: "litres" },
];

const HIGH_PRESET = [
  { id: "blood-op", name: "Blood Type O+", quantity: 2, unit: "units" },
  { id: "oxytocin", name: "Oxytocin (PPH)", quantity: 6, unit: "ampoules" },
];

const NORMAL_PRESET = [
  { id: "vaccine-mmr", name: "MMR Vaccine", quantity: 10, unit: "doses" },
  { id: "antibiotics", name: "Broad-spectrum Antibiotics", quantity: 10, unit: "doses" },
];

interface DispatchWizardProps {
  stations: DroneStation[];
  hospitals: Hospital[];
  cityById: (id: string) => City;
  onClose: () => void;
  onDispatched: (payload: DispatchPayload) => void;
}

export function DispatchWizard({
  stations,
  hospitals,
  cityById,
  onClose,
  onDispatched,
}: DispatchWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [stationId, setStationId] = useState<string>(stations[0]?.id ?? "");
  const [hospitalId, setHospitalId] = useState<string>(hospitals[0]?.id ?? "");
  const [urgency, setUrgency] = useState<"critical" | "high" | "normal">("critical");
  const [items, setItems] = useState(CRITICAL_PRESET);

  const station = stations.find((s) => s.id === stationId);
  const hospital = hospitals.find((h) => h.id === hospitalId);
  const stationCity = station ? cityById(station.cityId) : undefined;
  const hospitalCity = hospital ? cityById(hospital.cityId) : undefined;

  const distanceKm = useMemo(() => {
    if (!station || !hospital) return 0;
    return Math.round(
      haversineKm(
        { lat: station.lat, lng: station.lng },
        { lat: hospitalCity!.lat, lng: hospitalCity!.lng }
      ) * 10
    ) / 10;
  }, [station, hospital, hospitalCity]);

  const CRUISE_KPH = 95;
  const durationMin = Math.max(8, Math.round((distanceKm / CRUISE_KPH) * 60));
  // Battery cost: ~0.18% per minute in flight, plus 4% reserve buffer
  const batteryCostPct = Math.min(100, Math.round(durationMin * 0.18 + 4));

  const droneId = useMemo(() => {
    const stamp = (Date.now() % 1000).toString().padStart(3, "0");
    return `DR-${stamp}`;
  }, []);

  const presetForUrgency = (u: "critical" | "high" | "normal") => {
    setUrgency(u);
    if (u === "critical") setItems(CRITICAL_PRESET);
    else if (u === "high") setItems(HIGH_PRESET);
    else setItems(NORMAL_PRESET);
  };

  const canAdvance = () => {
    if (step === 1) return !!station;
    if (step === 2) return !!hospital && !!urgency;
    return items.length > 0;
  };

  const handleLaunch = () => {
    if (!station || !hospital) return;
    onDispatched({
      stationId: station.id,
      stationName: station.name,
      hospitalId: hospital.id,
      destinationName: hospital.name,
      urgency,
      items: items.map((it) => ({ ...it })),
      distanceKm,
      durationMin,
      batteryCostPct,
      droneId,
      etaMin: durationMin,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-ink-900/40 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispatch-wizard-title"
        className="panel-strong relative flex max-h-[90vh] w-full max-w-[640px] flex-col overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent — critical red, drone amber, medical teal gradient */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-critical-500 via-warn-500 to-primary-500" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-paper-300 p-5">
          <div className="flex items-start gap-3.5">
            <div className="rounded-lg border border-critical-500/25 bg-critical-500/[0.08] p-2.5">
              <AlertTriangle size={18} className="text-critical-600" />
            </div>
            <div>
              <h2
                id="dispatch-wizard-title"
                className="text-[15px] font-semibold leading-tight text-ink-900"
              >
                New emergency dispatch
              </h2>
              <div className="mt-1 text-[12px] text-ink-600">
                Coordinate a live drone flight to a medical facility.
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-ink-600 outline-none transition-colors hover:bg-paper-150 hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-primary-500/40"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step indicator */}
        <ol className="flex items-center gap-1.5 border-b border-paper-300 bg-paper-100 px-5 py-2.5">
          {[1, 2, 3].map((n) => {
            const active = step === n;
            const done = step > n;
            return (
              <li key={n} className="flex items-center gap-1.5">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold mono ${
                    done
                      ? "bg-ok-500/20 text-ok-600"
                      : active
                      ? "bg-primary-500/15 text-primary-700"
                      : "bg-paper-200 text-ink-600"
                  }`}
                >
                  {done ? <CheckCircle2 size={12} /> : n}
                </span>
                <span
                  className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${
                    active
                      ? "text-ink-900"
                      : done
                      ? "text-ok-600"
                      : "text-ink-600"
                  }`}
                >
                  {n === 1 ? "Origin" : n === 2 ? "Destination" : "Payload"}
                </span>
                {n < 3 && <span className="mx-1 h-px w-6 bg-paper-300" />}
              </li>
            );
          })}
        </ol>

        {/* Step body */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="label-eyebrow mb-2">Step 1 · Select origin base</h3>
                <p className="text-[13px] text-ink-700">
                  Pick a launch station with available drones and charged batteries.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {stations.map((s) => {
                  const c = cityById(s.cityId);
                  const selected = s.id === stationId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setStationId(s.id)}
                      className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
                        selected
                          ? "border-primary-500/50 bg-primary-500/[0.08]"
                          : "border-paper-300 bg-paper-50 hover:border-primary-300 hover:bg-paper-100"
                      }`}
                    >
                      <span className="text-[13px] font-medium text-ink-900">
                        {s.name}
                      </span>
                      <span className="text-[11px] text-ink-600">
                        {c.name}, {c.province} marz
                      </span>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] mono text-warn-700">
                        <PlaneTakeoff size={10} /> {s.dronesHome} drones
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] mono text-ok-600">
                        <Activity size={10} /> {s.batteriesHome} batteries
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="label-eyebrow mb-2">Step 2 · Destination & urgency</h3>
                <p className="text-[13px] text-ink-700">
                  Select the receiving medical facility and dispatch priority.
                </p>
              </div>

              <div>
                <label className="label-eyebrow block">Urgency</label>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {(["critical", "high", "normal"] as const).map((u) => {
                    const v = URGENCY_VARIANT[u];
                    const selected = urgency === u;
                    return (
                      <button
                        key={u}
                        onClick={() => presetForUrgency(u)}
                        className={`rounded-lg border px-3 py-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
                          selected ? v.selected : v.idle
                        }`}
                      >
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="label-eyebrow block">Receiving facility</label>
                <div className="mt-1.5 grid max-h-[280px] grid-cols-1 gap-1.5 overflow-y-auto pr-1">
                  {hospitals.map((h) => {
                    const c = cityById(h.cityId);
                    const selected = h.id === hospitalId;
                    return (
                      <button
                        key={h.id}
                        onClick={() => setHospitalId(h.id)}
                        className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
                          selected
                            ? "border-primary-500/50 bg-primary-500/[0.08]"
                            : "border-paper-300 bg-paper-50 hover:border-primary-300 hover:bg-paper-100"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-[13px] font-medium text-ink-900">
                            {h.name}
                          </span>
                          <span className="text-[11px] text-ink-600">
                            {c.name}, {c.province}
                          </span>
                        </div>
                        <div className="mono text-[11px] text-ink-600">
                          {h.operationalHours}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 3 && station && hospital && (
            <div className="space-y-4">
              <div>
                <h3 className="label-eyebrow mb-2">Step 3 · Payload & launch confirmation</h3>
                <p className="text-[13px] text-ink-700">
                  Confirm the flight envelope, battery cost, and cargo manifest before launch.
                </p>
              </div>

              {/* Flight envelope */}
              <div className="rounded-lg border border-paper-300 bg-paper-50 p-4">
                <div className="flex items-center justify-between text-[13px]">
                  <div className="flex flex-col">
                    <span className="label-eyebrow">Origin</span>
                    <span className="mt-1 font-medium text-ink-900">
                      {stationCity?.name}
                    </span>
                  </div>
                  <MapPin size={14} className="text-primary-600" />
                  <div className="flex flex-col text-right">
                    <span className="label-eyebrow">Destination</span>
                    <span className="mt-1 font-medium text-ink-900">
                      {hospitalCity?.name}
                    </span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-lg border border-paper-300 bg-paper-100 p-2.5">
                    <div className="label-eyebrow">Distance</div>
                    <div className="mono mt-1 text-[14px] font-semibold text-ink-900">
                      {distanceKm} <span className="text-[11px] text-ink-600">km</span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-paper-300 bg-paper-100 p-2.5">
                    <div className="label-eyebrow">Cruise</div>
                    <div className="mono mt-1 text-[14px] font-semibold text-ink-900">
                      {CRUISE_KPH} <span className="text-[11px] text-ink-600">km/h</span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-paper-300 bg-paper-100 p-2.5">
                    <div className="label-eyebrow">ETA</div>
                    <div className="mono mt-1 text-[14px] font-semibold text-primary-700">
                      {durationMin} <span className="text-[11px] text-ink-600">min</span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-paper-300 bg-paper-100 p-2.5">
                    <div className="label-eyebrow">Battery</div>
                    <div className="mono mt-1 text-[14px] font-semibold text-warn-700">
                      {batteryCostPct}<span className="text-[11px] text-ink-600">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cargo manifest */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="label-eyebrow">
                    Cargo manifest · {items.length} item{items.length === 1 ? "" : "s"}
                  </span>
                  <span
                    className={`pill ${
                      URGENCY_VARIANT[urgency].selected
                        .replace("border-", "border-")
                        .replace("bg-", "bg-")
                        .replace("text-", "text-")
                    }`}
                  >
                    {URGENCY_VARIANT[urgency].label}
                  </span>
                </div>
                <div className="mt-2 space-y-1.5">
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-paper-300 bg-paper-50 px-3.5 py-2"
                    >
                      <span className="text-[13px] text-ink-900">{it.name}</span>
                      <span className="mono text-[13px] text-primary-700">
                        {it.quantity} {it.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-warn-500/35 bg-warn-500/[0.08] p-3.5 text-[13px] text-warn-600">
                <div className="label-eyebrow text-warn-700">Assigned drone</div>
                <div className="mono mt-1 text-base font-bold">{droneId}</div>
                <div className="mt-1.5 text-[12px] text-warn-600/85">
                  Will depart from {station.name} with full cargo manifest. Live
                  position will be visible on the map.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-paper-300 p-4">
          <Button
            variant="secondary"
            onClick={() => (step === 1 ? onClose() : setStep((step - 1) as 1 | 2))}
          >
            <ChevronLeft size={12} />
            {step === 1 ? "Cancel" : "Back"}
          </Button>

          <div className="text-[11px] text-ink-600 mono">
            Step {step} of 3
          </div>

          {step < 3 ? (
            <Button
              variant="primary"
              disabled={!canAdvance()}
              onClick={() => setStep((step + 1) as 2 | 3)}
            >
              Next
              <ChevronRight size={12} />
            </Button>
          ) : (
            <Button variant="destructive" onClick={handleLaunch}>
              <PlaneTakeoff size={12} /> Launch dispatch
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
