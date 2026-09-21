import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  X,
  Presentation,
  Upload,
  FileText,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  AlertTriangle,
  Replace,
  FileType,
  Info,
  RotateCcw,
} from "lucide-react";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";

/* ============================================================
 * Auth — admin gate for edit/delete operations.
 *
 * The username + password are stored here as constants. They
 * are not a serious security boundary (the file itself lives in
 * the user's localStorage), they're a UI gate so a casual viewer
 * can't accidentally overwrite or delete the uploaded deck.
 * ============================================================ */
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "inecoadmin";

/* ============================================================
 * Storage — uploaded file metadata + base64 data URL.
 *
 * Stored under a versioned key so we can migrate cleanly later.
 * We keep the original File name, type, size, upload timestamp,
 * and the base64 data URL (so refreshes survive).
 * ============================================================ */
const STORAGE_KEY = "medair.presentation.upload.v1";

interface StoredFile {
  name: string;
  type: string;
  size: number;
  uploadedAt: string; // ISO
  dataUrl: string;
}

function loadStoredFile(): StoredFile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredFile;
    if (!parsed?.dataUrl || !parsed?.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveStoredFile(file: StoredFile): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(file));
}

function clearStoredFile(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

/** Read a File into a base64 data URL via FileReader. */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function isPdf(file: StoredFile): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isPptx(file: StoredFile): boolean {
  return (
    file.type ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    file.name.toLowerCase().endsWith(".pptx") ||
    file.name.toLowerCase().endsWith(".ppt")
  );
}

/* ============================================================
 * Drag-and-drop hook.
 *
 * Returns a list of props to spread onto the dropzone element
 * and a `isOver` flag for visual feedback.
 * ============================================================ */
function useDropZone(onFile: (file: File) => void) {
  const [isOver, setIsOver] = useState(false);
  const counter = useRef(0);

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    counter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsOver(true);
    }
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    counter.current = Math.max(0, counter.current - 1);
    if (counter.current === 0) setIsOver(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      counter.current = 0;
      setIsOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  return {
    isOver,
    dropZoneProps: {
      onDragEnter,
      onDragLeave,
      onDragOver,
      onDrop,
    },
  };
}

/* ============================================================
 * Login prompt — admin gate.
 *
 * Local form with username + password fields. Submits to the
 * parent on success; shows an inline error otherwise.
 * ============================================================ */
function AdminLoginPrompt({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setError(null);
      onSuccess();
      return;
    }
    setError("Incorrect username or password.");
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-lg border border-paper-300 bg-paper-100 p-4 animate-slideUp"
    >
      <div className="flex items-center gap-2 text-ink-800">
        <Lock size={14} className="text-primary-600" />
        <span className="text-[12px] font-semibold uppercase tracking-[0.1em]">
          Admin verification
        </span>
      </div>
      <p className="text-[11px] text-ink-600">
        Editing and replacing the presentation requires an admin sign-in. Viewers can
        always open or download the file.
      </p>

      <div>
        <label className="label-eyebrow mb-1 block" htmlFor="admin-user">
          Username
        </label>
        <input
          ref={usernameRef}
          id="admin-user"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          className="w-full rounded-md border border-paper-300 bg-paper-50 px-2.5 py-1.5 text-[13px] outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-500/30"
          placeholder="admin"
        />
      </div>
      <div>
        <label className="label-eyebrow mb-1 block" htmlFor="admin-pass">
          Password
        </label>
        <div className="relative">
          <input
            id="admin-pass"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full rounded-md border border-paper-300 bg-paper-50 px-2.5 py-1.5 pr-9 text-[13px] outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-500/30"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-600 hover:bg-paper-150 hover:text-ink-900"
          >
            {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 rounded-md border border-critical-500/30 bg-critical-50 px-2.5 py-1.5 text-[11px] text-critical-600">
          <AlertTriangle size={12} />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 pt-1">
        <Button type="submit" variant="primary">
          <ShieldCheck size={14} />
          Verify
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/* ============================================================
 * The dropzone — large, thematic, drag-and-drop file slot.
 *
 * Always visible. Clicking or dropping a file replaces the
 * currently stored file (when in edit mode) or shows a hint
 * that admin sign-in is required (otherwise).
 * ============================================================ */
function DropZone({
  hasFile,
  editMode,
  onFile,
  disabledHint,
}: {
  hasFile: boolean;
  editMode: boolean;
  onFile: (file: File) => void;
  disabledHint?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFile = useCallback(
    (file: File) => {
      onFile(file);
    },
    [onFile]
  );
  const { isOver, dropZoneProps } = useDropZone(handleFile);

  const onPick = () => fileInputRef.current?.click();

  // Read-only mode — drop is visually disabled, click does nothing.
  const isInteractive = editMode || !hasFile;

  return (
    <div
      {...dropZoneProps}
      onClick={isInteractive ? onPick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : -1}
      onKeyDown={(e) => {
        if (!isInteractive) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPick();
        }
      }}
      className={`relative flex min-h-[260px] cursor-${isInteractive ? "pointer" : "not-allowed"} flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-all ${
        isOver
          ? "border-primary-500 bg-primary-500/[0.06] shadow-soft"
          : editMode
            ? "border-paper-300 bg-paper-100 hover:border-primary-400 hover:bg-primary-500/[0.04]"
            : "border-paper-300 bg-paper-100/60 opacity-90"
      }`}
    >
      {/* Background motif */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl opacity-[0.04]">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      <div className="relative flex flex-col items-center gap-3">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-colors ${
            isOver
              ? "border-primary-500 bg-primary-500/15 text-primary-700"
              : "border-paper-300 bg-paper-50 text-primary-600"
          }`}
        >
          <Upload size={22} />
        </div>
        <div>
          <div className="text-[15px] font-semibold text-ink-900">
            {isOver
              ? "Release to upload"
              : hasFile
                ? editMode
                  ? "Drop a new file to replace"
                  : "A presentation is uploaded"
                : "Drop your presentation here"}
          </div>
          <div className="mt-1 text-[12px] text-ink-600">
            PPTX, PDF, or any file you want to share · click to browse
          </div>
        </div>

        {!editMode && hasFile && (
          <div className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-paper-300 bg-paper-50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-ink-700">
            <Lock size={10} />
            Replace / remove requires admin sign-in
          </div>
        )}

        {disabledHint && (
          <div className="mt-1 text-[10px] text-ink-600">{disabledHint}</div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.pptx,.ppt,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = ""; // allow re-uploading the same file
        }}
      />
    </div>
  );
}

/* ============================================================
 * The presentation modal — file slot with admin-gated edit.
 * ============================================================ */
export function PresentationModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [file, setFile] = useState<StoredFile | null>(() => loadStoredFile());
  const [authed, setAuthed] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Always re-lock when the modal closes — so opening it again asks anew.
  // (We don't unlock on close in this design — authed is local to this mount.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const ingestFile = useCallback(
    async (f: File) => {
      try {
        const dataUrl = await readFileAsDataUrl(f);
        const next: StoredFile = {
          name: f.name,
          type: f.type || "application/octet-stream",
          size: f.size,
          uploadedAt: new Date().toISOString(),
          dataUrl,
        };
        saveStoredFile(next);
        setFile(next);
        toast.show(`Uploaded "${f.name}"`, { variant: "success" });
      } catch (err) {
        console.error(err);
        toast.show("Failed to read the file — see console", { variant: "warning" });
      }
    },
    [toast]
  );

  const onUploadClick = useCallback(
    (f: File) => {
      // First upload (no file yet) does NOT require auth — anyone can drop a file.
      // But if a file is already present and the user isn't authed, prompt.
      if (file && !authed) {
        toast.show("Admin sign-in is required to replace the file", {
          variant: "warning",
        });
        setShowLogin(true);
        return;
      }
      void ingestFile(f);
    },
    [file, authed, toast, ingestFile]
  );

  const onOpen = () => {
    if (!file) return;
    const w = window.open();
    if (!w) {
      toast.show("Pop-up blocked — use Download instead", { variant: "warning" });
      return;
    }
    // For PDFs the browser's built-in viewer is excellent.
    // For other types we wrap in a minimal HTML viewer with a download CTA.
    if (isPdf(file)) {
      w.document.title = file.name;
      w.document.body.style.margin = "0";
      w.document.body.style.height = "100vh";
      const iframe = w.document.createElement("iframe");
      iframe.src = file.dataUrl;
      iframe.style.width = "100vw";
      iframe.style.height = "100vh";
      iframe.style.border = "0";
      w.document.body.appendChild(iframe);
    } else {
      w.document.title = file.name;
      w.document.body.style.cssText =
        "margin:0;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:system-ui;background:#FCFAF6;color:#2A2520;";
      w.document.body.innerHTML = `
        <div style="text-align:center;max-width:420px;padding:24px">
          <div style="font-size:15px;font-weight:600;margin-bottom:6px">${file.name}</div>
          <div style="font-size:12px;color:#755D49;margin-bottom:18px">
            This file type can't be previewed in the browser. Use the download button
            below to save it locally and open it in PowerPoint, Keynote, or LibreOffice.
          </div>
          <a href="${file.dataUrl}" download="${file.name}"
             style="display:inline-flex;align-items:center;gap:6px;padding:9px 14px;background:#3D8B7A;color:#fff;border-radius:6px;text-decoration:none;font-size:12px;font-weight:600">
            Download ${file.name}
          </a>
        </div>`;
    }
  };

  const onDownload = () => {
    if (!file) return;
    const a = document.createElement("a");
    a.href = file.dataUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const onRemove = () => {
    if (!file) return;
    if (!confirm(`Remove "${file.name}"? This can't be undone.`)) return;
    clearStoredFile();
    setFile(null);
    setAuthed(false);
    setShowLogin(false);
    toast.show("Presentation removed", { variant: "info" });
  };

  const onStartEdit = () => {
    if (authed) {
      // Toggle off — re-lock immediately.
      setAuthed(false);
      setShowLogin(false);
      return;
    }
    setShowLogin(true);
  };

  const kindLabel = useMemo(() => {
    if (!file) return "";
    if (isPdf(file)) return "PDF document";
    if (isPptx(file)) return "PowerPoint deck";
    return file.type || "File";
  }, [file]);

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
        {/* ── Top bar ────────────────────────────────────────────── */}
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
                Stakeholder briefing · drop your file once and share it with anyone
              </div>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1.5 rounded-md border border-paper-300 bg-paper-100 px-2 py-1">
            {authed ? (
              <>
                <ShieldCheck size={12} className="text-primary-600" />
                <span className="mono text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-700">
                  Admin mode
                </span>
              </>
            ) : (
              <>
                <Lock size={12} className="text-ink-600" />
                <span className="mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-700">
                  Read-only
                </span>
              </>
            )}
            <button
              onClick={onStartEdit}
              aria-pressed={authed}
              className={`ml-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                authed
                  ? "border-primary-500/40 bg-primary-500/[0.08] text-primary-700 hover:bg-primary-500/15"
                  : "border-paper-300 bg-paper-50 text-ink-800 hover:bg-paper-150"
              }`}
            >
              {authed ? "Exit admin" : "Edit"}
            </button>
          </div>

          <button
            onClick={onClose}
            aria-label="Close presentation workspace"
            className="rounded-md p-1.5 text-ink-600 outline-none transition-colors hover:bg-paper-150 hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-primary-500/40"
          >
            <X size={16} />
          </button>
        </header>

        {/* ── Body ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto bg-paper-200/40 p-6">
          <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
            {/* Dropzone / file card column */}
            <div className="space-y-4">
              {file ? (
                <div className="panel-strong animate-slideUp overflow-hidden">
                  {/* File header */}
                  <div className="flex items-start gap-4 border-b border-paper-300 p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-primary-500/35 bg-primary-500/[0.08] text-primary-700">
                      {isPdf(file) ? <FileType size={22} /> : <FileText size={22} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[15px] font-semibold text-ink-900">
                          {file.name}
                        </span>
                        <span className="pill bg-primary-500/[0.08] text-primary-700">
                          {kindLabel}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink-600">
                        <span className="mono">{formatBytes(file.size)}</span>
                        <span>·</span>
                        <span>Uploaded {formatDate(file.uploadedAt)}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button variant="secondary" onClick={onOpen}>
                        <Eye size={14} />
                        <span className="hidden sm:inline">Open</span>
                      </Button>
                      <Button variant="secondary" onClick={onDownload}>
                        <Download size={14} />
                        <span className="hidden sm:inline">Download</span>
                      </Button>
                    </div>
                  </div>

                  {/* Preview area */}
                  <div className="p-5">
                    {isPdf(file) ? (
                      <div className="overflow-hidden rounded-lg border border-paper-300 bg-paper-100">
                        <iframe
                          src={file.dataUrl}
                          title={file.name}
                          className="h-[480px] w-full"
                        />
                        <div className="border-t border-paper-300 bg-paper-100 px-3.5 py-2 text-[11px] text-ink-600">
                          PDF preview · use the toolbar inside the viewer to navigate
                          pages · <span className="mono">Esc</span> closes the
                          workspace
                        </div>
                      </div>
                    ) : isPptx(file) ? (
                      <div className="rounded-lg border border-paper-300 bg-paper-100 p-6 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-paper-300 bg-paper-50 text-primary-600">
                          <Presentation size={22} />
                        </div>
                        <div className="text-[13px] font-semibold text-ink-900">
                          PowerPoint preview isn&apos;t available in the browser
                        </div>
                        <div className="mt-1 text-[12px] text-ink-600">
                          Use <span className="mono text-ink-900">Open</span> to view in
                          your default app, or <span className="mono text-ink-900">Download</span>{" "}
                          to save a copy.
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-paper-300 bg-paper-100 p-6 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-paper-300 bg-paper-50 text-ink-700">
                          <FileText size={22} />
                        </div>
                        <div className="text-[13px] font-semibold text-ink-900">
                          {file.name}
                        </div>
                        <div className="mt-1 text-[12px] text-ink-600">
                          Preview not available for this file type — use{" "}
                          <span className="mono text-ink-900">Open</span> or{" "}
                          <span className="mono text-ink-900">Download</span>.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Admin actions — only visible when authed */}
                  {authed && (
                    <div className="flex flex-wrap items-center gap-2 border-t border-paper-300 bg-warn-500/[0.04] px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-warn-700">
                        <ShieldCheck size={11} />
                        Admin actions
                      </span>
                      <div className="ml-auto flex items-center gap-1.5">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept=".pdf,.pptx,.ppt,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) void ingestFile(f);
                              e.target.value = "";
                            }}
                          />
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-paper-300 bg-paper-50 px-2.5 py-1.5 text-[11px] font-medium text-ink-800 hover:bg-paper-150">
                            <Replace size={12} />
                            Replace
                          </span>
                        </label>
                        <button
                          onClick={onRemove}
                          className="inline-flex items-center gap-1.5 rounded-md border border-critical-500/35 bg-critical-50 px-2.5 py-1.5 text-[11px] font-medium text-critical-600 hover:bg-critical-500/15"
                        >
                          <Trash2 size={12} />
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <DropZone
                  hasFile={false}
                  editMode={true}
                  onFile={onUploadClick}
                  disabledHint="No sign-in needed for the first upload"
                />
              )}

              {/* Login prompt — shown when admin sign-in is requested */}
              {showLogin && (
                <AdminLoginPrompt
                  onCancel={() => setShowLogin(false)}
                  onSuccess={() => {
                    setAuthed(true);
                    setShowLogin(false);
                    toast.show("Admin mode unlocked", { variant: "success" });
                  }}
                />
              )}

              {/* When a file is present and authed, show the dropzone in a
                  collapsed form as a secondary replace slot. */}
              {file && authed && (
                <div className="space-y-2">
                  <div className="label-eyebrow">Or drop a replacement</div>
                  <DropZone hasFile={true} editMode={true} onFile={onUploadClick} />
                </div>
              )}
            </div>

            {/* Sidebar panel — meta + help */}
            <aside className="space-y-4">
              <div className="panel p-5">
                <div className="label-eyebrow">How this works</div>
                <ul className="mt-3 space-y-2.5 text-[12px] text-ink-700">
                  <li className="flex gap-2">
                    <span className="mt-0.5 mono text-[10px] font-bold text-primary-600">01</span>
                    <span>
                      Anyone can <span className="font-semibold text-ink-900">open</span> or{" "}
                      <span className="font-semibold text-ink-900">download</span> the
                      uploaded file.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-0.5 mono text-[10px] font-bold text-primary-600">02</span>
                    <span>
                      Replacing or removing the file requires admin sign-in (top
                      right <span className="font-semibold text-ink-900">Edit</span> button).
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-0.5 mono text-[10px] font-bold text-primary-600">03</span>
                    <span>
                      The first upload is open to anyone — a deliberate choice so
                      you can hand the workspace off.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-0.5 mono text-[10px] font-bold text-primary-600">04</span>
                    <span>
                      The file is stored in this browser&apos;s{" "}
                      <span className="mono text-ink-900">localStorage</span>; it does
                      not get uploaded to a server.
                    </span>
                  </li>
                </ul>
              </div>

              {file && (
                <div className="panel p-5">
                  <div className="label-eyebrow">File info</div>
                  <dl className="mt-3 space-y-1.5 text-[12px]">
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-600">Type</dt>
                      <dd className="mono text-ink-900">{kindLabel}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-600">Size</dt>
                      <dd className="mono text-ink-900">{formatBytes(file.size)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-600">Uploaded</dt>
                      <dd className="mono text-ink-900">{formatDate(file.uploadedAt)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-600">Storage key</dt>
                      <dd className="mono text-[10px] text-ink-700">{STORAGE_KEY}</dd>
                    </div>
                  </dl>
                </div>
              )}

              <div className="panel p-5">
                <div className="flex items-start gap-2.5">
                  <Info size={14} className="mt-0.5 shrink-0 text-primary-600" />
                  <div className="text-[12px] text-ink-700">
                    PDF files render inline. PowerPoint files open in a new tab in
                    your default app, or can be downloaded and viewed in
                    PowerPoint, Keynote, or LibreOffice Impress.
                  </div>
                </div>
              </div>

              {file && authed && (
                <button
                  onClick={() => {
                    setAuthed(false);
                    setShowLogin(false);
                    toast.show("Exited admin mode", { variant: "info" });
                  }}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-paper-300 bg-paper-100 px-3 py-2 text-[11px] font-medium text-ink-800 hover:bg-paper-150"
                >
                  <RotateCcw size={12} />
                  Exit admin mode
                </button>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
