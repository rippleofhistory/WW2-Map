import type { TheaterId } from "../types.ts";

/** A published operation window. It has no coordinates, units, or front geometry. */
export interface Campaign {
  id: string;
  name: string;
  theater: TheaterId;
  start: string;
  end: string;
  note: string;
}

/**
 * Clicking a campaign sets the theater, starts on the first date, and plays through the last date.
 * The camera uses the theater frame. Nothing in this list is a plotted position.
 */
export const CAMPAIGNS: readonly Campaign[] = [
  {
    id: "barbarossa",
    name: "Barbarossa",
    theater: "eastern-front",
    start: "1941-06-22",
    end: "1941-12-05",
    note: "Date window 22 June–5 December 1941, through the start of the Moscow counteroffensive. No plotted position.",
  },
  {
    id: "stalingrad",
    name: "Stalingrad",
    theater: "eastern-front",
    start: "1942-07-17",
    end: "1943-02-02",
    note: "Date window 17 July 1942–2 February 1943. No plotted position.",
  },
  {
    id: "kursk",
    name: "Kursk",
    theater: "eastern-front",
    start: "1943-07-05",
    end: "1943-08-23",
    note: "Date window 5 July–23 August 1943. No plotted position.",
  },
  {
    id: "husky",
    name: "Husky",
    theater: "italy",
    start: "1943-07-09",
    end: "1943-08-17",
    note: "Date window 9 July–17 August 1943. No plotted position.",
  },
  {
    id: "avalanche",
    name: "Avalanche",
    theater: "italy",
    start: "1943-09-09",
    end: "1943-09-17",
    note: "Salerno landings, 9–17 September 1943. No plotted position.",
  },
  {
    id: "overlord",
    name: "Overlord",
    theater: "normandy",
    start: "1944-06-06",
    end: "1944-08-30",
    note: "Date window 6 June–30 August 1944. The Normandy player still runs through 31 August. No new plotted position.",
  },
  {
    id: "market-garden",
    name: "Market Garden",
    theater: "nw-europe",
    start: "1944-09-17",
    end: "1944-09-25",
    note: "Date window 17–25 September 1944. No plotted position.",
  },
  {
    id: "bulge",
    name: "Bulge",
    theater: "nw-europe",
    start: "1944-12-16",
    end: "1945-01-25",
    note: "Date window 16 December 1944–25 January 1945. No plotted position.",
  },
  {
    id: "imphal-kohima",
    name: "Imphal-Kohima",
    theater: "burma",
    start: "1944-03-08",
    end: "1944-07-18",
    note: "Combined window 8 March–18 July 1944, the Imphal span, which covers Kohima. No plotted position.",
  },
  {
    id: "iwo-jima",
    name: "Iwo Jima",
    theater: "pacific",
    start: "1945-02-19",
    end: "1945-03-26",
    note: "Date window 19 February–26 March 1945. No plotted position.",
  },
];

export function campaignById(id: string | null): Campaign | null {
  if (!id) return null;
  return CAMPAIGNS.find((campaign) => campaign.id === id) ?? null;
}
