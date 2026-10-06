import type { ControlSide, Side } from "../types.ts";

/** Okabe–Ito colour-blind-safe hues. Axis is vermillion, not the same red as Soviet. */
export const SIDE_FALLBACK: Record<Side, string> = {
  allied: "#0072b2",
  axis: "#d55e00",
  soviet: "#cc79a7",
  japanese: "#e69f00",
};

export const NEUTRAL_FALLBACK = "#009e73";
export const COLLAPSED_FALLBACK = "#7a7a70";

export function controlColor(side: ControlSide, status: string, palette: Record<Side, string>, neutral: string, collapsed: string): string {
  if (status === "collapsed") return collapsed;
  if (side === "neutral") return neutral;
  return palette[side];
}

export function cssVar(el: Element | null, name: string, fallback: string): string {
  if (!el) return fallback;
  const value = getComputedStyle(el).getPropertyValue(name).trim();
  return value || fallback;
}

export function sideColorsFrom(el: Element | null): Record<Side, string> {
  return {
    allied: cssVar(el, "--allied", SIDE_FALLBACK.allied),
    axis: cssVar(el, "--axis", SIDE_FALLBACK.axis),
    soviet: cssVar(el, "--soviet", SIDE_FALLBACK.soviet),
    japanese: cssVar(el, "--japanese", SIDE_FALLBACK.japanese),
  };
}
