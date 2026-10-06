import type { Battle, Filters, FrontLine, PlaceLabel, TheaterId, Unit } from "../types.ts";

export function frontForDate(fronts: readonly FrontLine[], date: string, theater: TheaterId): FrontLine | null {
  let chosen: FrontLine | null = null;
  for (const front of fronts) {
    if (front.theater !== theater) continue;
    if (front.date <= date && (!chosen || front.date >= chosen.date)) chosen = front;
  }
  return chosen;
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

export function filterUnits(units: readonly Unit[], theater: TheaterId, filters: Filters): Unit[] {
  const query = filters.query.trim().toLowerCase();
  return units.filter((unit) => {
    if (unit.theater !== theater) return false;
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
