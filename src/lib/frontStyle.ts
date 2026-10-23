import type { FeatureCollection, LineString, Polygon } from "geojson";
import type { TheaterId } from "../types.ts";
import type { LngLat } from "./contact.ts";

/** HoI4-style front stroke. Not the Okabe–Ito unit palette. */
export const FRONT_LINE_COLOR = {
  allied: "#3d6db5",
  axis: "#b33a3a",
  soviet: "#a32020",
} as const;

/** Territory fill behind the front. Separate from country occupation. */
export const CONTROL_FILL_COLOR = {
  axis: "#b33a3a",
  soviet: "#8b1e1e",
  allied: "#2f5d9f",
} as const;

export const CONTROL_FILL_OPACITY = {
  axis: 0.18,
  soviet: 0.14,
  allied: 0.16,
} as const;

/** 1px outline, darker than the fill. */
export const CONTROL_OUTLINE_COLOR = {
  axis: "#7a2727",
  soviet: "#5f1414",
  allied: "#203f6c",
} as const;

export const CONTROL_BUFFER_KM = 80;

export type FrontStrokeSide = keyof typeof FRONT_LINE_COLOR;

export interface FrontTrace {
  sector: string;
  date: string;
  allied: LngLat[];
  axis: LngLat[];
  /** Sourced weekly held-area ring. Missing rings fall back to an 80 km buffer. */
  polygon?: LngLat[];
}

const KM_PER_DEG = 111.32;
const CHAIKIN_PASSES = 2;
export const FRONT_LERP_MS = 200;

function lerpPoint(a: LngLat, b: LngLat, t: number): LngLat {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function km(a: LngLat, b: LngLat): number {
  const midLat = ((a[1] + b[1]) / 2) * (Math.PI / 180);
  const dx = (b[0] - a[0]) * Math.cos(midLat);
  const dy = b[1] - a[1];
  return Math.hypot(dx, dy) * KM_PER_DEG;
}

function resample(line: LngLat[], count: number): LngLat[] {
  if (line.length < 2 || count < 2) return line.slice();
  const lengths: number[] = [0];
  let total = 0;
  for (let i = 1; i < line.length; i += 1) {
    const prev = line[i - 1];
    const next = line[i];
    if (!prev || !next) continue;
    total += km(prev, next);
    lengths.push(total);
  }
  if (total <= 0) return line.slice(0, 1);
  const out: LngLat[] = [];
  for (let i = 0; i < count; i += 1) {
    const target = (i / (count - 1)) * total;
    let seg = 1;
    while (seg < lengths.length && (lengths[seg] ?? 0) < target) seg += 1;
    const a = line[seg - 1];
    const b = line[seg] ?? a;
    const start = lengths[seg - 1] ?? 0;
    const end = lengths[seg] ?? start;
    const span = Math.max(0.000001, end - start);
    if (a && b) out.push(lerpPoint(a, b, (target - start) / span));
  }
  return out;
}

/** Corner-cutting. Keeps the first and last sourced vertices. */
export function chaikin(line: LngLat[], iterations = CHAIKIN_PASSES): LngLat[] {
  if (line.length < 2) return line.slice();
  let points = line;
  for (let pass = 0; pass < iterations; pass += 1) {
    const first = points[0];
    const last = points[points.length - 1];
    if (!first || !last) break;
    const next: LngLat[] = [first];
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      if (!a || !b) continue;
      next.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]]);
      next.push([0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
    }
    next.push(last);
    points = next;
  }
  return points;
}

export function lerpLine(from: LngLat[], to: LngLat[], t: number): LngLat[] {
  if (from.length < 2) return to.slice();
  if (to.length < 2) return t >= 1 ? to.slice() : from.slice();
  const count = Math.max(from.length, to.length);
  const a = resample(from, count);
  const b = resample(to, count);
  return a.map((point, index) => lerpPoint(point, b[index] ?? point, t));
}

export function lerpTraces(from: readonly FrontTrace[], to: readonly FrontTrace[], t: number): FrontTrace[] {
  return to.map((next) => {
    const prev = from.find((item) => item.sector === next.sector);
    if (!prev) return next;
    const polygon =
      prev.polygon && next.polygon && prev.polygon.length >= 4 && next.polygon.length >= 4
        ? lerpLine(prev.polygon, next.polygon, t)
        : next.polygon;
    return {
      sector: next.sector,
      date: next.date,
      allied: lerpLine(prev.allied, next.allied, t),
      axis: lerpLine(prev.axis, next.axis, t),
      polygon,
    };
  });
}

/** True when the same sector has two keyed dates with drawable geometry. */
export function canLerpFronts(
  from: readonly FrontTrace[],
  to: readonly FrontTrace[],
  fromTheater: string,
  toTheater: string,
): boolean {
  if (fromTheater !== toTheater) return false;
  return to.some((next) => {
    const prev = from.find((item) => item.sector === next.sector);
    if (!prev || prev.date === next.date) return false;
    const allied = prev.allied.length >= 2 && next.allied.length >= 2;
    const axis = prev.axis.length >= 2 && next.axis.length >= 2;
    const polygon = (prev.polygon?.length ?? 0) >= 4 && (next.polygon?.length ?? 0) >= 4;
    return allied || axis || polygon;
  });
}

function tangentNormal(line: LngLat[], index: number): { nx: number; ny: number } {
  const prev = line[Math.max(0, index - 1)] ?? line[index];
  const next = line[Math.min(line.length - 1, index + 1)] ?? line[index];
  if (!prev || !next) return { nx: 0, ny: 1 };
  const latScale = Math.max(0.2, Math.cos((((prev[1] + next[1]) / 2) * Math.PI) / 180));
  let tx = (next[0] - prev[0]) * latScale;
  let ty = next[1] - prev[1];
  const len = Math.hypot(tx, ty) || 1;
  tx /= len;
  ty /= len;
  return { nx: -ty, ny: tx };
}

function offsetPoint(point: LngLat, nx: number, ny: number, distanceKm: number): LngLat {
  const latScale = Math.max(0.2, Math.cos((point[1] * Math.PI) / 180));
  return [point[0] + (nx * distanceKm) / (KM_PER_DEG * latScale), point[1] + (ny * distanceKm) / KM_PER_DEG];
}

function closeRing(coordinates: LngLat[]): LngLat[] {
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  if (!first || !last) return coordinates;
  if (first[0] === last[0] && first[1] === last[1]) return coordinates;
  return [...coordinates, first];
}

/** West on the Eastern Front, south elsewhere — Axis-held side of a north/east-facing line. */
function axisSideSign(line: LngLat[], theaterId: TheaterId): number {
  const mid = Math.floor(line.length / 2);
  const { nx, ny } = tangentNormal(line, mid);
  if (theaterId === "eastern-front") return nx < 0 ? 1 : -1;
  return ny < 0 ? 1 : -1;
}

/** Ribbon on one side of a polyline. Fallback when no sourced held-area polygon exists. */
function controlRibbon(line: LngLat[], theaterId: TheaterId, towardAxis: boolean): LngLat[] {
  if (line.length < 2) return [];
  const axisSign = axisSideSign(line, theaterId);
  const sign = towardAxis ? axisSign : -axisSign;
  const outer = line.map((point, index) => {
    const { nx, ny } = tangentNormal(line, index);
    return offsetPoint(point, nx, ny, CONTROL_BUFFER_KM * sign);
  });
  return closeRing([...line, ...outer.reverse()]);
}

function sourcedRing(polygon: LngLat[] | undefined): LngLat[] {
  if (!polygon || polygon.length < 4) return [];
  return closeRing(polygon);
}

function polygonSide(trace: FrontTrace, theaterId: TheaterId): FrontStrokeSide {
  if (trace.axis.length < 2 && trace.allied.length >= 2) return friendSide(theaterId);
  return "axis";
}

export function friendSide(theaterId: TheaterId): FrontStrokeSide {
  return theaterId === "eastern-front" ? "soviet" : "allied";
}

/** Default on only for the Eastern Front. Dense lodgement theaters stay off. */
export function controlAreasDefault(theaterId: TheaterId): boolean {
  return theaterId === "eastern-front";
}

export interface ControlFill {
  side: FrontStrokeSide;
  coordinates: LngLat[];
  approximate: boolean;
}

export interface PreparedFront {
  lines: { side: FrontStrokeSide; coordinates: LngLat[] }[];
  fills: ControlFill[];
}

/**
 * Smooth sourced polylines for drawing. Two sides → opposing HoI4 strokes.
 * Control fills use a sourced polygon when present, else an 80 km buffer tagged approximate.
 */
export function prepareFrontDraw(traces: readonly FrontTrace[], theaterId: TheaterId): PreparedFront {
  const friend = friendSide(theaterId);
  const lines: PreparedFront["lines"] = [];
  const fills: ControlFill[] = [];
  for (const trace of traces) {
    const allied = trace.allied.length >= 2 ? chaikin(trace.allied) : [];
    const axis = trace.axis.length >= 2 ? chaikin(trace.axis) : [];
    if (allied.length >= 2) lines.push({ side: friend, coordinates: allied });
    if (axis.length >= 2) lines.push({ side: "axis", coordinates: axis });

    const sourced = sourcedRing(trace.polygon);
    const sourcedSide = polygonSide(trace, theaterId);

    if (sourced.length >= 4 && sourcedSide === "axis") {
      fills.push({ side: "axis", coordinates: sourced, approximate: false });
    } else {
      const axisLine = axis.length >= 2 ? axis : allied;
      if (axisLine.length >= 2) {
        fills.push({ side: "axis", coordinates: controlRibbon(axisLine, theaterId, true), approximate: true });
      }
    }

    if (sourced.length >= 4 && sourcedSide === friend) {
      fills.push({ side: friend, coordinates: sourced, approximate: false });
    } else {
      const friendLine = allied.length >= 2 ? allied : axis;
      if (friendLine.length >= 2) {
        fills.push({ side: friend, coordinates: controlRibbon(friendLine, theaterId, false), approximate: true });
      }
    }
  }
  return { lines, fills };
}

export function frontLinesData(prepared: PreparedFront): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: prepared.lines
      .filter((line) => line.coordinates.length >= 2)
      .map((line, index) => ({
        type: "Feature" as const,
        properties: { id: `front-${line.side}-${index}`, side: line.side },
        geometry: { type: "LineString" as const, coordinates: line.coordinates },
      })),
  };
}

export function controlFillData(prepared: PreparedFront): FeatureCollection<Polygon> {
  return {
    type: "FeatureCollection",
    features: prepared.fills
      .filter((fill) => fill.coordinates.length >= 4)
      .map((fill, index) => ({
        type: "Feature" as const,
        properties: {
          id: `front-fill-${fill.side}-${index}`,
          side: fill.side,
          approximate: fill.approximate ? 1 : 0,
        },
        geometry: { type: "Polygon" as const, coordinates: [fill.coordinates] },
      })),
  };
}

export const CONTROL_FILL_COLOR_EXPR = [
  "match",
  ["get", "side"],
  "axis",
  CONTROL_FILL_COLOR.axis,
  "soviet",
  CONTROL_FILL_COLOR.soviet,
  "allied",
  CONTROL_FILL_COLOR.allied,
  CONTROL_FILL_COLOR.axis,
] as const;

export const CONTROL_FILL_OPACITY_EXPR = [
  "match",
  ["get", "side"],
  "axis",
  CONTROL_FILL_OPACITY.axis,
  "soviet",
  CONTROL_FILL_OPACITY.soviet,
  "allied",
  CONTROL_FILL_OPACITY.allied,
  CONTROL_FILL_OPACITY.axis,
] as const;

export const CONTROL_OUTLINE_COLOR_EXPR = [
  "match",
  ["get", "side"],
  "axis",
  CONTROL_OUTLINE_COLOR.axis,
  "soviet",
  CONTROL_OUTLINE_COLOR.soviet,
  "allied",
  CONTROL_OUTLINE_COLOR.allied,
  CONTROL_OUTLINE_COLOR.axis,
] as const;

export const FRONT_WIDTH_CASING = ["interpolate", ["linear"], ["zoom"], 4, 7, 9, 14] as const;
export const FRONT_WIDTH_FILL = ["interpolate", ["linear"], ["zoom"], 4, 4, 9, 9] as const;
export const FRONT_WIDTH_GLOW = ["interpolate", ["linear"], ["zoom"], 4, 10, 9, 15] as const;

export const FRONT_COLOR_EXPR = [
  "match",
  ["get", "side"],
  "allied",
  FRONT_LINE_COLOR.allied,
  "axis",
  FRONT_LINE_COLOR.axis,
  "soviet",
  FRONT_LINE_COLOR.soviet,
  FRONT_LINE_COLOR.allied,
] as const;
