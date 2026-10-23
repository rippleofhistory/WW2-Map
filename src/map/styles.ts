import type { StyleSpecification } from "maplibre-gl";
import type { Basemap } from "../types.ts";

export const DARK_STYLE = "https://tiles.openfreemap.org/styles/dark";

function rasterStyle(name: string, url: string, attribution: string): StyleSpecification {
  return {
    version: 8,
    name,
    sources: {
      raster: {
        type: "raster",
        tiles: [url],
        tileSize: 256,
        maxzoom: 19,
        attribution,
      },
    },
    layers: [{ id: "background", type: "background", paint: { "background-color": "#171c15" } }, { id: "raster", type: "raster", source: "raster" }],
  };
}

export const TERRAIN_STYLE = rasterStyle(
  "Terrain",
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
  "Tiles © Esri",
);

export const SATELLITE_STYLE = rasterStyle(
  "Satellite",
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  "Tiles © Esri",
);

export const SITUATION_STYLE: StyleSpecification = {
  version: 8,
  name: "Situation canvas",
  sources: {
    notice: {
      type: "geojson",
      attribution: "Situation canvas. Modern basemap off.",
      data: { type: "FeatureCollection", features: [] },
    },
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#171c15" },
    },
  ],
};

export function styleFor(basemap: Basemap): string | StyleSpecification {
  if (basemap === "terrain") return TERRAIN_STYLE;
  if (basemap === "satellite") return SATELLITE_STYLE;
  return DARK_STYLE;
}
