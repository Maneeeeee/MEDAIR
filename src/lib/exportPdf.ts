// PDF export — produces a real, multi-page PDF from a Deck.
//
// We emit PDF 1.4 with the built-in Helvetica family. Coordinate system
// has origin at bottom-left; we flip Y when placing text.
// Layout matches the PPTX exporter (16:9 widescreen: 960 × 540 pt).

import type { Deck, Slide, SlideTheme } from "../types/presentation";

const PAGE_W = 960;
const PAGE_H = 540;

function themePalette(theme: SlideTheme) {
  switch (theme) {
    case "cockpit":
      return {
        bg: [15, 23, 42] as [number, number, number],
        fg: [226, 232, 240] as [number, number, number],
        fgMuted: [148, 163, 184] as [number, number, number],
        accent: [34, 211, 238] as [number, number, number],
      };
    case "atlas":
      return {
        bg: [252, 250, 246] as [number, number, number],
        fg: [42, 37, 32] as [number, number, number],
        fgMuted: [117, 74, 58] as [number, number, number],
        accent: [61, 139, 122] as [number, number, number],
      };
    case "briefing":
      return {
        bg: [244, 241, 234] as [number, number, number],
        fg: [42, 37, 32] as [number, number, number],
        fgMuted: [117, 74, 58] as [number, number, number],
        accent: [196, 133, 36] as [number, number, number],
      };
  }
}

function toneRgb(tone: string | undefined, p: ReturnType<typeof themePalette>): [number, number, number] {
  switch (tone) {
    case "primary":  return p.accent;
    case "warn":     return [196, 133, 36];
    case "critical": return [181, 74, 50];
    case "ok":       return [90, 150, 112];
    default:         return p.fg;
  }
}

/** Escape a string for PDF text (parentheses and backslashes). */
function escPdf(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/**
 * Word-wrap a string to fit within a pixel width at the given font size.
 * Helvetica is approximately 0.5 × fontSize wide per character at typical
 * weights; we use 0.55 as a conservative estimate.
 */
function wrap(text: string, fontSize: number, maxWidth: number): string[] {
  const charW = fontSize * 0.55;
  const maxChars = Math.max(1, Math.floor(maxWidth / charW));
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + " " + w : w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Build a content stream for one slide. */
function pageStream(slide: Slide, slideNumber: number): string {
  const p = themePalette(slide.theme);
  const ops: string[] = [];

  // 1. Background fill
  ops.push(`${p.bg[0]} ${p.bg[1]} ${p.bg[2]} rg`);
  ops.push(`0 0 ${PAGE_W} ${PAGE_H} re f`);

  // 2. Decorative accent rule
  ops.push(`${p.accent[0]} ${p.accent[1]} ${p.accent[2]} RG`);
  ops.push(`1.5 w`);
  ops.push(`48 480 m ${PAGE_W - 96} 480 l S`);

  // Helper: place text at x, baseline-y (top-down coordinate)
  const placeText = (text: string, x: number, y: number, size: number, rgb: [number, number, number], bold = false) => {
    ops.push(`BT`);
    ops.push(`${rgb[0]} ${rgb[1]} ${rgb[2]} rg`);
    ops.push(`/${bold ? "F2" : "F1"} ${size} Tf`);
    ops.push(`1 0 0 1 ${x} ${PAGE_H - y} Tm`);
    ops.push(`(${escPdf(text)}) Tj`);
    ops.push(`ET`);
  };

  let cursorY = 80;

  // Eyebrow
  if (slide.eyebrow) {
    placeText(slide.eyebrow.toUpperCase(), 56, cursorY, 10, p.accent, true);
    cursorY += 18;
  }

  // Title (wrap to 880pt)
  const titleLines = wrap(slide.title, 30, 860);
  for (const line of titleLines) {
    placeText(line, 56, cursorY, 30, p.fg, true);
    cursorY += 34;
  }
  cursorY += 4;

  // Subtitle
  if (slide.subtitle) {
    const subLines = wrap(slide.subtitle, 14, 860);
    for (const line of subLines) {
      placeText(line, 56, cursorY, 14, p.fgMuted, false);
      cursorY += 18;
    }
    cursorY += 8;
  }

  // Body
  for (const b of slide.bullets) {
    if (b.kind === "divider") {
      cursorY += 6;
      continue;
    }
    if (b.kind === "stat") {
      // Value
      const valText = b.value;
      const valSize = 22;
      placeText(valText, 56, cursorY, valSize, toneRgb(b.tone, p), true);
      // Approximate value width: char count × ~12 pt
      const valW = valText.length * valSize * 0.55;
      // Label
      const labelSize = 12;
      const labelLines = wrap("· " + b.label, labelSize, 860 - valW);
      placeText(labelLines[0], 56 + valW + 12, cursorY + 8, labelSize, p.fgMuted, false);
      cursorY += 28;
      continue;
    }
    // Text bullet
    const lines = wrap("• " + b.text, 11, 840);
    for (const line of lines) {
      placeText(line, 56, cursorY, 11, p.fg, false);
      cursorY += 15;
    }
    cursorY += 2;
  }

  // Callout strip near bottom
  if (slide.callout) {
    const calloutY = PAGE_H - 60;
    placeText(slide.callout.label.toUpperCase(), 56, calloutY, 9, p.accent, true);
    const valueLines = wrap(slide.callout.value, 14, 860);
    for (const line of valueLines) {
      placeText(line, 56, calloutY + 14, 14, p.fg, true);
    }
  }

  // Slide number
  placeText(String(slideNumber), PAGE_W - 56, 28, 9, p.fgMuted, false);

  return ops.join("\n");
}

/** Build the full PDF document. */
export function buildPdf(deck: Deck): Uint8Array {
  const pages: { stream: string }[] = deck.slides.map((s, i) => ({
    stream: pageStream(s, i + 1),
  }));

  // ── Object layout ──
  // 1: Catalog
  // 2: Pages
  // 3..(3+pages-1): Page objects
  // (3+pages).. : Contents per page
  // After pages: Font objects (F1, F2)

  const offsets: number[] = [];
  let body = "%PDF-1.4\n%âãÏÓ\n";

  const fontPageCount = pages.length;
  const catalogStr = `<< /Type /Catalog /Pages 2 0 R >>`;
  const pagesStr = `<< /Type /Pages /Count ${fontPageCount} /Kids [ ${Array.from({ length: fontPageCount }, (_, i) => `${3 + i} 0 R`).join(" ")} ] >>`;

  const writeObj = (id: number, content: string) => {
    offsets[id] = body.length;
    body += `${id} 0 obj\n${content}\nendobj\n`;
  };

  // 1: Catalog
  writeObj(1, catalogStr);
  // 2: Pages
  writeObj(2, pagesStr);
  // 3..N: Page
  const N = fontPageCount;
  for (let i = 0; i < N; i++) {
    writeObj(
      3 + i,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${3 + 2 * N} 0 R /F2 ${3 + 2 * N + 1} 0 R >> >> /Contents ${3 + N + i} 0 R >>`
    );
  }
  // (3+N)..(3+2N-1): Content streams
  for (let i = 0; i < N; i++) {
    const stream = pages[i].stream;
    writeObj(3 + N + i, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  }
  // (3+2N): F1
  writeObj(3 + 2 * N, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`);
  // (3+2N+1): F2
  writeObj(3 + 2 * N + 1, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`);

  // xref
  const xrefStart = body.length;
  const totalObjects = 3 + 2 * N + 1;
  body += `xref\n0 ${totalObjects + 1}\n`;
  body += `0000000000 65535 f \n`;
  for (let id = 1; id <= totalObjects; id++) {
    body += `${String(offsets[id] ?? 0).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  // Encode to bytes (Latin-1 is fine; we used WinAnsi which is a subset)
  const bytes = new Uint8Array(body.length);
  for (let i = 0; i < body.length; i++) {
    const code = body.charCodeAt(i);
    bytes[i] = code < 256 ? code : 63; // '?' for any non-Latin-1
  }
  return bytes;
}

export function exportPdf(deck: Deck): Blob {
  const bytes = buildPdf(deck);
  // Copy into a plain ArrayBuffer so the Blob constructor accepts it
  // (Uint8Array<ArrayBufferLike> is not always assignable across TS versions).
  const buf = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buf).set(bytes);
  return new Blob([buf], { type: "application/pdf" });
}

export function pdfFileName(deck: Deck): string {
  const slug = deck.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "deck";
  return `${slug}.pdf`;
}

/** Trigger a browser download of a Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Defer revoke so Safari/iOS finishes the download
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
