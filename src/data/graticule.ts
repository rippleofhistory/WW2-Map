import type { FeatureCollection, LineString } from "geojson";

/** Geographic grid for the plain canvas. Not a historical layer. */
export function buildGraticule(): FeatureCollection<LineString> {
  const features: FeatureCollection<LineString>["features"] = [];
  for (let lng = -180; lng <= 180; lng += 5) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: [[lng, -70], [lng, 80]] },
    });
  }
  for (let lat = -70; lat <= 80; lat += 5) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: [[-180, lat], [180, lat]] },
    });
  }
  return { type: "FeatureCollection", features };
}
