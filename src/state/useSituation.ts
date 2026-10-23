import { useEffect, useLayoutEffect, useReducer, useRef } from "react";
import { CAMPAIGNS } from "../data/campaigns.ts";
import { resolveBattleId } from "../data/catalog.ts";
import { useMapData } from "../data/mapContext.ts";
import { SAMPLE_START, WAR_DAYS, dateFromIndex, dayIndex, formatStencil, isValidWarDate } from "../lib/dates.ts";
import { readEmbedOptions } from "../lib/embed.ts";
import { theaterAt, unitTheaters } from "../lib/select.ts";
import { readUrl, writeUrl } from "../lib/url.ts";
import { controlAreasDefault } from "../lib/frontStyle.ts";
import type { Basemap, CameraCommand, Echelon, EchelonCap, Filters, Layers, MapView, Side, Speed, TheaterId } from "../types.ts";
import { setPlayClock } from "./playClock.ts";

function theaterLayers(layers: Layers, theater: TheaterId): Layers {
  return { ...layers, controlAreas: controlAreasDefault(theater) };
}

interface State {
  theater: TheaterId;
  date: string;
  playing: boolean;
  speed: Speed;
  unitId: string | null;
  battleId: string | null;
  battleDate: string | null;
  cameraLock: boolean;
  lockNonce: number;
  camera: CameraCommand;
  layers: Layers;
  basemap: Basemap;
  echelonCap: EchelonCap;
  filters: Filters;
  campaignId: string | null;
  playUntil: string | null;
  view: MapView;
  compareDate: string | null;
  contrast: boolean;
  regionId: string | null;
}

type Action =
  | { type: "setTheater"; id: TheaterId; keepUnit: boolean }
  | { type: "followTheater"; id: TheaterId }
  | { type: "scrub"; index: number }
  | { type: "tick"; steps: number }
  | { type: "togglePlay"; followUntil?: string | null }
  | { type: "setPlayUntil"; date: string }
  | { type: "setSpeed"; speed: Speed }
  | { type: "step"; delta: number }
  | { type: "selectUnit"; id: string; theater: TheaterId; dates: string[]; date?: string }
  | { type: "selectBattle"; id: string; theater: TheaterId; date: string; lng: number; lat: number; zoom: number }
  | { type: "clear" }
  | { type: "lock"; value: boolean }
  | { type: "follow" }
  | { type: "layer"; layer: keyof Layers }
  | { type: "basemap"; basemap: Basemap }
  | { type: "echelonCap"; cap: EchelonCap }
  | { type: "query"; query: string }
  | { type: "side"; side: Side | "all" }
  | { type: "nation"; nation: string }
  | { type: "echelon"; echelon: Echelon | "all" }
  | { type: "resetFilters" }
  | { type: "jumpSample" }
  | { type: "jumpPreset"; date: string }
  | {
      type: "playCampaign";
      id: string;
      theater: TheaterId;
      start: string;
      end: string;
      battle?: { id: string; lng: number; lat: number; zoom: number };
    }
  | { type: "openUrlBattle"; id: string; theater: TheaterId; date: string; lng: number; lat: number; zoom: number; playing: boolean }
  | {
      type: "hydrate";
      theater: TheaterId;
      date: string;
      unitId: string | null;
      playing: boolean;
      campaignId: string | null;
      playUntil: string | null;
      view: MapView;
      compareDate: string | null;
      contrast: boolean;
    }
  | { type: "setView"; view: MapView }
  | { type: "setCompare"; date: string | null }
  | { type: "setContrast"; value: boolean }
  | { type: "selectRegion"; id: string }
  | { type: "overview" }
  | { type: "selectHubUnit"; id: string; theater: TheaterId | null; date: string }
  | { type: "jumpHubStop"; date: string; theater: TheaterId | null };

function lastTrackDate(dates: readonly string[]): string | null {
  if (dates.length === 0) return null;
  let last = dates[0];
  for (const date of dates) {
    if (date > last) last = date;
  }
  return last;
}

function withDate(state: State, date: string, playing: boolean, keepSegment = false): State {
  const sameBattle = state.battleDate === date;
  return {
    ...state,
    date,
    playing,
    battleId: sameBattle ? state.battleId : null,
    battleDate: sameBattle ? state.battleDate : null,
    campaignId: keepSegment ? state.campaignId : null,
    playUntil: keepSegment ? state.playUntil : null,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "setTheater": {
      if (action.id === state.theater) return state;
      const keepUnit = action.keepUnit;
      return {
        ...state,
        theater: action.id,
        unitId: keepUnit ? state.unitId : null,
        battleId: null,
        battleDate: null,
        cameraLock: keepUnit ? state.cameraLock : false,
        campaignId: null,
        playUntil: null,
        camera: keepUnit ? state.camera : { type: "theater", id: action.id, nonce: state.camera.nonce + 1 },
        layers: theaterLayers(state.layers, action.id),
      };
    }
    case "followTheater": {
      if (action.id === state.theater) return state;
      return {
        ...state,
        theater: action.id,
        camera: state.cameraLock
          ? state.camera
          : { type: "theater", id: action.id, nonce: state.camera.nonce + 1 },
        layers: theaterLayers(state.layers, action.id),
      };
    }
    case "scrub":
      return withDate(state, dateFromIndex(action.index), false);
    case "tick": {
      if (!state.playing) return state;
      const limitIndex = state.playUntil ? Math.min(WAR_DAYS, dayIndex(state.playUntil)) : WAR_DAYS;
      const current = dayIndex(state.date);
      if (current >= limitIndex) return { ...state, playing: false };
      const nextIndex = Math.min(limitIndex, current + action.steps);
      return withDate(state, dateFromIndex(nextIndex), nextIndex < limitIndex, true);
    }
    case "togglePlay": {
      if (!state.playing && state.date === dateFromIndex(WAR_DAYS)) return state;
      if (!state.playing && state.playUntil && state.date >= state.playUntil) {
        return { ...state, playing: true, playUntil: dateFromIndex(WAR_DAYS), campaignId: null };
      }
      if (!state.playing) {
        return { ...state, playing: true, playUntil: action.followUntil ?? state.playUntil };
      }
      return { ...state, playing: false };
    }
    case "setPlayUntil":
      if (state.playUntil === action.date) return state;
      return { ...state, playUntil: action.date };
    case "setSpeed":
      return state.speed === action.speed ? state : { ...state, speed: action.speed };
    case "step": {
      const nextIndex = Math.min(WAR_DAYS, Math.max(0, dayIndex(state.date) + action.delta));
      return withDate(state, dateFromIndex(nextIndex), false);
    }
    case "selectUnit": {
      let first = action.dates[0] ?? state.date;
      for (const date of action.dates) {
        if (date < first) first = date;
      }
      const requested = action.date ?? state.date;
      const date = requested < first ? first : requested;
      return {
        ...state,
        theater: action.theater,
        date,
        unitId: action.id,
        battleId: null,
        battleDate: null,
        regionId: null,
        cameraLock: true,
        lockNonce: state.lockNonce + 1,
        campaignId: null,
        playUntil: state.playing ? lastTrackDate(action.dates) : null,
      };
    }
    case "selectBattle":
      return {
        ...state,
        playing: false,
        theater: action.theater,
        date: action.date,
        unitId: null,
        battleId: action.id,
        battleDate: action.date,
        regionId: null,
        cameraLock: false,
        campaignId: null,
        playUntil: null,
        camera: {
          type: "battle",
          lng: action.lng,
          lat: action.lat,
          zoom: action.zoom,
          nonce: state.camera.nonce + 1,
        },
      };
    case "openUrlBattle":
      return {
        ...state,
        playing: action.playing,
        theater: action.theater,
        date: action.date,
        unitId: null,
        battleId: action.id,
        battleDate: action.date,
        regionId: null,
        cameraLock: false,
        campaignId: null,
        playUntil: null,
        camera: {
          type: "battle",
          lng: action.lng,
          lat: action.lat,
          zoom: action.zoom,
          nonce: state.camera.nonce + 1,
        },
      };
    case "clear":
      if (!state.unitId && !state.battleId && !state.regionId) return state;
      return { ...state, unitId: null, battleId: null, battleDate: null, regionId: null, cameraLock: false };
    case "selectRegion":
      if (state.regionId === action.id && !state.unitId && !state.battleId) return state;
      return { ...state, regionId: action.id, unitId: null, battleId: null, battleDate: null, cameraLock: false };
    case "overview":
      return {
        ...state,
        unitId: null,
        battleId: null,
        battleDate: null,
        cameraLock: false,
        campaignId: null,
        playUntil: null,
        camera: { type: "overview", nonce: state.camera.nonce + 1 },
      };
    case "selectHubUnit":
      return {
        ...state,
        theater: action.theater ?? state.theater,
        date: action.date,
        unitId: action.id,
        battleId: null,
        battleDate: null,
        regionId: null,
        cameraLock: false,
        campaignId: null,
        playUntil: null,
        camera: action.theater
          ? { type: "theater", id: action.theater, nonce: state.camera.nonce + 1 }
          : { type: "overview", nonce: state.camera.nonce + 1 },
      };
    case "jumpHubStop":
      return {
        ...withDate(state, action.date, false),
        theater: action.theater ?? state.theater,
        cameraLock: false,
        camera: action.theater
          ? { type: "theater", id: action.theater, nonce: state.camera.nonce + 1 }
          : { type: "overview", nonce: state.camera.nonce + 1 },
      };
    case "lock":
      if (state.cameraLock === action.value) return state;
      return {
        ...state,
        cameraLock: action.value,
        lockNonce: action.value ? state.lockNonce + 1 : state.lockNonce,
      };
    case "follow":
      if (!state.unitId) return state;
      return { ...state, cameraLock: true, lockNonce: state.lockNonce + 1 };
    case "layer":
      return { ...state, layers: { ...state.layers, [action.layer]: !state.layers[action.layer] } };
    case "basemap":
      if (state.basemap === action.basemap) return state;
      return { ...state, basemap: action.basemap };
    case "echelonCap":
      if (state.echelonCap === action.cap) return state;
      return { ...state, echelonCap: action.cap };
    case "query":
      return { ...state, filters: { ...state.filters, query: action.query } };
    case "side":
      return { ...state, filters: { ...state.filters, side: action.side } };
    case "nation":
      return { ...state, filters: { ...state.filters, nation: action.nation } };
    case "echelon":
      return { ...state, filters: { ...state.filters, echelon: action.echelon } };
    case "resetFilters":
      return { ...state, filters: { query: "", side: "all", nation: "all", echelon: "all" } };
    case "jumpSample":
      return {
        ...state,
        theater: "normandy",
        date: SAMPLE_START,
        playing: false,
        unitId: null,
        battleId: null,
        battleDate: null,
        cameraLock: false,
        campaignId: null,
        playUntil: null,
        camera: { type: "theater", id: "normandy", nonce: state.camera.nonce + 1 },
        layers: theaterLayers(state.layers, "normandy"),
      };
    case "jumpPreset":
      return {
        ...state,
        theater: "normandy",
        date: action.date,
        playing: false,
        unitId: null,
        battleId: null,
        battleDate: null,
        cameraLock: false,
        campaignId: null,
        playUntil: null,
        camera: { type: "theater", id: "normandy", nonce: state.camera.nonce + 1 },
        layers: theaterLayers(state.layers, "normandy"),
      };
    case "playCampaign":
      return {
        ...state,
        theater: action.theater,
        layers: theaterLayers(state.layers, action.theater),
        date: action.start,
        playing: true,
        unitId: null,
        battleId: action.battle?.id ?? null,
        battleDate: action.battle ? action.start : null,
        regionId: null,
        cameraLock: false,
        campaignId: action.id,
        playUntil: action.end,
        camera: action.battle
          ? {
              type: "battle",
              lng: action.battle.lng,
              lat: action.battle.lat,
              zoom: action.battle.zoom,
              nonce: state.camera.nonce + 1,
            }
          : { type: "theater", id: action.theater, nonce: state.camera.nonce + 1 },
      };
    case "hydrate":
      return {
        ...state,
        theater: action.theater,
        date: action.date,
        playing: action.playing,
        unitId: action.unitId,
        battleId: null,
        battleDate: null,
        cameraLock: action.unitId !== null,
        lockNonce: state.lockNonce + 1,
        campaignId: action.campaignId,
        playUntil: action.playUntil,
        camera: action.unitId
          ? state.camera
          : { type: "theater", id: action.theater, nonce: state.camera.nonce + 1 },
        view: action.view,
        compareDate: action.compareDate,
        contrast: action.contrast,
        layers: theaterLayers(state.layers, action.theater),
      };
    case "setView":
      if (state.view === action.view && (action.view !== "globe" || state.compareDate === null)) return state;
      return {
        ...state,
        view: action.view,
        compareDate: action.view === "globe" ? null : state.compareDate,
      };
    case "setCompare": {
      if (action.date === state.compareDate) return state;
      if (action.date !== null && !isValidWarDate(action.date)) return state;
      const turningOn = action.date !== null && state.compareDate === null;
      return {
        ...state,
        compareDate: action.date,
        playing: turningOn ? false : state.playing,
        view: action.date ? "2d" : state.view,
      };
    }
    case "setContrast":
      if (action.value === state.contrast) return state;
      return { ...state, contrast: action.value };
    default:
      return state;
  }
}

function createState(): State {
  const url = readUrl(window.location.search);
  const embed = readEmbedOptions(window.location.search);
  return {
    theater: url.theater,
    date: url.date,
    playing: url.playing,
    speed: 1,
    unitId: url.unitId,
    battleId: null,
    battleDate: null,
    cameraLock: url.unitId !== null,
    lockNonce: 1,
    camera: url.unitId ? { type: "none", nonce: 1 } : { type: "theater", id: url.theater, nonce: 1 },
    layers: {
      fronts: true,
      units: true,
      battles: embed.battles !== "off",
      labels: true,
      occupation: true,
      controlAreas: controlAreasDefault(url.theater),
    },
    basemap: "dark",
    echelonCap: "auto",
    regionId: null,
    filters: { query: "", side: "all", nation: "all", echelon: "all" },
    campaignId: url.campaignId,
    playUntil: url.playUntil,
    view: url.view,
    compareDate: url.compareDate,
    contrast: url.contrast,
  };
}

export function useSituation() {
  const data = useMapData();
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  });
  const [state, dispatch] = useReducer(reducer, undefined, createState);
  const openedUrlBattle = useRef(false);

  useEffect(() => {
    if (openedUrlBattle.current) return;
    const options = readEmbedOptions(window.location.search);
    if (options.battles === "on" || options.battles === "off") {
      openedUrlBattle.current = true;
      return;
    }
    const battle = options.battles
      .map((id) => {
        const canonical = resolveBattleId(id) ?? id;
        return data.battles.find((item) => item.id === canonical);
      })
      .find((item) => item !== undefined);
    if (!battle) {
      if (data.status !== "loading") openedUrlBattle.current = true;
      return;
    }
    openedUrlBattle.current = true;
    const playing = new URLSearchParams(window.location.search).get("play") === "1";
    dispatch({
      type: "openUrlBattle",
      id: battle.id,
      theater: battle.theater,
      date: battle.date,
      lng: battle.lng,
      lat: battle.lat,
      zoom: battle.zoom,
      playing,
    });
  }, [data.battles, data.status]);

  useEffect(() => {
    if (!state.playing) {
      setPlayClock(0, false);
      return;
    }
    let frame = 0;
    let last = performance.now();
    let fraction = 0;
    const msPerDay = 1000 / state.speed;
    const loop = (now: number) => {
      const elapsed = now - last;
      last = now;
      fraction += elapsed / msPerDay;
      let steps = 0;
      while (fraction >= 1 && steps < 90) {
        fraction -= 1;
        steps += 1;
      }
      setPlayClock(Math.round(fraction * 20) / 20, true);
      if (steps > 0) dispatch({ type: "tick", steps });
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [state.playing, state.speed]);

  useEffect(() => {
    writeUrl({
      theater: state.theater,
      date: state.date,
      unitId: state.unitId,
      playing: state.playing,
      campaignId: state.campaignId,
      playUntil: state.playUntil,
      view: state.view,
      compareDate: state.compareDate,
      contrast: state.contrast,
    });
  }, [state.theater, state.date, state.unitId, state.playing, state.campaignId, state.playUntil, state.view, state.compareDate, state.contrast]);

  useEffect(() => {
    const onPop = () => {
      const next = readUrl(window.location.search);
      dispatch({
        type: "hydrate",
        theater: next.theater,
        date: next.date,
        unitId: next.unitId,
        playing: next.playing,
        campaignId: next.campaignId,
        playUntil: next.playUntil,
        view: next.view,
        compareDate: next.compareDate,
        contrast: next.contrast,
      });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    document.title = `${formatStencil(state.date)} · WW2Hub Map`;
  }, [state.date]);

  useLayoutEffect(() => {
    if (!state.playing || state.campaignId || state.playUntil || !state.unitId) return;
    const unit = data.units.find((item) => item.id === state.unitId);
    if (!unit) return;
    const last = lastTrackDate(unit.track.map((point) => point.date));
    if (last) dispatch({ type: "setPlayUntil", date: last });
  }, [state.playing, state.campaignId, state.playUntil, state.unitId, data.units]);

  return {
    state,
    data,
    setTheater: (id: TheaterId) => {
      const unit = dataRef.current.units.find((item) => item.id === state.unitId);
      dispatch({ type: "setTheater", id, keepUnit: unit ? unitTheaters(unit).includes(id) : false });
    },
    followTheater: (id: TheaterId) => dispatch({ type: "followTheater", id }),
    scrub: (index: number) => dispatch({ type: "scrub", index }),
    togglePlay: () => {
      const unit = dataRef.current.units.find((item) => item.id === state.unitId);
      const followUntil = unit ? lastTrackDate(unit.track.map((point) => point.date)) : undefined;
      dispatch({ type: "togglePlay", followUntil });
    },
    setSpeed: (speed: Speed) => dispatch({ type: "setSpeed", speed }),
    step: (delta: number) => dispatch({ type: "step", delta }),
    selectUnit: (id: string, atDate?: string) => {
      const unit = dataRef.current.units.find((item) => item.id === id);
      if (!unit) return;
      const dates = unit.track.map((point) => point.date);
      let first = dates[0] ?? state.date;
      for (const date of dates) {
        if (date < first) first = date;
      }
      const requested = atDate && isValidWarDate(atDate) ? atDate : state.date;
      const date = requested < first ? first : requested;
      dispatch({
        type: "selectUnit",
        id: unit.id,
        theater: theaterAt(unit, date) ?? unit.theater,
        dates,
        date,
      });
    },
    selectHubUnit: (id: string, theater: TheaterId | null, date: string) => {
      dispatch({ type: "selectHubUnit", id, theater, date });
    },
    jumpHubStop: (date: string, theater: TheaterId | null) => {
      dispatch({ type: "jumpHubStop", date, theater });
    },
    selectBattle: (id: string) => {
      const battle = dataRef.current.battles.find((item) => item.id === id);
      if (!battle) return;
      dispatch({
        type: "selectBattle",
        id: battle.id,
        theater: battle.theater,
        date: battle.date,
        lng: battle.lng,
        lat: battle.lat,
        zoom: battle.zoom,
      });
    },
    clearSelection: () => dispatch({ type: "clear" }),
    selectRegion: (id: string) => dispatch({ type: "selectRegion", id }),
    showOverview: () => dispatch({ type: "overview" }),
    setCameraLock: (value: boolean) => dispatch({ type: "lock", value }),
    followSelected: () => dispatch({ type: "follow" }),
    toggleLayer: (layer: keyof Layers) => dispatch({ type: "layer", layer }),
    setBasemap: (basemap: Basemap) => dispatch({ type: "basemap", basemap }),
    setEchelonCap: (cap: EchelonCap) => dispatch({ type: "echelonCap", cap }),
    setQuery: (query: string) => dispatch({ type: "query", query }),
    setSide: (side: Side | "all") => dispatch({ type: "side", side }),
    setNation: (nation: string) => dispatch({ type: "nation", nation }),
    setEchelon: (echelon: Echelon | "all") => dispatch({ type: "echelon", echelon }),
    resetFilters: () => dispatch({ type: "resetFilters" }),
    jumpSample: () => dispatch({ type: "jumpSample" }),
    jumpPreset: (date: string) => dispatch({ type: "jumpPreset", date }),
    setView: (view: MapView) => dispatch({ type: "setView", view }),
    setCompare: (date: string | null) => dispatch({ type: "setCompare", date }),
    setContrast: (value: boolean) => dispatch({ type: "setContrast", value }),
    playCampaign: (id: string) => {
      const campaign = CAMPAIGNS.find((item) => item.id === id);
      if (!campaign) return;
      const battle = campaign.battleId
        ? dataRef.current.battles.find((item) => item.id === campaign.battleId && item.theater === campaign.theater)
        : undefined;
      dispatch({
        type: "playCampaign",
        id: campaign.id,
        theater: campaign.theater,
        start: campaign.start,
        end: campaign.end,
        battle: battle
          ? { id: battle.id, lng: battle.lng, lat: battle.lat, zoom: battle.zoom }
          : undefined,
      });
    },
  };
}

export type Situation = ReturnType<typeof useSituation>;
