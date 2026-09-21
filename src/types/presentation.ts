// Presentation deck model for the MEDAIR presentation workspace.
//
// A deck is a list of slides. Each slide has:
//   - theme: visual variant (cockpit/atlas/briefing) — same palette names
//            as the map presets so the deck feels native to the app.
//   - title + subtitle: big display text.
//   - body: list of bullet lines, each optionally annotated as a KPI/stat.
//   - callout (optional): highlighted quote / KPI strip at the bottom.
//
// The model is intentionally plain JSON so it round-trips through
// localStorage and exports cleanly to PPTX + PDF.

export type SlideTheme = "atlas" | "cockpit" | "briefing";

/** A single bullet on a slide. Either a plain line, or a stat block. */
export type SlideBullet =
  | { kind: "text"; text: string }
  | { kind: "stat"; label: string; value: string; tone?: "primary" | "warn" | "critical" | "ok" | "neutral" }
  | { kind: "divider" };

export interface Slide {
  id: string;
  theme: SlideTheme;
  eyebrow?: string;       // tiny section label above the title (e.g. "01 / Overview")
  title: string;
  subtitle?: string;
  bullets: SlideBullet[];
  callout?: { label: string; value: string; tone?: "primary" | "warn" | "critical" | "ok" | "neutral" };
  notes?: string;         // speaker notes (visible in the editor only)
}

export interface Deck {
  title: string;
  author: string;
  slides: Slide[];
}

/** A starter deck — used the first time someone opens the workspace. */
export const STARTER_DECK: Deck = {
  title: "MEDAIR Armenia — Stakeholder Briefing",
  author: "Operations Team",
  slides: [
    {
      id: "s-cover",
      theme: "cockpit",
      eyebrow: "Cover",
      title: "MEDAIR Armenia",
      subtitle: "A medical drone network for time-critical response across the Republic of Armenia.",
      bullets: [
        { kind: "text", text: "Stakeholder briefing · v0.1" },
        { kind: "text", text: "Prepared by the MEDAIR operations team" },
      ],
      callout: { label: "Network status", value: "08 drones · 14 stations · 02 active dispatches", tone: "primary" },
    },
    {
      id: "s-mission",
      theme: "atlas",
      eyebrow: "01 / Mission",
      title: "Why a medical drone network?",
      subtitle: "Geography and time-to-care define outcomes in low-density regions.",
      bullets: [
        { kind: "text", text: "Roughly one-third of Armenia is mountainous and road-isolated for parts of the year." },
        { kind: "text", text: "Ground transport to remote clinics routinely exceeds 60 minutes; rotor-wing is faster but costly and weather-bound." },
        { kind: "text", text: "Small fixed-wing cargo drones move sub-3 kg medical payloads (blood, antivenom, vaccines, lab samples) point-to-point at ~120 km/h." },
      ],
      callout: { label: "Target reduction in delivery time", value: "−62 % vs ground", tone: "ok" },
    },
    {
      id: "s-network",
      theme: "briefing",
      eyebrow: "02 / Network",
      title: "The network at a glance",
      bullets: [
        { kind: "stat", label: "Active drones", value: "08", tone: "primary" },
        { kind: "stat", label: "Medical stations", value: "14", tone: "primary" },
        { kind: "stat", label: "Hospitals", value: "11", tone: "neutral" },
        { kind: "stat", label: "Cities served", value: "23", tone: "neutral" },
        { kind: "divider" },
        { kind: "stat", label: "Critical dispatches today", value: "02", tone: "critical" },
        { kind: "stat", label: "On-time rate (rolling 30d)", value: "96.4 %", tone: "ok" },
      ],
      callout: { label: "Coverage", value: "Yerevan + 6 marzer · 38 700 km²", tone: "primary" },
    },
    {
      id: "s-use-cases",
      theme: "atlas",
      eyebrow: "03 / Use cases",
      title: "What we carry, and why it matters",
      bullets: [
        { kind: "text", text: "Blood products (whole blood, O−, O+, A+) — postpartum haemorrhage and trauma." },
        { kind: "text", text: "Antivenom — viper bites are endemic in Lori, Tavush, Syunik." },
        { kind: "text", text: "Vaccines (MMR, seasonal) and oxytocin — last-mile rural primary care." },
        { kind: "text", text: "Lab samples (UN3373) — fast turnaround for rural clinics without on-site labs." },
        { kind: "text", text: "Insulin, epinephrine, IV fluids — chronic-disease continuity." },
      ],
      callout: { label: "Time-critical items", value: "Antivenom, blood, oxytocin", tone: "critical" },
    },
    {
      id: "s-how",
      theme: "cockpit",
      eyebrow: "04 / How it works",
      title: "From request to drop in under 30 minutes",
      bullets: [
        { kind: "text", text: "1. A clinician files an emergency dispatch (web, radio, phone)." },
        { kind: "text", text: "2. The system scores every drone on range, battery, payload, and proximity — picks the optimal unit." },
        { kind: "text", text: "3. The drone launches, flies a published corridor, and dispatches its payload above the destination." },
        { kind: "text", text: "4. The hospital is notified, inventory is decremented, the case is closed with a full audit trail." },
      ],
      callout: { label: "Median request → drop", value: "26 min", tone: "ok" },
    },
    {
      id: "s-safety",
      theme: "briefing",
      eyebrow: "05 / Safety & regulation",
      title: "Built for CAC/EASA Class G airspace",
      bullets: [
        { kind: "text", text: "All routes are pre-filed and gated by a published corridor network." },
        { kind: "text", text: "Restricted zones (military, government, dense urban) are honoured and visible to operators." },
        { kind: "text", text: "Every flight emits telemetry: position, battery, heading, signal — and is logged for 7 years." },
        { kind: "text", text: "Manual recall is always available; the system itself can re-route or hold a drone autonomously." },
      ],
      callout: { label: "Failure rate", value: "0.3 % over the last 12 months", tone: "ok" },
    },
    {
      id: "s-next",
      theme: "cockpit",
      eyebrow: "06 / Next steps",
      title: "Roadmap",
      bullets: [
        { kind: "text", text: "Phase 1 — Yerevan + 3 marzer (complete)." },
        { kind: "text", text: "Phase 2 — Full national coverage by Q4." },
        { kind: "text", text: "Phase 3 — Night operations and beyond-visual-line-of-sight corridors." },
        { kind: "text", text: "Phase 4 — Cross-border medical reciprocity with Georgia." },
      ],
      callout: { label: "Ask", value: "Sign-off on corridor expansion to Lori & Syunik", tone: "primary" },
    },
  ],
};
