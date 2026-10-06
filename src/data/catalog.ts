import type { TheaterId } from "../types.ts";

/** URL aliases. Canonical ids live in public/data/normandy/units.json. */
export const UNIT_ALIASES: Record<string, string> = {
  "sherwood-rangers": "sherwood-rangers-yeomanry",
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
  const canonical = UNIT_ALIASES[id] ?? id;
  return UNIT_THEATER[canonical] ? canonical : null;
}

export function theaterForUnit(id: string | null): TheaterId | null {
  const canonical = resolveUnitId(id);
  return canonical ? (UNIT_THEATER[canonical] ?? null) : null;
}

export function isFeaturedUnit(id: string): boolean {
  const canonical = resolveUnitId(id);
  return canonical !== null && (FEATURED_UNIT_IDS as readonly string[]).includes(canonical);
}
