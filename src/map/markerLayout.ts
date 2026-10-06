import type { Echelon } from "../types.ts";

const OVERVIEW_ECHELON = new Set<Echelon>(["army", "corps", "division", "brigade"]);

export function zoomBandFor(zoom: number): number {
  return Math.round(zoom * 2) / 2;
}

export function visibleAtZoom(echelon: Echelon, zoom: number, selected: boolean): boolean {
  if (selected) return true;
  if (zoom >= 9) return true;
  return OVERVIEW_ECHELON.has(echelon);
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

/** Same echelon and cluster rules as the 2D map. Selected units stay individual. */
export function layoutUnits<T extends { selected: boolean; echelon: Echelon; lng: number; lat: number }>(
  placed: readonly T[],
  zoom: number,
): LaidOut<T> {
  const visible = placed.filter((item) => visibleAtZoom(item.echelon, zoom, item.selected));
  const selected = visible.filter((item) => item.selected);
  const rest = visible.filter((item) => !item.selected);
  const individuals: T[] = [];
  const clusters: LaidOut<T>["clusters"] = [];
  if (zoom >= 7) {
    individuals.push(...rest);
  } else {
    const size = 8 / 2 ** zoom;
    const groups = new Map<string, T[]>();
    for (const entry of rest) {
      const key = `${Math.floor(entry.lng / size)}:${Math.floor(entry.lat / size)}`;
      const group = groups.get(key);
      if (group) group.push(entry);
      else groups.set(key, [entry]);
    }
    for (const [key, group] of groups) {
      const lone = group[0];
      if (group.length === 1 && lone) {
        individuals.push(lone);
        continue;
      }
      const lng = group.reduce((sum, entry) => sum + entry.lng, 0) / group.length;
      const lat = group.reduce((sum, entry) => sum + entry.lat, 0) / group.length;
      clusters.push({ key, lng, lat, members: group });
    }
  }
  individuals.push(...selected);
  return { individuals, clusters };
}
