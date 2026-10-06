import { useState, type KeyboardEvent } from "react";
import { THEATERS } from "../data/theaters.ts";
import type { Layers, MapView, TheaterId } from "../types.ts";

const LAYER_ITEMS: readonly { key: keyof Layers; label: string }[] = [
  { key: "fronts", label: "Front lines" },
  { key: "units", label: "Units" },
  { key: "battles", label: "Battles" },
  { key: "labels", label: "Historical labels" },
  { key: "modernBasemap", label: "Modern basemap" },
];

interface TopBarProps {
  theater: TheaterId;
  mode: string;
  layers: Layers;
  leftOpen: boolean;
  rightOpen: boolean;
  onTheater: (id: TheaterId) => void;
  onToggleLayer: (layer: keyof Layers) => void;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onExport: () => void;
  exportNote: string;
  showBrand: boolean;
  showEmbedLink: boolean;
  view: MapView;
  onView: (view: MapView) => void;
  comparing: boolean;
  onToggleCompare: () => void;
  contrast: boolean;
  onToggleContrast: () => void;
}

function copyLink(link: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(link).catch(() => copyWithSelection(link));
  }
  return copyWithSelection(link);
}

function copyWithSelection(link: string): Promise<void> {
  const input = document.createElement("textarea");
  input.value = link;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.left = "-999px";
  document.body.append(input);
  input.select();
  const copied = document.execCommand("copy");
  input.remove();
  return copied ? Promise.resolve() : Promise.reject(new Error("copy failed"));
}

function ShareButton() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="share-button"
      aria-live="polite"
      onClick={() => {
        copyLink(window.location.href)
          .then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          })
          .catch(() => setCopied(false));
      }}
    >
      {copied ? "Copied" : "Share"}
    </button>
  );
}

export function TopBar(props: TopBarProps) {
  const onTheaterKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "ArrowDown" && event.key !== "ArrowUp") {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const next = THEATERS[(index + step + THEATERS.length) % THEATERS.length];
    if (next) props.onTheater(next.id);
  };

  return (
    <header className="topbar">
      <div className="brand-row">
        {props.showBrand ? (
          <a className="brand" href="https://www.ww2hub.net" target="_blank" rel="noreferrer">
            <span className="brand-mark" aria-hidden="true">
              W
            </span>
            <span>
              <span className="brand-name">WW2Hub.net</span>
              <span className="brand-sub">Situation map</span>
            </span>
          </a>
        ) : null}
        <p className="mode-pill">{props.mode}</p>
        <div
          className="view-toggle"
          role="radiogroup"
          aria-label="Map view"
          onKeyDown={(event) => {
            if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
            event.preventDefault();
            event.stopPropagation();
            props.onView(props.view === "2d" ? "globe" : "2d");
          }}
        >
          <button type="button" role="radio" aria-checked={props.view === "2d"} onClick={() => props.onView("2d")}>
            2D
          </button>
          <button type="button" role="radio" aria-checked={props.view === "globe"} onClick={() => props.onView("globe")}>
            Globe
          </button>
        </div>
        <button type="button" className="compare-toggle" aria-pressed={props.comparing} onClick={props.onToggleCompare}>
          Compare
        </button>
        <button
          type="button"
          className="contrast-toggle"
          aria-pressed={props.contrast}
          aria-label="High contrast"
          onClick={props.onToggleContrast}
        >
          Contrast
        </button>
        {props.showBrand ? (
          <button type="button" className="share-button" onClick={props.onExport}>
            Export PNG
          </button>
        ) : null}
        {props.showBrand ? <ShareButton /> : null}
        {props.showEmbedLink ? (
          <a className="share-button" href="/snippet">
            Embed
          </a>
        ) : null}
        {props.showBrand && props.exportNote ? <p className="export-note">{props.exportNote}</p> : null}
        <div className="mobile-toggles">
          <button type="button" aria-expanded={props.leftOpen} aria-controls="search" onClick={props.onToggleLeft}>
            Units
          </button>
          <button type="button" aria-expanded={props.rightOpen} aria-controls="inspector" onClick={props.onToggleRight}>
            Inspector
          </button>
        </div>
      </div>
      <div className="theater-row" role="radiogroup" aria-label="Theater">
        {THEATERS.map((theater, index) => (
          <button
            key={theater.id}
            type="button"
            role="radio"
            aria-checked={theater.id === props.theater}
            className="theater"
            onClick={() => props.onTheater(theater.id)}
            onKeyDown={(event) => onTheaterKey(event, index)}
          >
            {theater.label}
          </button>
        ))}
      </div>
      <div className="layers" role="group" aria-label="Layers">
        {LAYER_ITEMS.map((item) => (
          <label key={item.key} className="layer">
            <input type="checkbox" checked={props.layers[item.key]} onChange={() => props.onToggleLayer(item.key)} />
            {item.label}
          </label>
        ))}
      </div>
    </header>
  );
}
