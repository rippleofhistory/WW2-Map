import type { Theater, TheaterId } from "../types.ts";


/**
 * Camera frames for the theater switcher.
 * center, zoom, and bounds aim the camera. They are not unit locations or front lines.
 * start and end are the theater's published span, including campaign overview windows.
 * They do not lock the date slider.
 * frontCadence "weekly" means the archive file is weekly front polygons, not daily battalion pins.
 * Those front files ship empty. Do not invent a ring.
 * Campaign overview pins live in battles.json. A campaign click flies to that pin.
 * Pearl Harbor and Midway sit west of the default Pacific frame; the click still flies there.
 */
export const THEATERS: readonly Theater[] = [
  {
    id: "normandy",
    label: "Normandy",
    center: [-0.7, 49.3],
    zoom: 8.2,
    bounds: [-2.2, 48.3, 2.5, 50],
    start: "1944-06-06",
    end: "1944-08-31",
    frontCadence: "daily",
  },
  {
    id: "nw-europe",
    label: "NW Europe",
    center: [5, 50],
    zoom: 5.1,
    bounds: [-5, 44, 18.5, 70],
    start: "1940-04-09",
    end: "1945-05-08",
    frontCadence: "daily",
  },
  {
    id: "italy",
    label: "Italy",
    center: [12.5, 42.5],
    zoom: 5.4,
    bounds: [6, 36, 26, 47],
    start: "1941-04-06",
    end: "1945-05-02",
    frontCadence: "daily",
  },
  {
    id: "eastern-front",
    label: "Eastern Front",
    center: [32, 52],
    zoom: 5.5,
    bounds: [12, 42, 55, 72],
    start: "1939-09-01",
    end: "1945-05-09",
    frontCadence: "weekly",
  },
  {
    id: "burma",
    label: "Burma",
    center: [96, 22],
    zoom: 5.1,
    bounds: [88, 1, 104, 30],
    start: "1942-01-01",
    end: "1945-08-15",
    frontCadence: "weekly",
  },
  {
    id: "pacific",
    label: "Pacific",
    center: [155, 8],
    zoom: 3.1,
    bounds: [100, -15, 195, 55],
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

/** Default camera zoom for a theater. Eastern Front stays near 5.5 so armies read, not a cloud of dots. */
export function theaterCameraZoom(theater: Theater, narrow = false): number {
  if (theater.id === "eastern-front") return narrow ? Math.max(5, theater.zoom - 0.3) : theater.zoom;
  return narrow ? Math.max(2, theater.zoom - 1.3) : theater.zoom;
}

/** Normandy sits inside NW Europe; check the smaller frames first. */
const CONTAIN_ORDER: readonly TheaterId[] = [
  "normandy",
  "north-africa",
  "italy",
  "burma",
  "pacific",
  "nw-europe",
  "eastern-front",
];

export function theaterContaining(lng: number, lat: number): TheaterId | null {
  for (const id of CONTAIN_ORDER) {
    const theater = theaterById(id);
    const [west, south, east, north] = theater.bounds;
    if (lng >= west && lng <= east && lat >= south && lat <= north) return id;
  }
  return null;
}
