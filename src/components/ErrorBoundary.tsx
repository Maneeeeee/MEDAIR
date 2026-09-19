import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { LogoMark } from "./ui/Icons";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches render-phase errors anywhere in its subtree and renders a
 * recoverable cockpit-styled fallback so a single throw never blanks
 * the whole app to a white screen. Logs the error to the console
 * for debugging.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary] Uncaught render error", error, info.componentStack);
  }

  private readonly handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const message = this.state.error?.message ?? "Unknown render error";
      return (
        <div
          role="alert"
          className="fixed inset-0 z-[4000] flex items-center justify-center bg-ink-900/40 p-4 backdrop-blur-md"
        >
          <div className="panel-strong relative w-full max-w-[520px] overflow-hidden animate-slideUp">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-critical-500 via-warn-500 to-primary-500" />

            <div className="flex items-start gap-4 border-b border-paper-300 p-5">
              <LogoMark size={36} />
              <div className="flex-1">
                <h1 className="flex items-center gap-2 text-[15px] font-semibold leading-tight text-ink-900">
                  <AlertTriangle size={16} className="text-critical-600" />
                  Something went wrong
                </h1>
                <p className="mt-1.5 text-[12px] text-ink-600">
                  The dashboard hit an unrecoverable render error. The session can be
                  reloaded without losing server state.
                </p>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <div className="label-eyebrow mb-1.5">Error trace</div>
                <pre className="mono max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-critical-500/35 bg-critical-500/[0.06] p-3 text-[11px] leading-relaxed text-critical-600">
                  {message}
                </pre>
              </div>

              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-3 py-2.5 text-[13px] font-medium text-white outline-none transition-colors hover:bg-primary-600 focus-visible:ring-2 focus-visible:ring-primary-500/40"
              >
                <RotateCw size={14} /> Reload dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
