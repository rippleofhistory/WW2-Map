import { useEffect, useRef, useState } from "react";
import {
  ArcType,
  Cartesian3,
  Cartographic,
  CesiumWidget,
  Color,
  ColorMaterialProperty,
  ConstantPositionProperty,
  ConstantProperty,
  EllipsoidTerrainProvider,
  ImageryLayer,
  LabelStyle,
  Math as CesiumMath,
  PolygonHierarchy,
  PolylineDashMaterialProperty,
  ScreenSpaceEventType,
  UrlTemplateImageryProvider,
  VerticalOrigin,
  type Entity,
} from "@cesium/engine";
import type { MapUnit } from "./MapCanvas.tsx";
import { buildGraticule } from "../data/graticule.ts";
import { PLACEHOLDER_SOURCE } from "../data/sample.ts";
import { theaterById, theaterCameraZoom } from "../data/theaters.ts";
import { counterSize, darkenHex, nationCounterColor, roundedRectPath, SIDE_PIP } from "../lib/counter.ts";
import { placeUnit } from "../lib/position.ts";
import { pathUntil } from "../lib/select.ts";
import { playClock, subscribePlayClock } from "../state/playClock.ts";
import type { FeatureCollection, Geometry } from "geojson";
import type { Basemap, Battle, CameraCommand, ControlSide, EchelonCap, PlaceLabel, PositionStatus, TheaterId, Unit } from "../types.ts";
import { COLLAPSED_FALLBACK, NEUTRAL_FALLBACK, controlColor, cssVar, sideColorsFrom } from "../lib/palette.ts";
import { postUnitsOnFronts } from "../lib/contact.ts";
import {
  CONTROL_FILL_COLOR,
  CONTROL_FILL_OPACITY,
  CONTROL_OUTLINE_COLOR,
  FRONT_LINE_COLOR,
  prepareFrontDraw,
  type FrontTrace,
} from "../lib/frontStyle.ts";
import { OCCUPATION_MAX_ZOOM, OVERVIEW_CENTER, OVERVIEW_ZOOM } from "../lib/occupation.ts";
import { heightForZoom, layoutUnits, zoomBandFor, zoomForHeight } from "./markerLayout.ts";

type WorldPoint = ReturnType<typeof Cartesian3.fromDegrees>;

const GRATICULE = buildGraticule();
const canvases = new Map<string, HTMLCanvasElement>();

export interface GlobeProps {
  units: MapUnit[];
  battles: readonly Battle[];
  labels: readonly PlaceLabel[];
  selectedBattleId: string | null;
  showUnits: boolean;
  showBattles: boolean;
  showLabels: boolean;
  showFronts: boolean;
  showControlAreas: boolean;
  showOccupation: boolean;
  occupation: FeatureCollection<Geometry>;
  selectedRegionId: string | null;
  showGraticule: boolean;
  basemap: Basemap;
  echelonCap: EchelonCap;
  alliedLine: [number, number][];
  axisLine: [number, number][];
  frontRing: [number, number][];
  frontTraces?: {
    sector?: string;
    date?: string;
    allied: [number, number][];
    axis: [number, number][];
    polygon?: [number, number][];
  }[];
  travelled: [number, number][];
  fullTrack: [number, number][];
  date: string;
  playing: boolean;
  camera: CameraCommand;
  cameraLock: boolean;
  lockNonce: number;
  followLng?: number;
  followLat?: number;
  theaterId: TheaterId;
  onSelectUnit: (id: string) => void;
  onSelectBattle: (id: string) => void;
  onSelectRegion: (id: string) => void;
  onBackground: () => void;
  onUserDrag: () => void;
  onBindExport: (exportPng: () => string | null) => void;
  contrast: boolean;
}

function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function globeTraces(current: GlobeProps): FrontTrace[] {
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

function ring(coordinates: [number, number][]): [number, number][] {
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  if (!first || !last) return coordinates;
  if (first[0] === last[0] && first[1] === last[1]) return coordinates;
  return [...coordinates, first];
}

function ringsOf(geometry: Geometry): [number, number][][] {
  if (geometry.type === "Polygon") return [geometry.coordinates[0] as [number, number][]];
  if (geometry.type === "MultiPolygon") return geometry.coordinates.map((polygon) => polygon[0] as [number, number][]);
  return [];
}

function degrees(line: readonly [number, number][]): WorldPoint[] {
  const flat: number[] = [];
  for (const point of line) flat.push(point[0], point[1]);
  return Cartesian3.fromDegreesArray(flat);
}

function drawDisc(label: string, stroke: string, dashed: boolean, selected: boolean): HTMLCanvasElement {
  const key = `cluster|${label}|${stroke}|${dashed}|${selected}`;
  const cached = canvases.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = 88;
  canvas.height = 88;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  roundedRectPath(ctx, 18, 18, 52, 52, 6);
  ctx.fillStyle = "#3a4038";
  ctx.fill();
  ctx.lineWidth = selected ? 4 : 2;
  ctx.strokeStyle = selected ? "#ffffff" : stroke;
  ctx.setLineDash(dashed ? [5, 4] : []);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 22px Barlow Condensed, Arial Narrow, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 44, 44);
  canvases.set(key, canvas);
  return canvas;
}

function drawDiamond(): HTMLCanvasElement {
  const cached = canvases.get("battle");
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.beginPath();
  ctx.moveTo(32, 6);
  ctx.lineTo(58, 32);
  ctx.lineTo(32, 58);
  ctx.lineTo(6, 32);
  ctx.closePath();
  ctx.fillStyle = "rgba(12, 16, 12, 0.92)";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#e2c56a";
  ctx.stroke();
  canvases.set("battle", canvas);
  return canvas;
}

function rasterImagery(url: string, credit: string): ImageryLayer {
  return ImageryLayer.fromProviderAsync(
    Promise.resolve(
      new UrlTemplateImageryProvider({
        url,
        credit,
        maximumLevel: 19,
        hasAlphaChannel: false,
        enablePickFeatures: false,
      }),
    ),
  );
}

function imageryFor(basemap: Basemap): ImageryLayer {
  if (basemap === "satellite") {
    return rasterImagery(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      "Tiles © Esri",
    );
  }
  if (basemap === "terrain") {
    return rasterImagery(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
      "Tiles © Esri",
    );
  }
  return ImageryLayer.fromProviderAsync(
    Promise.resolve(
      new UrlTemplateImageryProvider({
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        subdomains: ["a", "b", "c", "d"],
        credit: "© OpenStreetMap contributors © CARTO",
        maximumLevel: 19,
        hasAlphaChannel: false,
        enablePickFeatures: false,
      }),
    ),
  );
}

function fovyOf(widget: CesiumWidget): number {
  const frustum = widget.camera.frustum;
  return "fovy" in frustum && typeof frustum.fovy === "number" ? frustum.fovy : Math.PI / 3;
}

function zoomOf(widget: CesiumWidget): number {
  const carto = widget.camera.positionCartographic;
  return zoomForHeight(carto.height, CesiumMath.toDegrees(carto.latitude), widget.canvas.clientHeight, fovyOf(widget));
}

function stamp(container: HTMLElement, widget: CesiumWidget): void {
  const carto = Cartographic.clone(widget.camera.positionCartographic);
  container.dataset.cameraLng = CesiumMath.toDegrees(carto.longitude).toFixed(2);
  container.dataset.cameraLat = CesiumMath.toDegrees(carto.latitude).toFixed(2);
  container.dataset.zoom = zoomOf(widget).toFixed(2);
}

function frameFor(props: GlobeProps): { lng: number; lat: number; zoom: number } {
  if (props.camera.type === "battle") return { lng: props.camera.lng, lat: props.camera.lat, zoom: props.camera.zoom };
  if (props.camera.type === "theater") {
    const theater = theaterById(props.camera.id);
    return { lng: theater.center[0], lat: theater.center[1], zoom: theaterCameraZoom(theater, window.innerWidth < 900) };
  }
  if (props.camera.type === "overview") return { lng: OVERVIEW_CENTER[0], lat: OVERVIEW_CENTER[1], zoom: OVERVIEW_ZOOM };
  const theater = theaterById(props.theaterId);
  const zoom = theaterCameraZoom(theater, window.innerWidth < 900);
  if (props.followLng !== undefined && props.followLat !== undefined) {
    return { lng: props.followLng, lat: props.followLat, zoom };
  }
  return { lng: theater.center[0], lat: theater.center[1], zoom };
}

function setLine(entity: Entity, positions: WorldPoint[]): void {
  const graphic = entity.polyline;
  if (!graphic) return;
  if (graphic.positions instanceof ConstantProperty) graphic.positions.setValue(positions);
  else graphic.positions = new ConstantProperty(positions);
}

function moveBillboard(entity: Entity, lng: number, lat: number, image: HTMLCanvasElement): void {
  const position = Cartesian3.fromDegrees(lng, lat);
  if (entity.position instanceof ConstantPositionProperty) entity.position.setValue(position);
  else entity.position = new ConstantPositionProperty(position);
  if (entity.billboard) entity.billboard.image = new ConstantProperty(image);
}

export default function GlobeCanvas(props: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<CesiumWidget | null>(null);
  const propsRef = useRef(props);
  const clicksRef = useRef(new Map<string, () => void>());
  const suppressRef = useRef(0);
  const seenCamera = useRef(-1);
  const skipImagery = useRef(true);
  const [failed, setFailed] = useState("");
  const [zoomBand, setZoomBand] = useState(() => zoomBandFor(theaterById(props.theaterId).zoom));

  useEffect(() => {
    propsRef.current = props;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const narrow = window.innerWidth < 900;
    let widget: CesiumWidget;
    try {
      widget = new CesiumWidget(container, {
        baseLayer: imageryFor(propsRef.current.basemap),
        terrainProvider: new EllipsoidTerrainProvider(),
        requestRenderMode: true,
        maximumRenderTimeChange: Number.POSITIVE_INFINITY,
        useBrowserRecommendedResolution: narrow,
        msaaSamples: narrow ? 1 : 4,
        contextOptions: { webgl: { preserveDrawingBuffer: true } },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "The globe did not start.";
      queueMicrotask(() => setFailed(message));
      return;
    }
    widget.scene.backgroundColor = Color.fromCssColorString("#121510");
    widget.scene.globe.baseColor = Color.fromCssColorString("#1c2218");
    widget.scene.globe.enableLighting = false;
    widget.scene.screenSpaceCameraController.minimumZoomDistance = 1500;
    widget.scene.screenSpaceCameraController.maximumZoomDistance = 40_000_000;
    widgetRef.current = widget;
    const opening = frameFor(propsRef.current);
    const canvasHeight = container.clientHeight || widget.canvas.clientHeight || 700;
    widget.camera.setView({
      destination: Cartesian3.fromDegrees(opening.lng, opening.lat, heightForZoom(opening.zoom, opening.lat, canvasHeight)),
      orientation: { heading: 0, pitch: CesiumMath.toRadians(-90), roll: 0 },
    });
    seenCamera.current = propsRef.current.camera.nonce;
    stamp(container, widget);
    widget.scene.requestRender();

    const onClick = (click: { position: Parameters<CesiumWidget["scene"]["pick"]>[0] }) => {
      const picked = widget.scene.pick(click.position) as { id?: Entity } | undefined;
      const id = picked?.id?.id;
      const run = typeof id === "string" ? clicksRef.current.get(id) : undefined;
      if (run) run();
      else propsRef.current.onBackground();
    };
    widget.screenSpaceEventHandler.setInputAction(onClick, ScreenSpaceEventType.LEFT_CLICK);
    const onMove = () => {
      if (suppressRef.current > 0) return;
      propsRef.current.onUserDrag();
    };
    widget.camera.moveStart.addEventListener(onMove);
    const onMoved = () => {
      stamp(container, widget);
      const band = zoomBandFor(zoomOf(widget));
      setZoomBand((current) => (current === band ? current : band));
    };
    widget.camera.moveEnd.addEventListener(onMoved);

    let width = 0;
    let height = 0;
    const onResize = () => {
      const nextWidth = container.clientWidth;
      const nextHeight = container.clientHeight;
      if (nextWidth === 0 || nextHeight === 0) return;
      if (nextWidth === width && nextHeight === height) return;
      width = nextWidth;
      height = nextHeight;
      widget.resize();
      widget.scene.requestRender();
    };
    onResize();
    const observer = new ResizeObserver(() => onResize());
    observer.observe(container);
    propsRef.current.onBindExport(() => exportGlobe(widget, propsRef.current.date));

    return () => {
      observer.disconnect();
      widget.camera.moveStart.removeEventListener(onMove);
      widget.camera.moveEnd.removeEventListener(onMoved);
      propsRef.current.onBindExport(() => "Map is not ready.");
      if (!widget.isDestroyed()) widget.destroy();
      widgetRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (skipImagery.current) {
      skipImagery.current = false;
      return;
    }
    const widget = widgetRef.current;
    if (!widget) return;
    widget.imageryLayers.removeAll();
    widget.imageryLayers.add(imageryFor(props.basemap));
    widget.scene.requestRender();
  }, [props.basemap]);

  useEffect(() => {
    const widget = widgetRef.current;
    const container = containerRef.current;
    if (!widget || !container || props.camera.nonce === seenCamera.current) return;
    seenCamera.current = props.camera.nonce;
    const frame = frameFor(props);
    fly(widget, container, frame.lng, frame.lat, frame.zoom, suppressRef);
  }, [props, props.camera]);

  useEffect(() => {
    const widget = widgetRef.current;
    const container = containerRef.current;
    if (!widget || !container || props.playing || !props.cameraLock) return;
    if (props.followLng === undefined || props.followLat === undefined) return;
    fly(widget, container, props.followLng, props.followLat, zoomOf(widget), suppressRef);
  }, [props.followLng, props.followLat, props.cameraLock, props.lockNonce, props.playing]);

  const syncKey = [
    props.showUnits,
    props.showBattles,
    props.showLabels,
    props.showFronts,
    props.showControlAreas,
    props.showGraticule,
    props.echelonCap,
    props.selectedBattleId ?? "",
    props.date,
    props.playing,
    props.units.map((item) => `${item.unit.id}:${item.status}:${item.selected}`).join(","),
    props.battles.map((battle) => battle.id).join(","),
    props.labels.map((label) => label.id).join(","),
    props.alliedLine.map((point) => point.join(",")).join(" "),
    props.axisLine.map((point) => point.join(",")).join(" "),
    props.frontRing.map((point) => point.join(",")).join(" "),
    (props.frontTraces ?? [])
      .map(
        (trace) =>
          `${trace.sector ?? ""}:${trace.date ?? ""}:${trace.allied.join(" ")}|${trace.axis.join(" ")}|${(trace.polygon ?? []).join(" ")}`,
      )
      .join(";"),
    props.fullTrack.join(";"),
    props.contrast ? "1" : "0",
    props.showOccupation ? "1" : "0",
    props.selectedRegionId ?? "",
    zoomBand,
    props.occupation.features
      .map((feature) => {
        const row = feature.properties as { iso?: string; side?: string; status?: string } | null;
        return `${row?.iso ?? ""}:${row?.side ?? ""}:${row?.status ?? ""}`;
      })
      .join("|"),
  ].join("|");

  useEffect(() => {
    const apply = () => paint(widgetRef.current, propsRef.current, clicksRef.current, suppressRef);
    apply();
    return subscribePlayClock(apply);
  }, [syncKey]);

  return (
    <div className="globe-wrap" data-globe="1">
      <div ref={containerRef} className="globe-canvas" role="region" aria-label="Situation globe" />
      {failed ? (
        <div className="style-error" role="alert">
          <p>The globe did not start.</p>
          <p>{failed}</p>
        </div>
      ) : null}
    </div>
  );
}

function fly(
  widget: CesiumWidget,
  container: HTMLElement,
  lng: number,
  lat: number,
  zoom: number,
  suppressRef: { current: number },
): void {
  const destination = Cartesian3.fromDegrees(lng, lat, heightForZoom(zoom, lat, widget.canvas.clientHeight || 700));
  const orientation = { heading: 0, pitch: CesiumMath.toRadians(-90), roll: 0 };
  suppressRef.current += 1;
  const release = () => {
    suppressRef.current = Math.max(0, suppressRef.current - 1);
    stamp(container, widget);
  };
  if (reducedMotion()) {
    widget.camera.setView({ destination, orientation });
    widget.scene.requestRender();
    release();
    return;
  }
  widget.camera.flyTo({ destination, orientation, duration: 0.7, complete: release, cancel: release });
}

function paint(
  widget: CesiumWidget | null,
  current: GlobeProps,
  clicks: Map<string, () => void>,
  suppressRef: { current: number },
): void {
  if (!widget || widget.isDestroyed()) return;
  const playing = current.playing && playClock.playing;
  const fraction = playing ? playClock.fraction : 0;
  const zoom = zoomOf(widget);
  clicks.clear();
  const wanted = new Set<string>();
  const host = widget.container instanceof Element ? widget.container : document.querySelector(".app");
  const gold = cssVar(host, "--gold", "#f0d78c");
  const lineColor = cssVar(host, "--line", "#3e4a34");
  widget.scene.backgroundColor = Color.fromCssColorString(cssVar(host, "--bg", "#121510"));

  const ensureLine = (id: string, line: readonly [number, number][], color: string, width: number, dash: boolean) => {
    if (line.length < 2) return;
    wanted.add(id);
    const material = dash
      ? new PolylineDashMaterialProperty({ color: Color.fromCssColorString(color), dashLength: 16 })
      : new ColorMaterialProperty(Color.fromCssColorString(color));
    let entity = widget.entities.getById(id);
    if (!entity) {
      entity = widget.entities.add({
        id,
        polyline: {
          positions: degrees(line),
          width,
          clampToGround: true,
          arcType: ArcType.RHUMB,
          material,
        },
      });
    } else if (entity.polyline) {
      entity.polyline.material = material;
      entity.polyline.width = new ConstantProperty(width);
    }
    setLine(entity, degrees(line));
  };

  if (current.showGraticule) {
    GRATICULE.features.forEach((feature, index) => {
      const coordinates = feature.geometry.coordinates as [number, number][];
      ensureLine(`grid:${index}`, coordinates, lineColor, 1, false);
    });
  }
  ensureLine("path-full", current.fullTrack, gold, 2, true);
  const trackUnit = current.units.find((item) => item.selected);
  const moving = trackUnit ? placeUnit(trackUnit.unit, current.date, fraction, playing) : null;
  const head = moving?.status === "moving" ? ([moving.lng, moving.lat] as [number, number]) : undefined;
  const travelled = trackUnit ? pathUntil(trackUnit.unit, current.date, head) : current.travelled;
  ensureLine("path-travelled", travelled, gold, current.contrast ? 5 : 3, false);
  if (current.showOccupation && zoom < OCCUPATION_MAX_ZOOM) {
    const hostEl = widget.container instanceof Element ? widget.container : document.querySelector(".app");
    const occPalette = sideColorsFrom(hostEl);
    const neutral = cssVar(hostEl, "--neutral", NEUTRAL_FALLBACK);
    const collapsed = cssVar(hostEl, "--collapsed", COLLAPSED_FALLBACK);
    for (const feature of current.occupation.features) {
      const row = feature.properties as { id?: string; iso?: string; side?: string; status?: string } | null;
      const stateId = row?.id;
      const iso = row?.iso ?? "x";
      if (!stateId || !row?.side) continue;
      const fill = Color.fromCssColorString(controlColor(row.side as ControlSide, row.status ?? "sovereign", occPalette, neutral, collapsed)).withAlpha(
        current.selectedRegionId === stateId ? 0.62 : 0.42,
      );
      const parts = ringsOf(feature.geometry);
      parts.forEach((part, index) => {
        const id = `occ:${stateId}:${iso}:${index}`;
        wanted.add(id);
        const positions = degrees(part);
        let entity = widget.entities.getById(id);
        if (!entity) {
          entity = widget.entities.add({
            id,
            polygon: {
              hierarchy: new PolygonHierarchy(positions),
              material: fill,
              outline: false,
            },
          });
        } else if (entity.polygon) {
          entity.polygon.material = new ColorMaterialProperty(fill);
          if (entity.polygon.hierarchy instanceof ConstantProperty) entity.polygon.hierarchy.setValue(new PolygonHierarchy(positions));
          else entity.polygon.hierarchy = new ConstantProperty(new PolygonHierarchy(positions));
        }
        clicks.set(id, () => current.onSelectRegion(stateId));
      });
    }
  }

  const prepared = prepareFrontDraw(globeTraces(current), current.theaterId);
  const globeHost = widget.container instanceof HTMLElement ? widget.container : null;
  if (current.showControlAreas) {
    prepared.fills.forEach((fill, index) => {
      if (fill.coordinates.length < 4) return;
      const id = `front-control:${index}`;
      wanted.add(id);
      const positions = degrees(fill.coordinates);
      const material = Color.fromCssColorString(CONTROL_FILL_COLOR[fill.side]).withAlpha(CONTROL_FILL_OPACITY[fill.side]);
      const outline = Color.fromCssColorString(CONTROL_OUTLINE_COLOR[fill.side]);
      let entity = widget.entities.getById(id);
      if (!entity) {
        entity = widget.entities.add({
          id,
          polygon: {
            hierarchy: new PolygonHierarchy(positions),
            material,
            outline: true,
            outlineColor: outline,
            outlineWidth: 1,
          },
        });
      } else if (entity.polygon) {
        entity.polygon.material = new ColorMaterialProperty(material);
        entity.polygon.outlineColor = new ConstantProperty(outline);
        entity.polygon.outlineWidth = new ConstantProperty(1);
        if (entity.polygon.hierarchy instanceof ConstantProperty) entity.polygon.hierarchy.setValue(new PolygonHierarchy(positions));
        else entity.polygon.hierarchy = new ConstantProperty(new PolygonHierarchy(positions));
      }
      ensureLine(`front-control-outline:${index}`, fill.coordinates, CONTROL_OUTLINE_COLOR[fill.side], 1, false);
    });
  }
  if (globeHost) {
    globeHost.dataset.frontStyle = "hoi4";
    globeHost.dataset.frontOn = current.showFronts ? "1" : "0";
    globeHost.dataset.frontSides = [...new Set(prepared.lines.map((line) => line.side))].join("|");
    globeHost.dataset.frontLines = String(prepared.lines.length);
    globeHost.dataset.controlOn = current.showControlAreas && prepared.fills.length > 0 ? "1" : "0";
    globeHost.dataset.controlSides = [...new Set(prepared.fills.map((fill) => fill.side))].join("|");
    globeHost.dataset.controlFills = String(prepared.fills.length);
    globeHost.dataset.controlApprox = prepared.fills.some((fill) => fill.approximate) ? "1" : "0";
  }
  if (current.showFronts) {
    prepared.lines.forEach((stroke, index) => {
      const color = FRONT_LINE_COLOR[stroke.side];
      ensureLine(`front-line:${index}:glow`, stroke.coordinates, color, 16, false);
      const glow = widget.entities.getById(`front-line:${index}:glow`);
      if (glow?.polyline) {
        glow.polyline.material = new ColorMaterialProperty(Color.fromCssColorString(color).withAlpha(0.25));
      }
      ensureLine(`front-line:${index}:casing`, stroke.coordinates, "#000000", 11, false);
      const casing = widget.entities.getById(`front-line:${index}:casing`);
      if (casing?.polyline) {
        casing.polyline.material = new ColorMaterialProperty(Color.fromCssColorString("#000000").withAlpha(0.85));
      }
      ensureLine(`front-line:${index}:fill`, stroke.coordinates, color, 6, false);
    });
    if (current.frontRing.length >= 4 && !current.showControlAreas) {
      const id = "front-polygon";
      wanted.add(id);
      const positions = degrees(ring(current.frontRing));
      let entity = widget.entities.getById(id);
      if (!entity) {
        entity = widget.entities.add({
          id,
          polygon: {
            hierarchy: new PolygonHierarchy(positions),
            material: Color.fromCssColorString("#5a6b4a").withAlpha(0.28),
            outline: false,
          },
        });
      }
      if (entity.polygon) {
        if (entity.polygon.hierarchy instanceof ConstantProperty) entity.polygon.hierarchy.setValue(new PolygonHierarchy(positions));
        else entity.polygon.hierarchy = new ConstantProperty(new PolygonHierarchy(positions));
      }
      ensureLine("front-ring", ring(current.frontRing), "#d6c27a", 2, false);
    }
  }

  if (current.showUnits) {
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
      globeTraces(current),
    );
    const postById = new Map(posts.map((post) => [post.unitId, post]));
    const posted = placed.map((entry) => {
      const post = postById.get(entry.item.unit.id);
      if (!post?.onFront) return entry;
      return { ...entry, lng: post.lng, lat: post.lat };
    });
    const layout = layoutUnits(posted, zoom, current.echelonCap);
    const globeHost = widget.container instanceof HTMLElement ? widget.container : null;
    if (globeHost) {
      const drawn = layout.individuals.map((entry) => entry.item.unit.id);
      globeHost.dataset.drawn = drawn.join("|");
      globeHost.dataset.labeled = drawn.join("|");
      globeHost.dataset.clusters = String(layout.clusters.length);
      globeHost.dataset.counterStyle = "hoi4";
    }
    for (const cluster of layout.clusters) {
      const id = `cluster:${cluster.key}`;
      wanted.add(id);
      const names = cluster.members.map((entry) => entry.item.unit.abbr).join(", ");
      const image = drawDisc(String(cluster.members.length), "#f0d78c", false, false);
      let entity = widget.entities.getById(id);
      if (!entity) entity = widget.entities.add({ id, position: Cartesian3.fromDegrees(cluster.lng, cluster.lat), billboard: { image, scale: 0.42 } });
      moveBillboard(entity, cluster.lng, cluster.lat, image);
      clicks.set(id, () => {
        fly(
          widget,
          widget.container as HTMLElement,
          cluster.lng,
          cluster.lat,
          Math.min(16, Math.max(zoomOf(widget) + 1.8, 7.2)),
          suppressRef,
        );
      });
      entity.name = `Cluster of ${cluster.members.length} units: ${names}. Zoom in. ${PLACEHOLDER_SOURCE}`;
    }
    for (const entry of layout.individuals) {
      const unit = entry.item.unit;
      const id = `unit:${unit.id}`;
      wanted.add(id);
      const post = postById.get(unit.id);
      const opponent = post?.opponentId ? current.units.find((row) => row.unit.id === post.opponentId)?.unit : null;
      const image = unitCanvas(unit, entry.fix.status, entry.item.selected);
      let entity = widget.entities.getById(id);
      if (!entity) {
        entity = widget.entities.add({
          id,
          position: Cartesian3.fromDegrees(entry.lng, entry.lat),
          billboard: { image, verticalOrigin: VerticalOrigin.CENTER, scale: 0.5 },
        });
      }
      moveBillboard(entity, entry.lng, entry.lat, image);
      clicks.set(id, () => current.onSelectUnit(unit.id));
      const reported = entry.fix.status === "last-reported" ? " Last reported." : "";
      const contactNote = opponent ? ` In contact with ${opponent.name}.` : post?.onFront ? " On the schematic contact." : "";
      entity.name = `${unit.name}. ${unit.nation}.${reported}${contactNote} ${entry.fix.anchor.place ?? entry.fix.anchor.note}`;
    }
    const followed = layout.individuals.find((entry) => entry.selected);
    if (playing && current.cameraLock && followed) {
      const destination = Cartesian3.fromDegrees(
        followed.lng,
        followed.lat,
        heightForZoom(zoom, followed.lat, widget.canvas.clientHeight || 700),
      );
      suppressRef.current += 1;
      widget.camera.setView({
        destination,
        orientation: { heading: 0, pitch: CesiumMath.toRadians(-90), roll: 0 },
      });
      window.setTimeout(() => {
        suppressRef.current = Math.max(0, suppressRef.current - 1);
      }, 40);
      stamp(widget.container as HTMLElement, widget);
    }
  } else if (widget.container instanceof HTMLElement) {
    widget.container.dataset.drawn = "";
    widget.container.dataset.labeled = "";
    widget.container.dataset.clusters = "0";
  }

  if (current.showBattles) {
    for (const battle of current.battles) {
      const id = `battle:${battle.id}`;
      wanted.add(id);
      const image = drawDiamond();
      let entity = widget.entities.getById(id);
      if (!entity) entity = widget.entities.add({ id, position: Cartesian3.fromDegrees(battle.lng, battle.lat), billboard: { image, scale: 0.7 } });
      moveBillboard(entity, battle.lng, battle.lat, image);
      if (current.selectedBattleId === battle.id && entity.billboard) entity.billboard.scale = new ConstantProperty(0.9);
      clicks.set(id, () => current.onSelectBattle(battle.id));
    }
  }

  if (current.showLabels) {
    for (const label of current.labels) {
      const id = `label:${label.id}`;
      wanted.add(id);
      let entity = widget.entities.getById(id);
      if (!entity) {
        entity = widget.entities.add({
          id,
          position: Cartesian3.fromDegrees(label.lng, label.lat),
          label: {
            text: `${label.name}\nPLACEHOLDER`,
            font: "16px Barlow Condensed, sans-serif",
            fillColor: Color.fromCssColorString("#ebe6d6"),
            outlineColor: Color.fromCssColorString("#121510"),
            outlineWidth: 3,
            style: LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: VerticalOrigin.BOTTOM,
          },
        });
      }
    }
  }

  const stale: Entity[] = [];
  for (let index = 0; index < widget.entities.values.length; index += 1) {
    const entity = widget.entities.values[index];
    if (entity && !wanted.has(entity.id)) stale.push(entity);
  }
  for (const entity of stale) widget.entities.remove(entity);
  widget.scene.requestRender();
}

function unitCanvas(unit: Unit, status: PositionStatus, selected: boolean): HTMLCanvasElement {
  const face = nationCounterColor(unit.nation, unit.side);
  const key = `${unit.abbr}|${unit.nation}|${unit.echelon}|${unit.side}|${status}|${selected}|${unit.strength ?? ""}|${face}`;
  const cached = canvases.get(key);
  if (cached) return cached;
  const size = counterSize(unit.echelon);
  const pad = selected ? 6 : 4;
  const dpr = 2;
  const canvas = document.createElement("canvas");
  canvas.width = (size + pad * 2) * dpr;
  canvas.height = (size + pad * 2) * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.scale(dpr, dpr);
  if (status === "last-reported") ctx.globalAlpha = 0.78;
  roundedRectPath(ctx, pad, pad, size, size, 3);
  ctx.fillStyle = face;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = selected ? "#ffffff" : darkenHex(face);
  ctx.setLineDash(status === "last-reported" ? [3, 2] : []);
  ctx.stroke();
  ctx.setLineDash([]);
  if (selected) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
  }
  const pip = 5;
  ctx.beginPath();
  ctx.arc(pad + size - 5, pad + 5, pip / 2, 0, Math.PI * 2);
  ctx.fillStyle = SIDE_PIP[unit.side];
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  const fontPx = size <= 14 ? 8 : size <= 18 ? 9 : 11;
  ctx.font = `700 ${fontPx}px Barlow Condensed, Arial Narrow, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const label = unit.abbr.length > 8 ? `${unit.abbr.slice(0, 7)}…` : unit.abbr;
  ctx.fillText(label, pad + size / 2, pad + size / 2 + (unit.strength !== undefined ? -1 : 0));
  if (unit.strength !== undefined) {
    const barY = pad + size - 4;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(pad + 2, barY, size - 4, 2);
    ctx.fillStyle = "#ebe6d6";
    ctx.fillRect(pad + 2, barY, (size - 4) * unit.strength, 2);
  }
  canvases.set(key, canvas);
  return canvas;
}

function exportGlobe(widget: CesiumWidget, date: string): string | null {
  if (widget.isDestroyed()) return "Map is not ready.";
  try {
    widget.resize();
    widget.scene.requestRender();
    widget.render();
    const link = document.createElement("a");
    link.href = widget.canvas.toDataURL("image/png");
    link.download = `ww2hub-map-${date}.png`;
    link.click();
    return null;
  } catch {
    return "The basemap blocked the image export.";
  }
}
