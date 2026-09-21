import { LogoMark } from "../ui/Icons";
import { NetworkStats } from "./NetworkStats";
import { AlertTriangle, Phone, Menu, Presentation } from "lucide-react";
import { Button } from "../ui/Button";
import { ThemeToggle } from "../ui/ThemeToggle";
import type { LiveKpis } from "../../hooks/useDroneSimulation";
import type { Theme } from "../../hooks/useTheme";

export function Header({
  kpis,
  onOpenContact,
  onOpenDispatch,
  onToggleFilters,
  onOpenPresentation,
  theme,
  onToggleTheme,
}: {
  kpis: LiveKpis;
  onOpenContact: () => void;
  onOpenDispatch: () => void;
  onToggleFilters: () => void;
  onOpenPresentation: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}) {
  const isDark = theme === "dark";
  return (
    <header className="z-[1000] flex flex-col border-b border-paper-300 bg-paper-50/95 backdrop-blur-md">
      <div className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        <div className="flex shrink-0 items-center gap-3">
          <LogoMark size={32} />
          <div className="flex flex-col leading-none">
            <span
              className={`text-[17px] tracking-[-0.01em] ${
                isDark ? "glow-text-primary" : ""
              }`}
            >
              <span className="font-bold text-ink-900">MEDAIR</span>{" "}
              <span className="font-light tracking-wide text-primary-500">
                ARMENIA
              </span>
            </span>
            <span className="mono mt-1 hidden text-[9px] font-medium uppercase tracking-[0.22em] text-muted sm:block">
              Medical Drone Network · CAC/EASA Class G
            </span>
          </div>
        </div>

        {/* LIVE indicator */}
        <div className={`ml-2 hidden shrink-0 items-center gap-1.5 sm:inline-flex ${isDark ? "glow-text-primary" : ""}`}>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-pulseRing rounded-full bg-ok-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-ok-500" />
          </span>
          <span className="mono text-[10px] font-semibold tracking-[0.2em] text-ok-600">
            LIVE
          </span>
        </div>

        <div className="flex-1" />

        <div className="hidden shrink-0 md:block">
          <NetworkStats kpis={kpis} compact />
        </div>

        <ThemeToggle theme={theme} onToggle={onToggleTheme} />

        <Button
          variant="destructive"
          onClick={onOpenDispatch}
          className="shrink-0"
        >
          <AlertTriangle size={14} />
          <span className="hidden sm:inline">Dispatch</span>
        </Button>

        <Button variant="secondary" onClick={onOpenPresentation} className="shrink-0" aria-label="Open presentation workspace">
          <Presentation size={14} />
          <span className="hidden lg:inline">Present</span>
        </Button>

        <Button variant="secondary" onClick={onToggleFilters} className="shrink-0 md:hidden">
          <Menu size={14} />
        </Button>

        <Button variant="primary" onClick={onOpenContact} className="shrink-0">
          <Phone size={14} />
          <span className="hidden sm:inline">Contact</span>
        </Button>
      </div>

      <div className="md:hidden">
        <div className="snap-x snap-mandatory flex gap-2 overflow-x-auto border-t border-paper-300 px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <NetworkStats kpis={kpis} compact inline />
        </div>
      </div>
    </header>
  );
}
