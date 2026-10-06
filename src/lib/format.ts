import type { Echelon, Side } from "../types.ts";

export function formatCoord(lng: number, lat: number): string {
  const north = lat >= 0 ? "N" : "S";
  const east = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}° ${north}, ${Math.abs(lng).toFixed(2)}° ${east}`;
}

export function sideLabel(side: Side): string {
  switch (side) {
    case "allied":
      return "Allied";
    case "axis":
      return "Axis";
    case "soviet":
      return "Soviet";
    case "japanese":
      return "Japanese";
  }
}

export function echelonLabel(echelon: Echelon): string {
  return echelon.charAt(0).toUpperCase() + echelon.slice(1);
}

/** NATO size mark drawn above the abbreviation. Symbology only. */
export function echelonMark(echelon: Echelon): string {
  switch (echelon) {
    case "army":
      return "XXXX";
    case "corps":
      return "XXX";
    case "division":
      return "XX";
    case "brigade":
      return "X";
    case "regiment":
      return "III";
    case "battalion":
      return "II";
    case "company":
      return "I";
  }
}
