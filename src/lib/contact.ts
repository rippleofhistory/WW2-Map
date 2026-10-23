import type { Side } from "../types.ts";

export type LngLat = [number, number];

const KM_PER_DEG = 111.32;
export const FRONT_REACH_KM = 40;
const OFFSET_KM = 1.55;
const PAIR_KM = 18;
const TICK_KM = 1.35;
const TICK_SPACING_KM = 7.5;

export interface PaintedFront {
  contact: LngLat[];
  alliedFill: LngLat[];
  axisFill: LngLat[];
  ticks: LngLat[][];
}

export interface UnitPost {
  unitId: string;
  side: Side;
  lng: number;
  lat: number;
  sourcedLng: number;
  sourcedLat: number;
  onFront: boolean;
  alongKm: number;
  opponentId: string | null;
}

function km(a: LngLat, b: LngLat): number {
  const midLat = ((a[1] + b[1]) / 2) * (Math.PI / 180);
  const dx = (b[0] - a[0]) * Math.cos(midLat);
  const dy = b[1] - a[1];
  return Math.hypot(dx, dy) * KM_PER_DEG;
}

function lerp(a: LngLat, b: LngLat, t: number): LngLat {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function offsetPoint(point: LngLat, nx: number, ny: number, distanceKm: number): LngLat {
  const latScale = Math.max(0.2, Math.cos((point[1] * Math.PI) / 180));
  return [point[0] + (nx * distanceKm) / (KM_PER_DEG * latScale), point[1] + (ny * distanceKm) / KM_PER_DEG];
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
    const t = (target - start) / span;
    if (a && b) out.push(lerp(a, b, t));
  }
  return out;
}

function closeRing(coordinates: LngLat[]): LngLat[] {
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  if (!first || !last) return coordinates;
  if (first[0] === last[0] && first[1] === last[1]) return coordinates;
  return [...coordinates, first];
}

function band(a: LngLat[], b: LngLat[]): LngLat[] {
  if (a.length < 2 || b.length < 2) return [];
  return closeRing([...a, ...[...b].reverse()]);
}

function tangentNormal(line: LngLat[], index: number): { nx: number; ny: number; tx: number; ty: number } {
  const prev = line[Math.max(0, index - 1)] ?? line[index];
  const next = line[Math.min(line.length - 1, index + 1)] ?? line[index];
  if (!prev || !next) return { nx: 0, ny: 1, tx: 1, ty: 0 };
  const latScale = Math.max(0.2, Math.cos((((prev[1] + next[1]) / 2) * Math.PI) / 180));
  let tx = (next[0] - prev[0]) * latScale;
  let ty = next[1] - prev[1];
  const len = Math.hypot(tx, ty) || 1;
  tx /= len;
  ty /= len;
  return { tx, ty, nx: -ty, ny: tx };
}

function nearestOnLine(line: LngLat[], point: LngLat): { point: LngLat; alongKm: number; index: number; distanceKm: number } {
  let best = { point: line[0] ?? point, alongKm: 0, index: 0, distanceKm: Infinity };
  let walked = 0;
  for (let i = 1; i < line.length; i += 1) {
    const a = line[i - 1];
    const b = line[i];
    if (!a || !b) continue;
    const seg = km(a, b);
    const latScale = Math.max(0.2, Math.cos((((a[1] + b[1]) / 2) * Math.PI) / 180));
    const abx = (b[0] - a[0]) * latScale;
    const aby = b[1] - a[1];
    const apx = (point[0] - a[0]) * latScale;
    const apy = point[1] - a[1];
    const ab2 = abx * abx + aby * aby || 1;
    const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
    const hit: LngLat = lerp(a, b, t);
    const distanceKm = km(point, hit);
    if (distanceKm < best.distanceKm) {
      best = { point: hit, alongKm: walked + t * seg, index: i - 1, distanceKm };
    }
    walked += seg;
  }
  return best;
}

function alliedNormal(contact: LngLat[], allied: LngLat[]): { nx: number; ny: number } {
  const mid = Math.floor(contact.length / 2);
  const { nx, ny } = tangentNormal(contact, mid);
  const c = contact[mid];
  const a = allied[mid] ?? allied[0];
  if (!c || !a) return { nx, ny };
  const latScale = Math.max(0.2, Math.cos((c[1] * Math.PI) / 180));
  const dx = (a[0] - c[0]) * latScale;
  const dy = a[1] - c[1];
  if (dx * nx + dy * ny < 0) return { nx: -nx, ny: -ny };
  return { nx, ny };
}

export function kmToContact(lng: number, lat: number, contact: LngLat[]): number {
  if (contact.length < 2) return Number.POSITIVE_INFINITY;
  return nearestOnLine(contact, [lng, lat]).distanceKm;
}

export function postUnitsOnFronts(
  units: readonly { unitId: string; side: Side; lng: number; lat: number }[],
  fronts: readonly { allied: LngLat[]; axis: LngLat[] }[],
): UnitPost[] {
  const painted = fronts
    .map((front) => ({ front, paint: paintFront(front) }))
    .filter((item): item is { front: { allied: LngLat[]; axis: LngLat[] }; paint: PaintedFront } =>
      Boolean(item.paint && item.paint.contact.length >= 2),
    );
  if (painted.length === 0) return postUnitsOnContact(units, [], []);
  if (painted.length === 1) {
    const only = painted[0];
    return only ? postUnitsOnContact(units, only.paint.contact, only.front.allied) : postUnitsOnContact(units, [], []);
  }
  const groups: { unitId: string; side: Side; lng: number; lat: number }[][] = painted.map(() => []);
  const far: { unitId: string; side: Side; lng: number; lat: number }[] = [];
  for (const unit of units) {
    let best = -1;
    let bestKm = FRONT_REACH_KM;
    painted.forEach((item, index) => {
      const distance = kmToContact(unit.lng, unit.lat, item.paint.contact);
      if (distance < bestKm) {
        bestKm = distance;
        best = index;
      }
    });
    if (best < 0) far.push(unit);
    else groups[best]?.push(unit);
  }
  const posts = postUnitsOnContact(far, [], []);
  painted.forEach((item, index) => {
    const group = groups[index];
    if (!group || group.length === 0) return;
    posts.push(...postUnitsOnContact(group, item.paint.contact, item.front.allied));
  });
  return posts;
}

export function paintFront(front: { allied: LngLat[]; axis: LngLat[]; polygon?: LngLat[] } | null): PaintedFront | null {
  if (!front) return null;
  const allied = front.allied;
  const axis = front.axis;
  if (allied.length < 2 || axis.length < 2) {
    if (front.polygon && front.polygon.length >= 4) {
      return { contact: [], alliedFill: [], axisFill: [], ticks: [] };
    }
    return null;
  }
  const count = Math.max(allied.length, axis.length, 8);
  const a = resample(allied, count);
  const b = resample(axis, count);
  const contact: LngLat[] = a.map((point, index) => {
    const other = b[index] ?? point;
    return [(point[0] + other[0]) / 2, (point[1] + other[1]) / 2];
  });
  const ticks: LngLat[][] = [];
  let since = 0;
  for (let i = 1; i < contact.length - 1; i += 1) {
    const prev = contact[i - 1];
    const cur = contact[i];
    if (!prev || !cur) continue;
    since += km(prev, cur);
    if (since < TICK_SPACING_KM) continue;
    since = 0;
    const { nx, ny } = tangentNormal(contact, i);
    ticks.push([offsetPoint(cur, nx, ny, TICK_KM), offsetPoint(cur, -nx, -ny, TICK_KM)]);
  }
  return {
    contact,
    alliedFill: band(a, contact),
    axisFill: band(contact, b),
    ticks,
  };
}

export function postUnitsOnContact(
  units: readonly { unitId: string; side: Side; lng: number; lat: number }[],
  contact: LngLat[],
  alliedLine: LngLat[],
): UnitPost[] {
  if (contact.length < 2) {
    return units.map((unit) => ({
      unitId: unit.unitId,
      side: unit.side,
      lng: unit.lng,
      lat: unit.lat,
      sourcedLng: unit.lng,
      sourcedLat: unit.lat,
      onFront: false,
      alongKm: 0,
      opponentId: null,
    }));
  }
  const facing = alliedNormal(contact, alliedLine.length >= 2 ? resample(alliedLine, contact.length) : contact);
  const raw: UnitPost[] = units.map((unit) => {
    const nearest = nearestOnLine(contact, [unit.lng, unit.lat]);
    const onFront = nearest.distanceKm <= FRONT_REACH_KM;
    if (!onFront) {
      return {
        unitId: unit.unitId,
        side: unit.side,
        lng: unit.lng,
        lat: unit.lat,
        sourcedLng: unit.lng,
        sourcedLat: unit.lat,
        onFront: false,
        alongKm: nearest.alongKm,
        opponentId: null,
      };
    }
    const sign = unit.side === "allied" ? 1 : -1;
    const posted = offsetPoint(nearest.point, facing.nx, facing.ny, OFFSET_KM * sign);
    return {
      unitId: unit.unitId,
      side: unit.side,
      lng: posted[0],
      lat: posted[1],
      sourcedLng: unit.lng,
      sourcedLat: unit.lat,
      onFront: true,
      alongKm: nearest.alongKm,
      opponentId: null,
    };
  });

  const buckets = new Map<string, UnitPost[]>();
  for (const post of raw) {
    if (!post.onFront) continue;
    const key = `${post.side}:${Math.round(post.alongKm / 3)}`;
    const group = buckets.get(key);
    if (group) group.push(post);
    else buckets.set(key, [post]);
  }
  for (const group of buckets.values()) {
    if (group.length < 2) continue;
    const { tx, ty } = tangentNormal(contact, Math.max(1, Math.min(contact.length - 2, Math.round((group[0]?.alongKm ?? 0) / 8))));
    group.forEach((post, index) => {
      const spread = (index - (group.length - 1) / 2) * 0.85;
      const moved = offsetPoint([post.lng, post.lat], tx, ty, spread);
      post.lng = moved[0];
      post.lat = moved[1];
    });
  }

  const allied = raw.filter((post) => post.onFront && post.side === "allied");
  const axis = raw.filter((post) => post.onFront && post.side === "axis");
  for (const post of allied) {
    let best: UnitPost | null = null;
    let bestKm = PAIR_KM;
    for (const other of axis) {
      const gap = Math.abs(post.alongKm - other.alongKm);
      if (gap < bestKm) {
        bestKm = gap;
        best = other;
      }
    }
    if (best) post.opponentId = best.unitId;
  }
  for (const post of axis) {
    let best: UnitPost | null = null;
    let bestKm = PAIR_KM;
    for (const other of allied) {
      const gap = Math.abs(post.alongKm - other.alongKm);
      if (gap < bestKm) {
        bestKm = gap;
        best = other;
      }
    }
    if (best) post.opponentId = best.unitId;
  }
  return raw;
}

export function clashSegments(posts: readonly UnitPost[]): LngLat[][] {
  const seen = new Set<string>();
  const lines: LngLat[][] = [];
  const byId = new Map(posts.map((post) => [post.unitId, post]));
  for (const post of posts) {
    if (!post.onFront || !post.opponentId) continue;
    const other = byId.get(post.opponentId);
    if (!other) continue;
    const key = [post.unitId, other.unitId].sort().join(":");
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push([
      [post.lng, post.lat],
      [other.lng, other.lat],
    ]);
  }
  return lines;
}
