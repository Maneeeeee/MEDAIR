// PPTX export — produces a real .pptx file from a Deck.
//
// PPTX is a ZIP of XML following the Office Open XML schema (ECMA-376).
// We emit the minimal set of parts required by PowerPoint and Keynote:
//   [Content_Types].xml
//   _rels/.rels
//   ppt/_rels/presentation.xml.rels
//   ppt/presentation.xml
//   ppt/slides/slide{N}.xml
//   ppt/slides/_rels/slide{N}.xml.rels
//   ppt/slideLayouts/slideLayout1.xml        (blank layout)
//   ppt/slideMasters/slideMaster1.xml
//   ppt/theme/theme1.xml                     (Office theme — minimal)
//   docProps/app.xml
//   docProps/core.xml
//
// Coordinates use English Metric Units (EMU): 914 400 EMU = 1 inch.
// Slide size is 16:9 widescreen — 13.333" × 7.5" = 12 192 000 × 6 858 000 EMU.

import type { Deck, Slide, SlideTheme } from "../types/presentation";
import { buildZip } from "./zip";

const SLIDE_W = 12_192_000; // 13.333"
const SLIDE_H = 6_858_000;  // 7.5"
const EMU = 914_400;        // per inch

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Resolve a theme to a tri-colour palette + bg pattern. */
function themePalette(theme: SlideTheme) {
  // Match the in-app feel: cockpit = navy/cyan, atlas = warm paper/teal,
  // briefing = neutral cream with a single accent.
  switch (theme) {
    case "cockpit":
      return {
        bg: "0F172A",          // slate-900
        surface: "1E293B",     // slate-800
        fg: "E2E8F0",          // slate-200
        fgMuted: "94A3B8",     // slate-400
        accent: "22D3EE",      // medical cyan
        accentDark: "0E7490",
        rule: "334155",        // slate-700
      };
    case "atlas":
      return {
        bg: "FCFAF6",          // paper-50
        surface: "F4F1EA",     // paper-100
        fg: "2A2520",          // ink-900
        fgMuted: "755D49",     // ink-600/700
        accent: "3D8B7A",      // primary-500
        accentDark: "2F6E60",
        rule: "CDC5B3",        // paper-300
      };
    case "briefing":
      return {
        bg: "F4F1EA",          // paper-100
        surface: "FCFAF6",
        fg: "2A2520",
        fgMuted: "755D49",
        accent: "C48524",      // warn-500
        accentDark: "8A5C18",
        rule: "CDC5B3",
      };
  }
}

/**
 * Wrap a string in an XML paragraph for a text frame.
 * Honors newlines (becomes a line break) and supports runs with size/color.
 */
function pXml(text: string, opts: { size: number; color: string; bold?: boolean; italic?: boolean; align?: "l" | "c" | "r" }): string {
  const safe = xmlEscape(text);
  const lines = safe.split(/\n/);
  const body = lines
    .map((line, i) => {
      const br = i > 0 ? '<a:br/>' : "";
      return `${br}<a:r><a:rPr lang="en-US" sz="${opts.size}" b="${opts.bold ? 1 : 0}" i="${opts.italic ? 1 : 0}"><a:solidFill><a:srgbClr val="${opts.color}"/></a:solidFill><a:latin typeface="Calibri"/></a:rPr><a:t>${line}</a:t></a:r>`;
    })
    .join("");
  return `<a:p><a:pPr algn="${opts.align ?? "l"}"><a:defRPr/></a:pPr>${body}</a:p>`;
}

function toneToColor(tone: string | undefined, p: ReturnType<typeof themePalette>): string {
  switch (tone) {
    case "primary":  return p.accent;
    case "warn":     return "C48524";
    case "critical": return "B54A32";
    case "ok":       return "5A9670";
    default:         return p.fg;
  }
}

/** Convert a slide to its slide XML. */
function slideXml(slide: Slide, slideNumber: number): string {
  const p = themePalette(slide.theme);
  const paras: string[] = [];

  // Eyebrow
  if (slide.eyebrow) {
    paras.push(pXml(slide.eyebrow.toUpperCase(), { size: 12, color: p.accent, bold: true, align: "l" }));
  }
  // Title
  paras.push(pXml(slide.title, { size: 40, color: p.fg, bold: true, align: "l" }));
  // Subtitle
  if (slide.subtitle) {
    paras.push(pXml(slide.subtitle, { size: 20, color: p.fgMuted, italic: true, align: "l" }));
  }

  // Blank spacer
  paras.push(pXml(" ", { size: 14, color: p.fg, align: "l" }));

  // Body
  for (const b of slide.bullets) {
    if (b.kind === "divider") {
      paras.push(pXml(" ", { size: 8, color: p.fg, align: "l" }));
      continue;
    }
    if (b.kind === "stat") {
      const val = b.value;
      const lbl = b.label;
      // Format "VALUE  LABEL" inline
      const runs = [
        `<a:r><a:rPr lang="en-US" sz="28" b="1"><a:solidFill><a:srgbClr val="${toneToColor(b.tone, p)}"/></a:solidFill><a:latin typeface="Consolas"/></a:rPr><a:t>${xmlEscape(val)}</a:t></a:r>`,
        `<a:r><a:rPr lang="en-US" sz="16"><a:solidFill><a:srgbClr val="${p.fgMuted}"/></a:solidFill><a:latin typeface="Calibri"/></a:rPr><a:t>  ·  ${xmlEscape(lbl)}</a:t></a:r>`,
      ];
      paras.push(`<a:p><a:pPr algn="l"><a:defRPr/></a:pPr>${runs.join("")}</a:p>`);
      continue;
    }
    // Text bullet — leading dot
    paras.push(
      `<a:p><a:pPr algn="l" marL="285750" indent="-285750"><a:buFont typeface="Arial" char="•"><a:buClr><a:srgbClr val="${p.accent}"/></a:buClr></a:buFont><a:defRPr/></a:pPr><a:r><a:rPr lang="en-US" sz="16"><a:solidFill><a:srgbClr val="${p.fg}"/></a:solidFill><a:latin typeface="Calibri"/></a:rPr><a:t>${xmlEscape(b.text)}</a:t></a:r></a:p>`
    );
  }

  // Callout strip
  if (slide.callout) {
    paras.push(pXml(" ", { size: 10, color: p.fg, align: "l" }));
    paras.push(pXml(slide.callout.label.toUpperCase(), { size: 11, color: p.accent, bold: true, align: "l" }));
    paras.push(pXml(slide.callout.value, { size: 18, color: p.fg, bold: true, align: "l" }));
  }

  // Notes
  const notesXml = slide.notes
    ? `  <p:notes><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="100" name="Notes"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/><p:sp><p:nvSpPr><p:cNvPr id="101" name="Notes Placeholder"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US"/><a:t>${xmlEscape(slide.notes)}</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>\n`
    : "";

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg><p:solidFill><a:srgbClr val="${p.bg}"/></p:solidFill></p:bg>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
      <!-- Decorative rule -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Rule"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="${0.5 * EMU}" y="${0.6 * EMU}"/><a:ext cx="${SLIDE_W - 1 * EMU}" cy="12700"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="${p.accent}"/></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr>
        <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="en-US"/></a:p></p:txBody>
      </p:sp>
      <!-- Title block -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Title"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="${0.7 * EMU}" y="${0.8 * EMU}"/><a:ext cx="${SLIDE_W - 1.4 * EMU}" cy="${SLIDE_H - 1.6 * EMU}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>
        <p:txBody><a:bodyPr wrap="square" rtlCol="0" anchor="t"/><a:lstStyle/>
          ${paras.join("\n          ")}
        </p:txBody>
      </p:sp>
      <!-- Slide number -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="4" name="SlideNum"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="${SLIDE_W - 1.3 * EMU}" y="${SLIDE_H - 0.6 * EMU}"/><a:ext cx="1 * EMU" cy="0.3 * EMU"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>
        <p:txBody><a:bodyPr/><a:lstStyle/>${pXml(`${slideNumber}`, { size: 10, color: p.fgMuted, align: "r" })}</p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
  ${notesXml}</p:sld>`;
}

/** Generate the static template parts. */
function templateParts(slideCount: number): { name: string; data: string }[] {
  const slidesRels = slideCount
    ? Array.from({ length: slideCount }, (_, i) =>
        `  <Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`
      ).join("\n")
    : "";

  return [
    {
      name: "[Content_Types].xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
${Array.from({ length: slideCount }, (_, i) =>
  `  <Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
).join("\n")}
${Array.from({ length: slideCount }, (_, i) =>
  `  <Override PartName="/ppt/notesSlides/notesSlide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>`
).join("\n")}
</Types>`,
    },
    {
      name: "_rels/.rels",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`,
    },
    {
      name: "ppt/_rels/presentation.xml.rels",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
${slidesRels}
</Relationships>`,
    },
    {
      name: "ppt/presentation.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>${Array.from({ length: slideCount }, (_, i) =>
    `    <p:sldId id="${256 + i}" r:id="rId${100 + i + 1}"/>`
  ).join("\n")}</p:sldIdLst>
  <p:sldSz cx="${SLIDE_W}" cy="${SLIDE_H}" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`,
    },
    {
      name: "ppt/slideMasters/_rels/slideMaster1.xml.rels",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`,
    },
    {
      name: "ppt/slideMasters/slideMaster1.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:bg><p:solidFill><a:srgbClr val="FFFFFF"/></p:solidFill></p:bg><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>
  </p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`,
    },
    {
      name: "ppt/slideLayouts/_rels/slideLayout1.xml.rels",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`,
    },
    {
      name: "ppt/slideLayouts/slideLayout1.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>
</p:sldLayout>`,
    },
    {
      name: "ppt/theme/theme1.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="MEDAIR">
  <a:themeElements>
    <a:clrScheme name="MEDAIR"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2><a:accent1><a:srgbClr val="3D8B7A"/></a:accent1><a:accent2><a:srgbClr val="C48524"/></a:accent2><a:accent3><a:srgbClr val="B54A32"/></a:accent3><a:accent4><a:srgbClr val="5A9670"/></a:accent4><a:accent5><a:srgbClr val="22D3EE"/></a:accent5><a:accent6><a:srgbClr val="A5A5A5"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme>
    <a:fontScheme name="MEDAIR"><a:majorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme>
    <a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln><a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln><a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>
  </a:themeElements>
</a:theme>`,
    },
    {
      name: "docProps/app.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>MEDAIR Presentation Workspace</Application>
  <Slides>${slideCount}</Slides>
</Properties>`,
    },
    {
      name: "docProps/core.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${xmlEscape("MEDAIR Armenia — Stakeholder Briefing")}</dc:title>
  <dc:creator>MEDAIR Operations</dc:creator>
  <cp:lastModifiedBy>MEDAIR Operations</cp:lastModifiedBy>
</cp:coreProperties>`,
    },
  ];
}

/**
 * Export the deck to a real .pptx file and trigger a browser download.
 * Returns the generated Blob (useful for testing).
 */
export function exportPptx(deck: Deck): Blob {
  const entries = [
    ...templateParts(deck.slides.length).map((t) => ({ name: t.name, data: t.data as string })),
    ...deck.slides.map((s, i) => ({
      name: `ppt/slides/slide${i + 1}.xml`,
      data: slideXml(s, i + 1),
    })),
  ];
  const bytes = buildZip(entries);
  // Copy into a plain ArrayBuffer so the Blob constructor accepts it
  // (Uint8Array<ArrayBufferLike> is not always assignable across TS versions).
  const buf = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buf).set(bytes);
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
}

/** Convenience: build a file name from the deck title. */
export function pptxFileName(deck: Deck): string {
  const slug = deck.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "deck";
  return `${slug}.pptx`;
}
