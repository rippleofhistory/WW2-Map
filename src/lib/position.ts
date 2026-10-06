import { addDays, dayIndex } from "./dates.ts";
import type { PositionStatus, Unit, UnitPosition } from "../types.ts";

export interface Placement {
  lng: number;
  lat: number;
  status: PositionStatus;
  anchor: UnitPosition;
  toward: UnitPosition | null;
  staleDays: number;
}

function ordered(unit: Unit): UnitPosition[] {
  return [...unit.track].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

function mix(from: UnitPosition, to: UnitPosition, fraction: number): { lng: number; lat: number } {
  const t = Math.min(1, Math.max(0, fraction));
  return {
    lng: from.lng + (to.lng - from.lng) * t,
    lat: from.lat + (to.lat - from.lat) * t,
  };
}

/**
 * Exact sample point when that day has one.
 * While playing, glide only to the next calendar day when that day also has a point.
 * A missing date holds the previous point. It is last-reported, including a 1-day gap
 * and when the held point is older than 3 days. No fake town is interpolated.
 * Before the first point, the unit stays hidden.
 */
export function placeUnit(unit: Unit, date: string, fraction: number, playing: boolean): Placement | null {
  const track = ordered(unit);
  if (track.length === 0) return null;
  const exact = track.find((point) => point.date === date) ?? null;
  if (exact) {
    const nextDay = track.find((point) => point.date === addDays(date, 1)) ?? null;
    if (playing && nextDay && fraction > 0) {
      const point = mix(exact, nextDay, fraction);
      return { ...point, status: "moving", anchor: exact, toward: nextDay, staleDays: 0 };
    }
    return { lng: exact.lng, lat: exact.lat, status: "reported", anchor: exact, toward: null, staleDays: 0 };
  }
  const previous = [...track].reverse().find((point) => point.date < date) ?? null;
  if (!previous) return null;
  const staleDays = dayIndex(date) - dayIndex(previous.date);
  return { lng: previous.lng, lat: previous.lat, status: "last-reported", anchor: previous, toward: null, staleDays };
}
