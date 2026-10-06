import type { StyleSpecification } from "maplibre-gl";

export const MODERN_STYLE = "https://tiles.openfreemap.org/styles/dark";

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
