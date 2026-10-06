import type { Feature, FeatureCollection, Geometry } from "geojson";
import { dayIndex } from "./dates.ts";
import type { OccupationPoint, OccupationState } from "../types.ts";

/** Country fills hide at tactical zoom. Unit pins remain. */
export const OCCUPATION_MAX_ZOOM = 6.25;

export const OVERVIEW_CENTER: [number, number] = [12, 48];
export const OVERVIEW_ZOOM = 3.4;

export const OCCUPATION_WATCH = ["FRA", "GBR", "USA", "ITA", "DEU", "RUS"] as const;

export interface OccupationPlacement {
  state: OccupationState;
  point: OccupationPoint;
  staleDays: number;
}

function ordered(state: OccupationState): OccupationPoint[] {
  return [...state.track].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** Most specific record that includes this ISO code. */
export function stateForCode(states: readonly OccupationState[], code: string): OccupationState | null {
  let chosen: OccupationState | null = null;
  for (const state of states) {
    if (!state.codes.includes(code)) continue;
    if (!chosen || state.codes.length < chosen.codes.length) chosen = state;
  }
  return chosen;
}

/**
 * Last sourced control on or before the date.
 * Missing calendar days keep that control. They are not last-reported badges.
 * Before the first row the country is hidden.
 */
export function occupationOnDate(
  states: readonly OccupationState[],
  code: string,
  date: string,
): OccupationPlacement | null {
  const state = stateForCode(states, code);
  if (!state) return null;
  const track = ordered(state);
  const previous = [...track].reverse().find((point) => point.date <= date) ?? null;
  if (!previous) return null;
  return { state, point: previous, staleDays: dayIndex(date) - dayIndex(previous.date) };
}

export function occupationById(
  states: readonly OccupationState[],
  id: string | null,
  date: string,
): OccupationPlacement | null {
  if (!id) return null;
  const state = states.find((item) => item.id === id) ?? null;
  if (!state) return null;
  const code = state.codes[0];
  if (!code) return null;
  return occupationOnDate(states, code, date);
}

export function paintOccupation(
  regions: FeatureCollection<Geometry, { id: string; name: string }>,
  states: readonly OccupationState[],
  date: string,
): FeatureCollection {
  const features: Feature[] = [];
  for (const feature of regions.features) {
    const code = feature.properties?.id;
    if (!code) continue;
    const placement = occupationOnDate(states, code, date);
    if (!placement) continue;
    features.push({
      type: "Feature",
      geometry: feature.geometry,
      properties: {
        id: placement.state.id,
        iso: code,
        name: placement.state.name,
        side: placement.point.side,
        status: placement.point.status,
        note: placement.point.note,
      },
    });
  }
  return { type: "FeatureCollection", features };
}

export function occupationWatch(states: readonly OccupationState[], date: string): string {
  return OCCUPATION_WATCH.map((code) => {
    const placement = occupationOnDate(states, code, date);
    return placement ? `${code}:${placement.point.side}:${placement.point.status}` : `${code}:-`;
  }).join("|");
}
