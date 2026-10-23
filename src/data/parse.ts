import { isValidWarDate } from "../lib/dates.ts";
import type {
  Battle,
  Confidence,
  ControlSide,
  ControlStatus,
  Echelon,
  FrontCadence,
  FrontLine,
  OccupationPoint,
  OccupationState,
  PlaceLabel,
  Side,
  Theater,
  TheaterId,
  Unit,
  UnitPosition,
} from "../types.ts";
import type { FeatureCollection, Geometry } from "geojson";
import { parseStrength } from "../lib/counter.ts";
import { THEATERS } from "./theaters.ts";

const SIDES = new Set<Side>(["allied", "axis", "soviet", "japanese"]);
const CONTROL_SIDES = new Set<ControlSide>(["allied", "axis", "soviet", "japanese", "neutral"]);
const CONTROL_STATUS = new Set<ControlStatus>(["sovereign", "occupied", "puppet", "cobelligerent", "collapsed"]);
const ECHELONS = new Set<Echelon>(["army-group", "army", "corps", "division", "brigade", "regiment", "battalion", "company"]);
const THEATER_IDS = new Set<TheaterId>(THEATERS.map((theater) => theater.id));
const CONFIDENCE = new Set<Confidence>(["high", "medium", "low"]);
const CADENCE = new Set<FrontCadence>(["daily", "weekly"]);

export interface MapDataset {
  units: Unit[];
  fronts: FrontLine[];
  battles: Battle[];
  labels: PlaceLabel[];
}

export interface TheaterModule {
  units: Unit[];
  fronts: FrontLine[];
  battles: Battle[];
  /** True when units, fronts, and battles are all empty. The map then says "Data coming soon". */
  empty: boolean;
}

export interface MapData extends MapDataset {
  origin: "sample" | "server";
  status: "loading" | "ready" | "missing" | "invalid";
  message: string;
  modules: Record<TheaterId, TheaterModule>;
  frames: Record<TheaterId, Theater>;
  occupation: OccupationState[];
  regions: FeatureCollection<Geometry, { id: string; name: string }>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function finite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function coord(lngValue: unknown, latValue: unknown): [number, number] | null {
  const lng = finite(lngValue);
  const lat = finite(latValue);
  if (lng === null || lat === null) return null;
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null;
  return [lng, lat];
}

function member<T extends string>(value: unknown, allowed: Set<T>): T | null {
  return typeof value === "string" && allowed.has(value as T) ? (value as T) : null;
}

/** Missing confidence is allowed. A bad value rejects the file. */
function parseConfidence(value: unknown): Confidence | undefined | null {
  if (value === undefined) return undefined;
  return member(value, CONFIDENCE);
}

function parseTrack(value: unknown): UnitPosition[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const track: UnitPosition[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    const date = text(item.date);
    const point = coord(item.lng, item.lat);
    const note = text(item.note);
    const source = text(item.source);
    if (!date || !isValidWarDate(date) || !point || !note) return null;
    if (!source) continue;
    const place = text(item.place) ?? undefined;
    const confidence = parseConfidence(item.confidence);
    if (confidence === null) return null;
    let pointTheater: TheaterId | undefined;
    if (item.theater !== undefined) {
      const parsed = member(item.theater, THEATER_IDS);
      if (!parsed) return null;
      pointTheater = parsed;
    }
    track.push({ date, lng: point[0], lat: point[1], note, place, source, confidence, theater: pointTheater });
  }
  if (track.length === 0) return null;
  track.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return track;
}

/** Later files add dated stops to a unit that already exists. Same calendar date keeps the first row. */
export function mergeUnitLists(primary: Unit[], extra: Unit[]): Unit[] {
  const byId = new Map(primary.map((unit) => [unit.id, unit]));
  for (const unit of extra) {
    const existing = byId.get(unit.id);
    if (!existing) {
      byId.set(unit.id, unit);
      continue;
    }
    const seen = new Set(existing.track.map((point) => point.date));
    const track = [...existing.track];
    for (const point of unit.track) {
      if (seen.has(point.date)) continue;
      seen.add(point.date);
      track.push(point);
    }
    track.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    byId.set(unit.id, { ...existing, track });
  }
  return [...byId.values()];
}

export function parseUnits(value: unknown): Unit[] | null {
  if (!Array.isArray(value)) return null;
  const units: Unit[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    const id = text(item.id);
    const name = text(item.name);
    const abbr = text(item.abbr);
    const nation = text(item.nation);
    const side = member(item.side, SIDES);
    const echelon = member(item.echelon, ECHELONS);
    const parent = text(item.parent);
    const theater = member(item.theater, THEATER_IDS);
    const source = text(item.source);
    const confidence = parseConfidence(item.confidence);
    const track = parseTrack(item.track);
    const featured = item.featured === true;
    const strength = parseStrength(item.strength);
    if (!id || !name || !abbr || !nation || !side || !echelon || !parent || !theater || !source || confidence === null || !track) {
      return null;
    }
    units.push({ id, name, abbr, nation, side, echelon, parent, theater, source, confidence, featured, strength, track });
  }
  return units;
}

function parseLine(value: unknown): [number, number][] | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const line: [number, number][] = [];
  for (const item of value) {
    if (!Array.isArray(item)) return null;
    const point = coord(item[0], item[1]);
    if (!point) return null;
    line.push(point);
  }
  return line;
}

/** A weekly front ring. At least four positions. An empty file has no rings. */
function parseRing(value: unknown): [number, number][] | null {
  if (!Array.isArray(value) || value.length < 4) return null;
  const ring: [number, number][] = [];
  for (const item of value) {
    if (!Array.isArray(item)) return null;
    const point = coord(item[0], item[1]);
    if (!point) return null;
    ring.push(point);
  }
  return ring;
}

function hasOwn(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

/**
 * A front is either a daily allied/axis polyline or a weekly polygon ring.
 * An empty array is valid. A polygon short of four positions rejects the file.
 */
export function parseFronts(value: unknown): FrontLine[] | null {
  if (!Array.isArray(value)) return null;
  const fronts: FrontLine[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    const id = text(item.id);
    const date = text(item.date);
    const theater = member(item.theater, THEATER_IDS);
    const label = text(item.label);
    const source = text(item.source);
    const confidence = parseConfidence(item.confidence);
    if (!id || !date || !isValidWarDate(date) || !theater || !label || !source || confidence === null) return null;
    const hasPolygon = hasOwn(item, "polygon");
    const hasLines = hasOwn(item, "allied") || hasOwn(item, "axis");
    let polygon: [number, number][] | undefined;
    let allied: [number, number][] = [];
    let axis: [number, number][] = [];
    if (hasPolygon) {
      const ring = parseRing(item.polygon);
      if (!ring) return null;
      polygon = ring;
    }
    if (hasLines) {
      const alliedLine = parseLine(item.allied);
      const axisLine = parseLine(item.axis);
      if (!alliedLine || !axisLine) return null;
      allied = alliedLine;
      axis = axisLine;
    }
    if (!hasPolygon && !hasLines) return null;
    let sector: string | undefined;
    if (item.sector !== undefined) {
      const name = text(item.sector);
      if (!name || !/^[a-z][a-z0-9-]{0,39}$/.test(name)) return null;
      sector = name;
    }
    let until: string | undefined;
    if (item.until !== undefined) {
      const end = text(item.until);
      if (!end || !isValidWarDate(end) || end <= date) return null;
      until = end;
    }
    fronts.push({ id, date, theater, label, source, confidence, sector, until, allied, axis, polygon });
  }
  fronts.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return fronts;
}

export function parseBattles(value: unknown): Battle[] | null {
  if (!Array.isArray(value)) return null;
  const battles: Battle[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    const id = text(item.id);
    const name = text(item.name);
    const theater = member(item.theater, THEATER_IDS);
    const date = text(item.date);
    const point = coord(item.lng, item.lat);
    const zoom = finite(item.zoom);
    const summary = text(item.summary);
    const source = text(item.source);
    const confidence = parseConfidence(item.confidence);
    if (!id || !name || !theater || !date || !isValidWarDate(date) || !point || zoom === null || !summary || !source || confidence === null) {
      return null;
    }
    let units: string[] | undefined;
    if (item.units !== undefined) {
      if (!Array.isArray(item.units)) return null;
      units = [];
      for (const entry of item.units) {
        const unitId = text(entry);
        if (!unitId) return null;
        units.push(unitId);
      }
    }
    battles.push({ id, name, theater, date, lng: point[0], lat: point[1], zoom, summary, source, confidence, units });
  }
  return battles;
}

function parseLabels(value: unknown): PlaceLabel[] | null {
  if (!Array.isArray(value)) return null;
  const labels: PlaceLabel[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    const id = text(item.id);
    const name = text(item.name);
    const theater = member(item.theater, THEATER_IDS);
    const point = coord(item.lng, item.lat);
    const source = text(item.source);
    if (!id || !name || !theater || !point || !source) return null;
    labels.push({ id, name, theater, lng: point[0], lat: point[1], source });
  }
  return labels;
}

/** Returns null when the file is empty or malformed so the embedded sample can stay up. */
export function parseNormandy(value: unknown): MapDataset | null {
  if (!isRecord(value)) return null;
  const units = parseUnits(value.units);
  const fronts = parseFronts(value.fronts);
  const battles = parseBattles(value.battles);
  const labels = parseLabels(value.labels);
  if (!units || !fronts || !battles || !labels) return null;
  if (units.length === 0 && fronts.length === 0 && battles.length === 0) return null;
  return { units, fronts, battles, labels };
}

export function parseOccupation(value: unknown): OccupationState[] | null {
  if (!Array.isArray(value)) return null;
  const states: OccupationState[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    const id = text(item.id);
    const name = text(item.name);
    const source = text(item.source);
    const confidence = parseConfidence(item.confidence);
    if (!id || !name || !source || !confidence || !Array.isArray(item.codes) || !Array.isArray(item.track)) return null;
    const codes: string[] = [];
    for (const code of item.codes) {
      const iso = text(code);
      if (!iso) return null;
      codes.push(iso);
    }
    if (codes.length === 0) return null;
    const track: OccupationPoint[] = [];
    for (const entry of item.track) {
      if (!isRecord(entry)) return null;
      const date = text(entry.date);
      const side = member(entry.side, CONTROL_SIDES);
      const status = member(entry.status, CONTROL_STATUS);
      const note = text(entry.note);
      const pointSource = text(entry.source);
      const pointConfidence = parseConfidence(entry.confidence);
      if (!date || !isValidWarDate(date) || !side || !status || !note || !pointSource || !pointConfidence) continue;
      track.push({ date, side, status, note, source: pointSource, confidence: pointConfidence });
    }
    if (track.length === 0) return null;
    track.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    states.push({ id, name, codes, source, confidence, track });
  }
  return states;
}

export function parseRegions(value: unknown): FeatureCollection<Geometry, { id: string; name: string }> | null {
  if (!isRecord(value) || value.type !== "FeatureCollection" || !Array.isArray(value.features)) return null;
  const features: FeatureCollection<Geometry, { id: string; name: string }>["features"] = [];
  for (const item of value.features) {
    if (!isRecord(item) || item.type !== "Feature" || !isRecord(item.properties) || !item.geometry) return null;
    const id = text(item.properties.id);
    const name = text(item.properties.name);
    if (!id || !name) return null;
    features.push({
      type: "Feature",
      properties: { id, name },
      geometry: item.geometry as Geometry,
    });
  }
  return { type: "FeatureCollection", features };
}

const EMPTY_REGIONS: FeatureCollection<Geometry, { id: string; name: string }> = { type: "FeatureCollection", features: [] };

export function emptyRegions(): FeatureCollection<Geometry, { id: string; name: string }> {
  return EMPTY_REGIONS;
}

/** Overlay for public/data/normandy/theaters.json. Camera frame only. */
export function parseTheaterOverlay(value: unknown, fallback: Theater): Theater | null {
  if (!isRecord(value)) return null;
  const id = member(value.id, THEATER_IDS);
  const label = text(value.label);
  const zoom = finite(value.zoom);
  const start = text(value.start);
  const end = text(value.end);
  const frontCadence = member(value.frontCadence, CADENCE);
  const disclaimer = text(value.disclaimer) ?? undefined;
  if (!id || !label || zoom === null || !start || !isValidWarDate(start) || !end || !isValidWarDate(end) || !frontCadence) {
    return null;
  }
  if (!Array.isArray(value.center) || !Array.isArray(value.bounds)) return null;
  const center = coord(value.center[0], value.center[1]);
  if (!center) return null;
  if (value.bounds.length !== 4) return null;
  const west = finite(value.bounds[0]);
  const south = finite(value.bounds[1]);
  const east = finite(value.bounds[2]);
  const north = finite(value.bounds[3]);
  if (west === null || south === null || east === null || north === null) return null;
  return {
    ...fallback,
    id,
    label,
    center,
    zoom,
    bounds: [west, south, east, north],
    start,
    end,
    frontCadence,
    disclaimer,
  };
}
