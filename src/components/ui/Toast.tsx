import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

/**
 * Bottom-right sliding toast system.
 *
 *   const toast = useToast();
 *   toast.show("Recall command sent to AR-003", { variant: "success" });
 *   toast.show("Heads up",            { variant: "warning", duration: 6000 });
 *   toast.show("Quietly informational");  // defaults: variant="info", duration=4000
 *
 * The provider renders a fixed, non-interactive container in the bottom-right.
 * Each toast auto-dismisses on its `duration` (ms) and can be closed manually.
 * Toasts stack vertically, slide in from the right, and match the warm-paper
 * aesthetic (`border-paper-300`, `bg-paper-50/95`, `backdrop-blur-md`).
 */

export type ToastVariant = "info" | "success" | "warning";

export interface ToastOptions {
  variant?: ToastVariant;
  /** ms before auto-dismiss; default 4000. Pass 0 to disable auto-dismiss. */
  duration?: number;
}

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  show: (message: string, opts?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

interface VariantStyle {
  border: string;
  text: string;
  Icon: typeof Info;
}

const variantStyles: Record<ToastVariant, VariantStyle> = {
  info: {
    border: "border-primary-300",
    text: "text-primary-700",
    Icon: Info,
  },
  success: {
    border: "border-ok-500/35",
    text: "text-ok-600",
    Icon: CheckCircle2,
  },
  warning: {
    border: "border-warn-500/40",
    text: "text-warn-600",
    Icon: AlertTriangle,
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);
  const timers = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    const handle = timers.current.get(id);
    if (handle !== undefined) {
      window.clearTimeout(handle);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback<ToastContextValue["show"]>(
    (message, opts) => {
      counter.current += 1;
      const id = `t-${counter.current.toString(36)}-${Date.now().toString(36)}`;
      const variant = opts?.variant ?? "info";
      const duration = opts?.duration ?? 4000;
      setToasts((prev) => [...prev, { id, message, variant, duration }]);
      if (duration > 0) {
        const handle = window.setTimeout(() => dismiss(id), duration);
        timers.current.set(id, handle);
      }
    },
    [dismiss],
  );

  // Clear pending timers on unmount so we don't setState on a dead component.
  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((h) => window.clearTimeout(h));
      map.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Self-contained keyframes — keeps the slide-in scoped to this module
          so the rest of the app's index.css stays untouched. */}
      <style>{`
        @keyframes toast-slide-in {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed bottom-6 right-6 z-[3500] flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((t) => {
          const v = variantStyles[t.variant];
          const Icon = v.Icon;
          return (
            <div
              key={t.id}
              role="status"
              style={{
                animation: "toast-slide-in 220ms cubic-bezier(0.16, 1, 0.3, 1) both",
              }}
              className={`pointer-events-auto flex items-start gap-3 rounded-lg border ${v.border} bg-paper-50/95 px-4 py-3 shadow-float backdrop-blur-md`}
            >
              <Icon size={16} className={`mt-0.5 shrink-0 ${v.text}`} />
              <div className={`flex-1 text-[13px] leading-snug ${v.text}`}>{t.message}</div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded p-0.5 text-ink-600 outline-none transition-colors hover:bg-paper-150 hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-primary-500/40"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Hook for child components to push toasts. Must be used inside a
 * `<ToastProvider>`; throws otherwise so misuse is loud.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}
