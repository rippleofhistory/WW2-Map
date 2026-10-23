import { theaterContaining } from "../data/theaters.ts";
import type { Battle, Filters, FrontLine, PlaceLabel, TheaterId, Unit, UnitPosition } from "../types.ts";

function frontSector(front: FrontLine): string {
  return front.sector ?? front.theater;
}

/**
 * One live schematic per sector. Distant sectors stay on the map together.
 * A later front in the same sector replaces the earlier one.
 */
export function frontsForDate(
  fronts: readonly FrontLine[],
  date: string,
  theater: TheaterId,
): FrontLine[] {
  const chosen = new Map<string, FrontLine>();
  for (const front of fronts) {
    if (front.theater !== theater) continue;
    if (front.date > date) continue;
    if (front.until && date >= front.until) continue;
    const sector = frontSector(front);
    const previous = chosen.get(sector);
    if (!previous || front.date >= previous.date) chosen.set(sector, front);
  }
  return [...chosen.values()].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** Latest live schematic in the theater. Inspector and data-front keep a single id. */
export function frontForDate(
  fronts: readonly FrontLine[],
  date: string,
  theater: TheaterId,
): FrontLine | null {
  const live = frontsForDate(fronts, date, theater);
  return live[live.length - 1] ?? null;
}

export function pathPlaces(unit: Unit): string[] {
  const places: string[] = [];
  const track = [...unit.track].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  for (const point of track) {
    const place = point.place;
    if (!place || places[places.length - 1] === place) continue;
    places.push(place);
  }
  return places;
}

export function pathSummary(unit: Unit): string {
  const places = pathPlaces(unit);
  if (places.length === 0) return "";
  if (places.length === 1) return places[0] ?? "";
  return `${places[0]} → ${places[places.length - 1]}`;
}

export function unitsInCampaign(
  units: readonly Unit[],
  campaign: { theater: TheaterId; start: string; end: string },
): Unit[] {
  return units.filter((unit) =>
    unit.track.some((point) => {
      if (point.date < campaign.start || point.date > campaign.end) return false;
      return (pointTheater(point) ?? unit.theater) === campaign.theater;
    }),
  );
}

export function pointOnDate(unit: Unit, date: string) {
  return unit.track.find((point) => point.date === date) ?? null;
}

export function pathUntil(unit: Unit, date: string, head?: [number, number]): [number, number][] {
  const line = unit.track.filter((point) => point.date <= date).map((point) => [point.lng, point.lat] as [number, number]);
  if (!head || line.length === 0) return line;
  const last = line[line.length - 1];
  if (last && (last[0] !== head[0] || last[1] !== head[1])) line.push(head);
  return line;
}

export function fullPath(unit: Unit): [number, number][] {
  return unit.track.map((point) => [point.lng, point.lat]);
}

/** Explicit stop theater, or the smallest camera frame that contains the pin. */
export function pointTheater(point: UnitPosition): TheaterId | null {
  return point.theater ?? theaterContaining(point.lng, point.lat);
}

/** Frame for the last sourced stop on or before the date. Hidden units (before the first pin) have none. */
export function theaterAt(unit: Unit, date: string): TheaterId | null {
  let latest: UnitPosition | null = null;
  for (const point of unit.track) {
    if (point.date <= date && (!latest || point.date >= latest.date)) latest = point;
  }
  if (!latest) return null;
  return pointTheater(latest) ?? unit.theater;
}

export function unitTheaters(unit: Unit): TheaterId[] {
  const ids = new Set<TheaterId>([unit.theater]);
  for (const point of unit.track) {
    const id = pointTheater(point);
    if (id) ids.add(id);
  }
  return [...ids];
}

export function filterUnits(units: readonly Unit[], theater: TheaterId, filters: Filters, date: string): Unit[] {
  const query = filters.query.trim().toLowerCase();
  return units.filter((unit) => {
    if (theaterAt(unit, date) !== theater) return false;
    if (filters.side !== "all" && unit.side !== filters.side) return false;
    if (filters.nation !== "all" && unit.nation !== filters.nation) return false;
    if (filters.echelon !== "all" && unit.echelon !== filters.echelon) return false;
    if (!query) return true;
    const haystack = `${unit.name} ${unit.abbr} ${unit.nation} ${unit.parent} ${unit.side}`.toLowerCase();
    return haystack.includes(query);
  });
}

export function battlesForTheater(battles: readonly Battle[], theater: TheaterId): Battle[] {
  return battles.filter((battle) => battle.theater === theater);
}

export function labelsForTheater(labels: readonly PlaceLabel[], theater: TheaterId): PlaceLabel[] {
  return labels.filter((label) => label.theater === theater);
}
