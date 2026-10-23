import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Inspector } from "./components/Inspector.tsx";
import { MapPanel } from "./components/MapPanel.tsx";
import { SearchPanel } from "./components/SearchPanel.tsx";
import { Timeline } from "./components/Timeline.tsx";
import { CAMPAIGNS } from "./data/campaigns.ts";
import { CAMPAIGN_PRESETS } from "./data/presets.ts";
import { hubIdForMap, isFeaturedUnit, mapIdForHub } from "./data/catalog.ts";
import { PLACEHOLDER_SOURCE } from "./data/sample.ts";
import { theaterById, theaterCameraZoom } from "./data/theaters.ts";
import { SAMPLE_END, SAMPLE_START, WAR_DAYS, dateFromIndex, dayIndex, formatDisplay } from "./lib/dates.ts";
import { lastReportedHolds, placeUnit, type Placement } from "./lib/position.ts";
import { occupationById, occupationWatch, paintOccupation } from "./lib/occupation.ts";
import { paintFront, postUnitsOnFronts } from "./lib/contact.ts";
import {
  battlesForTheater,
  filterUnits,
  frontForDate,
  frontsForDate,
  labelsForTheater,
  pathUntil,
  theaterAt,
  unitTheaters,
  unitsInCampaign,
} from "./lib/select.ts";
import { readEmbedOptions, postMapMessage } from "./lib/embed.ts";
import { fetchHubUnit, isHubOrigin, readHubMessage, stopForDate, type HubUnitRef } from "./lib/hub.ts";
import { readUrl } from "./lib/url.ts";
import { MapCanvas } from "./map/MapCanvas.tsx";
import { useSituation } from "./state/useSituation.ts";
import type { CameraCommand, Unit } from "./types.ts";

const NO_CAMERA: CameraCommand = { type: "none", nonce: 0 };

interface LinkedView {
  lng: number;
  lat: number;
  zoom: number;
  nonce: number;
}

function sameView(a: { lng: number; lat: number; zoom: number }, b: { lng: number; lat: number; zoom: number }): boolean {
  return Math.abs(a.lng - b.lng) < 0.0008 && Math.abs(a.lat - b.lat) < 0.0008 && Math.abs(a.zoom - b.zoom) < 0.02;
}

function rowsFor(
  filtered: readonly Unit[],
  selected: Unit | null,
  date: string,
  unitId: string | null,
  holds: readonly { date: string; contact: [number, number][] }[],
  bounds: [number, number, number, number],
) {
  const rows: { unit: Unit; placement: Placement; selected: boolean }[] = [];
  const seen = new Set<string>();
  const add = (unit: Unit) => {
    if (seen.has(unit.id)) return;
    const placement = placeUnit(unit, date, 0, false);
    if (!placement) return;
    const selected = unit.id === unitId;
    if (!selected && !lastReportedHolds(placement, holds, bounds)) return;
    seen.add(unit.id);
    rows.push({ unit, placement, selected });
  };
  for (const unit of filtered) add(unit);
  if (selected) add(selected);
  return rows;
}

function positionText(rows: ReturnType<typeof rowsFor>): string {
  return rows
    .map((item) => `${item.unit.id}:${item.placement.lng.toFixed(2)},${item.placement.lat.toFixed(2)}:${item.placement.status}`)
    .sort()
    .join("|");
}

const GlobeCanvas = lazy(() => import("./map/GlobeCanvas.tsx"));

class GlobeBoundary extends Component<{ children: ReactNode; onBack: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="empty-banner" role="alert">
          <p>The globe did not start.</p>
          <button type="button" onClick={this.props.onBack}>
            Use the 2D map
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function useWide(): boolean {
  const query = "(min-width: 900px)";
  const [wide, setWide] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setWide(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return wide;
}

export default function App({ embed = false }: { embed?: boolean }) {
  const situation = useSituation();
  const embedOptions = readEmbedOptions(window.location.search);
  const hideChrome = embed && embedOptions.hideChrome;
  const battleAllowKey = Array.isArray(embedOptions.battles) ? embedOptions.battles.join(",") : "";
  const { state, data } = situation;
  const wide = useWide();
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(() => Boolean(readUrl(window.location.search).unitId) && !hideChrome);
  const [mapOpen, setMapOpen] = useState(false);
  const [fullMap, setFullMap] = useState(false);
  const [showCampaigns, setShowCampaigns] = useState(true);
  const [showPresets, setShowPresets] = useState(true);
  const [showTicks, setShowTicks] = useState(true);
  const fullMapRef = useRef(false);
  const mapOpenRef = useRef(false);
  const hideChromeRef = useRef(hideChrome);
  const [live, setLive] = useState("");
  const [linked, setLinked] = useState<LinkedView | null>(null);
  const linkedRef = useRef<LinkedView | null>(null);
  const lastAnnounced = useRef(0);
  const actionsRef = useRef(situation);
  const [hubRef, setHubRef] = useState<HubUnitRef | null>(null);
  const appliedHub = useRef<string | null>(null);
  const dateFromQuery = useRef(readUrl(window.location.search).dateFromQuery === true);
  useEffect(() => {
    actionsRef.current = situation;
    fullMapRef.current = fullMap;
    mapOpenRef.current = mapOpen;
    hideChromeRef.current = hideChrome;
  });

  const theater = data.frames[state.theater] ?? theaterById(state.theater);
  const activeFronts = useMemo(
    () => frontsForDate(data.fronts, state.date, state.theater),
    [data.fronts, state.date, state.theater],
  );
  const front = activeFronts[activeFronts.length - 1] ?? frontForDate(data.fronts, state.date, state.theater);
  const occupation = useMemo(
    () => paintOccupation(data.regions, data.occupation, state.date),
    [data.regions, data.occupation, state.date],
  );
  const compareOccupation = useMemo(
    () => (state.compareDate ? paintOccupation(data.regions, data.occupation, state.compareDate) : occupation),
    [data.regions, data.occupation, state.compareDate, occupation],
  );
  const selectedOccupation = occupationById(data.occupation, state.regionId, state.date);
  const selectedUnit = data.units.find((unit) => unit.id === state.unitId) ?? null;
  const selectedBattle = data.battles.find((battle) => battle.id === state.battleId) ?? null;
  const nations = useMemo(() => [...new Set(data.units.map((unit) => unit.nation))].sort(), [data.units]);
  const filteredUnits = useMemo(
    () => filterUnits(data.units, state.theater, state.filters, state.date),
    [data.units, state.theater, state.filters, state.date],
  );
  const theaterBattles = useMemo(() => {
    const rows = battlesForTheater(data.battles, state.theater);
    if (!battleAllowKey) return rows;
    const allow = new Set(battleAllowKey.split(","));
    return rows.filter((battle) => allow.has(battle.id));
  }, [data.battles, state.theater, battleAllowKey]);
  const theaterLabels = useMemo(() => labelsForTheater(data.labels, state.theater), [data.labels, state.theater]);
  const order = useMemo(() => {
    const allied: typeof data.units = [];
    const german: typeof data.units = [];
    for (const unit of data.units) {
      if (theaterAt(unit, state.date) !== state.theater) continue;
      const placement = placeUnit(unit, state.date, 0, false);
      if (!placement || placement.status !== "reported") continue;
      if (unit.side === "allied") allied.push(unit);
      if (unit.side === "axis") german.push(unit);
    }
    return { allied, german };
  }, [data.units, state.date, state.theater]);
  const datePreset = CAMPAIGN_PRESETS.find((item) => state.theater === "normandy" && item.date === state.date && !item.battleId);
  const campaign = CAMPAIGNS.find((item) => item.id === state.campaignId) ?? null;
  const comingSoon = data.status !== "loading" && data.modules[state.theater].empty;
  const leftVisible = !fullMap && leftOpen;
  const rightVisible = !hideChrome && !fullMap && rightOpen;
  const mapVisible = !hideChrome;

  const openInspector = () => {
    if (hideChrome) return;
    setFullMap(false);
    setRightOpen(true);
    if (!wide) setLeftOpen(false);
  };

  const frontTraces = useMemo(
    () =>
      activeFronts.map((item) => ({
        sector: item.sector ?? item.theater,
        date: item.date,
        allied: item.allied,
        axis: item.axis,
        polygon: item.polygon,
      })),
    [activeFronts],
  );
  const contactPaint = useMemo(
    () => paintFront({ allied: front?.allied ?? [], axis: front?.axis ?? [] }),
    [front],
  );
  const holds = useMemo(() => {
    const rows: { date: string; contact: [number, number][] }[] = [];
    for (const item of activeFronts) {
      const painted = paintFront({ allied: item.allied, axis: item.axis });
      if (painted && painted.contact.length >= 2) rows.push({ date: item.date, contact: painted.contact });
    }
    return rows;
  }, [activeFronts]);
  const mapUnits = useMemo(
    () => rowsFor(filteredUnits, selectedUnit, state.date, state.unitId, holds, theater.bounds),
    [filteredUnits, selectedUnit, state.date, state.unitId, holds, theater.bounds],
  );
  const compareFronts = useMemo(
    () => (state.compareDate ? frontsForDate(data.fronts, state.compareDate, state.theater) : []),
    [state.compareDate, data.fronts, state.theater],
  );
  const compareFront = compareFronts[compareFronts.length - 1] ?? null;
  const compareHold = useMemo(() => {
    const rows: { date: string; contact: [number, number][] }[] = [];
    for (const item of compareFronts) {
      const painted = paintFront({ allied: item.allied, axis: item.axis });
      if (painted && painted.contact.length >= 2) rows.push({ date: item.date, contact: painted.contact });
    }
    return rows;
  }, [compareFronts]);
  const compareFiltered = useMemo(
    () =>
      state.compareDate ? filterUnits(data.units, state.theater, state.filters, state.compareDate) : [],
    [data.units, state.theater, state.filters, state.compareDate],
  );
  const compareRows = useMemo(
    () =>
      state.compareDate
        ? rowsFor(compareFiltered, selectedUnit, state.compareDate, state.unitId, compareHold, theater.bounds)
        : [],
    [compareFiltered, selectedUnit, state.compareDate, state.unitId, compareHold, theater.bounds],
  );

  const [initialView] = useState(() => {
    const url = readUrl(window.location.search);
    const frame = theaterById(url.theater);
    const narrow = window.innerWidth < 900;
    return { center: frame.center, zoom: theaterCameraZoom(frame, narrow) };
  });

  const followPlacement = selectedUnit ? (mapUnits.find((item) => item.unit.id === selectedUnit.id)?.placement ?? null) : null;
  const inspectorPlacement = selectedUnit ? placeUnit(selectedUnit, state.date, 0, false) : null;
  const contactPosts = useMemo(
    () =>
      postUnitsOnFronts(
        mapUnits.map((row) => ({
          unitId: row.unit.id,
          side: row.unit.side,
          lng: row.placement.lng,
          lat: row.placement.lat,
        })),
        frontTraces,
      ),
    [mapUnits, frontTraces],
  );
  const campaignTitles = useMemo(() => {
    const titles: Record<string, string> = {};
    for (const item of CAMPAIGNS) {
      const names = unitsInCampaign(data.units, item)
        .slice(0, 5)
        .map((unit) => unit.abbr);
      const base = item.note.replace(/ No unit pins yet\./g, "");
      titles[item.id] = names.length > 0 ? `${base} Follow ${names.join(", ")}.` : `${base} Overview pin only.`;
    }
    return titles;
  }, [data.units]);
  const selectedPost = selectedUnit ? (contactPosts.find((post) => post.unitId === selectedUnit.id) ?? null) : null;
  const opponentUnit = selectedPost?.opponentId
    ? (data.units.find((unit) => unit.id === selectedPost.opponentId) ?? null)
    : null;
  const followLng = selectedPost?.onFront ? selectedPost.lng : followPlacement?.lng;
  const followLat = selectedPost?.onFront ? selectedPost.lat : followPlacement?.lat;
  const travelled = selectedUnit ? pathUntil(selectedUnit, state.date) : [];
  const inSample = state.theater === "normandy" && state.date >= SAMPLE_START && state.date <= SAMPLE_END;
  const offFront =
    followPlacement !== null &&
    (followPlacement.lng < theater.bounds[0] ||
      followPlacement.lat < theater.bounds[1] ||
      followPlacement.lng > theater.bounds[2] ||
      followPlacement.lat > theater.bounds[3]);
  const featuredUnits = data.units.filter(
    (unit) => unitTheaters(unit).includes(state.theater) && (unit.featured || isFeaturedUnit(unit.id)),
  );
  const positionAttr = positionText(mapUnits);
  const comparePositionAttr = state.compareDate ? positionText(compareRows) : "";
  const compareTravelled = state.compareDate && selectedUnit ? pathUntil(selectedUnit, state.compareDate) : [];
  const onViewChange = (view: { lng: number; lat: number; zoom: number }) => {
    const prev = linkedRef.current;
    if (prev && sameView(prev, view)) return;
    const next = { ...view, nonce: (prev?.nonce ?? 0) + 1 };
    linkedRef.current = next;
    if (state.compareDate) setLinked(next);
  };

  const selectionKey = `${state.unitId ?? ""}|${state.battleId ?? ""}`;
  const [seenSelection, setSeenSelection] = useState(selectionKey);
  if (selectionKey !== seenSelection) {
    setSeenSelection(selectionKey);
    if (!wide && selectionKey !== "|") {
      setRightOpen(true);
      setLeftOpen(false);
    }
  }

  useEffect(() => {
    if (!selectedUnit) return;
    const next = theaterAt(selectedUnit, state.date);
    if (next && next !== state.theater) actionsRef.current.followTheater(next);
  }, [selectedUnit, state.date, state.theater]);

  useEffect(() => {
    const now = Date.now();
    if (state.playing && now - lastAnnounced.current < 1000) return;
    lastAnnounced.current = now;
    const followed = selectedUnit ? `Following ${selectedUnit.name}.` : `${mapUnits.length} units in view.`;
    setLive(`${state.playing ? "Playing" : "Paused"}. ${formatDisplay(state.date)}. ${theater.label}. ${followed}`);
  }, [state.date, state.playing, state.unitId, theater.label, selectedUnit, mapUnits.length]);

  useEffect(() => {
    if (!embed) return;
    postMapMessage({ type: "dateChange", date: state.date, theater: state.theater, playing: state.playing });
  }, [embed, state.date, state.theater, state.playing]);

  useEffect(() => {
    const id = state.unitId;
    if (!id) {
      appliedHub.current = null;
      return undefined;
    }
    if (data.status === "loading") return undefined;
    const mapped = data.units.find((unit) => unit.id === id) ?? null;
    const lookup = mapped ? hubIdForMap(mapped.id) ?? mapped.id : id;
    let gone = false;
    fetchHubUnit(lookup).then((ref) => {
      if (gone) return;
      const currentDate = actionsRef.current.state.date;
      if (ref) {
        const plotted = Boolean(mapped || mapIdForHub(ref.id) || ref.plotted);
        setHubRef({ ...ref, plotted });
        if (!mapped && appliedHub.current !== id) {
          appliedHub.current = id;
          const date = dateFromQuery.current ? currentDate : (ref.battles[0]?.date ?? currentDate);
          const stop = stopForDate(ref, date);
          actionsRef.current.selectHubUnit(ref.id, stop?.mapTheater ?? null, date);
          setRightOpen(true);
        }
        return;
      }
      if (!mapped) {
        setHubRef({
          id,
          name: id,
          nation: "",
          branch: "",
          mapId: null,
          plotted: false,
          path: `/unit/${encodeURIComponent(id)}`,
          battles: [],
        });
        if (appliedHub.current !== id) {
          appliedHub.current = id;
          actionsRef.current.selectHubUnit(id, null, currentDate);
          setRightOpen(true);
        }
      } else {
        setHubRef(null);
      }
    });
    return () => {
      gone = true;
    };
  }, [state.unitId, data.status, data.units]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!isHubOrigin(event.origin)) return;
      const message = readHubMessage(event.data);
      if (!message) return;
      const api = actionsRef.current;
      if (message.unit) {
        const hubUnit = message.unit;
        const hinted = hubUnit.mapId ?? mapIdForHub(hubUnit.id);
        const mapped =
          api.data.units.find((unit) => unit.id === hinted) ??
          api.data.units.find((unit) => unit.id === hubUnit.id) ??
          null;
        setHubRef({ ...hubUnit, plotted: Boolean(mapped || hubUnit.plotted) });
        appliedHub.current = hubUnit.id;
        if (mapped) {
          api.selectUnit(mapped.id, message.date ?? undefined);
        } else {
          const date = message.date ?? stopForDate(message.unit, api.state.date)?.date ?? api.state.date;
          const stop = stopForDate(message.unit, date);
          api.selectHubUnit(message.unit.id, message.theater ?? stop?.mapTheater ?? null, date);
        }
        setRightOpen(true);
        return;
      }
      if (message.date) api.jumpHubStop(message.date, message.theater);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const unitMessage = useRef({ date: state.date, theater: state.theater, name: selectedUnit?.name ?? null });

  useEffect(() => {
    unitMessage.current = { date: state.date, theater: state.theater, name: selectedUnit?.name ?? null };
  });

  useEffect(() => {
    if (!embed) return;
    const current = unitMessage.current;
    postMapMessage({
      type: "unitSelect",
      date: current.date,
      theater: current.theater,
      unit: state.unitId,
      name: current.name,
    });
  }, [embed, state.unitId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const api = actionsRef.current;
      if (event.key === "Escape") {
        if (mapOpenRef.current) {
          setMapOpen(false);
          return;
        }
        if (fullMapRef.current) {
          setFullMap(false);
          return;
        }
        api.clearSelection();
        if (!hideChromeRef.current) setLeftOpen(false);
        setRightOpen(false);
        return;
      }
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return;
      if ((event.key === "m" || event.key === "M") && !event.metaKey && !event.ctrlKey && !event.altKey) {
        if (hideChromeRef.current) return;
        event.preventDefault();
        setMapOpen(false);
        setFullMap((open) => !open);
        return;
      }
      if (tag === "BUTTON") return;
      if (target.closest(".maplibregl-canvas, [role='radio']")) return;
      if (event.key === " " || event.code === "Space") {
        event.preventDefault();
        api.togglePlay();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        api.step(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        api.step(-1);
      } else if (event.key === "f" || event.key === "F") {
        if (event.metaKey || event.ctrlKey || event.altKey) return;
        if (!api.state.unitId) return;
        event.preventDefault();
        api.followSelected();
      } else if (event.key === "/") {
        event.preventDefault();
        setFullMap(false);
        setLeftOpen(true);
        document.getElementById("unit-search")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const approximateControl =
    state.layers.controlAreas &&
    activeFronts.some(
      (item) => !(item.polygon && item.polygon.length >= 4) && (item.allied.length >= 2 || item.axis.length >= 2),
    );
  const frontMessage =
    activeFronts.length === 0
      ? "No front line for this date."
      : activeFronts.length > 1
        ? `${activeFronts.length} front lines in this theater. Distant sectors stay on the map together.`
        : front?.polygon && front.polygon.length >= 4
          ? `Weekly front polygon for ${formatDisplay(front.date)}.`
          : front && front.date === state.date
            ? `Front line for ${formatDisplay(state.date)}.`
            : `Front line keyed to ${formatDisplay(front?.date ?? state.date)}, held on ${formatDisplay(state.date)}.`;

  return (
    <div
      className="app"
      data-date={state.date}
      data-theater={state.theater}
      data-playing={state.playing ? "1" : "0"}
      data-unit={state.unitId ?? ""}
      data-battle={state.battleId ?? ""}
      data-front={front?.id ?? ""}
      data-fronts={activeFronts.map((item) => item.id).join("|")}
      data-front-lat={front ? String(front.allied[0]?.[1] ?? "") : ""}
      data-positions={positionAttr}
      data-speed={state.speed}
      data-origin={data.origin}
      data-status={data.status}
      data-campaign={state.campaignId ?? ""}
      data-play-until={state.playUntil ?? ""}
      data-empty={comingSoon ? "1" : "0"}
      data-cadence={theater.frontCadence}
      data-bounds={theater.bounds.join(",")}
      data-embed={embed ? "1" : "0"}
      data-hidechrome={hideChrome ? "1" : "0"}
      data-view={state.view}
      data-compare={state.compareDate ?? ""}
      data-compare-positions={comparePositionAttr}
      data-contrast={state.contrast ? "1" : ""}
      data-control={state.layers.controlAreas ? "1" : "0"}
      data-path={travelled.map((point) => `${point[0]},${point[1]}`).join("|")}
      data-featured={featuredUnits.map((unit) => unit.id).join(",")}
      data-off-front={offFront ? "1" : "0"}
      data-occupation={occupationWatch(data.occupation, state.date)}
      data-region={state.regionId ?? ""}
      data-hub={hubRef?.id ?? ""}
      data-hub-plotted={hubRef?.plotted ? "1" : "0"}
      data-contact={contactPaint && contactPaint.contact.length >= 2 ? String(contactPaint.contact.length) : "0"}
      data-opponent={opponentUnit?.id ?? ""}
      data-on-front={selectedPost?.onFront ? "1" : "0"}
      data-fullmap={fullMap ? "1" : "0"}
      data-left={leftVisible ? "1" : "0"}
      data-right={rightVisible ? "1" : "0"}
      data-basemap={state.basemap}
      data-echelon-cap={state.echelonCap}
      data-map-open={mapOpen ? "1" : "0"}
    >
      <a className="skip" href="#search" onClick={() => setLeftOpen(true)}>
        Skip to unit search
      </a>
      <a className="skip" href="#timeline">
        Skip to timeline
      </a>
      <main className={state.compareDate ? "stage compare" : "stage"}>
        <div className="compare-pane" data-pane="primary">
          {state.compareDate ? (
            <p className="compare-label">
              {formatDisplay(state.date)} · {theater.label}
            </p>
          ) : null}
        <MapCanvas
          date={state.date}
          playing={state.playing}
          frame={state.compareDate ? "split" : "full"}
          syncView={state.compareDate ? linked : null}
          onViewChange={onViewChange}
          units={mapUnits.map((item) => ({
            unit: item.unit,
            lng: item.placement.lng,
            lat: item.placement.lat,
            status: item.placement.status,
            selected: item.selected,
          }))}
          battles={theaterBattles}
          labels={theaterLabels}
          selectedBattleId={state.battleId}
          showUnits={state.layers.units}
          showBattles={state.layers.battles}
          showLabels={state.layers.labels}
          showFronts={state.layers.fronts}
          showControlAreas={state.layers.controlAreas}
          showGraticule={false}
          basemap={state.basemap}
          echelonCap={state.echelonCap}
          showNav={!hideChrome}
          alliedLine={front?.allied ?? []}
          axisLine={front?.axis ?? []}
          frontRing={front?.polygon ?? []}
          frontTraces={frontTraces}
          theaterId={state.theater}
          occupation={occupation}
          showOccupation={state.layers.occupation}
          selectedRegionId={state.regionId}
          travelled={travelled}
          fullTrack={[]}
          camera={state.camera}
          cameraLock={state.cameraLock && state.unitId !== null}
          lockNonce={state.lockNonce}
          followLng={followLng}
          followLat={followLat}
          initialCenter={initialView.center}
          initialZoom={initialView.zoom}
          onSelectUnit={(id) => {
            situation.selectUnit(id);
            openInspector();
          }}
          onSelectBattle={(id) => {
            situation.selectBattle(id);
            openInspector();
          }}
          onSelectRegion={(id) => {
            situation.selectRegion(id);
            openInspector();
          }}
          onBackground={situation.clearSelection}
          onUserDrag={() => situation.setCameraLock(false)}
          onDisableBasemap={() => situation.setBasemap("dark")}
          onBindExport={() => undefined}
          hidden={state.view === "globe"}
          contrast={state.contrast}
        />
        </div>
        {state.compareDate ? (
          <div className="compare-pane" data-pane="compare" data-positions={comparePositionAttr}>
            <label className="compare-label">
              <span>
                {formatDisplay(state.compareDate)} · {theater.label}
              </span>
              <input
                id="compare-slider"
                type="range"
                min={0}
                max={WAR_DAYS}
                value={dayIndex(state.compareDate)}
                aria-label="Compare date"
                aria-valuetext={formatDisplay(state.compareDate)}
                onChange={(event) => situation.setCompare(dateFromIndex(Number(event.target.value)))}
              />
            </label>
            <MapCanvas
              date={state.compareDate}
              playing={false}
              frame="split"
              syncView={linked}
              onViewChange={onViewChange}
              units={compareRows.map((item) => ({
                unit: item.unit,
                lng: item.placement.lng,
                lat: item.placement.lat,
                status: item.placement.status,
                selected: item.selected,
              }))}
              battles={theaterBattles}
              labels={theaterLabels}
              selectedBattleId={state.battleId}
              showUnits={state.layers.units}
              showBattles={state.layers.battles}
              showLabels={state.layers.labels}
              showFronts={state.layers.fronts}
              showControlAreas={state.layers.controlAreas}
              showGraticule={false}
              basemap={state.basemap}
              echelonCap={state.echelonCap}
              showNav={false}
              alliedLine={compareFront?.allied ?? []}
              axisLine={compareFront?.axis ?? []}
              frontRing={compareFront?.polygon ?? []}
              frontTraces={compareFronts.map((item) => ({
                sector: item.sector ?? item.theater,
                date: item.date,
                allied: item.allied,
                axis: item.axis,
                polygon: item.polygon,
              }))}
              theaterId={state.theater}
              occupation={compareOccupation}
              showOccupation={state.layers.occupation}
              selectedRegionId={state.regionId}
              travelled={compareTravelled}
              fullTrack={[]}
              camera={NO_CAMERA}
              cameraLock={false}
              lockNonce={0}
              initialCenter={initialView.center}
              initialZoom={initialView.zoom}
              onSelectUnit={(id) => {
                situation.selectUnit(id);
                openInspector();
              }}
              onSelectBattle={(id) => {
                situation.selectBattle(id);
                openInspector();
              }}
              onSelectRegion={(id) => {
                situation.selectRegion(id);
                openInspector();
              }}
              onBackground={situation.clearSelection}
              onUserDrag={() => situation.setCameraLock(false)}
              onDisableBasemap={() => situation.setBasemap("dark")}
              onBindExport={() => undefined}
              hidden={false}
              contrast={state.contrast}
            />
          </div>
        ) : null}
        {state.view === "globe" ? (
          <GlobeBoundary onBack={() => situation.setView("2d")}>
            <Suspense fallback={<p className="load-banner">Loading globe…</p>}>
              <GlobeCanvas
                date={state.date}
                playing={state.playing}
                units={mapUnits.map((item) => ({
                  unit: item.unit,
                  lng: item.placement.lng,
                  lat: item.placement.lat,
                  status: item.placement.status,
                  selected: item.selected,
                }))}
                battles={theaterBattles}
                labels={theaterLabels}
                selectedBattleId={state.battleId}
                showUnits={state.layers.units}
                showBattles={state.layers.battles}
                showLabels={state.layers.labels}
                showFronts={state.layers.fronts}
                showControlAreas={state.layers.controlAreas}
                showGraticule={false}
                basemap={state.basemap}
                echelonCap={state.echelonCap}
                alliedLine={front?.allied ?? []}
                axisLine={front?.axis ?? []}
                frontRing={front?.polygon ?? []}
                frontTraces={frontTraces}
                occupation={occupation}
                showOccupation={state.layers.occupation}
                selectedRegionId={state.regionId}
                travelled={travelled}
                fullTrack={[]}
                camera={state.camera}
                cameraLock={state.cameraLock && state.unitId !== null}
                lockNonce={state.lockNonce}
                followLng={followLng}
                followLat={followLat}
                theaterId={state.theater}
                onSelectUnit={(id) => {
                  situation.selectUnit(id);
                  openInspector();
                }}
                onSelectBattle={(id) => {
                  situation.selectBattle(id);
                  openInspector();
                }}
                onSelectRegion={(id) => {
                  situation.selectRegion(id);
                  openInspector();
                }}
                onBackground={situation.clearSelection}
                onUserDrag={() => situation.setCameraLock(false)}
                onBindExport={() => undefined}
                contrast={state.contrast}
              />
            </Suspense>
          </GlobeBoundary>
        ) : null}
        {mapVisible ? (
          <MapPanel
            open={mapOpen}
            layers={state.layers}
            echelonCap={state.echelonCap}
            basemap={state.basemap}
            onToggle={() => setMapOpen((open) => !open)}
            onClose={() => setMapOpen(false)}
            onToggleLayer={situation.toggleLayer}
            onEchelonCap={situation.setEchelonCap}
            onBasemap={situation.setBasemap}
          />
        ) : null}
        {!leftVisible && !fullMap ? (
          <button
            type="button"
            className="search-toggle"
            aria-controls="search"
            aria-expanded="false"
            onClick={() => {
              setFullMap(false);
              setLeftOpen(true);
            }}
          >
            Search
          </button>
        ) : null}
        {fullMap || hideChrome ? null : (
        <div className="map-caption">
          <p>{state.layers.fronts ? frontMessage : "Positions are approximate and sourced."}</p>
          {approximateControl ? <p>Approximate control.</p> : null}
          {offFront ? <p>Not yet on the Normandy front.</p> : null}
          {selectedUnit && selectedPost && !selectedPost.onFront && !offFront ? (
            <p>Off the schematic contact. The counter stays at the sourced place.</p>
          ) : null}
          {opponentUnit ? <p>In contact with {opponentUnit.name}.</p> : null}
          {state.unitId && hubRef && !selectedUnit ? (
            <p>
              {hubRef.name} is referenced from WW2Hub. No sourced pin on this date. Occupation shows who held the country.
              Battle dates in the inspector jump the war.
            </p>
          ) : null}
          {datePreset ? <p>{datePreset.note}</p> : null}
          {campaign ? <p>{campaign.note}</p> : null}
          <p>Source: {selectedUnit?.source ?? front?.source ?? PLACEHOLDER_SOURCE}</p>
        </div>
        )}
        {data.status !== "ready" ? (
          <p className="load-banner" role="status">
            {data.message}
          </p>
        ) : null}
        {comingSoon && occupation.features.length === 0 && !(state.unitId && hubRef) ? (
          <div className="empty-banner">
            <p>Data coming soon</p>
            {theater.frontCadence === "weekly" ? (
              <p>This theater is set up for weekly front polygons, not daily battalion pins.</p>
            ) : null}
            <p>
              Theater window {formatDisplay(theater.start)} – {formatDisplay(theater.end)}. The slider still covers the whole war.
            </p>
            <button type="button" onClick={situation.jumpSample}>
              Open the Normandy sample
            </button>
          </div>
        ) : null}
        {!fullMap && !hideChrome && state.layers.occupation && occupation.features.length > 0 ? (
          <ul className="occupation-legend" aria-label="Occupation colours">
            <li><span className="swatch side-allied" /> Allied</li>
            <li><span className="swatch side-axis" /> Axis</li>
            <li><span className="swatch side-soviet" /> Soviet</li>
            <li><span className="swatch side-japanese" /> Japanese</li>
            <li><span className="swatch side-neutral" /> Neutral</li>
          </ul>
        ) : null}
        {state.theater === "normandy" && !inSample && !comingSoon && !front && mapUnits.length === 0 && data.occupation.length === 0 ? (
          <div className="empty-banner">
            <p>No units or front in the sample for {formatDisplay(state.date)}.</p>
            <button type="button" onClick={() => situation.scrub(dayIndex(SAMPLE_START))}>
              Jump to 6 June 1944
            </button>
          </div>
        ) : null}
        <SearchPanel
          open={leftVisible}
          query={state.filters.query}
          filters={state.filters}
          nations={nations}
          units={filteredUnits}
          battles={theaterBattles}
          selectedUnitId={state.unitId}
          selectedBattleId={state.battleId}
          selectedHidden={Boolean(selectedUnit && !filteredUnits.some((unit) => unit.id === selectedUnit.id))}
          onQuery={situation.setQuery}
          onSide={situation.setSide}
          onNation={situation.setNation}
          onEchelon={situation.setEchelon}
          onResetFilters={situation.resetFilters}
          onSelectUnit={(id) => {
            situation.selectUnit(id);
            openInspector();
          }}
          onSelectBattle={(id) => {
            situation.selectBattle(id);
            openInspector();
          }}
          onClose={() => setLeftOpen(false)}
          alliedPresent={order.allied}
          germanPresent={order.german}
          featured={featuredUnits}
        />
        <Inspector
          open={rightVisible}
          date={state.date}
          theater={theater}
          unit={selectedUnit}
          placement={inspectorPlacement}
          drawn={followPlacement !== null}
          playing={state.playing}
          battle={selectedBattle}
          front={front}
          unitCount={mapUnits.length}
          cameraLock={state.cameraLock}
          onLock={situation.setCameraLock}
          onShowStop={(date) => situation.scrub(dayIndex(date))}
          onClear={situation.clearSelection}
          onClose={() => setRightOpen(false)}
          onSelectUnit={(id) => {
            situation.selectUnit(id);
            openInspector();
          }}
          taggedUnits={
            selectedBattle?.units
              ? data.units.filter((unit) => selectedBattle.units?.includes(unit.id))
              : []
          }
          occupation={selectedOccupation}
          hub={state.unitId ? hubRef : null}
          onHubStop={situation.jumpHubStop}
          opponent={opponentUnit}
          onFront={Boolean(selectedPost?.onFront)}
          hasContact={Boolean(holds.length > 0 && state.layers.fronts)}
        />
      </main>
      {fullMap || hideChrome ? null : (
      <p className="disclaimer" role="note">
        {theater.disclaimer ?? "Positions are approximate and sourced. Not a complete order of battle."}
      </p>
      )}
      <Timeline
        date={state.date}
        playing={state.playing}
        speed={state.speed}
        onScrub={situation.scrub}
        onTogglePlay={situation.togglePlay}
        onSpeed={situation.setSpeed}
        onStep={situation.step}
        onBattle={(id) => {
          situation.selectBattle(id);
          openInspector();
        }}
        onPreset={situation.jumpPreset}
        onCampaign={situation.playCampaign}
        campaignId={state.campaignId}
        campaignTitles={campaignTitles}
        battles={theaterBattles}
        onOverview={situation.showOverview}
        compact={fullMap || hideChrome}
        showTicks={showTicks && !fullMap && !hideChrome}
        showCampaigns={showCampaigns && !fullMap && !hideChrome}
        showPresets={showPresets && !fullMap && !hideChrome}
        onToggleTicks={() => {
          setFullMap(false);
          setShowTicks((open) => !open);
        }}
        onToggleCampaigns={() => {
          setFullMap(false);
          setShowCampaigns((open) => !open);
        }}
        onTogglePresets={() => {
          setFullMap(false);
          setShowPresets((open) => !open);
        }}
      />
      <div className="sr-only" aria-live="polite">
        {live}
      </div>
    </div>
  );
}
