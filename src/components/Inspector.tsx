import { theaterById } from "../data/theaters.ts";
import { addDays, formatDisplay } from "../lib/dates.ts";
import { echelonLabel, formatCoord, sideLabel } from "../lib/format.ts";
import { hubUnitUrl, type HubUnitRef } from "../lib/hub.ts";
import type { OccupationPlacement } from "../lib/occupation.ts";
import type { Placement } from "../lib/position.ts";
import { pointTheater } from "../lib/select.ts";
import type { Battle, Confidence, FrontLine, Theater, TheaterId, Unit, UnitPosition } from "../types.ts";

function confidenceText(value: Confidence | undefined): string {
  return value ?? "not set";
}

interface InspectorProps {
  open: boolean;
  date: string;
  theater: Theater;
  unit: Unit | null;
  placement: Placement | null;
  drawn: boolean;
  playing: boolean;
  battle: Battle | null;
  front: FrontLine | null;
  unitCount: number;
  cameraLock: boolean;
  onLock: (value: boolean) => void;
  onShowStop: (date: string) => void;
  onClear: () => void;
  onClose: () => void;
  onSelectUnit: (id: string) => void;
  taggedUnits: readonly Unit[];
  occupation: OccupationPlacement | null;
  hub: HubUnitRef | null;
  onHubStop: (date: string, theater: TheaterId | null) => void;
  opponent: Unit | null;
  onFront: boolean;
  hasContact: boolean;
}

function orderedStops(unit: Unit): UnitPosition[] {
  return [...unit.track].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

function stopState(point: UnitPosition, date: string, placement: Placement | null): string {
  if (point.date > date) return "Not on the path yet";
  if (point.date === date) return "This day";
  if (placement?.status === "last-reported" && point.date === placement.anchor.date) return "Last reported";
  return "On the path";
}

export function Inspector(props: InspectorProps) {
  const placement = props.placement;
  const gliding =
    Boolean(props.playing && props.unit && placement?.status === "reported") &&
    Boolean(props.unit?.track.some((item) => item.date === addDays(props.date, 1)));
  const stops = props.unit ? orderedStops(props.unit) : [];
  const firstStop = stops[0] ?? null;
  const reached = stops.filter((point) => point.date <= props.date);

  return (
    <aside id="inspector" className="panel panel-right" hidden={!props.open} aria-label="Inspector">
      <div className="panel-head">
        <h2>Inspector</h2>
        <button type="button" className="panel-close" onClick={props.onClose}>
          Close
        </button>
      </div>
      {props.unit ? (
        <div className="sheet">
          {props.unit.source === "placeholder pending archive geocoding" ? <p className="badge">PLACEHOLDER</p> : null}
          {placement?.status === "last-reported" ? <p className="badge">Last reported</p> : null}
          {gliding ? <p className="badge">Moving</p> : null}
          {props.opponent ? <p className="badge">In contact</p> : null}
          <h3>{props.unit.name}</h3>
          <p className="lede">
            {props.unit.nation} · {sideLabel(props.unit.side)} · {echelonLabel(props.unit.echelon)}
          </p>
          <dl>
            <div>
              <dt>Parent formation</dt>
              <dd>{props.unit.parent}</dd>
            </div>
            <div>
              <dt>Confidence</dt>
              <dd>{confidenceText(props.unit.confidence)}</dd>
            </div>
          </dl>
          <section className="day-panel" aria-label="Day panel">
            <h3>This day</h3>
            <p className="day-date">{formatDisplay(props.date)}</p>
            {placement ? (
              <>
                {placement.status === "last-reported" ? (
                  <p>
                    No row on this date. Holding {placement.anchor.place ?? "the last sourced point"} from{" "}
                    {formatDisplay(placement.anchor.date)}
                    {placement.staleDays >= 3 ? ` (${placement.staleDays} days ago)` : ""}. Last reported.
                  </p>
                ) : null}
                {placement.status === "last-reported" && !props.drawn ? (
                  <p>
                    Not drawn. The schematic front has moved on. No later coordinate is invented.
                  </p>
                ) : null}
                {gliding ? (
                  <p>Playing. The marker glides toward the next sample day. The line is not a located route.</p>
                ) : null}
                {placement.anchor.place ? <p className="meta">{placement.anchor.place}</p> : null}
                <p>{placement.anchor.note}</p>
                <p className="meta">
                  {placement.status === "last-reported" ? "Last reported: " : "Coordinates: "}
                  {formatCoord(placement.anchor.lng, placement.anchor.lat)}
                </p>
                {placement.anchor.source ? (
                  <p className="meta">Point source: {placement.anchor.source}</p>
                ) : null}
                {props.hasContact && props.opponent ? (
                  <p>
                    Counter posted on the front line, in contact with {props.opponent.name}. The sourced place
                    stays {placement.anchor.place ?? "the last sourced point"}.
                  </p>
                ) : null}
                {props.hasContact && props.onFront && !props.opponent ? (
                  <p className="meta">On the front line. No opposing pin within pairing distance on this date.</p>
                ) : null}
                {props.hasContact && !props.onFront ? (
                  <p className="meta">Off the schematic contact. The counter stays at the sourced place.</p>
                ) : null}
              </>
            ) : (
              <p>No sample position on this date. This unit has not reached its first sample point.</p>
            )}
          </section>
          <section className="stops" aria-label="Dated stops">
            <h3>Stops</h3>
            {firstStop ? (
              <p className="meta">
                Path from {formatDisplay(firstStop.date)} to {formatDisplay(props.date)}. {reached.length} of {stops.length} sample
                stops {reached.length === 1 ? "is" : "are"} drawn. Missing days hold the previous point. No extra dates are invented.
              </p>
            ) : (
              <p className="meta">This unit has no sample stops.</p>
            )}
            <ol>
              {stops.map((point) => {
                const current = point.date === props.date;
                const frame = pointTheater(point) ?? props.unit?.theater;
                const theaterLabel = frame ? theaterById(frame).label : "";
                return (
                  <li key={`${point.date}:${point.lng}:${point.lat}`}>
                    <button
                      type="button"
                      data-stop={point.date}
                      data-reached={point.date <= props.date ? "1" : "0"}
                      aria-current={current ? "date" : undefined}
                      aria-label={`${formatDisplay(point.date)}. ${point.place ?? ""} ${theaterLabel}. ${formatCoord(point.lng, point.lat)}. ${stopState(point, props.date, placement)}`}
                      onClick={() => props.onShowStop(point.date)}
                    >
                      <span className="stop-date">{formatDisplay(point.date)}</span>
                      <span className="stop-meta">
                        {point.place ? `${point.place} · ` : ""}
                        {theaterLabel ? `${theaterLabel} · ` : ""}
                        {formatCoord(point.lng, point.lat)} · {stopState(point, props.date, placement)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
          <p className="source">
            <span>Source</span>
            {props.unit.source}
          </p>
          {props.hub ? (
            <p className="meta">
              <a href={hubUnitUrl(props.hub.path)} target="_blank" rel="noopener noreferrer">
                Open {props.hub.name} on WW2Hub
              </a>
            </p>
          ) : null}
          <div className="action-row">
            <button type="button" aria-pressed={props.cameraLock} onClick={() => props.onLock(!props.cameraLock)}>
              {props.cameraLock ? "Camera locked" : "Lock camera"}
            </button>
            {props.opponent ? (
              <button
                type="button"
                onClick={() => {
                  const next = props.opponent;
                  if (next) props.onSelectUnit(next.id);
                }}
              >
                Open {props.opponent.abbr}
              </button>
            ) : null}
            <button type="button" onClick={props.onClear}>
              Clear follow
            </button>
          </div>
        </div>
      ) : null}
      {!props.unit && props.hub ? (
        <div className="sheet">
          <p className="badge">{props.hub.plotted ? "WW2HUB UNIT" : "HUB REFERENCE"}</p>
          <h3>{props.hub.name}</h3>
          <p className="lede">
            {[props.hub.nation, props.hub.branch].filter(Boolean).join(" · ") || "WW2Hub unit"}
          </p>
          <p>
            {props.hub.plotted
              ? "This formation has a sourced track on the map. Use the dated stops to jump."
              : "No sourced pin for this unit yet. The map holds country occupation on the selected date. Battle dates below jump the war. No extra coordinates are invented."}
          </p>
          <section className="stops" aria-label="WW2Hub path">
            <h3>Path through the war</h3>
            {props.hub.battles.length === 0 ? (
              <p className="meta">No dated battles are linked on WW2Hub yet.</p>
            ) : (
              <ol>
                {props.hub.battles.map((stop) => {
                  const current = stop.date === props.date;
                  return (
                    <li key={`${stop.id}:${stop.date}`}>
                      <button type="button" data-hub-stop={stop.date} onClick={() => props.onHubStop(stop.date, stop.mapTheater)}>
                        <span className="stop-date">{formatDisplay(stop.date)}</span>
                        <span className="stop-meta">
                          {stop.name}
                          {stop.location ? ` · ${stop.location}` : ""}
                          {current ? " · This day" : ""}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
          <p className="meta">
            <a href={hubUnitUrl(props.hub.path)} target="_blank" rel="noopener noreferrer">
              Open this unit on WW2Hub
            </a>
          </p>
          <div className="action-row">
            <button type="button" onClick={props.onClear}>
              Clear
            </button>
          </div>
        </div>
      ) : null}
      {!props.unit && !props.hub && !props.battle && props.occupation ? (
        <div className="sheet">
          <p className="badge">OCCUPATION</p>
          <h3>{props.occupation.state.name}</h3>
          <p className="lede">{formatDisplay(props.date)}</p>
          <p className="meta">
            {props.occupation.point.side} · {props.occupation.point.status}
          </p>
          {props.occupation.point.date === props.date ? (
            <p className="meta">Control keyed to this date.</p>
          ) : (
            <p className="meta">
              Holding {formatDisplay(props.occupation.point.date)}. Country fills keep the last sourced control. No extra dates are invented.
            </p>
          )}
          <p>{props.occupation.point.note}</p>
          <p className="meta">Confidence: {confidenceText(props.occupation.point.confidence)}</p>
          <p className="source">
            <span>Source</span>
            {props.occupation.point.source}
          </p>
          <div className="action-row">
            <button type="button" onClick={props.onClear}>
              Clear
            </button>
          </div>
        </div>
      ) : null}
      {!props.unit && props.battle ? (
        <div className="sheet">
          {props.battle.source === "placeholder pending archive geocoding" ? <p className="badge">PLACEHOLDER</p> : null}
          <h3>{props.battle.name}</h3>
          <p className="lede">{formatDisplay(props.battle.date)}</p>
          <p>{props.battle.summary}</p>
          <p className="meta">Confidence: {confidenceText(props.battle.confidence)}</p>
          <p className="meta">Coordinates: {formatCoord(props.battle.lng, props.battle.lat)}</p>
          {props.taggedUnits.length > 0 ? (
            <section className="stops" aria-label="Tagged units">
              <h3>Tagged units</h3>
              <ol>
                {props.taggedUnits.map((unit) => (
                  <li key={unit.id}>
                    <button type="button" onClick={() => props.onSelectUnit(unit.id)}>
                      <span className="stop-date">{unit.name}</span>
                      <span className="stop-meta">{unit.abbr}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
          <p className="source">
            <span>Source</span>
            {props.battle.source}
          </p>
          <div className="action-row">
            <button type="button" onClick={props.onClear}>
              Close battle
            </button>
          </div>
        </div>
      ) : null}
      {!props.unit && !props.hub && !props.battle && !props.occupation ? (
        <div className="sheet">
          <p className="badge">OVERVIEW</p>
          <h3>{props.theater.label}</h3>
          <p className="lede">{formatDisplay(props.date)}</p>
          <p>{props.unitCount} units on the map for this date and the current filters.</p>
          <p className="meta">
            Zoom out below 6, or press War overview, for schematic country occupation from 1939 to 1945. Click a country fill for the sourced control row.
          </p>
          {props.front ? (
            <>
              <p>{props.front.label}</p>
              {props.front.polygon && props.front.polygon.length >= 4 ? (
                <p className="meta">Weekly front polygon for {formatDisplay(props.front.date)}.</p>
              ) : (
                <>
                  <p className="meta">
                    {props.front.date === props.date
                      ? "This is the front line keyed to the selected date."
                      : `The map holds the ${formatDisplay(props.front.date)} front line on this date. Keyed fronts are 6, 7, 10 and 13 June, then 8, 18 and 25 July, 1 and 25 August.`}
                  </p>
                  <p className="meta">
                    Control areas sit behind the front. Missing held-area polygons use an 80 km buffer (approximate control).
                    Counters sit on their side of the line. Zoom in to see which unit is fighting which.
                  </p>
                </>
              )}
              <p className="meta">Confidence: {confidenceText(props.front.confidence)}</p>
            </>
          ) : props.theater.frontCadence === "weekly" ? (
            <p>This theater is set up for weekly front polygons, not daily battalion pins.</p>
          ) : props.theater.id === "normandy" ? (
            <p>No placeholder front for this date. The first keyed Normandy front line is 6 June 1944.</p>
          ) : (
            <p>No front for this date.</p>
          )}
          <p>Select a unit to fly to it and draw its path from the first sample stop to this date. The side panel lists every dated stop.</p>
          <p className="meta">
            Zoom shows army groups and armies first, then corps, then divisions, then brigades and regiments, then
            battalions and companies. A selected unit stays on the map and draws its path. Overlapping markers of the
            same rank hide at theater zoom and cluster when you zoom in.
          </p>
          {props.front ? (
            <p className="source">
              <span>Source</span>
              {props.front.source}
            </p>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
