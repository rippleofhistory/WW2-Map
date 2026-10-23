import { useEffect, useState, type ReactNode } from "react";
import type { Battle, FrontLine, OccupationState, Theater, TheaterId, Unit } from "../types.ts";
import { MapDataContext } from "./mapContext.ts";
import {
  emptyRegions,
  mergeUnitLists,
  parseBattles,
  parseFronts,
  parseOccupation,
  parseRegions,
  parseTheaterOverlay,
  parseUnits,
  type MapData,
  type TheaterModule,
} from "./parse.ts";
import { LABELS } from "./sample.ts";
import { THEATERS, theaterById } from "./theaters.ts";
import type { FeatureCollection, Geometry } from "geojson";

function emptyModule(): TheaterModule {
  return { units: [], fronts: [], battles: [], empty: true };
}

function initialModules(): Record<TheaterId, TheaterModule> {
  const modules = {} as Record<TheaterId, TheaterModule>;
  for (const theater of THEATERS) modules[theater.id] = emptyModule();
  return modules;
}

function defaultFrames(): Record<TheaterId, Theater> {
  const frames = {} as Record<TheaterId, Theater>;
  for (const theater of THEATERS) frames[theater.id] = theater;
  return frames;
}

const LOADING: MapData = {
  units: [],
  fronts: [],
  battles: [],
  labels: [...LABELS],
  origin: "server",
  status: "loading",
  message: "Loading Normandy JSON…",
  modules: initialModules(),
  frames: defaultFrames(),
  occupation: [],
  regions: emptyRegions(),
};

async function loadModule(id: TheaterId): Promise<TheaterModule | "missing" | "invalid"> {
  let unitsResponse: Response;
  let frontsResponse: Response;
  let battlesResponse: Response;
  try {
    [unitsResponse, frontsResponse, battlesResponse] = await Promise.all([
      fetch(`/data/${id}/units.json`),
      fetch(`/data/${id}/fronts.json`),
      fetch(`/data/${id}/battles.json`),
    ]);
  } catch {
    return "missing";
  }
  if (!unitsResponse.ok || !frontsResponse.ok || !battlesResponse.ok) return "missing";
  try {
    const units = parseUnits(await unitsResponse.json());
    const fronts = parseFronts(await frontsResponse.json());
    const battles = parseBattles(await battlesResponse.json());
    if (!units || !fronts || !battles) return "invalid";
    const empty = units.length === 0 && fronts.length === 0 && battles.length === 0;
    return { units, fronts, battles, empty };
  } catch {
    return "invalid";
  }
}

async function loadNormandyFrame(): Promise<Theater | null> {
  try {
    const response = await fetch("/data/normandy/theaters.json");
    if (!response.ok) return null;
    return parseTheaterOverlay(await response.json(), theaterById("normandy"));
  } catch {
    return null;
  }
}

async function loadOccupation(): Promise<{
  occupation: OccupationState[];
  regions: FeatureCollection<Geometry, { id: string; name: string }>;
} | null> {
  try {
    const [occupationResponse, regionsResponse] = await Promise.all([
      fetch("/data/world/occupation.json"),
      fetch("/data/world/regions.geojson"),
    ]);
    if (!occupationResponse.ok || !regionsResponse.ok) return null;
    const occupation = parseOccupation(await occupationResponse.json());
    const regions = parseRegions(await regionsResponse.json());
    if (!occupation || !regions) return null;
    return { occupation, regions };
  } catch {
    return null;
  }
}

async function loadWorldUnits(): Promise<Unit[]> {
  try {
    const response = await fetch("/data/world/units.json");
    if (!response.ok) return [];
    return parseUnits(await response.json()) ?? [];
  } catch {
    return [];
  }
}

function packFrom(
  modules: Record<TheaterId, TheaterModule>,
  origin: MapData["origin"],
  status: MapData["status"],
  message: string,
  frames: Record<TheaterId, Theater>,
  occupation: OccupationState[],
  regions: FeatureCollection<Geometry, { id: string; name: string }>,
  worldUnits: Unit[] = [],
): MapData {
  const units: Unit[] = [];
  const fronts: FrontLine[] = [];
  const battles: Battle[] = [];
  for (const theater of THEATERS) {
    const module = modules[theater.id];
    units.push(...module.units);
    fronts.push(...module.fronts);
    battles.push(...module.battles);
  }
  return {
    units: mergeUnitLists(units, worldUnits),
    fronts,
    battles,
    labels: [...LABELS],
    origin,
    status,
    message,
    modules,
    frames,
    occupation,
    regions,
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<MapData>(LOADING);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      Promise.all(THEATERS.map(async (theater) => [theater.id, await loadModule(theater.id)] as const)),
      loadNormandyFrame(),
      loadOccupation(),
      loadWorldUnits(),
    ])
      .then(([rows, normandyFrame, world, worldUnits]) => {
        if (cancelled) return;
        const modules = initialModules();
        const frames = defaultFrames();
        if (normandyFrame) frames.normandy = normandyFrame;
        let status: MapData["status"] = "ready";
        let origin: MapData["origin"] = "server";
        let message = "";
        for (const [id, loaded] of rows) {
          if (id === "normandy" && (loaded === "missing" || loaded === "invalid")) {
            modules.normandy = emptyModule();
            status = loaded;
            origin = "server";
            message =
              loaded === "missing"
                ? "Normandy JSON is missing. Drop units.json, fronts.json, and battles.json into public/data/normandy/."
                : "Normandy JSON could not be read. Check docs/SCHEMA.md.";
            continue;
          }
          if (loaded === "missing" || loaded === "invalid") {
            modules[id] = emptyModule();
            continue;
          }
          modules[id] = loaded;
        }
        setData(
          packFrom(
            modules,
            origin,
            status,
            message,
            frames,
            world?.occupation ?? [],
            world?.regions ?? emptyRegions(),
            worldUnits,
          ),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setData({
          ...LOADING,
          status: "missing",
          message: "Normandy JSON is missing. Drop units.json, fronts.json, and battles.json into public/data/normandy/.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <MapDataContext.Provider value={data}>{children}</MapDataContext.Provider>;
}
