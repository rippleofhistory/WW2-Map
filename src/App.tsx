import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Inspector } from "./components/Inspector.tsx";
import { SearchPanel } from "./components/SearchPanel.tsx";
import { Timeline } from "./components/Timeline.tsx";
import { TopBar } from "./components/TopBar.tsx";
import { CAMPAIGNS } from "./data/campaigns.ts";
import { CAMPAIGN_PRESETS } from "./data/presets.ts";
import { isFeaturedUnit } from "./data/catalog.ts";
import { PLACEHOLDER_SOURCE } from "./data/sample.ts";
import { theaterById } from "./data/theaters.ts";
import { SAMPLE_END, SAMPLE_START, WAR_DAYS, dateFromIndex, dayIndex, formatDisplay } from "./lib/dates.ts";
import { placeUnit, type Placement } from "./lib/position.ts";
import { battlesForTheater, filterUnits, frontForDate, labelsForTheater, pathUntil } from "./lib/select.ts";
import { readEmbedOptions, postMapMessage } from "./lib/embed.ts";
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

function rowsFor(filtered: readonly Unit[], selected: Unit | null, date: string, unitId: string | null) {
  const rows: { unit: Unit; placement: Placement; selected: boolean }[] = [];
  const seen = new Set<string>();
  const add = (unit: Unit) => {
    if (seen.has(unit.id)) return;
    const placement = placeUnit(unit, date, 0, false);
    if (!placement) return;
    seen.add(unit.id);
    rows.push({ unit, placement, selected: unit.id === unitId });
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
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [live, setLive] = useState("");
  const [exportNote, setExportNote] = useState("");
  const [linked, setLinked] = useState<LinkedView | null>(null);
  const [compareStart, setCompareStart] = useState<{ center: [number, number]; zoom: number } | null>(null);
  const linkedRef = useRef<LinkedView | null>(null);
  const mapExport = useRef<(() => string | null) | null>(null);
  const globeExport = useRef<(() => string | null) | null>(null);
  const lastAnnounced = useRef(0);
  const actionsRef = useRef(situation);
  useEffect(() => {
    actionsRef.current = situation;
  });

  const theater = data.frames[state.theater] ?? theaterById(state.theater);
  const front = frontForDate(data.fronts, state.date, state.theater);
  const selectedUnit = data.units.find((unit) => unit.id === state.unitId) ?? null;
  const selectedBattle = data.battles.find((battle) => battle.id === state.battleId) ?? null;
  const nations = useMemo(() => [...new Set(data.units.map((unit) => unit.nation))].sort(), [data.units]);
  const filteredUnits = useMemo(
    () => filterUnits(data.units, state.theater, state.filters),
    [data.units, state.theater, state.filters],
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
      if (unit.theater !== state.theater) continue;
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

  const mapUnits = useMemo(
    () => rowsFor(filteredUnits, selectedUnit, state.date, state.unitId),
    [filteredUnits, selectedUnit, state.date, state.unitId],
  );
  const compareRows = useMemo(
    () => (state.compareDate ? rowsFor(filteredUnits, selectedUnit, state.compareDate, state.unitId) : []),
    [filteredUnits, selectedUnit, state.compareDate, state.unitId],
  );

  const [initialView] = useState(() => {
    const url = readUrl(window.location.search);
    const frame = theaterById(url.theater);
    const narrow = window.innerWidth < 900;
    return { center: frame.center, zoom: narrow ? Math.max(2, frame.zoom - 1.3) : frame.zoom };
  });

  const followPlacement = selectedUnit ? (mapUnits.find((item) => item.unit.id === selectedUnit.id)?.placement ?? null) : null;
  const travelled = selectedUnit ? pathUntil(selectedUnit, state.date) : [];
  const inSample = state.theater === "normandy" && state.date >= SAMPLE_START && state.date <= SAMPLE_END;
  const offFront =
    followPlacement !== null &&
    (followPlacement.lng < theater.bounds[0] ||
      followPlacement.lat < theater.bounds[1] ||
      followPlacement.lng > theater.bounds[2] ||
      followPlacement.lat > theater.bounds[3]);
  const featuredUnits = data.units.filter((unit) => unit.theater === state.theater && (unit.featured || isFeaturedUnit(unit.id)));
  const leftVisible = wide || leftOpen;
  const rightVisible = wide || rightOpen;
  const positionAttr = positionText(mapUnits);
  const comparePositionAttr = state.compareDate ? positionText(compareRows) : "";
  const compareFront = state.compareDate ? frontForDate(data.fronts, state.compareDate, state.theater) : null;
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
        api.clearSelection();
        setLeftOpen(false);
        setRightOpen(false);
        return;
      }
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON" || target.isContentEditable) return;
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
        setLeftOpen(true);
        document.getElementById("unit-search")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const frontMessage = !front
    ? "No schematic front for this date."
    : front.date === state.date
      ? `Schematic front for ${formatDisplay(state.date)}.`
      : `Schematic front keyed to ${formatDisplay(front.date)}, held on ${formatDisplay(state.date)}.`;

  return (
    <div
      className="app"
      data-date={state.date}
      data-theater={state.theater}
      data-playing={state.playing ? "1" : "0"}
      data-unit={state.unitId ?? ""}
      data-battle={state.battleId ?? ""}
      data-front={front?.id ?? ""}
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
      data-path={travelled.map((point) => `${point[0]},${point[1]}`).join("|")}
      data-featured={featuredUnits.map((unit) => unit.id).join(",")}
      data-off-front={offFront ? "1" : "0"}
    >
      <a className="skip" href="#search" onClick={() => setLeftOpen(true)}>
        Skip to unit search
      </a>
      <a className="skip" href="#timeline">
        Skip to timeline
      </a>
      <TopBar
        theater={state.theater}
        mode={state.compareDate ? "Compare" : state.unitId ? "Unit follow" : "Overview"}
        layers={state.layers}
        leftOpen={leftVisible}
        rightOpen={rightVisible}
        onTheater={situation.setTheater}
        onToggleLayer={situation.toggleLayer}
        onToggleLeft={() => {
          setLeftOpen((open) => !open);
          setRightOpen(false);
        }}
        onToggleRight={() => {
          setRightOpen((open) => !open);
          setLeftOpen(false);
        }}
        exportNote={exportNote}
        showBrand={!hideChrome}
        showEmbedLink={!embed}
        view={state.view}
        onView={situation.setView}
        comparing={state.compareDate !== null}
        contrast={state.contrast}
        onToggleContrast={() => situation.setContrast(!state.contrast)}
        onToggleCompare={() => {
          if (state.compareDate) {
            situation.setCompare(null);
            setCompareStart(null);
            return;
          }
          const live = linkedRef.current;
          if (live) setLinked({ ...live, nonce: live.nonce + 1 });
          setCompareStart(
            live ? { center: [live.lng, live.lat], zoom: live.zoom } : { center: initialView.center, zoom: initialView.zoom },
          );
          situation.setCompare(state.date === SAMPLE_START ? SAMPLE_END : SAMPLE_START);
        }}
        onExport={() => {
          const exporter = state.view === "globe" ? globeExport.current : mapExport.current;
          const message = exporter?.() ?? null;
          setExportNote(message === null ? "Saved the map image." : (message ?? "Map is not ready."));
        }}
      />
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
          showGraticule={!state.layers.modernBasemap}
          modernBasemap={state.layers.modernBasemap}
          alliedLine={front?.allied ?? []}
          axisLine={front?.axis ?? []}
          frontRing={front?.polygon ?? []}
          travelled={travelled}
          fullTrack={[]}
          camera={state.camera}
          cameraLock={state.cameraLock && state.unitId !== null}
          lockNonce={state.lockNonce}
          followLng={followPlacement?.lng}
          followLat={followPlacement?.lat}
          initialCenter={initialView.center}
          initialZoom={initialView.zoom}
          onSelectUnit={situation.selectUnit}
          onSelectBattle={situation.selectBattle}
          onBackground={situation.clearSelection}
          onUserDrag={() => situation.setCameraLock(false)}
          onDisableBasemap={() => {
            if (state.layers.modernBasemap) situation.toggleLayer("modernBasemap");
          }}
          onBindExport={(exportPng) => {
            mapExport.current = exportPng;
          }}
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
              showGraticule={!state.layers.modernBasemap}
              modernBasemap={state.layers.modernBasemap}
              alliedLine={compareFront?.allied ?? []}
              axisLine={compareFront?.axis ?? []}
              frontRing={compareFront?.polygon ?? []}
              travelled={compareTravelled}
              fullTrack={[]}
              camera={NO_CAMERA}
              cameraLock={false}
              lockNonce={0}
              initialCenter={compareStart?.center ?? initialView.center}
              initialZoom={compareStart?.zoom ?? initialView.zoom}
              onSelectUnit={situation.selectUnit}
              onSelectBattle={situation.selectBattle}
              onBackground={situation.clearSelection}
              onUserDrag={() => situation.setCameraLock(false)}
              onDisableBasemap={() => {
                if (state.layers.modernBasemap) situation.toggleLayer("modernBasemap");
              }}
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
                showGraticule={!state.layers.modernBasemap}
                modernBasemap={state.layers.modernBasemap}
                alliedLine={front?.allied ?? []}
                axisLine={front?.axis ?? []}
                frontRing={front?.polygon ?? []}
                travelled={travelled}
                fullTrack={[]}
                camera={state.camera}
                cameraLock={state.cameraLock && state.unitId !== null}
                lockNonce={state.lockNonce}
                followLng={followPlacement?.lng}
                followLat={followPlacement?.lat}
                theaterId={state.theater}
                onSelectUnit={situation.selectUnit}
                onSelectBattle={situation.selectBattle}
                onBackground={situation.clearSelection}
                onUserDrag={() => situation.setCameraLock(false)}
                onBindExport={(exportPng) => {
                  globeExport.current = exportPng;
                }}
                contrast={state.contrast}
              />
            </Suspense>
          </GlobeBoundary>
        ) : null}
        <div className="map-caption">
          <p>{state.layers.fronts ? frontMessage : "Positions are approximate and sourced."}</p>
          {offFront ? <p>Not yet on the Normandy front.</p> : null}
          {datePreset ? <p>{datePreset.note}</p> : null}
          {campaign ? <p>{campaign.note}</p> : null}
          <p>Source: {selectedUnit?.source ?? front?.source ?? PLACEHOLDER_SOURCE}</p>
        </div>
        {data.status !== "ready" ? (
          <p className="load-banner" role="status">
            {data.message}
          </p>
        ) : null}
        {comingSoon ? (
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
        {state.theater === "normandy" && !inSample && !comingSoon && !front && mapUnits.length === 0 ? (
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
          onSelectUnit={situation.selectUnit}
          onSelectBattle={situation.selectBattle}
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
          placement={followPlacement}
          playing={state.playing}
          battle={selectedBattle}
          front={front}
          unitCount={mapUnits.length}
          cameraLock={state.cameraLock}
          onLock={situation.setCameraLock}
          onShowStop={(date) => situation.scrub(dayIndex(date))}
          onClear={situation.clearSelection}
          onClose={() => setRightOpen(false)}
          onSelectUnit={situation.selectUnit}
          taggedUnits={
            selectedBattle?.units
              ? data.units.filter((unit) => selectedBattle.units?.includes(unit.id))
              : []
          }
        />
      </main>
      <p className="disclaimer" role="note">
        {theater.disclaimer ?? "Positions are approximate and sourced. Not a complete order of battle."}
      </p>
      <Timeline
        date={state.date}
        playing={state.playing}
        speed={state.speed}
        onScrub={situation.scrub}
        onTogglePlay={situation.togglePlay}
        onSpeed={situation.setSpeed}
        onStep={situation.step}
        onBattle={situation.selectBattle}
        onPreset={situation.jumpPreset}
        onCampaign={situation.playCampaign}
        campaignId={state.campaignId}
        battles={theaterBattles}
      />
      <div className="sr-only" aria-live="polite">
        {live}
      </div>
    </div>
  );
}
