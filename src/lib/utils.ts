// Pure helpers — distance math, ID lookups, format helpers.

export const haversineKm = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/** Linear interpolation between two lat/lng by t in [0,1]. */
export const lerpLatLng = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  t: number
): { lat: number; lng: number } => ({
  lat: a.lat + (b.lat - a.lat) * t,
  lng: a.lng + (b.lng - a.lng) * t,
});

/** Bearing in degrees (0..360) from a → b. */
export const bearingDeg = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number => {
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
};

export const formatKm = (km: number) =>
  km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;

export const formatEta = (min: number) => {
  if (min < 1) return "<1 min";
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
};

export const relativeTime = (iso: string, nowMs?: number) => {
  const t = new Date(iso).getTime();
  const now = nowMs ?? Date.now();
  // Clamp to non-negative so future ISO strings (e.g. fixed mock data) never
  // render as "-54138s ago". Render "just now" for any past-or-future instant.
  const diffSec = Math.max(0, Math.round((now - t) / 1000));
  if (diffSec < 60) return diffSec === 0 ? "just now" : `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} h ago`;
  return `${Math.floor(diffSec / 86400)} d ago`;
};

export const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
