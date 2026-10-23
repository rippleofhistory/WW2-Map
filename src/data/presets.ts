export interface CampaignPreset {
  id: string;
  name: string;
  /** Published start date for the operation. Not a unit location. */
  date: string;
  /** Sample battle that already has a placeholder marker. */
  battleId?: string;
  note: string;
}

export const NORMANDY_CAMPAIGN_START = "1944-06-06";
export const NORMANDY_CAMPAIGN_END = "1944-08-31";

/**
 * Normandy campaign jumps, 6 June–31 August 1944.
 * D-Day, Carentan, Charnwood, Goodwood, and Cobra open a sourced battle marker.
 * Epsom has no named commune in Operation Overlord. Falaise (12 August) is the
 * pocket-forming date; the town pin is 16 August.
 */
export const CAMPAIGN_PRESETS: readonly CampaignPreset[] = [
  {
    id: "d-day",
    name: "D-Day",
    date: "1944-06-06",
    battleId: "d-day",
    note: "Sample jump. Placeholder marker.",
  },
  {
    id: "carentan",
    name: "Carentan",
    date: "1944-06-12",
    battleId: "carentan",
    note: "Sample jump. Placeholder marker.",
  },
  {
    id: "epsom",
    name: "Epsom",
    date: "1944-06-26",
    note: "Date preset for 26 June 1944. Overlord names the Odon, not a commune. Cherbourg that day is a separate battle marker.",
  },
  {
    id: "charnwood",
    name: "Charnwood",
    date: "1944-07-08",
    battleId: "caen-charnwood",
    note: "8 July 1944. Northern Caen. Overlord commune pin.",
  },
  {
    id: "goodwood",
    name: "Goodwood",
    date: "1944-07-18",
    battleId: "caen-goodwood",
    note: "18 July 1944. Caen. Overlord commune pin.",
  },
  {
    id: "cobra",
    name: "Cobra",
    date: "1944-07-25",
    battleId: "saint-lo",
    note: "25 July 1944. Saint-Lô. Overlord commune pin.",
  },
  {
    id: "falaise",
    name: "Falaise",
    date: "1944-08-12",
    note: "Date preset for 12 August 1944. The Falaise town pin is 16 August, when Overlord names the Canadian capture.",
  },
];
