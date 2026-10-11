import type { TheaterId } from "../types.ts";

/** URL aliases. Canonical ids live in public/data/normandy/units.json. Hub ids resolve here when a track exists. */
export const UNIT_ALIASES: Record<string, string> = {
  "sherwood-rangers": "sherwood-rangers-yeomanry",
  "us-101st": "us-101st-airborne",
  "us-1st-inf": "us-1st-infantry",
  "cdn-3rd": "canadian-3rd-division",
  "uk-7th-armoured": "british-7th-armoured",
  "uk-3rd-inf": "british-3rd-division",
  "uk-50th-inf": "british-50th-division",
  "de-2-ss": "de-2-ss-panzer",
  "de-12-ss": "12th-ss",
  "de-21-panzer": "21st-panzer",
};

export const MAP_TO_HUB: Record<string, string> = {
  "us-101st-airborne": "us-101st",
  "us-1st-infantry": "us-1st-inf",
  "canadian-3rd-division": "cdn-3rd",
  "british-7th-armoured": "uk-7th-armoured",
  "british-3rd-division": "uk-3rd-inf",
  "british-50th-division": "uk-50th-inf",
  "de-2-ss-panzer": "de-2-ss",
  "12th-ss": "de-12-ss",
  "21st-panzer": "de-21-panzer",
};

export const FEATURED_UNIT_IDS = ["easy-company-506", "sherwood-rangers-yeomanry", "de-2-ss-panzer"] as const;

const UNIT_THEATER: Record<string, TheaterId> = {
  "easy-company-506": "normandy",
  "sherwood-rangers-yeomanry": "normandy",
  "de-2-ss-panzer": "normandy",
  "us-101st-airborne": "normandy",
  "us-506-pir": "normandy",
  "us-1st-infantry": "normandy",
  "british-3rd-division": "normandy",
  "british-50th-division": "normandy",
  "british-7th-armoured": "normandy",
  "canadian-3rd-division": "normandy",
  "12th-ss": "normandy",
  "21st-panzer": "normandy",
  "4th-county-of-london-yeomanry": "normandy",
  "de-ss-pz-abt-101": "normandy",
};

export function resolveUnitId(id: string | null): string | null {
  if (!id) return null;
  const raw = id.trim();
  if (!raw || !/^[a-z0-9][a-z0-9-]{0,80}$/i.test(raw)) return null;
  return UNIT_ALIASES[raw] ?? raw;
}

export function theaterForUnit(id: string | null): TheaterId | null {
  const canonical = resolveUnitId(id);
  if (!canonical) return null;
  return UNIT_THEATER[canonical] ?? null;
}

export function mapIdForHub(id: string | null): string | null {
  const canonical = resolveUnitId(id);
  if (!canonical) return null;
  return UNIT_THEATER[canonical] ? canonical : null;
}

export function hubIdForMap(id: string | null): string | null {
  if (!id) return null;
  return MAP_TO_HUB[id] ?? id;
}

export function isFeaturedUnit(id: string): boolean {
  const canonical = resolveUnitId(id);
  return canonical !== null && (FEATURED_UNIT_IDS as readonly string[]).includes(canonical);
}
