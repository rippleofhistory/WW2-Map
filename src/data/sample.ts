import type { Battle, FrontLine, PlaceLabel, Unit } from "../types.ts";

/**
 * Beach labels only. Unit, front, and battle coordinates load from
 * public/data/normandy/*.json. Do not put a second coordinate table here.
 */
export const PLACEHOLDER_SOURCE = "placeholder pending archive geocoding";

export const UNITS: readonly Unit[] = [];
export const FRONTS: readonly FrontLine[] = [];
export const BATTLES: readonly Battle[] = [];

export const LABELS: readonly PlaceLabel[] = [
  { id: "utah", name: "Utah", theater: "normandy", lng: -1.22, lat: 49.43, source: PLACEHOLDER_SOURCE },
  { id: "omaha", name: "Omaha", theater: "normandy", lng: -0.9, lat: 49.39, source: PLACEHOLDER_SOURCE },
  { id: "gold", name: "Gold", theater: "normandy", lng: -0.58, lat: 49.37, source: PLACEHOLDER_SOURCE },
  { id: "juno", name: "Juno", theater: "normandy", lng: -0.46, lat: 49.36, source: PLACEHOLDER_SOURCE },
  { id: "sword", name: "Sword", theater: "normandy", lng: -0.28, lat: 49.34, source: PLACEHOLDER_SOURCE },
  { id: "carentan-label", name: "Carentan", theater: "normandy", lng: -1.246, lat: 49.304, source: PLACEHOLDER_SOURCE },
  { id: "bayeux", name: "Bayeux", theater: "normandy", lng: -0.704, lat: 49.276, source: PLACEHOLDER_SOURCE },
  { id: "caen", name: "Caen", theater: "normandy", lng: -0.37, lat: 49.181, source: PLACEHOLDER_SOURCE },
  { id: "villers-label", name: "Villers-Bocage", theater: "normandy", lng: -0.655, lat: 49.078, source: PLACEHOLDER_SOURCE },
];

export const NATIONS: readonly string[] = [];

export function unitById(_id: string | null): Unit | null {
  return null;
}

export function battleById(_id: string | null): Battle | null {
  return null;
}
