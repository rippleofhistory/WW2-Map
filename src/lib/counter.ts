import type { Echelon, Side } from "../types.ts";

/** HoI4 / Project 44 counter faces. Not the Okabe–Ito side palette. */
const NATION_FACE: Record<string, string> = {
  "united states": "#2f5d9f",
  usa: "#2f5d9f",
  "united kingdom": "#8a7848",
  uk: "#8a7848",
  britain: "#8a7848",
  germany: "#5c6758",
  "soviet union": "#8b1e1e",
  ussr: "#8b1e1e",
  france: "#3a5680",
  "free france": "#3a5680",
  canada: "#6b5a36",
  italy: "#6a7358",
  japan: "#6b5344",
  poland: "#7a2430",
  india: "#7d6a3c",
  australia: "#7a6b3a",
  "south africa": "#6e6738",
  "new zealand": "#6e6740",
  romania: "#5a4e3a",
  hungary: "#6b4a3a",
  belgium: "#4a5a6a",
  china: "#7a3a3a",
  norway: "#4a6a7a",
  greece: "#5a6a7a",
  netherlands: "#5a5a6a",
  slovakia: "#6a5a4a",
};

const SIDE_FACE: Record<Side, string> = {
  allied: "#2f5d9f",
  axis: "#5c6758",
  soviet: "#8b1e1e",
  japanese: "#6b5344",
};

export const SIDE_PIP: Record<Side, string> = {
  allied: "#3d6db5",
  axis: "#b33a3a",
  soviet: "#b33a3a",
  japanese: "#b33a3a",
};

const SIZE_PX: Record<Echelon, number> = {
  "army-group": 28,
  army: 28,
  corps: 24,
  division: 22,
  brigade: 18,
  regiment: 18,
  battalion: 14,
  company: 14,
};

export function nationCounterColor(nation: string, side: Side): string {
  return NATION_FACE[nation.trim().toLowerCase()] ?? SIDE_FACE[side];
}

export function counterSize(echelon: Echelon): number {
  return SIZE_PX[echelon];
}

export function darkenHex(hex: string, amount = 0.32): string {
  const raw = hex.replace("#", "");
  const full = raw.length === 3 ? raw.split("").map((part) => part + part).join("") : raw;
  const value = Number.parseInt(full, 16);
  if (!Number.isFinite(value)) return "#1a1a1a";
  const scale = 1 - amount;
  const channel = (shift: number) => {
    const next = Math.max(0, Math.min(255, Math.round(((value >> shift) & 255) * scale)));
    return next.toString(16).padStart(2, "0");
  };
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}

/** 0–1 fill. Values 1–100 are treated as percent. */
export function parseStrength(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  if (value < 0) return 0;
  if (value > 1 && value <= 100) return value / 100;
  if (value > 1) return 1;
  return value;
}

export function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}
