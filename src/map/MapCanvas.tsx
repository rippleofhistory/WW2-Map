import { useEffect, useRef, useState } from "react";
import type { FeatureCollection, Geometry, LineString, Polygon } from "geojson";
import {
  Map as MlMap,
  Marker,
  NavigationControl,
  setWorkerUrl,
  type DataDrivenPropertyValueSpecification,
  type GeoJSONSource,
  type Map as MapInstance,
} from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { buildGraticule } from "../data/graticule.ts";
import { PLACEHOLDER_SOURCE } from "../data/sample.ts";
import { theaterById, theaterCameraZoom } from "../data/theaters.ts";
import { counterSize, darkenHex, nationCounterColor } from "../lib/counter.ts";
import { placeUnit } from "../lib/position.ts";
import { pathUntil } from "../lib/select.ts";
import { playClock, subscribePlayClock } from "../state/playClock.ts";
import { clashSegments, paintFront, postUnitsOnFronts, type LngLat } from "../lib/contact.ts";
import {
  CONTROL_FILL_COLOR_EXPR,
  CONTROL_FILL_OPACITY_EXPR,
  CONTROL_OUTLINE_COLOR_EXPR,
  FRONT_COLOR_EXPR,
  FRONT_LERP_MS,
  FRONT_WIDTH_CASING,
  FRONT_WIDTH_FILL,
  FRONT_WIDTH_GLOW,
  canLerpFronts,
  controlFillData,
  frontLinesData,
  lerpTraces,
  prepareFrontDraw,
  type FrontTrace,
} from "../lib/frontStyle.ts";
import { COLLAPSED_FALLBACK, NEUTRAL_FALLBACK, cssVar, sideColorsFrom } from "../lib/palette.ts";
import { OCCUPATION_MAX_ZOOM, OVERVIEW_CENTER, OVERVIEW_ZOOM } from "../lib/occupation.ts";
import { exportMapPng } from "./exportPng.ts";
import { layoutUnits, zoomBandFor } from "./markerLayout.ts";
import { SITUATION_STYLE, styleFor } from "./styles.ts";
import type { Basemap, Battle, CameraCommand, EchelonCap, PlaceLabel, PositionStatus, TheaterId, Unit } from "../types.ts";

setWorkerUrl(workerUrl);

const GRATICULE = buildGraticule();
const EMPTY: FeatureCollection<LineString> = { type: "FeatureCollection", features: [] };
const EMPTY_POLYGON: FeatureCollection<Polygon> = { type: "FeatureCollection", features: [] };

export interface MapUnit {
  unit: Unit;
  lng: number;
  lat: number;
  status: PositionStatus;
  selected: boolean;
}

interface MapCanvasProps {
  units: MapUnit[];
  battles: readonly Battle[];
  labels: readonly PlaceLabel[];
  selectedBattleId: string | null;
  showUnits: boolean;
  showBattles: boolean;
  showLabels: boolean;
  showFronts: boolean;
  showControlAreas: boolean;
  showGraticule: boolean;
  basemap: Basemap;
  echelonCap: EchelonCap;
  showNav?: boolean;
  alliedLine: [number, number][];
  axisLine: [number, number][];
  frontRing: [number, number][];
  /** Extra sector traces. When set, the map paints every live schematic, not only the latest. */
  frontTraces?: {
    sector?: string;
    date?: string;
    allied: [number, number][];
    axis: [number, number][];
    polygon?: [number, number][];
  }[];
  theaterId: TheaterId;
  travelled: [number, number][];
  fullTrack: [number, number][];
  date: string;
  playing: boolean;
  camera: CameraCommand;
  cameraLock: boolean;
  lockNonce: number;
  followLng?: number;
  followLat?: number;
  initialCenter: [number, number];
  initialZoom: number;
  occupation: FeatureCollection<Geometry>;
  showOccupation: boolean;
  selectedRegionId: string | null;
  onSelectUnit: (id: string) => void;
  onSelectBattle: (id: string) => void;
  onSelectRegion: (id: string) => void;
  onBackground: () => void;
  onUserDrag: () => void;
  onDisableBasemap: () => void;
  onBindExport: (exportPng: () => string | null) => void;
  hidden: boolean;
  contrast: boolean;
  frame?: "full" | "split";
  syncView?: { lng: number; lat: number; zoom: number; nonce: number } | null;
  onViewChange?: (view: { lng: number; lat: number; zoom: number }) => void;
}

interface MarkerSpec {
  key: string;
  lng: number;
  lat: number;
  className: string;
  label: string;
  pressed: boolean;
  button: boolean;
  anchor: "center" | "bottom";
  offset: [number, number];
  draw: (element: HTMLElement) => void;
  onClick?: () => void;
}

function lines(id: string, coordinates: [number, number][]): FeatureCollection<LineString> {
  if (coordinates.length < 2) return EMPTY;
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { id },
        geometry: { type: "LineString", coordinates },
      },
    ],
  };
}

function closeRing(coordinates: [number, number][]): [number, number][] {
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  if (!first || !last) return coordinates;
  if (first[0] === last[0] && first[1] === last[1]) return coordinates;
  return [...coordinates, first];
}

function polygonData(coordinates: [number, number][]): FeatureCollection<Polygon> {
  if (coordinates.length < 4) return EMPTY_POLYGON;
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { id: "weekly" },
        geometry: { type: "Polygon", coordinates: [closeRing(coordinates)] },
      },
    ],
  };
}

function tracesOf(current: {
  date: string;
  alliedLine: [number, number][];
  axisLine: [number, number][];
  frontRing?: [number, number][];
  frontTraces?: {
    sector?: string;
    date?: string;
    allied: [number, number][];
    axis: [number, number][];
    polygon?: [number, number][];
  }[];
}): FrontTrace[] {
  const raw =
    current.frontTraces && current.frontTraces.length > 0
      ? current.frontTraces
      : [
          {
            allied: current.alliedLine,
            axis: current.axisLine,
            date: current.date,
            sector: "default",
            polygon: current.frontRing,
          },
        ];
  return raw.map((trace, index) => ({
    sector: trace.sector ?? `sector-${index}`,
    date: trace.date ?? current.date,
    allied: trace.allied,
    axis: trace.axis,
    polygon: trace.polygon,
  }));
}

function multiLines(id: string, segments: LngLat[][]): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: segments
      .filter((segment) => segment.length >= 2)
      .map((coordinates, index) => ({
        type: "Feature" as const,
        properties: { id: `${id}-${index}` },
        geometry: { type: "LineString" as const, coordinates },
      })),
  };
}

function strokeBefore(map: MapInstance): string | undefined {
  if (map.getLayer("front-lines-glow")) return "front-lines-glow";
  if (map.getLayer("front-lines-casing")) return "front-lines-casing";
  if (map.getLayer("front-lines-fill")) return "front-lines-fill";
  return undefined;
}

function underStroke(map: MapInstance, id: string) {
  const before = strokeBefore(map);
  if (!before || !map.getLayer(id)) return;
  map.moveLayer(id, before);
}

function upsertControlAreas(map: MapInstance, prepared: ReturnType<typeof prepareFrontDraw>, visible: boolean) {
  const data = controlFillData(prepared);
  const source = map.getSource("front-control") as GeoJSONSource | undefined;
  if (!source) map.addSource("front-control", { type: "geojson", data });
  else source.setData(data);
  const before = strokeBefore(map);
  const addLayer = (id: string, spec: Parameters<MapInstance["addLayer"]>[0]) => {
    if (map.getLayer(id)) return;
    if (before && map.getLayer(before)) map.addLayer(spec, before);
    else map.addLayer(spec);
  };
  addLayer("front-control-fill", {
    id: "front-control-fill",
    type: "fill",
    source: "front-control",
    paint: {
      "fill-color": CONTROL_FILL_COLOR_EXPR as unknown as DataDrivenPropertyValueSpecification<string>,
      "fill-opacity": CONTROL_FILL_OPACITY_EXPR as unknown as DataDrivenPropertyValueSpecification<number>,
    },
  });
  addLayer("front-control-outline", {
    id: "front-control-outline",
    type: "line",
    source: "front-control",
    paint: {
      "line-color": CONTROL_OUTLINE_COLOR_EXPR as unknown as DataDrivenPropertyValueSpecification<string>,
      "line-width": 1,
      "line-opacity": 0.95,
    },
  });
  if (map.getLayer("front-control-fill")) {
    map.setPaintProperty(
      "front-control-fill",
      "fill-color",
      CONTROL_FILL_COLOR_EXPR as unknown as DataDrivenPropertyValueSpecification<string>,
    );
    map.setPaintProperty(
      "front-control-fill",
      "fill-opacity",
      CONTROL_FILL_OPACITY_EXPR as unknown as DataDrivenPropertyValueSpecification<number>,
    );
  }
  if (map.getLayer("front-control-outline")) {
    map.setPaintProperty(
      "front-control-outline",
      "line-color",
      CONTROL_OUTLINE_COLOR_EXPR as unknown as DataDrivenPropertyValueSpecification<string>,
    );
    map.setPaintProperty("front-control-outline", "line-width", 1);
  }
  underStroke(map, "front-control-fill");
  underStroke(map, "front-control-outline");
  const visibility = visible ? "visible" : "none";
  setVisibility(map, "front-control-fill", visibility);
  setVisibility(map, "front-control-outline", visibility);
}

function upsertPolygon(map: MapInstance, id: string, data: FeatureCollection<Polygon>, visible: boolean) {
  const source = map.getSource(id) as GeoJSONSource | undefined;
  if (!source) {
    map.addSource(id, { type: "geojson", data });
    map.addLayer({
      id: `${id}-fill`,
      type: "fill",
      source: id,
      paint: { "fill-color": "#5a6b4a", "fill-opacity": 0.28 },
    });
    map.addLayer({
      id: `${id}-line`,
      type: "line",
      source: id,
      paint: { "line-color": "#d6c27a", "line-width": 2, "line-opacity": 0.9 },
    });
  } else {
    source.setData(data);
  }
  const visibility = visible ? "visible" : "none";
  setVisibility(map, `${id}-fill`, visibility);
  setVisibility(map, `${id}-line`, visibility);
}

function occupationColorExpr(
  palette: Record<"allied" | "axis" | "soviet" | "japanese", string>,
  neutral: string,
  collapsed: string,
): DataDrivenPropertyValueSpecification<string> {
  return [
    "case",
    ["==", ["get", "status"], "collapsed"],
    collapsed,
    [
      "match",
      ["get", "side"],
      "allied",
      palette.allied,
      "axis",
      palette.axis,
      "soviet",
      palette.soviet,
      "japanese",
      palette.japanese,
      neutral,
    ],
  ];
}

function upsertOccupation(
  map: MapInstance,
  data: FeatureCollection<Geometry>,
  visible: boolean,
  palette: Record<"allied" | "axis" | "soviet" | "japanese", string>,
  neutral: string,
  collapsed: string,
  selectedId: string | null,
) {
  try {
    const source = map.getSource("occupation") as GeoJSONSource | undefined;
    if (!source) {
      map.addSource("occupation", { type: "geojson", data });
      const fillLayer = {
        id: "occupation-fill",
        type: "fill" as const,
        source: "occupation",
        maxzoom: OCCUPATION_MAX_ZOOM,
        paint: {
          "fill-color": occupationColorExpr(palette, neutral, collapsed),
          "fill-opacity": 0.46,
        },
      };
      if (map.getLayer("graticule-line")) map.addLayer(fillLayer, "graticule-line");
      else map.addLayer(fillLayer);
      map.addLayer({
        id: "occupation-line",
        type: "line",
        source: "occupation",
        maxzoom: OCCUPATION_MAX_ZOOM,
        paint: {
          "line-color": "#121510",
          "line-width": ["case", ["==", ["get", "id"], selectedId ?? ""], 2.4, 0.7],
          "line-opacity": 0.75,
        },
      });
    } else {
      source.setData(data);
      if (map.getLayer("occupation-fill")) {
        map.setPaintProperty("occupation-fill", "fill-color", occupationColorExpr(palette, neutral, collapsed));
      }
      if (map.getLayer("occupation-line")) {
        map.setPaintProperty("occupation-line", "line-width", ["case", ["==", ["get", "id"], selectedId ?? ""], 2.4, 0.7]);
      }
    }
    const visibility = visible ? "visible" : "none";
    setVisibility(map, "occupation-fill", visibility);
    setVisibility(map, "occupation-line", visibility);
  } catch (error) {
    const host = map.getContainer();
    host.dataset.occupationError = error instanceof Error ? error.message : "occupation layer failed";
  }
}

function setVisibility(map: MapInstance, layerId: string, visibility: "visible" | "none") {
  if (!map.getLayer(layerId)) return;
  const current = map.getLayoutProperty(layerId, "visibility") ?? "visible";
  if (current === visibility) return;
  map.setLayoutProperty(layerId, "visibility", visibility);
}

function upsertLine(
  map: MapInstance,
  id: string,
  data: FeatureCollection<LineString>,
  color: string,
  width: number,
  opacity: number,
  dash: number[] | undefined,
  visible: boolean,
  casing: boolean,
) {
  const source = map.getSource(id) as GeoJSONSource | undefined;
  if (!source) {
    map.addSource(id, { type: "geojson", data });
    if (casing) {
      map.addLayer({
        id: `${id}-casing`,
        type: "line",
        source: id,
        paint: { "line-color": "#0c0e0a", "line-width": width + 4, "line-opacity": 0.7 },
      });
    }
    map.addLayer({
      id: `${id}-line`,
      type: "line",
      source: id,
      paint: {
        "line-color": color,
        "line-width": width,
        "line-opacity": opacity,
        ...(dash ? { "line-dasharray": dash } : {}),
      },
    });
  } else {
    source.setData(data);
    if (map.getLayer(`${id}-line`)) {
      map.setPaintProperty(`${id}-line`, "line-color", color);
      map.setPaintProperty(`${id}-line`, "line-width", width);
    }
    if (casing && map.getLayer(`${id}-casing`)) {
      map.setPaintProperty(`${id}-casing`, "line-width", width + 4);
    }
  }
  const visibility = visible ? "visible" : "none";
  setVisibility(map, `${id}-line`, visibility);
  setVisibility(map, `${id}-casing`, visibility);
}

const LEGACY_FRONT_LAYERS = [
  "front-contact-line",
  "front-contact-casing",
  "front-ticks-line",
  "front-allied-line",
  "front-allied-casing",
  "front-axis-line",
  "front-axis-casing",
  "front-allied-fill-fill",
  "front-axis-fill-fill",
  "front-clash-line",
] as const;

function hideLegacyFronts(map: MapInstance) {
  for (const id of LEGACY_FRONT_LAYERS) setVisibility(map, id, "none");
}

function upsertFrontStroke(map: MapInstance, prepared: ReturnType<typeof prepareFrontDraw>, visible: boolean) {
  const data = frontLinesData(prepared);
  const source = map.getSource("front-lines") as GeoJSONSource | undefined;
  if (!source) map.addSource("front-lines", { type: "geojson", data });
  else source.setData(data);
  const addLineLayer = (id: string, spec: Parameters<MapInstance["addLayer"]>[0], before?: string) => {
    if (map.getLayer(id)) return;
    if (before && map.getLayer(before)) map.addLayer(spec, before);
    else map.addLayer(spec);
  };
  addLineLayer(
    "front-lines-glow",
    {
      id: "front-lines-glow",
      type: "line",
      source: "front-lines",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": FRONT_COLOR_EXPR as unknown as DataDrivenPropertyValueSpecification<string>,
        "line-width": FRONT_WIDTH_GLOW as unknown as DataDrivenPropertyValueSpecification<number>,
        "line-opacity": 0.25,
        "line-blur": 1,
      },
    },
    map.getLayer("front-lines-casing") ? "front-lines-casing" : map.getLayer("front-lines-fill") ? "front-lines-fill" : undefined,
  );
  addLineLayer(
    "front-lines-casing",
    {
      id: "front-lines-casing",
      type: "line",
      source: "front-lines",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#000000",
        "line-width": FRONT_WIDTH_CASING as unknown as DataDrivenPropertyValueSpecification<number>,
        "line-opacity": 0.85,
      },
    },
    map.getLayer("front-lines-fill") ? "front-lines-fill" : undefined,
  );
  addLineLayer("front-lines-fill", {
    id: "front-lines-fill",
    type: "line",
    source: "front-lines",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": FRONT_COLOR_EXPR as unknown as DataDrivenPropertyValueSpecification<string>,
      "line-width": FRONT_WIDTH_FILL as unknown as DataDrivenPropertyValueSpecification<number>,
      "line-opacity": 1,
    },
  });
  const visibility = visible ? "visible" : "none";
  setVisibility(map, "front-lines-glow", visibility);
  setVisibility(map, "front-lines-casing", visibility);
  setVisibility(map, "front-lines-fill", visibility);
}

function paintFrontLayers(
  map: MapInstance,
  traces: readonly FrontTrace[],
  theaterId: TheaterId,
  showFronts: boolean,
  showControl: boolean,
  host: HTMLElement | null,
) {
  hideLegacyFronts(map);
  const prepared = prepareFrontDraw(traces, theaterId);
  const fillsOn = showControl && prepared.fills.length > 0;
  upsertControlAreas(map, prepared, fillsOn);
  upsertFrontStroke(map, prepared, showFronts && prepared.lines.length > 0);
  if (host) {
    const layers = map.getStyle().layers.map((layer) => layer.id);
    const fillAt = layers.indexOf("front-control-fill");
    const glowAt = layers.indexOf("front-lines-glow");
    const casingAt = layers.indexOf("front-lines-casing");
    const lineAt = layers.indexOf("front-lines-fill");
    const strokeAt = [glowAt, casingAt, lineAt].filter((index) => index >= 0);
    host.dataset.frontStyle = "hoi4";
    host.dataset.frontOn = showFronts ? "1" : "0";
    host.dataset.frontSides = [...new Set(prepared.lines.map((line) => line.side))].join("|");
    host.dataset.frontLines = String(prepared.lines.length);
    host.dataset.controlOn = fillsOn ? "1" : "0";
    host.dataset.controlSides = [...new Set(prepared.fills.map((fill) => fill.side))].join("|");
    host.dataset.controlFills = String(prepared.fills.length);
    host.dataset.controlApprox = prepared.fills.some((fill) => fill.approximate) ? "1" : "0";
    host.dataset.controlOutline = map.getLayer("front-control-outline") ? "1" : "0";
    host.dataset.controlOutlineW = String(map.getPaintProperty("front-control-outline", "line-width") ?? "");
    host.dataset.controlUnder = fillAt >= 0 && strokeAt.length > 0 && strokeAt.every((index) => fillAt < index) ? "1" : "0";
  }
}

function drawUnit(element: HTMLElement, unit: Unit) {
  const faceColor = nationCounterColor(unit.nation, unit.side);
  element.style.setProperty("--counter-bg", faceColor);
  element.style.setProperty("--counter-border", darkenHex(faceColor));
  element.style.setProperty("--counter-size", `${counterSize(unit.echelon)}px`);
  element.dataset.short = unit.abbr;
  element.dataset.size = String(counterSize(unit.echelon));
  element.dataset.nation = unit.nation;
  element.replaceChildren();
  const face = document.createElement("span");
  face.className = "face";
  face.setAttribute("aria-hidden", "true");
  const pip = document.createElement("span");
  pip.className = "pip";
  const short = document.createElement("span");
  short.className = "short";
  short.textContent = unit.abbr;
  face.append(pip, short);
  if (unit.strength !== undefined) {
    const bar = document.createElement("span");
    bar.className = "strength";
    const fill = document.createElement("span");
    fill.style.width = `${Math.round(unit.strength * 100)}%`;
    bar.append(fill);
    face.append(bar);
  }
  const hover = document.createElement("span");
  hover.className = "hover-name";
  hover.textContent = unit.name;
  element.append(face, hover);
}

function drawLabel(element: HTMLElement, name: string) {
  element.replaceChildren();
  const title = document.createElement("span");
  title.textContent = name;
  const tag = document.createElement("span");
  tag.className = "ph";
  tag.textContent = "PLACEHOLDER";
  element.append(title, tag);
}

function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function goToUnit(map: MapInstance, lng: number, lat: number, animate: boolean) {
  if (!animate || reducedMotion()) {
    map.jumpTo({ center: [lng, lat] });
    return;
  }
  const center = map.getCenter();
  const far = Math.hypot(center.lng - lng, center.lat - lat) > 1.5;
  if (far) {
    map.flyTo({ center: [lng, lat], essential: true, speed: 1.8, curve: 1.2 });
    return;
  }
  map.easeTo({ center: [lng, lat], duration: 600, essential: true });
}

function followIfLocked(
  map: MapInstance,
  current: { cameraLock: boolean; playing: boolean; followLng?: number; followLat?: number },
  animate: boolean,
) {
  if (current.playing || !current.cameraLock || current.followLng === undefined || current.followLat === undefined) return;
  goToUnit(map, current.followLng, current.followLat, animate);
}

function panelPadding(frame: "full" | "split"): { top: number; bottom: number; left: number; right: number } {
  if (frame === "split") return { top: 36, bottom: 8, left: 8, right: 8 };
  if (window.matchMedia("(min-width: 900px)").matches) {
    return { top: 12, bottom: 16, left: 340, right: 64 };
  }
  return { top: 12, bottom: 12, left: 10, right: 10 };
}

export function MapCanvas(props: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const cacheRef = useRef<Map<string, Marker>>(new Map());
  const ignoreClearRef = useRef(false);
  const propsRef = useRef(props);
  const paintingRef = useRef(false);
  const skipBasemapReset = useRef(true);
  const applyingSync = useRef(false);
  const frontAnim = useRef(0);
  const frontTarget = useRef<FrontTrace[]>([]);
  const frontShown = useRef<FrontTrace[]>([]);
  const frontTheater = useRef<TheaterId | "">("");
  const [styleError, setStyleError] = useState(false);
  const [plainCanvas, setPlainCanvas] = useState(false);
  const [zoomBand, setZoomBand] = useState(() => zoomBandFor(props.initialZoom));

  propsRef.current = props;

  const paint = () => {
    const map = mapRef.current;
    const current = propsRef.current;
    if (!map || !map.isStyleLoaded() || paintingRef.current) return;
    paintingRef.current = true;
    try {
      const host = containerRef.current;
      const palette = sideColorsFrom(host);
      const gold = cssVar(host, "--gold", "#f0d78c");
      const line = cssVar(host, "--line", "#3e4a34");
      upsertOccupation(
        map,
        current.occupation,
        current.showOccupation,
        palette,
        cssVar(host, "--neutral", NEUTRAL_FALLBACK),
        cssVar(host, "--collapsed", COLLAPSED_FALLBACK),
        current.selectedRegionId,
      );
      if (host instanceof HTMLElement) {
        host.dataset.occupationOn = current.showOccupation && map.getZoom() < OCCUPATION_MAX_ZOOM ? "1" : "0";
        host.dataset.occupationCount = String(current.occupation.features.length);
        host.dataset.occupationLayer = map.getLayer("occupation-fill") ? "1" : "0";
      }
      upsertLine(map, "graticule", GRATICULE, line, 1, 0.45, undefined, current.showGraticule, false);
      const nextFronts = tracesOf(current);
      const painted = nextFronts
        .map((trace) => paintFront(trace))
        .filter((item): item is NonNullable<typeof item> => Boolean(item && item.contact.length >= 2));
      const showContact = current.showFronts && painted.length > 0;
      const hostEl = host instanceof HTMLElement ? host : null;
      const snapFront = (traces: FrontTrace[]) => {
        frontShown.current = traces;
        frontTarget.current = traces;
        frontTheater.current = current.theaterId;
        paintFrontLayers(map, traces, current.theaterId, current.showFronts, current.showControlAreas, hostEl);
      };
      const sameTarget =
        frontTheater.current === current.theaterId &&
        JSON.stringify(frontTarget.current) === JSON.stringify(nextFronts);
      if (sameTarget) {
        paintFrontLayers(
          map,
          frontShown.current.length > 0 ? frontShown.current : nextFronts,
          current.theaterId,
          current.showFronts,
          current.showControlAreas,
          hostEl,
        );
      } else {
        window.cancelAnimationFrame(frontAnim.current);
        const from = frontShown.current;
        const lerp =
          (current.showFronts || current.showControlAreas) &&
          !reducedMotion() &&
          canLerpFronts(from, nextFronts, frontTheater.current, current.theaterId);
        if (!lerp) {
          snapFront(nextFronts);
        } else {
          frontTarget.current = nextFronts;
          frontTheater.current = current.theaterId;
          const started = performance.now();
          const step = (now: number) => {
            const t = Math.min(1, (now - started) / FRONT_LERP_MS);
            const mid = lerpTraces(from, nextFronts, t * t * (3 - 2 * t));
            frontShown.current = t >= 1 ? nextFronts : mid;
            paintFrontLayers(map, frontShown.current, current.theaterId, current.showFronts, current.showControlAreas, hostEl);
            if (t < 1) frontAnim.current = window.requestAnimationFrame(step);
          };
          frontAnim.current = window.requestAnimationFrame(step);
        }
      }
      upsertPolygon(
        map,
        "front-polygon",
        polygonData(current.frontRing),
        current.showFronts && !current.showControlAreas && current.frontRing.length >= 4,
      );
      upsertLine(map, "path-full", lines("full", current.fullTrack), gold, 2, 0.4, [1, 1.4], current.fullTrack.length >= 2, false);
      upsertLine(
        map,
        "path-travelled",
        lines("travelled", current.travelled),
        gold,
        current.contrast ? 5 : 3.5,
        0.95,
        undefined,
        current.travelled.length >= 2,
        true,
      );
      if (hostEl) {
        hostEl.dataset.contact = showContact ? String(painted.reduce((sum, item) => sum + item.contact.length, 0)) : "0";
      }
    } finally {
      paintingRef.current = false;
    }
  };

  const markerKey = [
    props.showUnits,
    props.showBattles,
    props.showLabels,
    props.selectedBattleId ?? "",
    zoomBand,
    props.date,
    props.playing,
    props.units.map((item) => `${item.unit.id}:${item.lng}:${item.lat}:${item.status}:${item.selected}`).join(","),
    props.battles.map((battle) => battle.id).join(","),
    props.labels.map((label) => label.id).join(","),
    props.echelonCap,
  ].join("|");

  const lineKey = [
    props.showFronts,
    props.showControlAreas,
    props.showGraticule,
    props.theaterId,
    props.date,
    props.alliedLine.map((point) => point.join(",")).join(" "),
    props.axisLine.map((point) => point.join(",")).join(" "),
    props.frontRing.map((point) => point.join(",")).join(" "),
    (props.frontTraces ?? [])
      .map(
        (trace) =>
          `${trace.sector ?? ""}:${trace.date ?? ""}:${trace.allied.join(" ")}|${trace.axis.join(" ")}|${(trace.polygon ?? []).join(" ")}`,
      )
      .join(";"),
    props.travelled.join(";"),
    props.fullTrack.join(";"),
    props.contrast ? "1" : "0",
    props.showOccupation ? "1" : "0",
    props.selectedRegionId ?? "",
    props.occupation.features
      .map((feature) => {
        const props = feature.properties as { iso?: string; side?: string; status?: string } | null;
        return `${props?.iso ?? ""}:${props?.side ?? ""}:${props?.status ?? ""}`;
      })
      .join("|"),
  ].join("|");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const start = propsRef.current;
    const map = new MlMap({
      container,
      style: styleFor(start.basemap),
      center: start.initialCenter,
      zoom: start.initialZoom,
      attributionControl: { compact: true },
      dragRotate: start.showNav !== false,
      pitchWithRotate: false,
      touchPitch: false,
      maxZoom: 16,
      minZoom: 2,
      fadeDuration: 0,
      canvasContextAttributes: { preserveDrawingBuffer: true },
    });
    if (start.showNav !== false) {
      map.addControl(new NavigationControl({ showCompass: true, visualizePitch: false }), "bottom-right");
    }
    let width = 0;
    let height = 0;
    const onResize = () => {
      const nextWidth = container.clientWidth;
      const nextHeight = container.clientHeight;
      if (nextWidth === 0 || nextHeight === 0) return;
      if (nextWidth !== width || nextHeight !== height) {
        width = nextWidth;
        height = nextHeight;
        map.resize();
      }
      map.setPadding(panelPadding(propsRef.current.frame ?? "full"));
      followIfLocked(map, propsRef.current, false);
    };
    onResize();
    window.addEventListener("resize", onResize);
    const observer = new ResizeObserver(() => onResize());
    observer.observe(container);
    const onStyle = () => {
      if (map.isStyleLoaded()) paint();
    };
    map.on("dragstart", (event) => {
      if (event.originalEvent) propsRef.current.onUserDrag();
    });
    map.on("click", (event) => {
      const target = event.originalEvent.target;
      if (target instanceof Element && target.closest(".map-marker, .maplibregl-marker")) return;
      if (map.getLayer("occupation-fill")) {
        const hit = map.queryRenderedFeatures(event.point, { layers: ["occupation-fill"] })[0];
        const regionId = hit?.properties?.id;
        if (typeof regionId === "string" && regionId) {
          propsRef.current.onSelectRegion(regionId);
          return;
        }
      }
      if (ignoreClearRef.current) return;
      propsRef.current.onBackground();
    });
    const onZoom = () => {
      const band = zoomBandFor(map.getZoom());
      setZoomBand((current) => (current === band ? current : band));
      const current = propsRef.current;
      container.dataset.occupationOn = current.showOccupation && map.getZoom() < OCCUPATION_MAX_ZOOM ? "1" : "0";
    };
    const publishView = () => {
      const center = map.getCenter();
      container.dataset.lng = center.lng.toFixed(2);
      container.dataset.lat = center.lat.toFixed(2);
      container.dataset.zoom = map.getZoom().toFixed(2);
      const current = propsRef.current;
      container.dataset.occupationOn = current.showOccupation && map.getZoom() < OCCUPATION_MAX_ZOOM ? "1" : "0";
      container.dataset.occupationCount = String(current.occupation.features.length);
    };
    const onMoveEnd = () => {
      publishView();
      if (applyingSync.current) {
        applyingSync.current = false;
        return;
      }
      const center = map.getCenter();
      propsRef.current.onViewChange?.({ lng: center.lng, lat: center.lat, zoom: map.getZoom() });
    };
    map.on("moveend", onMoveEnd);
    map.on("zoom", onZoom);
    map.on("style.load", onStyle);
    map.on("load", onStyle);
    map.on("error", (event) => {
      const url = "url" in event.error ? String(event.error.url ?? "") : "";
      if (url.includes("openfreemap.org") || url.includes("arcgisonline.com")) setStyleError(true);
    });
    mapRef.current = map;
    Object.assign(container, { __map: map });
    propsRef.current.onBindExport(() => exportMapPng(map, container, propsRef.current.date));
    const cache = cacheRef.current;
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      window.cancelAnimationFrame(frontAnim.current);
      map.remove();
      mapRef.current = null;
      for (const marker of cache.values()) marker.remove();
      cache.clear();
    };
    // Map instance is created once. Later updates go through the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (skipBasemapReset.current) {
      skipBasemapReset.current = false;
      return;
    }
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(styleFor(props.basemap), { diff: false });
    setStyleError(false);
    setPlainCanvas(false);
  }, [props.basemap]);

  useEffect(() => {
    paint();
  }, [lineKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let cancelled = false;
    const apply = () => {
    if (cancelled) return;
    if (!map.isStyleLoaded()) {
      map.once("idle", apply);
      return;
    }
    const current = propsRef.current;
    const specs: MarkerSpec[] = [];
    if (!current.showUnits && map.getContainer() instanceof HTMLElement) {
      const host = map.getContainer();
      host.dataset.drawn = "";
      host.dataset.labeled = "";
      host.dataset.clusters = "0";
      host.dataset.echelonCap = current.echelonCap;
    }
    if (current.showUnits) {
      const zoom = map.getZoom();
      const playing = current.playing && playClock.playing;
      const fraction = playing ? playClock.fraction : 0;
      const gold = cssVar(map.getContainer(), "--gold", "#f0d78c");
      const placed = current.units.flatMap((item) => {
        const fix = placeUnit(item.unit, current.date, fraction, playing);
        if (!fix) return [];
        return [{
          item,
          fix,
          selected: item.selected,
          echelon: item.unit.echelon,
          lng: fix.lng,
          lat: fix.lat,
          id: item.unit.id,
          status: fix.status,
        }];
      });
      const posts = postUnitsOnFronts(
        placed.map((entry) => ({
          unitId: entry.item.unit.id,
          side: entry.item.unit.side,
          lng: entry.lng,
          lat: entry.lat,
        })),
        tracesOf(current),
      );
      const postById = new Map(posts.map((post) => [post.unitId, post]));
      const posted = placed.map((entry) => {
        const post = postById.get(entry.item.unit.id);
        if (!post?.onFront) return entry;
        return { ...entry, lng: post.lng, lat: post.lat };
      });
      upsertLine(
        map,
        "front-clash",
        multiLines("clash", clashSegments(posts)),
        gold,
        2.4,
        0.85,
        undefined,
        false,
        false,
      );
      if (map.getContainer() instanceof HTMLElement) {
        map.getContainer().dataset.clash = String(clashSegments(posts).length);
      }
      const layout = layoutUnits(posted, zoom, current.echelonCap);
      if (map.getContainer() instanceof HTMLElement) {
        const host = map.getContainer();
        const drawn = layout.individuals.map((entry) => entry.item.unit.id);
        host.dataset.drawn = drawn.join("|");
        host.dataset.labeled = drawn.join("|");
        host.dataset.clusters = String(layout.clusters.length);
        host.dataset.counterStyle = "hoi4";
        host.dataset.echelonCap = current.echelonCap;
      }
      const selected = layout.individuals.filter((entry) => entry.selected);
      for (const cluster of layout.clusters) {
        const names = cluster.members.map((entry) => entry.item.unit.abbr).join(", ");
        specs.push({
          key: `cluster:${cluster.key}`,
          lng: cluster.lng,
          lat: cluster.lat,
          className: "map-marker cluster-marker",
          label: `Cluster of ${cluster.members.length} units: ${names}. Zoom in. ${PLACEHOLDER_SOURCE}`,
          pressed: false,
          button: true,
          anchor: "center",
          offset: [0, 0],
          draw: (element) => {
            element.replaceChildren();
            element.textContent = String(cluster.members.length);
          },
          onClick: () => {
            map.easeTo({
              center: [cluster.lng, cluster.lat],
              zoom: Math.min(16, Math.max(map.getZoom() + 1.8, 7.2)),
              duration: reducedMotion() ? 0 : 500,
            });
          },
        });
      }
      for (const entry of layout.individuals) {
        const unit = entry.item.unit;
        const post = postById.get(unit.id);
        const opponent = post?.opponentId ? current.units.find((row) => row.unit.id === post.opponentId)?.unit : null;
        const reported = entry.fix.status === "last-reported" ? " Last reported." : "";
        const contactNote = opponent ? ` In contact with ${opponent.name}.` : post?.onFront ? " On the schematic contact." : "";
        specs.push({
          key: `unit:${unit.id}`,
          lng: entry.lng,
          lat: entry.lat,
          className: `map-marker unit-marker ech-${unit.echelon} side-${unit.side}${entry.item.selected ? " selected" : ""}${entry.fix.status === "last-reported" ? " last-reported" : ""}${opponent ? " in-contact" : ""}`,
          label: `${unit.name}. ${unit.nation}.${reported}${contactNote} ${entry.fix.anchor.place ?? entry.fix.anchor.note}`,
          pressed: entry.item.selected,
          button: true,
          anchor: "center",
          offset: [0, 0],
          draw: (element) => drawUnit(element, unit),
          onClick: () => current.onSelectUnit(unit.id),
        });
      }
      const followed = selected[0];
      if (playing && current.cameraLock && followed) {
        map.jumpTo({ center: [followed.lng, followed.lat] });
      }
      const trackUnit = current.units.find((item) => item.selected);
      const pathSource = map.getSource("path-travelled") as GeoJSONSource | undefined;
      if (trackUnit && pathSource) {
        const fix = placeUnit(trackUnit.unit, current.date, fraction, playing);
        const head = fix?.status === "moving" ? ([fix.lng, fix.lat] as [number, number]) : undefined;
        pathSource.setData(lines("travelled", pathUntil(trackUnit.unit, current.date, head)));
      }
    }
    if (current.showBattles) {
      for (const battle of current.battles) {
        specs.push({
          key: `battle:${battle.id}`,
          lng: battle.lng,
          lat: battle.lat,
          className: `map-marker battle-marker${current.selectedBattleId === battle.id ? " selected" : ""}`,
          label: `${battle.name}. ${battle.summary} ${battle.source}`,
          pressed: current.selectedBattleId === battle.id,
          button: true,
          anchor: "center",
          offset: [0, 0],
          draw: () => undefined,
          onClick: () => current.onSelectBattle(battle.id),
        });
      }
    }
    if (current.showLabels) {
      for (const label of current.labels) {
        specs.push({
          key: `label:${label.id}`,
          lng: label.lng,
          lat: label.lat,
          className: "map-marker place-label",
          label: `${label.name}. PLACEHOLDER. ${label.source}`,
          pressed: false,
          button: false,
          anchor: "bottom",
          offset: [0, -4],
          draw: (element) => drawLabel(element, label.name),
        });
      }
    }

    const cache = cacheRef.current;
    const wanted = new Set(specs.map((spec) => spec.key));
    for (const [key, marker] of cache) {
      if (!wanted.has(key)) {
        marker.remove();
        cache.delete(key);
      }
    }
    for (const spec of specs) {
      let marker = cache.get(spec.key);
      if (!marker) {
        const element = document.createElement(spec.button ? "button" : "div");
        if (element instanceof HTMLButtonElement) element.type = "button";
        marker = new Marker({ element, anchor: spec.anchor, offset: spec.offset }).setLngLat([spec.lng, spec.lat]).addTo(map);
        cache.set(spec.key, marker);
      }
      marker.setLngLat([spec.lng, spec.lat]);
      const element = marker.getElement();
      element.className = `maplibregl-marker ${spec.className}`;
      spec.draw(element);
      element.title = spec.label;
      if (element instanceof HTMLButtonElement) {
        element.setAttribute("aria-label", spec.label);
        element.setAttribute("aria-pressed", spec.pressed ? "true" : "false");
        element.onclick = (event) => {
          event.preventDefault();
          event.stopPropagation();
          ignoreClearRef.current = true;
          window.setTimeout(() => {
            ignoreClearRef.current = false;
          }, 0);
          spec.onClick?.();
        };
      }
    }
    };
    apply();
    map.on("style.load", apply);
    map.on("load", apply);
    const stopClock = subscribePlayClock(apply);
    return () => {
      cancelled = true;
      map.off("idle", apply);
      map.off("style.load", apply);
      map.off("load", apply);
      stopClock();
    };
  }, [markerKey]);

  useEffect(() => {
    const map = mapRef.current;
    const command = props.camera;
    if (!map || command.type === "none") return;
    const run = () => {
      const duration = reducedMotion() ? 0 : 700;
      if (command.type === "theater") {
        const theater = theaterById(command.id);
        const zoom = theaterCameraZoom(theater, window.innerWidth < 900);
        map.easeTo({ center: theater.center, zoom, duration });
      } else if (command.type === "battle") {
        map.easeTo({ center: [command.lng, command.lat], zoom: command.zoom, duration, essential: true });
      } else if (command.type === "overview") {
        map.easeTo({ center: OVERVIEW_CENTER, zoom: OVERVIEW_ZOOM, duration, essential: true });
      }
    };
    if (map.isStyleLoaded()) run();
    else map.once("idle", run);
    return () => {
      map.off("idle", run);
    };
  }, [props.camera]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const run = () => followIfLocked(map, propsRef.current, true);
    if (map.isStyleLoaded()) run();
    else map.once("idle", run);
    return () => {
      map.off("idle", run);
    };
  }, [props.followLng, props.followLat, props.cameraLock, props.lockNonce, props.playing]);

  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    const sync = props.syncView;
    if (!map || !container || !sync) return;
    const center = map.getCenter();
    if (
      Math.abs(center.lng - sync.lng) < 0.0008 &&
      Math.abs(center.lat - sync.lat) < 0.0008 &&
      Math.abs(map.getZoom() - sync.zoom) < 0.02
    ) {
      return;
    }
    applyingSync.current = true;
    map.jumpTo({ center: [sync.lng, sync.lat], zoom: sync.zoom });
    requestAnimationFrame(() => {
      applyingSync.current = false;
    });
  }, [props.syncView]);

  useEffect(() => {
    if (props.hidden) return;
    const map = mapRef.current;
    if (!map) return;
    map.resize();
    map.setPadding(panelPadding(props.frame ?? "full"));
    followIfLocked(map, propsRef.current, false);
  }, [props.hidden, props.frame]);

  return (
    <div className="map-wrap" hidden={props.hidden}>
      <div ref={containerRef} className="map-canvas" role="region" aria-label="Situation map" />
      {styleError && !plainCanvas ? (
        <div className="style-error">
          <p>The basemap did not load.</p>
          <button
            type="button"
            onClick={() => {
              if (props.basemap !== "dark") {
                props.onDisableBasemap();
                return;
              }
              const map = mapRef.current;
              if (map) map.setStyle(SITUATION_STYLE, { diff: false });
              setPlainCanvas(true);
              setStyleError(false);
            }}
          >
            {props.basemap === "dark" ? "Use the plain canvas" : "Use Dark"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
