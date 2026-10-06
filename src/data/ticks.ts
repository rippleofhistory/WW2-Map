import { CAMPAIGNS } from "./campaigns.ts";
import { CAMPAIGN_PRESETS } from "./presets.ts";
import { WAR_DAYS, dayIndex } from "../lib/dates.ts";

/** A date already published on the timeline. Not a coordinate. */
export interface OperationTick {
  id: string;
  name: string;
  date: string;
  kind: "campaign" | "preset";
}

export interface PlacedTick extends OperationTick {
  left: number;
  lane: number;
  labeled: boolean;
}

const CHAR_PX = 6.6;
const GAP_PX = 10;
const LANES = 3;

/**
 * Campaign openings, plus Cobra and Falaise.
 * D-Day is the same day as Overlord, so it stays on the Normandy row only.
 */
export function operationTicks(): OperationTick[] {
  const ticks: OperationTick[] = CAMPAIGNS.map((campaign) => ({
    id: campaign.id,
    name: campaign.name,
    date: campaign.start,
    kind: "campaign" as const,
  }));
  for (const preset of CAMPAIGN_PRESETS) {
    if (preset.id !== "cobra" && preset.id !== "falaise") continue;
    ticks.push({ id: preset.id, name: preset.name, date: preset.date, kind: "preset" });
  }
  ticks.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
  return ticks;
}

function labelWidth(name: string): number {
  return name.length * CHAR_PX + GAP_PX;
}

const REQUIRED_LANE: Record<string, number> = { overlord: 0, cobra: 1, falaise: 2 };

/**
 * Place names in up to three rows so nearby dates stay readable.
 * Overlord, Cobra, and Falaise are reserved first, each on its own row.
 */
export function layoutOperationTicks(width: number): PlacedTick[] {
  const ticks = operationTicks();
  const spans: { start: number; end: number }[][] = [[], [], []];
  const placed = new Map<string, { lane: number; labeled: boolean }>();

  const spanFor = (tick: OperationTick) => {
    const leftPx = width > 0 ? (dayIndex(tick.date) / WAR_DAYS) * width : 0;
    const half = labelWidth(tick.name) / 2;
    return { start: leftPx - half, end: leftPx + half };
  };

  const fits = (lane: number, start: number, end: number) =>
    (spans[lane] ?? []).every((span) => end < span.start || start > span.end);

  const claim = (tick: OperationTick, lane: number, labeled: boolean) => {
    if (labeled) {
      const { start, end } = spanFor(tick);
      spans[lane]?.push({ start, end });
    }
    placed.set(tick.id, { lane, labeled });
  };

  for (const tick of ticks) {
    const lane = REQUIRED_LANE[tick.id];
    if (lane === undefined) continue;
    claim(tick, lane, true);
  }

  for (const tick of ticks) {
    if (placed.has(tick.id)) continue;
    if (width <= 0) {
      claim(tick, 0, false);
      continue;
    }
    const { start, end } = spanFor(tick);
    let lane = -1;
    for (let index = 0; index < LANES; index += 1) {
      if (fits(index, start, end)) {
        lane = index;
        break;
      }
    }
    claim(tick, lane >= 0 ? lane : 0, lane >= 0);
  }

  return ticks.map((tick) => {
    const spot = placed.get(tick.id);
    return {
      ...tick,
      left: (dayIndex(tick.date) / WAR_DAYS) * 100,
      lane: spot?.lane ?? 0,
      labeled: spot?.labeled ?? false,
    };
  });
}
