// Minimal ZIP (PKZIP) writer — STORE (no compression) only.
//
// Why hand-rolled: we want a `.pptx` export with zero new runtime
// dependencies. PPTX is a ZIP of XML, so we only need to produce a
// valid ZIP container. We use STORE (method 0) — compression is left
// to the host OS / download manager.
//
// Reference: APPNOTE.TXT (PKWARE) — section 4.3.7 (Local file header)
// and 4.3.14 (Central directory). The CRC-32 table is the standard
// IEEE 802.3 polynomial 0xEDB88320.

const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/** Encode a single text string as a UTF-8 byte array. */
function utf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export interface ZipEntry {
  name: string;
  data: string | Uint8Array;
}

/** Build a ZIP file (Uint8Array) from a list of entries. */
export function buildZip(entries: ZipEntry[]): Uint8Array {
  const records: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const e of entries) {
    const data = typeof e.data === "string" ? utf8(e.data) : e.data;
    const name = utf8(e.name);
    const crc = crc32(data);
    const size = data.length;

    // Local file header (4.3.7)
    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true); // signature
    lv.setUint16(4, 20, true);        // version needed
    lv.setUint16(6, 0, true);         // flags
    lv.setUint16(8, 0, true);         // method = STORE
    lv.setUint16(10, 0, true);        // mod time
    lv.setUint16(12, 0, true);        // mod date
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);     // compressed size
    lv.setUint32(22, size, true);     // uncompressed size
    lv.setUint16(26, name.length, true);
    lv.setUint16(28, 0, true);        // extra length
    local.set(name, 30);
    records.push(local, data);

    // Central directory header (4.3.14)
    const cd = new Uint8Array(46 + name.length);
    const cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true); // signature
    cv.setUint16(4, 20, true);         // version made by
    cv.setUint16(6, 20, true);         // version needed
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, name.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    cd.set(name, 46);
    central.push(cd);

    offset += local.length + data.length;
  }

  const centralStart = offset;
  for (const c of central) {
    records.push(c);
    offset += c.length;
  }
  const centralSize = offset - centralStart;

  // End of central directory (4.3.16)
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, centralStart, true);
  ev.setUint16(20, 0, true);
  records.push(eocd);

  // Concatenate
  const total = records.reduce((s, r) => s + r.length, 0);
  const out = new Uint8Array(total);
  let p = 0;
  for (const r of records) {
    out.set(r, p);
    p += r.length;
  }
  return out;
}
