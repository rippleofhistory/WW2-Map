import { useEffect, useRef, useState } from "react";
import type { FeatureCollection, LineString, Polygon } from "geojson";
import {
  Map as MlMap,
  Marker,
  NavigationControl,
  setWorkerUrl,
  type GeoJSONSource,
  type Map as MapInstance,
} from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { buildGraticule } from "../data/graticule.ts";
import { PLACEHOLDER_SOURCE } from "../data/sample.ts";
import { theaterById } from "../data/theaters.ts";
import { echelonMark } from "../lib/format.ts";
import { placeUnit } from "../lib/position.ts";
import { pathUntil } from "../lib/select.ts";
import { playClock, subscribePlayClock } from "../state/playClock.ts";
import { cssVar, sideColorsFrom } from "../lib/palette.ts";
import { exportMapPng } from "./exportPng.ts";
import { layoutUnits, zoomBandFor } from "./markerLayout.ts";
import { MODERN_STYLE, SITUATION_STYLE } from "./styles.ts";
import type { Battle, CameraCommand, PlaceLabel, PositionStatus, Unit } from "../types.ts";

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
  showGraticule: boolean;
  modernBasemap: boolean;
  alliedLine: [number, number][];
  axisLine: [number, number][];
  frontRing: [number, number][];
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
  onSelectUnit: (id: string) => void;
  onSelectBattle: (id: string) => void;
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

function drawUnit(element: HTMLElement, unit: Unit, status: PositionStatus) {
  element.replaceChildren();
  const mark = document.createElement("span");
  mark.className = "ech";
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = echelonMark(unit.echelon);
  const abbr = document.createElement("span");
  abbr.className = "abbr";
  abbr.textContent = unit.abbr;
  element.append(mark, abbr);
  if (status === "last-reported") {
    const tag = document.createElement("span");
    tag.className = "report";
    tag.textContent = "Last reported";
    element.append(tag);
  }
  if (unit.side === "soviet") {
    const star = document.createElement("span");
    star.className = "star";
    star.setAttribute("aria-hidden", "true");
    star.textContent = "★";
    element.append(star);
  }
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
  const zoom = Math.max(map.getZoom(), 10.5);
  if (!animate || reducedMotion()) {
    map.jumpTo({ center: [lng, lat], zoom });
    return;
  }
  const center = map.getCenter();
  const far = Math.hypot(center.lng - lng, center.lat - lat) > 1.5;
  if (far) {
    map.flyTo({ center: [lng, lat], zoom, essential: true, speed: 1.8, curve: 1.2 });
    return;
  }
  map.easeTo({ center: [lng, lat], zoom, duration: 600, essential: true });
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
    return { top: 64, bottom: 16, left: 340, right: 356 };
  }
  return { top: 78, bottom: 12, left: 10, right: 10 };
}

export function MapCanvas(props: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const cacheRef = useRef<Map<string, Marker>>(new Map());
  const ignoreClearRef = useRef(false);
  const propsRef = useRef(props);
  const paintingRef = useRef(false);
  const skipBasemapReset = useRef(true);
  const lockSeen = useRef(0);
  const applyingSync = useRef(false);
  const [styleError, setStyleError] = useState(false);
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
      const fat = current.contrast ? 6 : 4;
      upsertLine(map, "graticule", GRATICULE, line, 1, 0.45, undefined, current.showGraticule, false);
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
      upsertPolygon(
        map,
        "front-polygon",
        polygonData(current.frontRing),
        current.showFronts && current.frontRing.length >= 4,
      );
      upsertLine(
        map,
        "front-axis",
        lines("axis", current.axisLine),
        palette.axis,
        fat,
        0.95,
        [1.2, 1.1],
        current.showFronts && current.axisLine.length >= 2,
        true,
      );
      upsertLine(
        map,
        "front-allied",
        lines("allied", current.alliedLine),
        palette.allied,
        fat,
        0.95,
        [2, 1.3],
        current.showFronts && current.alliedLine.length >= 2,
        true,
      );
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
  ].join("|");

  const lineKey = [
    props.showFronts,
    props.showGraticule,
    props.alliedLine.map((point) => point.join(",")).join(" "),
    props.axisLine.map((point) => point.join(",")).join(" "),
    props.frontRing.map((point) => point.join(",")).join(" "),
    props.travelled.join(";"),
    props.fullTrack.join(";"),
    props.contrast ? "1" : "0",
  ].join("|");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const start = propsRef.current;
    const map = new MlMap({
      container,
      style: start.modernBasemap ? MODERN_STYLE : SITUATION_STYLE,
      center: start.initialCenter,
      zoom: start.initialZoom,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      maxZoom: 16,
      minZoom: 2,
      fadeDuration: 0,
      canvasContextAttributes: { preserveDrawingBuffer: true },
    });
    map.addControl(new NavigationControl({ showCompass: false }), "bottom-right");
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
      if (ignoreClearRef.current) return;
      propsRef.current.onBackground();
    });
    const onZoom = () => {
      const band = zoomBandFor(map.getZoom());
      setZoomBand((current) => (current === band ? current : band));
    };
    const publishView = () => {
      const center = map.getCenter();
      container.dataset.lng = center.lng.toFixed(2);
      container.dataset.lat = center.lat.toFixed(2);
      container.dataset.zoom = map.getZoom().toFixed(2);
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
    map.on("error", (event) => {
      const url = "url" in event.error ? String(event.error.url ?? "") : "";
      if (url.includes("openfreemap.org/styles")) setStyleError(true);
    });
    mapRef.current = map;
    propsRef.current.onBindExport(() => exportMapPng(map, container, propsRef.current.date));
    const cache = cacheRef.current;
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
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
    map.setStyle(props.modernBasemap ? MODERN_STYLE : SITUATION_STYLE, { diff: false });
    if (props.modernBasemap) setStyleError(false);
  }, [props.modernBasemap]);

  useEffect(() => {
    paint();
  }, [lineKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
    const current = propsRef.current;
    const specs: MarkerSpec[] = [];
    if (current.showUnits) {
      const zoom = map.getZoom();
      const playing = current.playing && playClock.playing;
      const fraction = playing ? playClock.fraction : 0;
      const placed = current.units.flatMap((item) => {
        const fix = placeUnit(item.unit, current.date, fraction, playing);
        if (!fix) return [];
        return [{ item, fix, selected: item.selected, echelon: item.unit.echelon, lng: fix.lng, lat: fix.lat }];
      });
      const layout = layoutUnits(placed, zoom);
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
        const reported = entry.fix.status === "last-reported" ? " Last reported." : "";
        specs.push({
          key: `unit:${unit.id}`,
          lng: entry.fix.lng,
          lat: entry.fix.lat,
          className: `map-marker unit-marker side-${unit.side}${entry.item.selected ? " selected" : ""}${entry.fix.status === "last-reported" ? " last-reported" : ""}`,
          label: `${unit.name}. ${unit.nation}.${reported} ${entry.fix.anchor.place ?? entry.fix.anchor.note}`,
          pressed: entry.item.selected,
          button: true,
          anchor: "center",
          offset: [0, 0],
          draw: (element) => drawUnit(element, unit, entry.fix.status),
          onClick: () => current.onSelectUnit(unit.id),
        });
      }
      const followed = selected[0];
      if (playing && current.cameraLock && followed) {
        const zoomUp = lockSeen.current !== current.lockNonce;
        lockSeen.current = current.lockNonce;
        map.jumpTo({
          center: [followed.fix.lng, followed.fix.lat],
          ...(zoomUp ? { zoom: Math.max(map.getZoom(), 10.5) } : {}),
        });
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
          label: `${battle.name}. Placeholder battle. ${PLACEHOLDER_SOURCE}`,
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
    return subscribePlayClock(apply);
  }, [markerKey]);

  useEffect(() => {
    const map = mapRef.current;
    const command = props.camera;
    if (!map || command.type === "none") return;
    const run = () => {
      const duration = reducedMotion() ? 0 : 700;
      if (command.type === "theater") {
        const theater = theaterById(command.id);
        const zoom = window.innerWidth < 900 ? Math.max(2, theater.zoom - 1.3) : theater.zoom;
        map.easeTo({ center: theater.center, zoom, duration });
      } else if (command.type === "battle") {
        map.easeTo({ center: [command.lng, command.lat], zoom: command.zoom, duration });
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
      {styleError ? (
        <div className="style-error">
          <p>The modern basemap did not load.</p>
          <button type="button" onClick={props.onDisableBasemap}>
            Use the plain canvas
          </button>
        </div>
      ) : null}
    </div>
  );
}
