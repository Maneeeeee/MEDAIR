import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  X,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronFirst,
  ChevronLast,
  FileType,
  Presentation,
  Play,
  Pencil,
  Download,
  Eye,
  Copy,
  LayoutTemplate,
} from "lucide-react";
import { Button } from "../ui/Button";
import type { Deck, Slide, SlideBullet, SlideTheme } from "../../types/presentation";
import { STARTER_DECK } from "../../types/presentation";
import { exportPptx, pptxFileName } from "../../lib/exportPptx";
import { exportPdf, pdfFileName, downloadBlob } from "../../lib/exportPdf";
import { useToast } from "../ui/Toast";

const STORAGE_KEY = "medair.presentation.deck.v1";

function loadDeck(): Deck {
  if (typeof window === "undefined") return STARTER_DECK;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return STARTER_DECK;
    const parsed = JSON.parse(raw) as Deck;
    if (!parsed.slides || parsed.slides.length === 0) return STARTER_DECK;
    return parsed;
  } catch {
    return STARTER_DECK;
  }
}

function saveDeck(deck: Deck): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
  } catch {
    // Ignore quota / private-mode errors — the export buttons are the source of truth.
  }
}

const newId = () =>
  `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

function blankSlide(position: number): Slide {
  return {
    id: newId(),
    theme: "atlas",
    eyebrow: `${String(position + 1).padStart(2, "0")} / Section`,
    title: "New slide",
    subtitle: "",
    bullets: [
      { kind: "text", text: "Click any text on the right to edit it." },
      { kind: "text", text: "Use the bullets below to add structure." },
    ],
    callout: undefined,
  };
}

/** Theme → swatch palette, mirrored from exportPptx for visual consistency. */
function themeSwatches(theme: SlideTheme): {
  bg: string; surface: string; fg: string; muted: string; accent: string; rule: string;
} {
  switch (theme) {
    case "cockpit":
      return { bg: "bg-[#0F172A]", surface: "bg-[#1E293B]", fg: "text-[#E2E8F0]", muted: "text-[#94A3B8]", accent: "bg-[#22D3EE] text-[#0F172A]", rule: "border-[#334155]" };
    case "atlas":
      return { bg: "bg-[#FCFAF6]", surface: "bg-[#F4F1EA]", fg: "text-[#2A2520]", muted: "text-[#755D49]", accent: "bg-[#3D8B7A] text-white", rule: "border-[#CDC5B3]" };
    case "briefing":
      return { bg: "bg-[#F4F1EA]", surface: "bg-[#FCFAF6]", fg: "text-[#2A2520]", muted: "text-[#755D49]", accent: "bg-[#C48524] text-white", rule: "border-[#CDC5B3]" };
  }
}

/** Aspect-ratio slide preview — used in both the sidebar thumbnails and the main stage. */
function SlidePreview({
  slide,
  slideNumber,
  size = "lg",
  active = false,
}: {
  slide: Slide;
  slideNumber: number;
  size?: "sm" | "lg";
  active?: boolean;
}) {
  const s = themeSwatches(slide.theme);
  const isSm = size === "sm";
  const padding = isSm ? "p-2.5" : "p-7";
  const eyebrowSize = isSm ? "text-[6px]" : "text-[10px]";
  const titleSize = isSm ? "text-[10px] leading-tight" : "text-[26px] leading-tight";
  const subSize = isSm ? "hidden" : "text-[11px]";
  const bulletSize = isSm ? "text-[7px]" : "text-[11px]";
  const statSize = isSm ? "text-[10px]" : "text-[20px]";
  const statLabelSize = isSm ? "text-[6px]" : "text-[10px]";

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-md border ${s.rule} ${s.bg} ${active ? "ring-2 ring-primary-500 ring-offset-1 ring-offset-paper-50" : ""}`}
    >
      {/* Decorative rule */}
      <div className={`absolute left-3 top-3 h-[2px] w-[10%] ${s.accent}`} />

      <div className={`flex h-full flex-col ${padding}`}>
        <div className={`${eyebrowSize} ${s.muted} font-mono font-semibold uppercase tracking-[0.15em]`}>
          {slide.eyebrow || `Slide ${slideNumber}`}
        </div>
        <div className={`mt-1.5 font-bold ${s.fg} ${titleSize}`}>
          {slide.title}
        </div>
        {slide.subtitle && (
          <div className={`mt-1.5 ${s.muted} ${subSize} italic`}>
            {slide.subtitle}
          </div>
        )}
        <div className="mt-3 flex-1 space-y-1 overflow-hidden">
          {slide.bullets.slice(0, isSm ? 2 : 4).map((b, i) => {
            if (b.kind === "divider") return <div key={i} className="h-1" />;
            if (b.kind === "stat") {
              return (
                <div key={i} className="flex items-baseline gap-1.5">
                  <span className={`${s.fg} mono font-bold ${statSize}`}>{b.value}</span>
                  <span className={`${s.muted} ${statLabelSize}`}>{b.label}</span>
                </div>
              );
            }
            return (
              <div key={i} className={`${s.fg} ${bulletSize} flex gap-1.5`}>
                <span className={s.muted}>•</span>
                <span className="truncate">{b.text}</span>
              </div>
            );
          })}
        </div>
        {slide.callout && !isSm && (
          <div className={`mt-2 border-t ${s.rule} pt-2`}>
            <div className={`${s.muted} ${eyebrowSize} font-semibold uppercase tracking-[0.15em]`}>
              {slide.callout.label}
            </div>
            <div className={`${s.fg} text-[12px] font-bold`}>
              {slide.callout.value}
            </div>
          </div>
        )}
      </div>
      <div className={`absolute right-2 bottom-1.5 mono text-[8px] ${s.muted}`}>
        {String(slideNumber).padStart(2, "0")}
      </div>
    </div>
  );
}

/** Editable bullet list inside the right inspector. */
function BulletEditor({
  bullets,
  onChange,
  theme,
}: {
  bullets: SlideBullet[];
  onChange: (next: SlideBullet[]) => void;
  theme: SlideTheme;
}) {
  const update = (i: number, patch: Partial<SlideBullet>) => {
    onChange(bullets.map((b, idx) => (idx === i ? ({ ...b, ...patch } as SlideBullet) : b)));
  };
  const remove = (i: number) => onChange(bullets.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= bullets.length) return;
    const next = bullets.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {bullets.map((b, i) => (
        <div
          key={i}
          className="group relative rounded-md border border-paper-300 bg-paper-50 p-2.5"
        >
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-600">
            <span className="mono">#{i + 1}</span>
            <span>·</span>
            <select
              value={b.kind}
              onChange={(e) => {
                const kind = e.target.value as SlideBullet["kind"];
                if (kind === "text") onChange(bullets.map((bb, idx) => idx === i ? { kind: "text", text: (bb as any).text ?? "" } : bb));
                else if (kind === "stat") onChange(bullets.map((bb, idx) => idx === i ? { kind: "stat", label: (bb as any).label ?? "Label", value: (bb as any).value ?? "0", tone: "primary" } : bb));
                else onChange(bullets.map((bb, idx) => idx === i ? { kind: "divider" } : bb));
              }}
              className="rounded border border-paper-300 bg-paper-100 px-1.5 py-0.5 text-[10px] outline-none"
            >
              <option value="text">Text</option>
              <option value="stat">Stat</option>
              <option value="divider">Spacer</option>
            </select>
            <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button onClick={() => move(i, -1)} aria-label="Move up" className="rounded p-0.5 text-ink-600 hover:bg-paper-150 hover:text-ink-900">▲</button>
              <button onClick={() => move(i, 1)} aria-label="Move down" className="rounded p-0.5 text-ink-600 hover:bg-paper-150 hover:text-ink-900">▼</button>
              <button onClick={() => remove(i)} aria-label="Remove" className="rounded p-0.5 text-critical-600 hover:bg-critical-50">×</button>
            </div>
          </div>
          {b.kind === "text" && (
            <textarea
              value={b.text}
              onChange={(e) => update(i, { text: e.target.value })}
              rows={2}
              className="w-full resize-none rounded border border-paper-300 bg-paper-100 px-2 py-1.5 text-[12px] outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-500/30"
            />
          )}
          {b.kind === "stat" && (
            <div className="grid grid-cols-[1fr_1fr_auto] gap-1.5">
              <input
                value={b.value}
                onChange={(e) => update(i, { value: e.target.value })}
                placeholder="Value"
                className="rounded border border-paper-300 bg-paper-100 px-2 py-1.5 text-[12px] outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-500/30"
              />
              <input
                value={b.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="Label"
                className="rounded border border-paper-300 bg-paper-100 px-2 py-1.5 text-[12px] outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-500/30"
              />
              <select
                value={b.tone ?? "primary"}
                onChange={(e) => update(i, { tone: e.target.value as any })}
                className="rounded border border-paper-300 bg-paper-100 px-1.5 py-1.5 text-[10px] outline-none"
              >
                <option value="primary">primary</option>
                <option value="warn">warn</option>
                <option value="critical">critical</option>
                <option value="ok">ok</option>
                <option value="neutral">neutral</option>
              </select>
            </div>
          )}
          {b.kind === "divider" && (
            <div className="text-[10px] text-ink-600">— spacer —</div>
          )}
        </div>
      ))}
      <div className="flex flex-wrap gap-1.5 pt-1">
        <button
          onClick={() => onChange([...bullets, { kind: "text", text: "New bullet" }])}
          className="inline-flex items-center gap-1 rounded-md border border-paper-300 bg-paper-100 px-2 py-1 text-[11px] text-ink-800 hover:bg-paper-150"
        >
          <Plus size={11} /> Text
        </button>
        <button
          onClick={() => onChange([...bullets, { kind: "stat", label: "Label", value: "0", tone: theme === "briefing" ? "warn" : "primary" }])}
          className="inline-flex items-center gap-1 rounded-md border border-paper-300 bg-paper-100 px-2 py-1 text-[11px] text-ink-800 hover:bg-paper-150"
        >
          <Plus size={11} /> Stat
        </button>
        <button
          onClick={() => onChange([...bullets, { kind: "divider" }])}
          className="inline-flex items-center gap-1 rounded-md border border-paper-300 bg-paper-100 px-2 py-1 text-[11px] text-ink-800 hover:bg-paper-150"
        >
          <Plus size={11} /> Spacer
        </button>
      </div>
    </div>
  );
}

export function PresentationModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [deck, setDeck] = useState<Deck>(() => loadDeck());
  const [activeIdx, setActiveIdx] = useState(0);
  const [mode, setMode] = useState<"edit" | "present">("edit");
  const [tab, setTab] = useState<"content" | "meta">("content");
  const mainRef = useRef<HTMLDivElement>(null);

  // Persist deck on every change
  useEffect(() => { saveDeck(deck); }, [deck]);

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement | null)?.isContentEditable === true;
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (isTyping) return;
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(deck.slides.length - 1, i + 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "Home") {
        e.preventDefault();
        setActiveIdx(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setActiveIdx(deck.slides.length - 1);
      } else if (e.key.toLowerCase() === "p") {
        setMode((m) => (m === "edit" ? "present" : "edit"));
      } else if (e.key.toLowerCase() === "n" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        addSlide();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck.slides.length]);

  // Scroll the active thumbnail into view in the sidebar
  const sidebarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sidebarRef.current) return;
    const el = sidebarRef.current.querySelector<HTMLDivElement>(`[data-slide-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIdx]);

  const slide = deck.slides[activeIdx];

  const updateSlide = (patch: Partial<Slide>) => {
    setDeck((d) => ({
      ...d,
      slides: d.slides.map((s, i) => (i === activeIdx ? { ...s, ...patch } : s)),
    }));
  };

  const addSlide = () => {
    setDeck((d) => {
      const s = blankSlide(d.slides.length);
      return { ...d, slides: [...d.slides, s] };
    });
    setActiveIdx(deck.slides.length);
  };

  const duplicateSlide = () => {
    setDeck((d) => {
      const copy: Slide = { ...slide, id: newId(), bullets: slide.bullets.map((b) => ({ ...b })) };
      const next = [...d.slides];
      next.splice(activeIdx + 1, 0, copy);
      return { ...d, slides: next };
    });
    setActiveIdx(activeIdx + 1);
    toast.show("Slide duplicated", { variant: "info" });
  };

  const removeSlide = () => {
    if (deck.slides.length === 1) {
      toast.show("Cannot remove the last slide", { variant: "warning" });
      return;
    }
    setDeck((d) => ({ ...d, slides: d.slides.filter((_, i) => i !== activeIdx) }));
    setActiveIdx((i) => Math.min(i, deck.slides.length - 2));
  };

  const moveSlide = (dir: -1 | 1) => {
    const j = activeIdx + dir;
    if (j < 0 || j >= deck.slides.length) return;
    setDeck((d) => {
      const next = d.slides.slice();
      [next[activeIdx], next[j]] = [next[j], next[activeIdx]];
      return { ...d, slides: next };
    });
    setActiveIdx(j);
  };

  const resetDeck = () => {
    if (!confirm("Reset to the starter deck? Your edits will be lost.")) return;
    setDeck(STARTER_DECK);
    setActiveIdx(0);
    toast.show("Deck reset to starter", { variant: "info" });
  };

  const onExportPptx = () => {
    try {
      const blob = exportPptx(deck);
      downloadBlob(blob, pptxFileName(deck));
      toast.show("PowerPoint download started", { variant: "success" });
    } catch (err) {
      console.error(err);
      toast.show("PPTX export failed — see console", { variant: "warning" });
    }
  };

  const onExportPdf = () => {
    try {
      const blob = exportPdf(deck);
      downloadBlob(blob, pdfFileName(deck));
      toast.show("PDF download started", { variant: "success" });
    } catch (err) {
      console.error(err);
      toast.show("PDF export failed — see console", { variant: "warning" });
    }
  };

  const themeLabel = useMemo(() => {
    if (!slide) return "";
    return slide.theme === "cockpit" ? "Cockpit" : slide.theme === "atlas" ? "Atlas" : "Briefing";
  }, [slide?.theme]);

  if (!slide) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-stretch justify-stretch bg-ink-900/50 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="presentation-modal-title"
        className="panel-strong relative m-3 flex w-full flex-col overflow-hidden animate-slideUp md:m-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top bar ────────────────────────────────────────────────── */}
        <header className="flex flex-wrap items-center gap-3 border-b border-paper-300 bg-paper-50/95 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="rounded-md border border-primary-500/35 bg-primary-500/[0.08] p-1.5 text-primary-700">
              <Presentation size={16} />
            </div>
            <div>
              <div id="presentation-modal-title" className="text-[14px] font-semibold text-ink-900">
                Presentation workspace
              </div>
              <div className="mt-0.5 text-[11px] text-ink-600">
                <span className="mono">{deck.slides.length}</span> slides · auto-saved locally ·{" "}
                <kbd className="rounded border border-paper-300 bg-paper-100 px-1 py-0.5 mono text-[9px] text-ink-800">←</kbd>{" "}
                <kbd className="rounded border border-paper-300 bg-paper-100 px-1 py-0.5 mono text-[9px] text-ink-800">→</kbd>{" "}
                navigate · <kbd className="rounded border border-paper-300 bg-paper-100 px-1 py-0.5 mono text-[9px] text-ink-800">P</kbd> present · <kbd className="rounded border border-paper-300 bg-paper-100 px-1 py-0.5 mono text-[9px] text-ink-800">Esc</kbd> close
              </div>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1.5 rounded-md border border-paper-300 bg-paper-100 p-0.5">
            <button
              onClick={() => setMode("edit")}
              className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium ${
                mode === "edit" ? "bg-paper-50 text-ink-900 shadow-soft" : "text-ink-600 hover:text-ink-900"
              }`}
            >
              <Pencil size={12} /> Edit
            </button>
            <button
              onClick={() => setMode("present")}
              className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium ${
                mode === "present" ? "bg-paper-50 text-ink-900 shadow-soft" : "text-ink-600 hover:text-ink-900"
              }`}
            >
              <Play size={12} /> Present
            </button>
          </div>

          <Button variant="secondary" onClick={onExportPdf}>
            <FileType size={14} />
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button variant="primary" onClick={onExportPptx}>
            <Download size={14} />
            <span className="hidden sm:inline">PPTX</span>
          </Button>
          <button
            onClick={onClose}
            aria-label="Close presentation workspace"
            className="rounded-md p-1.5 text-ink-600 outline-none transition-colors hover:bg-paper-150 hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-primary-500/40"
          >
            <X size={16} />
          </button>
        </header>

        {/* ── Body: 3-column layout (sidebar · stage · inspector) ─────── */}
        <div className="grid flex-1 grid-cols-[200px_minmax(0,1fr)_300px] overflow-hidden min-h-0">
          {/* Sidebar — slide list */}
          <aside className="flex min-h-0 flex-col border-r border-paper-300 bg-paper-100">
            <div className="flex items-center justify-between gap-2 border-b border-paper-300 px-3 py-2">
              <div className="label-eyebrow">Slides</div>
              <button
                onClick={addSlide}
                aria-label="Add slide"
                className="inline-flex items-center gap-1 rounded-md border border-paper-300 bg-paper-50 px-1.5 py-0.5 text-[10px] font-medium text-ink-800 hover:bg-paper-150"
              >
                <Plus size={10} /> Add
              </button>
            </div>
            <div ref={sidebarRef} className="flex-1 space-y-2 overflow-y-auto p-2">
              {deck.slides.map((s, i) => (
                <div
                  key={s.id}
                  data-slide-idx={i}
                  className={`group relative cursor-pointer rounded-md border bg-paper-50 p-1.5 transition-all hover:border-primary-400 ${
                    i === activeIdx ? "border-primary-500 shadow-soft" : "border-paper-300"
                  }`}
                  onClick={() => setActiveIdx(i)}
                >
                  <SlidePreview slide={s} slideNumber={i + 1} size="sm" active={i === activeIdx} />
                  <div className="mt-1 flex items-center justify-between gap-1 px-0.5">
                    <span className="mono text-[9px] font-bold text-ink-700">#{String(i + 1).padStart(2, "0")}</span>
                    <span className="truncate text-[9px] text-ink-600">{s.theme}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-paper-300 p-2">
              <button
                onClick={resetDeck}
                className="w-full rounded-md border border-paper-300 bg-paper-50 px-2 py-1.5 text-[10px] text-ink-700 hover:bg-paper-150"
              >
                Reset to starter deck
              </button>
            </div>
          </aside>

          {/* Stage — preview + navigation */}
          <main ref={mainRef} className="flex min-h-0 flex-col overflow-hidden bg-paper-200/40">
            {/* Nav strip */}
            <div className="flex items-center justify-between gap-2 border-b border-paper-300 bg-paper-50/80 px-4 py-2 backdrop-blur-md">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveIdx(0)}
                  aria-label="First slide"
                  className="rounded-md p-1.5 text-ink-700 hover:bg-paper-150 hover:text-ink-900 disabled:opacity-40"
                  disabled={activeIdx === 0}
                >
                  <ChevronFirst size={14} />
                </button>
                <button
                  onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
                  aria-label="Previous slide"
                  className="rounded-md p-1.5 text-ink-700 hover:bg-paper-150 hover:text-ink-900 disabled:opacity-40"
                  disabled={activeIdx === 0}
                >
                  <ChevronLeft size={14} />
                </button>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-ink-700">
                <span className="mono font-semibold text-ink-900">{String(activeIdx + 1).padStart(2, "0")}</span>
                <span className="text-ink-600">/ {String(deck.slides.length).padStart(2, "0")}</span>
                <span className="ml-2 hidden text-ink-600 sm:inline">— {themeLabel} theme</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveIdx((i) => Math.min(deck.slides.length - 1, i + 1))}
                  aria-label="Next slide"
                  className="rounded-md p-1.5 text-ink-700 hover:bg-paper-150 hover:text-ink-900 disabled:opacity-40"
                  disabled={activeIdx === deck.slides.length - 1}
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  onClick={() => setActiveIdx(deck.slides.length - 1)}
                  aria-label="Last slide"
                  className="rounded-md p-1.5 text-ink-700 hover:bg-paper-150 hover:text-ink-900 disabled:opacity-40"
                  disabled={activeIdx === deck.slides.length - 1}
                >
                  <ChevronLast size={14} />
                </button>
              </div>
            </div>

            {/* Slide canvas */}
            <div className="flex-1 overflow-auto p-6">
              <div className="mx-auto max-w-[960px]">
                {mode === "edit" ? (
                  <SlidePreview slide={slide} slideNumber={activeIdx + 1} size="lg" />
                ) : (
                  <PresentMode
                    slides={deck.slides}
                    activeIdx={activeIdx}
                    setActiveIdx={setActiveIdx}
                    onExit={() => setMode("edit")}
                  />
                )}

                {/* Slide actions */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => moveSlide(-1)}
                    disabled={activeIdx === 0}
                    className="inline-flex items-center gap-1 rounded-md border border-paper-300 bg-paper-50 px-2 py-1.5 text-[11px] font-medium text-ink-800 hover:bg-paper-150 disabled:opacity-40"
                  >
                    <ChevronLeft size={12} /> Move up
                  </button>
                  <button
                    onClick={() => moveSlide(1)}
                    disabled={activeIdx === deck.slides.length - 1}
                    className="inline-flex items-center gap-1 rounded-md border border-paper-300 bg-paper-50 px-2 py-1.5 text-[11px] font-medium text-ink-800 hover:bg-paper-150 disabled:opacity-40"
                  >
                    Move down <ChevronRight size={12} />
                  </button>
                  <button
                    onClick={duplicateSlide}
                    className="inline-flex items-center gap-1 rounded-md border border-paper-300 bg-paper-50 px-2 py-1.5 text-[11px] font-medium text-ink-800 hover:bg-paper-150"
                  >
                    <Copy size={12} /> Duplicate
                  </button>
                  <button
                    onClick={removeSlide}
                    className="inline-flex items-center gap-1 rounded-md border border-critical-500/30 bg-critical-50 px-2 py-1.5 text-[11px] font-medium text-critical-600 hover:bg-critical-500/15"
                  >
                    <Trash2 size={12} /> Delete
                  </button>

                  <div className="ml-auto flex items-center gap-2 rounded-md border border-paper-300 bg-paper-50 px-2 py-1.5">
                    <LayoutTemplate size={12} className="text-ink-700" />
                    <span className="label-eyebrow">Theme</span>
                    <select
                      value={slide.theme}
                      onChange={(e) => updateSlide({ theme: e.target.value as SlideTheme })}
                      className="rounded border border-paper-300 bg-paper-100 px-1.5 py-0.5 text-[11px] outline-none focus:border-primary-400"
                    >
                      <option value="atlas">Atlas (warm paper)</option>
                      <option value="cockpit">Cockpit (dark)</option>
                      <option value="briefing">Briefing (mono)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Inspector — slide editor */}
          <aside className="flex min-h-0 flex-col border-l border-paper-300 bg-paper-50/90">
            <div className="flex items-center gap-1 border-b border-paper-300 bg-paper-50 p-1.5">
              <button
                onClick={() => setTab("content")}
                className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-medium ${
                  tab === "content" ? "bg-paper-100 text-ink-900" : "text-ink-700 hover:bg-paper-100"
                }`}
              >
                <LayoutTemplate size={11} className="mr-1 inline" />
                Content
              </button>
              <button
                onClick={() => setTab("meta")}
                className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-medium ${
                  tab === "meta" ? "bg-paper-100 text-ink-900" : "text-ink-700 hover:bg-paper-100"
                }`}
              >
                <Eye size={11} className="mr-1 inline" />
                Deck meta
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {tab === "content" && (
                <div className="space-y-4">
                  <div>
                    <div className="label-eyebrow mb-1.5">Eyebrow</div>
                    <input
                      value={slide.eyebrow ?? ""}
                      onChange={(e) => updateSlide({ eyebrow: e.target.value })}
                      placeholder="e.g. 03 / Use cases"
                      className="w-full rounded-md border border-paper-300 bg-paper-100 px-2.5 py-1.5 text-[12px] outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-500/30"
                    />
                  </div>
                  <div>
                    <div className="label-eyebrow mb-1.5">Title</div>
                    <textarea
                      value={slide.title}
                      onChange={(e) => updateSlide({ title: e.target.value })}
                      rows={2}
                      className="w-full resize-none rounded-md border border-paper-300 bg-paper-100 px-2.5 py-1.5 text-[14px] font-semibold outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-500/30"
                    />
                  </div>
                  <div>
                    <div className="label-eyebrow mb-1.5">Subtitle</div>
                    <textarea
                      value={slide.subtitle ?? ""}
                      onChange={(e) => updateSlide({ subtitle: e.target.value })}
                      rows={2}
                      placeholder="Optional subtitle"
                      className="w-full resize-none rounded-md border border-paper-300 bg-paper-100 px-2.5 py-1.5 text-[12px] italic text-ink-800 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-500/30"
                    />
                  </div>
                  <div>
                    <div className="label-eyebrow mb-1.5">Body</div>
                    <BulletEditor
                      bullets={slide.bullets}
                      onChange={(b) => updateSlide({ bullets: b })}
                      theme={slide.theme}
                    />
                  </div>
                  <div className="rounded-md border border-paper-300 bg-paper-100 p-2.5">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <span className="label-eyebrow">Callout strip</span>
                      <button
                        onClick={() => updateSlide({ callout: slide.callout ? undefined : { label: "Highlight", value: "...", tone: "primary" } })}
                        className="ml-auto rounded border border-paper-300 bg-paper-50 px-1.5 py-0.5 text-[10px] text-ink-700 hover:bg-paper-150"
                      >
                        {slide.callout ? "Remove" : "Add"}
                      </button>
                    </div>
                    {slide.callout && (
                      <div className="space-y-1.5">
                        <input
                          value={slide.callout.label}
                          onChange={(e) => updateSlide({ callout: { ...slide.callout!, label: e.target.value } })}
                          placeholder="Label"
                          className="w-full rounded border border-paper-300 bg-paper-50 px-2 py-1 text-[11px] outline-none"
                        />
                        <textarea
                          value={slide.callout.value}
                          onChange={(e) => updateSlide({ callout: { ...slide.callout!, value: e.target.value } })}
                          rows={2}
                          placeholder="Value"
                          className="w-full resize-none rounded border border-paper-300 bg-paper-50 px-2 py-1 text-[12px] font-semibold outline-none"
                        />
                        <select
                          value={slide.callout.tone ?? "primary"}
                          onChange={(e) => updateSlide({ callout: { ...slide.callout!, tone: e.target.value as any } })}
                          className="w-full rounded border border-paper-300 bg-paper-50 px-2 py-1 text-[10px] outline-none"
                        >
                          <option value="primary">primary</option>
                          <option value="warn">warn</option>
                          <option value="critical">critical</option>
                          <option value="ok">ok</option>
                          <option value="neutral">neutral</option>
                        </select>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="label-eyebrow mb-1.5">Speaker notes</div>
                    <textarea
                      value={slide.notes ?? ""}
                      onChange={(e) => updateSlide({ notes: e.target.value })}
                      rows={3}
                      placeholder="Only visible in editor & PPTX"
                      className="w-full resize-none rounded-md border border-paper-300 bg-paper-100 px-2.5 py-1.5 text-[12px] outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-500/30"
                    />
                  </div>
                </div>
              )}
              {tab === "meta" && (
                <div className="space-y-4">
                  <div>
                    <div className="label-eyebrow mb-1.5">Deck title</div>
                    <input
                      value={deck.title}
                      onChange={(e) => setDeck((d) => ({ ...d, title: e.target.value }))}
                      className="w-full rounded-md border border-paper-300 bg-paper-100 px-2.5 py-1.5 text-[13px] font-semibold outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-500/30"
                    />
                  </div>
                  <div>
                    <div className="label-eyebrow mb-1.5">Author</div>
                    <input
                      value={deck.author}
                      onChange={(e) => setDeck((d) => ({ ...d, author: e.target.value }))}
                      className="w-full rounded-md border border-paper-300 bg-paper-100 px-2.5 py-1.5 text-[12px] outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-500/30"
                    />
                  </div>
                  <div className="rounded-md border border-paper-300 bg-paper-100 p-3 text-[11px] text-ink-700">
                    <div className="label-eyebrow mb-1.5">Stats</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Slides</span>
                        <span className="mono text-ink-900">{deck.slides.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Themes in use</span>
                        <span className="mono text-ink-900">
                          {new Set(deck.slides.map((s) => s.theme)).size}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total bullets</span>
                        <span className="mono text-ink-900">
                          {deck.slides.reduce((sum, s) => sum + s.bullets.length, 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-md border border-paper-300 bg-paper-100 p-3 text-[11px] text-ink-700">
                    <div className="label-eyebrow mb-1.5">Export notes</div>
                    <ul className="ml-3 list-disc space-y-1 text-[11px]">
                      <li>PPTX includes speaker notes — visible in PowerPoint's Notes pane.</li>
                      <li>PDF uses Helvetica — Diacritics are handled via WinAnsiEncoding.</li>
                      <li>Edits auto-save to <span className="mono text-ink-900">localStorage</span>.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/** Present mode — large slide centred, click anywhere or use keys to advance. */
function PresentMode({
  slides,
  activeIdx,
  setActiveIdx,
  onExit,
}: {
  slides: Slide[];
  activeIdx: number;
  setActiveIdx: (i: number) => void;
  onExit: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onExit(); return; }
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        setActiveIdx(Math.min(slides.length - 1, activeIdx + 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setActiveIdx(Math.max(0, activeIdx - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIdx, slides.length, setActiveIdx, onExit]);

  const slide = slides[activeIdx];
  if (!slide) return null;

  return (
    <div
      className="relative mx-auto max-w-full cursor-pointer overflow-hidden rounded-lg shadow-float"
      onClick={() => setActiveIdx(Math.min(slides.length - 1, activeIdx + 1))}
    >
      <SlidePreview slide={slide} slideNumber={activeIdx + 1} size="lg" />
      <div className="absolute bottom-3 right-3 rounded-md bg-ink-900/80 px-2.5 py-1 text-[10px] text-paper-50 backdrop-blur-md">
        <span className="mono font-semibold">{String(activeIdx + 1).padStart(2, "0")}</span>
        <span className="mx-1 opacity-60">/</span>
        <span className="mono">{String(slides.length).padStart(2, "0")}</span>
      </div>
      <div className="absolute bottom-3 left-3 rounded-md bg-ink-900/80 px-2.5 py-1 text-[10px] text-paper-50 backdrop-blur-md">
        Press <kbd className="mx-0.5 rounded bg-ink-900/60 px-1">Esc</kbd> to exit · click to advance
      </div>
    </div>
  );
}
