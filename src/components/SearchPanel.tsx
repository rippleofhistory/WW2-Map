import { useRef } from "react";
import type { KeyboardEvent } from "react";
import { echelonLabel, echelonMark, sideLabel } from "../lib/format.ts";
import type { Battle, Echelon, Filters, Side, Unit } from "../types.ts";

const SIDES = ["all", "allied", "axis", "soviet", "japanese"] as const;
const ECHELONS = ["all", "army", "corps", "division", "brigade", "regiment", "battalion", "company"] as const;

interface SearchPanelProps {
  open: boolean;
  query: string;
  filters: Filters;
  nations: readonly string[];
  units: readonly Unit[];
  battles: readonly Battle[];
  selectedUnitId: string | null;
  selectedBattleId: string | null;
  selectedHidden: boolean;
  onQuery: (query: string) => void;
  onSide: (side: Side | "all") => void;
  onNation: (nation: string) => void;
  onEchelon: (echelon: Echelon | "all") => void;
  onResetFilters: () => void;
  onSelectUnit: (id: string) => void;
  onSelectBattle: (id: string) => void;
  onClose: () => void;
  alliedPresent: readonly Unit[];
  germanPresent: readonly Unit[];
  featured: readonly Unit[];
}

function isSide(value: string): value is Side | "all" {
  return (SIDES as readonly string[]).includes(value);
}

function isEchelon(value: string): value is Echelon | "all" {
  return (ECHELONS as readonly string[]).includes(value);
}

export function SearchPanel(props: SearchPanelProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const focusRow = (index: number) => {
    const buttons = listRef.current?.querySelectorAll("button");
    const button = buttons?.[index];
    if (button instanceof HTMLButtonElement) button.focus();
  };

  const onSearchKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusRow(0);
    } else if (event.key === "Enter" && props.units[0]) {
      event.preventDefault();
      props.onSelectUnit(props.units[0].id);
    }
  };

  const onRowKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusRow(index + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (index === 0) document.getElementById("unit-search")?.focus();
      else focusRow(index - 1);
    }
  };

  return (
    <aside id="search" className="panel panel-left" hidden={!props.open} aria-label="Search and filters">
      <div className="panel-head">
        <h2>Units</h2>
        <button type="button" className="panel-close" onClick={props.onClose}>
          Close
        </button>
      </div>
      <label className="field" htmlFor="unit-search">
        <span>Search</span>
        <input
          id="unit-search"
          type="search"
          placeholder="Name, nation, formation"
          value={props.query}
          autoComplete="off"
          onChange={(event) => props.onQuery(event.target.value)}
          onKeyDown={onSearchKey}
        />
      </label>
      <div className="filter-grid">
        <label className="field">
          <span>Side</span>
          <select
            value={props.filters.side}
            onChange={(event) => {
              if (isSide(event.target.value)) props.onSide(event.target.value);
            }}
          >
            <option value="all">All sides</option>
            <option value="allied">Allied</option>
            <option value="axis">Axis</option>
            <option value="soviet">Soviet</option>
            <option value="japanese">Japanese</option>
          </select>
        </label>
        <label className="field">
          <span>Nation</span>
          <select value={props.filters.nation} onChange={(event) => props.onNation(event.target.value)}>
            <option value="all">All nations</option>
            {props.nations.map((nation) => (
              <option key={nation} value={nation}>
                {nation}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Echelon</span>
          <select
            value={props.filters.echelon}
            onChange={(event) => {
              if (isEchelon(event.target.value)) props.onEchelon(event.target.value);
            }}
          >
            {ECHELONS.map((echelon) => (
              <option key={echelon} value={echelon}>
                {echelon === "all" ? "All echelons" : echelonLabel(echelon)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="quick-filters" role="group" aria-label="Echelon shortcuts">
        <button type="button" aria-pressed={props.filters.echelon === "all"} onClick={() => props.onEchelon("all")}>
          All echelons
        </button>
        <button type="button" aria-pressed={props.filters.echelon === "division"} onClick={() => props.onEchelon("division")}>
          Division level
        </button>
      </div>
      {props.featured.length > 0 ? (
        <div className="featured-list" aria-label="Featured tracks">
          <h2 className="section-title">Featured tracks</h2>
          {props.featured.map((unit) => (
            <button
              key={unit.id}
              type="button"
              className={unit.id === props.selectedUnitId ? "unit-row selected" : "unit-row"}
              aria-pressed={unit.id === props.selectedUnitId}
              onClick={() => props.onSelectUnit(unit.id)}
            >
              <span className={`swatch side-${unit.side}`} aria-hidden="true">
                {echelonMark(unit.echelon)}
              </span>
              <span>
                <span className="unit-name">{unit.name}</span>
                <span className="unit-meta">
                  {sideLabel(unit.side)} · {unit.nation} · {echelonLabel(unit.echelon)}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
      {props.selectedHidden ? (
        <p className="filter-note">
          The followed unit is hidden by these filters. The map still draws it.
          <button type="button" onClick={props.onResetFilters}>
            Reset filters
          </button>
        </p>
      ) : null}
      <div ref={listRef} className="unit-list" aria-label="Units in this theater">
        {props.units.length === 0 ? <p className="empty-copy">No units match.</p> : null}
        {props.units.map((unit, index) => (
          <button
            key={unit.id}
            type="button"
            className={unit.id === props.selectedUnitId ? "unit-row selected" : "unit-row"}
            aria-pressed={unit.id === props.selectedUnitId}
            onClick={() => props.onSelectUnit(unit.id)}
            onKeyDown={(event) => onRowKey(event, index)}
          >
            <span className={`swatch side-${unit.side}`} aria-hidden="true">
              {echelonMark(unit.echelon)}
            </span>
            <span>
              <span className="unit-name">{unit.name}</span>
              <span className="unit-meta">
                {sideLabel(unit.side)} · {unit.nation} · {echelonLabel(unit.echelon)}
              </span>
            </span>
          </button>
        ))}
      </div>
      <details className="oob" open>
        <summary>Order of battle</summary>
        <p className="unit-meta">Formations with a sample position on this date.</p>
        <h3>Allied</h3>
        {props.alliedPresent.length === 0 ? <p className="empty-copy">None in the sample.</p> : null}
        <ul>
          {props.alliedPresent.map((unit) => (
            <li key={unit.id}>
              <button type="button" onClick={() => props.onSelectUnit(unit.id)}>
                {unit.name}
                <span>{unit.nation}</span>
              </button>
            </li>
          ))}
        </ul>
        <h3>German</h3>
        {props.germanPresent.length === 0 ? <p className="empty-copy">None in the sample.</p> : null}
        <ul>
          {props.germanPresent.map((unit) => (
            <li key={unit.id}>
              <button type="button" onClick={() => props.onSelectUnit(unit.id)}>
                {unit.name}
                <span>{unit.nation}</span>
              </button>
            </li>
          ))}
        </ul>
      </details>
      <h2 className="section-title">Battles</h2>
      <div className="battle-list" aria-label="Battles in this theater">
        {props.battles.length === 0 ? <p className="empty-copy">No battles in this theater sample.</p> : null}
        {props.battles.map((battle) => (
          <button
            key={battle.id}
            type="button"
            className={battle.id === props.selectedBattleId ? "battle-row selected" : "battle-row"}
            aria-pressed={battle.id === props.selectedBattleId}
            onClick={() => props.onSelectBattle(battle.id)}
          >
            <span className="battle-name">{battle.name}</span>
            <span className="unit-meta">{battle.date}</span>
          </button>
        ))}
      </div>
      <ul className="legend" aria-label="Marker colours">
        <li><i className="dot side-allied" /> Allied</li>
        <li><i className="dot side-axis" /> Axis</li>
        <li><i className="dot side-soviet" /> Soviet</li>
        <li><i className="dot side-japanese" /> Japanese</li>
      </ul>
    </aside>
  );
}
