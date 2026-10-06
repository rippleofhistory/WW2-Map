export type Side = "allied" | "axis" | "soviet" | "japanese";

/** Country fill at zoom-out. Neutral is not a unit side. */
export type ControlSide = Side | "neutral";

export type ControlStatus = "sovereign" | "occupied" | "puppet" | "cobelligerent" | "collapsed";

export type Echelon =
  | "army"
  | "corps"
  | "division"
  | "brigade"
  | "regiment"
  | "battalion"
  | "company";

export type TheaterId =
  | "normandy"
  | "nw-europe"
  | "italy"
  | "eastern-front"
  | "burma"
  | "pacific"
  | "north-africa";

/** Daily polylines, or weekly held-area polygons. Weekly theaters are not filled in this build. */
export type FrontCadence = "daily" | "weekly";

export type Speed = 1 | 5 | 30;

/** 2D MapLibre is the default. Globe loads Cesium only after the user asks for it. */
export type MapView = "2d" | "globe";

export type Confidence = "high" | "medium" | "low";

/** One dated sample fix. Coordinates stay placeholders until an archive source replaces them. */
export interface UnitPosition {
  date: string;
  lng: number;
  lat: number;
  note: string;
  place?: string;
  source?: string;
  confidence?: Confidence;
}

/** Same record as UnitPosition. */
export type TrackPoint = UnitPosition;

export type PositionStatus = "reported" | "last-reported" | "moving";

export interface Unit {
  id: string;
  name: string;
  abbr: string;
  nation: string;
  side: Side;
  echelon: Echelon;
  parent: string;
  theater: TheaterId;
  source: string;
  confidence?: Confidence;
  featured?: boolean;
  track: UnitPosition[];
}

export interface FrontLine {
  id: string;
  date: string;
  theater: TheaterId;
  label: string;
  source: string;
  confidence?: Confidence;
  /** Daily situation trace. Empty when the front is a weekly polygon. */
  allied: [number, number][];
  axis: [number, number][];
  /**
   * Closed ring for a weekly front polygon, [lng, lat].
   * Leave this off until an archive source supplies it. No sample ring is shipped.
   */
  polygon?: [number, number][];
}

export interface Battle {
  id: string;
  name: string;
  theater: TheaterId;
  date: string;
  lng: number;
  lat: number;
  zoom: number;
  summary: string;
  source: string;
  confidence?: Confidence;
  /** Unit ids tagged to this battle. Villers-Bocage lists 4 CLY and s.SS-Pz.Abt. 101, not SRY. */
  units?: string[];
}

export interface PlaceLabel {
  id: string;
  name: string;
  theater: TheaterId;
  lng: number;
  lat: number;
  source: string;
}

export interface Theater {
  id: TheaterId;
  label: string;
  /** Camera frame only. Not a unit location or a front. */
  center: [number, number];
  /** Default camera zoom for this theater. */
  zoom: number;
  /** Camera window [west, south, east, north]. Not a front line or a unit location. */
  bounds: [number, number, number, number];
  /** Published span for the theater. It does not lock the date slider. */
  start: string;
  end: string;
  /** Eastern Front and Burma take weekly polygons. The others take daily polylines. */
  frontCadence: FrontCadence;
  disclaimer?: string;
}

export interface Layers {
  fronts: boolean;
  units: boolean;
  battles: boolean;
  labels: boolean;
  modernBasemap: boolean;
  occupation: boolean;
}

export interface Filters {
  query: string;
  side: Side | "all";
  nation: string;
  echelon: Echelon | "all";
}

export type CameraCommand =
  | { type: "none"; nonce: number }
  | { type: "theater"; id: TheaterId; nonce: number }
  | { type: "battle"; lng: number; lat: number; zoom: number; nonce: number }
  | { type: "overview"; nonce: number };

/** Schematic country control. Last sourced row on or before the date is current. */
export interface OccupationPoint {
  date: string;
  side: ControlSide;
  status: ControlStatus;
  note: string;
  source: string;
  confidence: Confidence;
}

export interface OccupationState {
  id: string;
  name: string;
  codes: string[];
  source: string;
  confidence: Confidence;
  track: OccupationPoint[];
}
