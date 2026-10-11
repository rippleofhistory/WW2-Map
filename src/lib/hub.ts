import { isTheaterId } from "../data/theaters.ts";
import { isValidWarDate } from "./dates.ts";
import type { TheaterId } from "../types.ts";

export const HUB_MESSAGE_SOURCE = "ww2hub";

export interface HubBattleStop {
  id: string;
  name: string;
  date: string;
  endDate: string | null;
  location: string;
  theater: string;
  mapTheater: TheaterId | null;
}

export interface HubUnitRef {
  id: string;
  name: string;
  nation: string;
  branch: string;
  mapId: string | null;
  plotted: boolean;
  path: string;
  battles: HubBattleStop[];
}

const LOCAL_HUB = "http://127.0.0.1:5173";

function stripSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function hubOrigin(): string {
  const env = stripSlash(String(import.meta.env.VITE_HUB_URL ?? ""));
  if (env) return env;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return LOCAL_HUB;
  }
  return "https://www.ww2hub.net";
}

export function hubUnitUrl(path: string): string {
  const origin = hubOrigin();
  if (path.startsWith("http")) return path;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function allowedHubOrigins(): string[] {
  return [...new Set([hubOrigin(), "https://www.ww2hub.net", "https://ww2hub.net", LOCAL_HUB, "http://localhost:5173"])];
}

export function isHubOrigin(origin: string): boolean {
  return allowedHubOrigins().includes(stripSlash(origin));
}

export function mapTheaterOf(hubTheater: string | null | undefined, battleId: string, startDate: string): TheaterId | null {
  const label = String(hubTheater || "").toLowerCase();
  const date = String(startDate || "");
  if (battleId === "normandy" || (date >= "1944-06-06" && date <= "1944-08-31" && /western|normandy/.test(label))) {
    return "normandy";
  }
  if (label.includes("north africa")) return "north-africa";
  if (label.includes("burma") || label.includes("southeast asia") || label.includes("china-burma")) return "burma";
  if (label.includes("pacific") || (label.includes("china") && !label.includes("burma"))) return "pacific";
  if (label.includes("eastern")) return "eastern-front";
  if (label.includes("mediterranean")) return "italy";
  if (label.includes("western") || label.includes("scandinavia") || label.includes("atlantic") || label.includes("air")) {
    return "nw-europe";
  }
  return null;
}

function asStop(value: unknown): HubBattleStop | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const id = typeof row.id === "string" ? row.id : "";
  const name = typeof row.name === "string" ? row.name : "";
  const date = typeof row.date === "string" && isValidWarDate(row.date) ? row.date : "";
  if (!id || !name || !date) return null;
  const mapTheaterRaw = typeof row.mapTheater === "string" ? row.mapTheater : "";
  return {
    id,
    name,
    date,
    endDate: typeof row.endDate === "string" && isValidWarDate(row.endDate) ? row.endDate : null,
    location: typeof row.location === "string" ? row.location : "",
    theater: typeof row.theater === "string" ? row.theater : "",
    mapTheater: isTheaterId(mapTheaterRaw) ? mapTheaterRaw : mapTheaterOf(typeof row.theater === "string" ? row.theater : "", id, date),
  };
}

export function parseHubUnit(value: unknown): HubUnitRef | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const id = typeof row.id === "string" ? row.id.trim() : "";
  const name = typeof row.name === "string" ? row.name.trim() : "";
  if (!id || !name) return null;
  const battles = Array.isArray(row.battles) ? row.battles.map(asStop).filter((item): item is HubBattleStop => item !== null) : [];
  const mapId = typeof row.mapId === "string" && row.mapId ? row.mapId : null;
  return {
    id,
    name,
    nation: typeof row.nation === "string" ? row.nation : "",
    branch: typeof row.branch === "string" ? row.branch : "",
    mapId,
    plotted: Boolean(mapId) || row.plotted === true,
    path: typeof row.path === "string" && row.path ? row.path : `/unit/${encodeURIComponent(id)}`,
    battles,
  };
}

export function stopForDate(ref: HubUnitRef, date: string): HubBattleStop | null {
  const previous = [...ref.battles].reverse().find((stop) => stop.date <= date) ?? null;
  return previous ?? ref.battles[0] ?? null;
}

export async function fetchHubUnit(id: string): Promise<HubUnitRef | null> {
  const origin = hubOrigin();
  if (!origin || !id) return null;
  try {
    const response = await fetch(`${origin}/api/map/units/${encodeURIComponent(id)}`);
    if (!response.ok) return null;
    return parseHubUnit(await response.json());
  } catch {
    return null;
  }
}

export interface HubShowMessage {
  date: string | null;
  theater: TheaterId | null;
  unit: HubUnitRef | null;
}

export function readHubMessage(data: unknown): HubShowMessage | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  if (row.source !== HUB_MESSAGE_SOURCE) return null;
  if (row.type !== "showUnit" && row.type !== "setDate") return null;
  const date = typeof row.date === "string" && isValidWarDate(row.date) ? row.date : null;
  const theater = typeof row.theater === "string" && isTheaterId(row.theater) ? row.theater : null;
  const unit = row.unit ? parseHubUnit(row.unit) : null;
  return { date, theater, unit };
}
