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
 * D-Day and Carentan reuse the sample markers.
 * The later operations set the date only. They have no coordinates in this sample.
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
    note: "Date preset for 26 June 1944. No plotted position in this sample.",
  },
  {
    id: "charnwood",
    name: "Charnwood",
    date: "1944-07-08",
    note: "Date preset for 8 July 1944. No plotted position in this sample.",
  },
  {
    id: "goodwood",
    name: "Goodwood",
    date: "1944-07-18",
    note: "Date preset for 18 July 1944. No plotted position in this sample.",
  },
  {
    id: "cobra",
    name: "Cobra",
    date: "1944-07-25",
    note: "Date preset for 25 July 1944. No plotted position in this sample.",
  },
  {
    id: "falaise",
    name: "Falaise",
    date: "1944-08-12",
    note: "Date preset for 12 August 1944. No plotted position in this sample.",
  },
];
