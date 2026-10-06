import { addDays, formatDisplay } from "../lib/dates.ts";
import { echelonLabel, formatCoord, sideLabel } from "../lib/format.ts";
import type { Placement } from "../lib/position.ts";
import type { Battle, Confidence, FrontLine, Theater, Unit, UnitPosition } from "../types.ts";

function confidenceText(value: Confidence | undefined): string {
  return value ?? "not set";
}

interface InspectorProps {
  open: boolean;
  date: string;
  theater: Theater;
  unit: Unit | null;
  placement: Placement | null;
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
                return (
                  <li key={`${point.date}:${point.lng}:${point.lat}`}>
                    <button
                      type="button"
                      data-stop={point.date}
                      data-reached={point.date <= props.date ? "1" : "0"}
                      aria-current={current ? "date" : undefined}
                      aria-label={`${formatDisplay(point.date)}. ${formatCoord(point.lng, point.lat)}. ${stopState(point, props.date, placement)}`}
                      onClick={() => props.onShowStop(point.date)}
                    >
                      <span className="stop-date">{formatDisplay(point.date)}</span>
                      <span className="stop-meta">
                        {point.place ? `${point.place} · ` : ""}
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
          <div className="action-row">
            <button type="button" aria-pressed={props.cameraLock} onClick={() => props.onLock(!props.cameraLock)}>
              {props.cameraLock ? "Camera locked" : "Lock camera"}
            </button>
            <button type="button" onClick={props.onClear}>
              Clear follow
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
      {!props.unit && !props.battle ? (
        <div className="sheet">
          <p className="badge">OVERVIEW</p>
          <h3>{props.theater.label}</h3>
          <p className="lede">{formatDisplay(props.date)}</p>
          <p>{props.unitCount} units on the map for this date and the current filters.</p>
          {props.front ? (
            <>
              <p>{props.front.label}</p>
              {props.front.polygon && props.front.polygon.length >= 4 ? (
                <p className="meta">Weekly front polygon for {formatDisplay(props.front.date)}.</p>
              ) : (
                <>
                  <p className="meta">
                    {props.front.date === props.date
                      ? "This is the schematic front keyed to the selected date."
                      : `The map holds the ${formatDisplay(props.front.date)} front on this date. Keyed fronts are 6, 7, 10 and 13 June.`}
                  </p>
                  <p className="meta">Blue dashed line: placeholder allied trace. Vermillion dashed line: placeholder axis trace.</p>
                </>
              )}
              <p className="meta">Confidence: {confidenceText(props.front.confidence)}</p>
            </>
          ) : props.theater.frontCadence === "weekly" ? (
            <p>This theater is set up for weekly front polygons, not daily battalion pins.</p>
          ) : props.theater.id === "normandy" ? (
            <p>No placeholder front for this date. The Normandy sample covers 6–13 June 1944.</p>
          ) : (
            <p>No front for this date.</p>
          )}
          <p>Select a unit to fly to it and draw its path from the first sample stop to this date. The side panel lists every dated stop.</p>
          <p className="meta">
            Divisions show at theater zoom. Regiments, battalions, and companies show after zoom 9. Below zoom 7 the markers
            cluster.
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
