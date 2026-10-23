import type { Echelon, EchelonCap } from "../types.ts";

/** Below this zoom, overlapping same-echelon markers hide instead of clustering. */
export const STRATEGIC_ZOOM = 6.5;
const MARKER_GAP_PX = 32;

const ECHELON_RANK: Record<Echelon, number> = {
  "army-group": 0,
  army: 1,
  corps: 2,
  division: 3,
  brigade: 4,
  regiment: 4,
  battalion: 5,
  company: 5,
};

export function zoomBandFor(zoom: number): number {
  return Math.round(zoom * 2) / 2;
}

export function echelonRank(echelon: Echelon): number {
  return ECHELON_RANK[echelon];
}

/**
 * Finest rank drawn at this zoom (selected units ignore the cap).
 * zoom < 5: army groups and armies
 * 5–6.5: + corps
 * 6.5–8.5: + divisions
 * 8.5–10.5: + brigades and regiments
 * > 10.5: + battalions and companies
 * Army+ caps at army. Division+ caps at division. All draws every echelon.
 */
export function maxEchelonRank(zoom: number, cap: EchelonCap = "auto"): number {
  if (cap === "all") return 5;
  if (cap === "army+") return 1;
  if (cap === "division+") return 3;
  if (zoom < 5) return 1;
  if (zoom < 6.5) return 2;
  if (zoom < 8.5) return 3;
  if (zoom <= 10.5) return 4;
  return 5;
}

export function visibleAtZoom(echelon: Echelon, zoom: number, selected: boolean, cap: EchelonCap = "auto"): boolean {
  if (selected) return true;
  return echelonRank(echelon) <= maxEchelonRank(zoom, cap);
}

/** Finest rank actually on the map at this zoom. Selected exceptions do not set it. */
export function currentEchelonRank(
  items: readonly { echelon: Echelon; selected: boolean }[],
  zoom: number,
  cap: EchelonCap = "auto",
): number {
  const max = maxEchelonRank(zoom, cap);
  let finest = -1;
  for (const item of items) {
    const rank = echelonRank(item.echelon);
    if (item.selected && rank > max) continue;
    if (rank <= max && rank > finest) finest = rank;
  }
  return finest < 0 ? max : finest;
}

export function mercatorPixel(lng: number, lat: number, zoom: number): { x: number; y: number } {
  const scale = 256 * 2 ** zoom;
  const x = ((lng + 180) / 360) * scale;
  const clamped = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const latRad = (clamped * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale;
  return { x, y };
}

/** Meters above the ellipsoid that match a MapLibre zoom at this latitude. */
export function heightForZoom(zoom: number, latitude: number, canvasHeight: number): number {
  const metersPerPixel = (156543.03392 * Math.cos((latitude * Math.PI) / 180)) / 2 ** zoom;
  const height = (metersPerPixel * Math.max(canvasHeight, 1)) / (2 * Math.tan(Math.PI / 6));
  return Math.min(40_000_000, Math.max(1_500, height));
}

/** MapLibre-equivalent zoom for a camera height, using a 60° vertical field of view. */
export function zoomForHeight(height: number, latitude: number, canvasHeight: number, fovy = Math.PI / 3): number {
  const metersPerPixel = (2 * Math.max(height, 1) * Math.tan(fovy / 2)) / Math.max(canvasHeight, 1);
  const cos = Math.max(0.01, Math.cos((latitude * Math.PI) / 180));
  return Math.log2((156543.03392 * cos) / metersPerPixel);
}

export interface LaidOut<T> {
  individuals: T[];
  clusters: { key: string; lng: number; lat: number; members: T[] }[];
}

type LayoutItem = {
  selected: boolean;
  echelon: Echelon;
  lng: number;
  lat: number;
  status?: string;
  id?: string;
};

function overlapKey(entry: LayoutItem, zoom: number): string {
  const pixel = mercatorPixel(entry.lng, entry.lat, zoom);
  return `${echelonRank(entry.echelon)}:${Math.round(pixel.x / MARKER_GAP_PX)}:${Math.round(pixel.y / MARKER_GAP_PX)}`;
}

function pickOne<T extends LayoutItem>(group: T[]): T {
  const ranked = [...group].sort((a, b) => {
    const stale = (item: T) => (item.status === "last-reported" ? 1 : 0);
    const byStatus = stale(a) - stale(b);
    if (byStatus !== 0) return byStatus;
    if (a.id && b.id && a.id !== b.id) return a.id < b.id ? -1 : 1;
    return a.lng - b.lng || a.lat - b.lat;
  });
  return ranked[0] ?? group[0];
}

/**
 * Hide echelons below the current zoom. Cluster only same-echelon overlaps.
 * At strategic zoom, overlapping same-echelon pins hide instead of clustering.
 * Selected units stay individual.
 */
export function layoutUnits<T extends LayoutItem>(placed: readonly T[], zoom: number, cap: EchelonCap = "auto"): LaidOut<T> {
  const visible = placed.filter((item) => visibleAtZoom(item.echelon, zoom, item.selected, cap));
  const selected = visible.filter((item) => item.selected);
  const rest = visible.filter((item) => !item.selected);
  const individuals: T[] = [...selected];
  const clusters: LaidOut<T>["clusters"] = [];
  const strategic = zoom < STRATEGIC_ZOOM;
  const buckets = new Map<string, T[]>();
  for (const entry of rest) {
    const key = overlapKey(entry, zoom);
    const group = buckets.get(key);
    if (group) group.push(entry);
    else buckets.set(key, [entry]);
  }
  for (const [key, group] of buckets) {
    const lone = group[0];
    if (!lone || group.length === 1) {
      if (lone) individuals.push(lone);
      continue;
    }
    if (strategic) {
      const kept = pickOne(group);
      if (kept) individuals.push(kept);
      continue;
    }
    const lng = group.reduce((sum, entry) => sum + entry.lng, 0) / group.length;
    const lat = group.reduce((sum, entry) => sum + entry.lat, 0) / group.length;
    clusters.push({ key, lng, lat, members: group });
  }
  return { individuals, clusters };
}

function boxesOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * shortName labels for the current echelon only, plus the selected unit.
 * Skip a label when its box collides with one already placed.
 */
export function labeledIds<T extends { selected: boolean; echelon: Echelon; lng: number; lat: number; id: string; abbr: string }>(
  individuals: readonly T[],
  zoom: number,
  pixel: (lng: number, lat: number) => { x: number; y: number },
  cap: EchelonCap = "auto",
): Set<string> {
  const current = currentEchelonRank(individuals, zoom, cap);
  const labeled = new Set<string>();
  const boxes: { x: number; y: number; w: number; h: number }[] = [];
  const order = [
    ...individuals.filter((item) => item.selected),
    ...individuals.filter((item) => !item.selected && echelonRank(item.echelon) === current),
  ];
  for (const item of order) {
    const point = pixel(item.lng, item.lat);
    const width = Math.min(80, 10 + item.abbr.length * 7);
    const box = { x: point.x - width / 2, y: point.y + 14, w: width, h: 14 };
    const hits = boxes.some((other) => boxesOverlap(other, box));
    if (item.selected || !hits) {
      labeled.add(item.id);
      boxes.push(box);
    }
  }
  return labeled;
}
