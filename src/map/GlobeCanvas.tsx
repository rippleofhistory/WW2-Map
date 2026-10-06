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
  TileMapServiceImageryProvider,
  UrlTemplateImageryProvider,
  VerticalOrigin,
  buildModuleUrl,
  type Entity,
} from "@cesium/engine";
import type { MapUnit } from "./MapCanvas.tsx";
import { buildGraticule } from "../data/graticule.ts";
import { PLACEHOLDER_SOURCE } from "../data/sample.ts";
import { theaterById } from "../data/theaters.ts";
import { echelonMark } from "../lib/format.ts";
import { placeUnit } from "../lib/position.ts";
import { pathUntil } from "../lib/select.ts";
import { playClock, subscribePlayClock } from "../state/playClock.ts";
import type { FeatureCollection, Geometry } from "geojson";
import type { Battle, CameraCommand, ControlSide, PlaceLabel, PositionStatus, TheaterId, Unit } from "../types.ts";
import { COLLAPSED_FALLBACK, NEUTRAL_FALLBACK, controlColor, cssVar, sideColorsFrom } from "../lib/palette.ts";
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
  showOccupation: boolean;
  occupation: FeatureCollection<Geometry>;
  selectedRegionId: string | null;
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
  const key = `${label}|${stroke}|${dashed}|${selected}`;
  const cached = canvases.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.beginPath();
  ctx.arc(64, 72, 34, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(12, 16, 12, 0.92)";
  ctx.fill();
  ctx.lineWidth = selected ? 7 : 4;
  ctx.strokeStyle = selected ? "#f0d78c" : stroke;
  ctx.setLineDash(dashed ? [7, 5] : []);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#ebe6d6";
  ctx.font = "700 22px Barlow Condensed, Arial Narrow, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 64, 74);
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

function plainImagery(): ImageryLayer {
  return ImageryLayer.fromProviderAsync(
    TileMapServiceImageryProvider.fromUrl(buildModuleUrl("Assets/Textures/NaturalEarthII")),
  );
}

function modernImagery(): ImageryLayer {
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
}

function frameFor(props: GlobeProps): { lng: number; lat: number; zoom: number } {
  if (props.camera.type === "battle") return { lng: props.camera.lng, lat: props.camera.lat, zoom: props.camera.zoom };
  if (props.camera.type === "theater") {
    const theater = theaterById(props.camera.id);
    const zoom = window.innerWidth < 900 ? Math.max(2, theater.zoom - 1.3) : theater.zoom;
    return { lng: theater.center[0], lat: theater.center[1], zoom };
  }
  if (props.camera.type === "overview") return { lng: OVERVIEW_CENTER[0], lat: OVERVIEW_CENTER[1], zoom: OVERVIEW_ZOOM };
  if (props.followLng !== undefined && props.followLat !== undefined) {
    return { lng: props.followLng, lat: props.followLat, zoom: 11 };
  }
  const theater = theaterById(props.theaterId);
  const zoom = window.innerWidth < 900 ? Math.max(2, theater.zoom - 1.3) : theater.zoom;
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
  const lockSeen = useRef(0);
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
        baseLayer: propsRef.current.modernBasemap ? modernImagery() : plainImagery(),
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
    widget.imageryLayers.add(props.modernBasemap ? modernImagery() : plainImagery());
    widget.scene.requestRender();
  }, [props.modernBasemap]);

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
    const zoom = Math.max(zoomOf(widget), 10.5);
    fly(widget, container, props.followLng, props.followLat, zoom, suppressRef);
  }, [props.followLng, props.followLat, props.cameraLock, props.lockNonce, props.playing]);

  const syncKey = [
    props.showUnits,
    props.showBattles,
    props.showLabels,
    props.showFronts,
    props.showGraticule,
    props.selectedBattleId ?? "",
    props.date,
    props.playing,
    props.units.map((item) => `${item.unit.id}:${item.status}:${item.selected}`).join(","),
    props.battles.map((battle) => battle.id).join(","),
    props.labels.map((label) => label.id).join(","),
    props.alliedLine.map((point) => point.join(",")).join(" "),
    props.axisLine.map((point) => point.join(",")).join(" "),
    props.frontRing.map((point) => point.join(",")).join(" "),
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
    const apply = () => paint(widgetRef.current, propsRef.current, clicksRef.current, lockSeen, suppressRef);
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
  lockSeen: { current: number },
  suppressRef: { current: number },
): void {
  if (!widget || widget.isDestroyed()) return;
  const playing = current.playing && playClock.playing;
  const fraction = playing ? playClock.fraction : 0;
  const zoom = zoomOf(widget);
  clicks.clear();
  const wanted = new Set<string>();
  const host = widget.container instanceof Element ? widget.container : document.querySelector(".app");
  const palette = sideColorsFrom(host);
  const gold = cssVar(host, "--gold", "#f0d78c");
  const lineColor = cssVar(host, "--line", "#3e4a34");
  const fat = current.contrast ? 6 : 4;
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

  if (current.showFronts) {
    ensureLine("front-allied", current.alliedLine, palette.allied, fat, true);
    ensureLine("front-axis", current.axisLine, palette.axis, fat, true);
    if (current.frontRing.length >= 4) {
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
      return [{ item, fix, selected: item.selected, echelon: item.unit.echelon, lng: fix.lng, lat: fix.lat }];
    });
    const layout = layoutUnits(placed, zoom);
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
      const image = unitCanvas(unit, entry.fix.status, entry.item.selected, palette[unit.side], gold);
      let entity = widget.entities.getById(id);
      if (!entity) {
        entity = widget.entities.add({
          id,
          position: Cartesian3.fromDegrees(entry.fix.lng, entry.fix.lat),
          billboard: { image, verticalOrigin: VerticalOrigin.CENTER, scale: 0.5 },
        });
      }
      moveBillboard(entity, entry.fix.lng, entry.fix.lat, image);
      clicks.set(id, () => current.onSelectUnit(unit.id));
    }
    const followed = layout.individuals.find((entry) => entry.selected);
    if (playing && current.cameraLock && followed) {
      const zoomUp = lockSeen.current !== current.lockNonce;
      lockSeen.current = current.lockNonce;
      const nextZoom = zoomUp ? Math.max(zoom, 10.5) : zoom;
      const destination = Cartesian3.fromDegrees(
        followed.fix.lng,
        followed.fix.lat,
        heightForZoom(nextZoom, followed.fix.lat, widget.canvas.clientHeight || 700),
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

function unitCanvas(unit: Unit, status: PositionStatus, selected: boolean, color: string, gold: string): HTMLCanvasElement {
  const key = `${unit.abbr}|${unit.side}|${status}|${selected}|${echelonMark(unit.echelon)}|${color}|${gold}`;
  const cached = canvases.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 148;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.fillStyle = color;
  ctx.font = "16px Barlow Condensed, Arial Narrow, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(echelonMark(unit.echelon), 64, 16);
  if (unit.side === "soviet") ctx.fillText("★", 64, 34);
  ctx.beginPath();
  ctx.arc(64, 86, 36, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(12, 16, 12, 0.92)";
  ctx.fill();
  ctx.lineWidth = selected ? 7 : 4;
  ctx.strokeStyle = selected ? gold : color;
  ctx.setLineDash(status === "last-reported" ? [7, 5] : []);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#ebe6d6";
  ctx.font = "700 22px Barlow Condensed, Arial Narrow, sans-serif";
  ctx.fillText(unit.abbr, 64, 88);
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
