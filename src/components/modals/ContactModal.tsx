import { Phone, Mail, MapPin, X, Shield, Clock, CalendarCheck2 } from "lucide-react";
import { Button } from "../ui/Button";
import { LogoMark } from "../ui/Icons";
import { useToast } from "../ui/Toast";

const PRIMARY_DISPATCH = "+374 11 51-28-00";
const MEDICAL_COORD = "+374 41 12-34-56";
const ENGINEERING_ONCALL = "+374 91 99-00-77";
const UNIVERSAL_EMERGENCY = "112";

const CONTACTS = [
  {
    label: "Operations Dispatch",
    phone: PRIMARY_DISPATCH,
    tel: PRIMARY_DISPATCH.replace(/\s|-/g, ""),
    hint: "24/7 · primary line",
  },
  {
    label: "Medical Coordinator",
    phone: MEDICAL_COORD,
    tel: MEDICAL_COORD.replace(/\s|-/g, ""),
    hint: "06:00–24:00",
  },
  {
    label: "Engineering On-Call",
    phone: ENGINEERING_ONCALL,
    tel: ENGINEERING_ONCALL.replace(/\s|-/g, ""),
    hint: "24/7 · fleet health",
  },
  {
    label: "Universal Emergency",
    phone: UNIVERSAL_EMERGENCY,
    tel: UNIVERSAL_EMERGENCY,
    hint: "Ambulance / fire",
  },
];

export function ContactModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-ink-900/40 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
        className="panel-strong relative w-full max-w-[520px] overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-critical-500 via-warn-500 to-primary-500" />

        <div className="flex items-start justify-between gap-3 border-b border-paper-300 p-5">
          <div className="flex items-start gap-3.5">
            <LogoMark size={36} />
            <div>
              <h2
                id="contact-modal-title"
                className="text-[15px] font-semibold leading-tight text-ink-900"
              >
                Emergency Operations Center
              </h2>
              <div className="mt-1 text-[12px] text-ink-600">
                Medical Drone Network — Armenia
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-critical-500 animate-breathe" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-critical-600">
                  24/7 Active
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-ink-600 outline-none transition-colors hover:bg-paper-150 hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-primary-500/40"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <div>
            <h3 className="label-eyebrow mb-2.5 flex items-center gap-2">
              <Phone size={11} /> Primary contacts
            </h3>
            <div className="space-y-1.5">
              {CONTACTS.map((c) => (
                <a
                  key={c.label}
                  href={`tel:${c.tel}`}
                  className="flex items-center justify-between rounded-lg border border-paper-300 bg-paper-50 px-3.5 py-2.5 outline-none transition-colors hover:border-primary-400 hover:bg-paper-100 focus-visible:ring-2 focus-visible:ring-primary-500/40"
                >
                  <div className="flex flex-col">
                    <span className="text-[13px] text-ink-900">{c.label}</span>
                    <span className="text-[11px] text-ink-600">{c.hint}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="mono text-[13px] text-primary-700">{c.phone}</span>
                    <Phone size={12} className="text-primary-600" />
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="label-eyebrow mb-2.5 flex items-center gap-2">
              <Mail size={11} /> Email
            </h3>
            <div className="space-y-1.5">
              {[
                { addr: "operations@droneaid.am", subject: "Operations request" },
                { addr: "medical@droneaid.am", subject: "Medical coordination" },
                { addr: "engineering@droneaid.am", subject: "Engineering escalation" },
              ].map((e) => (
                <a
                  key={e.addr}
                  href={`mailto:${e.addr}?subject=${encodeURIComponent(e.subject)}`}
                  className="flex items-center justify-between rounded-lg border border-paper-300 bg-paper-50 px-3.5 py-2.5 outline-none transition-colors hover:border-primary-400 hover:bg-paper-100 focus-visible:ring-2 focus-visible:ring-primary-500/40"
                >
                  <span className="mono text-[13px] text-ink-900">{e.addr}</span>
                  <Mail size={12} className="text-primary-600" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="label-eyebrow mb-2.5 flex items-center gap-2">
              <MapPin size={11} /> Address
            </h3>
            <a
              href="https://maps.google.com/?q=Halabyan+22+Yerevan+Armenia"
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg border border-paper-300 bg-paper-50 px-3.5 py-3 text-[13px] text-ink-900 outline-none transition-colors hover:border-primary-400 hover:bg-paper-100 focus-visible:ring-2 focus-visible:ring-primary-500/40"
            >
              22/3 Halabyan St, Yerevan 0033, Armenia
              <span className="mt-1 block text-[11px] text-primary-600">
                ↗ Open in Maps
              </span>
            </a>
          </div>

          <div>
            <h3 className="label-eyebrow mb-2.5 flex items-center gap-2">
              <Shield size={11} /> Response metrics
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-paper-300 bg-paper-50 p-2.5">
                <div className="label-eyebrow">Avg dispatch</div>
                <div className="mono mt-1 text-sm font-semibold text-primary-700">90 sec</div>
              </div>
              <div className="rounded-lg border border-paper-300 bg-paper-50 p-2.5">
                <div className="label-eyebrow">Median delivery</div>
                <div className="mono mt-1 text-sm font-semibold text-primary-700">22 min</div>
              </div>
              <div className="rounded-lg border border-paper-300 bg-paper-50 p-2.5">
                <div className="label-eyebrow">Network uptime</div>
                <div className="mono mt-1 text-sm font-semibold text-ok-600">99.7%</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-paper-300 p-4">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <a
            href={`tel:${PRIMARY_DISPATCH.replace(/\s|-/g, "")}`}
            className="ml-auto inline-flex items-center justify-center gap-1.5 rounded-md bg-primary-500 px-3.5 py-2 text-[12px] font-medium text-white outline-none transition-colors hover:bg-primary-600 focus-visible:ring-2 focus-visible:ring-primary-500/40"
          >
            <Phone size={13} /> Call Dispatch
          </a>
          <Button
            variant="secondary"
            onClick={() => {
              toast.show("Operations centre: scheduling form sent to operations@droneaid.am.", {
                variant: "info",
              });
            }}
          >
            <CalendarCheck2 size={12} /> Schedule visit
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              toast.show("Emergency 112 line acknowledged. Standby for redirect.", {
                variant: "warning",
              });
            }}
          >
            <Clock size={12} /> Escalate 112
          </Button>
        </div>
      </div>
    </div>
  );
}
