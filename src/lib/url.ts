import { campaignById } from "../data/campaigns.ts";
import { resolveUnitId, theaterForUnit } from "../data/catalog.ts";
import { isTheaterId } from "../data/theaters.ts";
import { isValidWarDate, SAMPLE_START } from "./dates.ts";
import type { MapView, TheaterId } from "../types.ts";

export interface UrlState {
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

export function readUrl(search: string): UrlState {
  const params = new URLSearchParams(search);
  const theaterParam = params.get("theater");
  let theater: TheaterId = isTheaterId(theaterParam) ? theaterParam : "normandy";
  const dateParam = params.get("date");
  const date = dateParam && isValidWarDate(dateParam) ? dateParam : SAMPLE_START;
  const unitId = resolveUnitId(params.get("unit"));
  const campaign = unitId ? null : campaignById(params.get("campaign"));
  if (campaign) theater = campaign.theater;
  const unitTheater = theaterForUnit(unitId);
  if (unitTheater) theater = unitTheater;
  const compareParam = params.get("compare");
  const compareDate = compareParam && isValidWarDate(compareParam) ? compareParam : null;
  return {
    theater,
    date,
    unitId,
    playing: params.get("play") === "1",
    campaignId: campaign?.id ?? null,
    playUntil: campaign?.end ?? null,
    view: compareDate ? "2d" : params.get("view") === "globe" ? "globe" : "2d",
    compareDate,
    contrast: params.get("contrast") === "1",
  };
}

export function writeUrl(state: UrlState): void {
  const url = new URL(window.location.href);
  url.searchParams.set("theater", state.theater);
  url.searchParams.set("date", state.date);
  if (state.unitId) url.searchParams.set("unit", state.unitId);
  else url.searchParams.delete("unit");
  if (state.playing) url.searchParams.set("play", "1");
  else url.searchParams.delete("play");
  if (state.campaignId) url.searchParams.set("campaign", state.campaignId);
  else url.searchParams.delete("campaign");
  if (state.view === "globe") url.searchParams.set("view", "globe");
  else url.searchParams.delete("view");
  if (state.compareDate) url.searchParams.set("compare", state.compareDate);
  else url.searchParams.delete("compare");
  if (state.contrast) url.searchParams.set("contrast", "1");
  else url.searchParams.delete("contrast");
  const next = `${url.pathname}${url.search}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== current) window.history.replaceState(null, "", next);
}
