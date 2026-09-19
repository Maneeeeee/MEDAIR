import { Moon, Sun } from "lucide-react";
import type { Theme } from "../../hooks/useTheme";

/* Theme toggle button. Single-click swaps light ↔ dark via the
   useTheme hook. The icon morphs (sun ↔ moon) and the inner disc
   uses a phosphor-glow ring in dark mode so the toggle itself
   participates in the dark-mode language. */
export function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: Theme;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
      className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-paper-300 bg-paper-50 outline-none transition-colors hover:bg-paper-150 focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
        theme === "dark" ? "text-primary-500 hover:text-primary-600" : "text-ink-700 hover:text-ink-900"
      }`}
    >
      {/* Sun (light mode) */}
      <Sun
        size={16}
        aria-hidden
        className={`absolute transition-all duration-300 ease-out ${
          theme === "light"
            ? "scale-100 rotate-0 opacity-100"
            : "scale-50 rotate-45 opacity-0"
        }`}
      />
      {/* Moon (dark mode) */}
      <Moon
        size={16}
        aria-hidden
        className={`absolute transition-all duration-300 ease-out ${
          theme === "dark"
            ? "scale-100 rotate-0 opacity-100"
            : "scale-50 -rotate-45 opacity-0"
        }`}
      />
    </button>
  );
}

export type { Theme };
