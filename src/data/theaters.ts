import type { Theater, TheaterId } from "../types.ts";

/**
 * Camera frames for the theater switcher.
 * center, zoom, and bounds aim the camera. They are not unit locations or front lines.
 * start and end are the theater's published span. They do not lock the date slider.
 * frontCadence "weekly" means the archive file is weekly front polygons, not daily battalion pins.
 * Those files ship empty. Do not invent a ring.
 */
export const THEATERS: readonly Theater[] = [
  {
    id: "normandy",
    label: "Normandy",
    center: [-0.7, 49.3],
    zoom: 8.2,
    bounds: [-2.2, 48.6, 0.8, 50],
    start: "1944-06-06",
    end: "1944-08-31",
    frontCadence: "daily",
  },
  {
    id: "nw-europe",
    label: "NW Europe",
    center: [5, 50],
    zoom: 5.1,
    bounds: [-5, 45, 15, 55],
    start: "1944-09-01",
    end: "1945-05-08",
    frontCadence: "daily",
  },
  {
    id: "italy",
    label: "Italy",
    center: [12.5, 42.5],
    zoom: 5.4,
    bounds: [6, 36.5, 19, 47],
    start: "1943-07-09",
    end: "1945-05-02",
    frontCadence: "daily",
  },
  {
    id: "eastern-front",
    label: "Eastern Front",
    center: [32, 52],
    zoom: 4.2,
    bounds: [12, 42, 55, 64],
    start: "1941-06-22",
    end: "1945-05-09",
    frontCadence: "weekly",
  },
  {
    id: "burma",
    label: "Burma",
    center: [96, 22],
    zoom: 5.1,
    bounds: [88, 12, 104, 30],
    start: "1942-01-01",
    end: "1945-08-15",
    frontCadence: "weekly",
  },
  {
    id: "pacific",
    label: "Pacific",
    center: [155, 8],
    zoom: 3.1,
    bounds: [115, -15, 195, 35],
    start: "1941-12-07",
    end: "1945-09-02",
    frontCadence: "daily",
  },
  {
    id: "north-africa",
    label: "North Africa",
    center: [10, 28],
    zoom: 4.6,
    bounds: [-12, 18, 35, 38],
    start: "1940-06-10",
    end: "1943-05-13",
    frontCadence: "daily",
  },
];

const IDS = new Set<string>(THEATERS.map((theater) => theater.id));

export function isTheaterId(value: string | null): value is TheaterId {
  return value !== null && IDS.has(value);
}

export function theaterById(id: TheaterId): Theater {
  const theater = THEATERS.find((item) => item.id === id);
  return theater ?? THEATERS[0];
}
