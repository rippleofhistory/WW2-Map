import { createContext, useContext } from "react";
import type { MapData } from "./parse.ts";

export const MapDataContext = createContext<MapData | null>(null);

export function useMapData(): MapData {
  const data = useContext(MapDataContext);
  if (!data) throw new Error("useMapData must be used inside DataProvider");
  return data;
}
