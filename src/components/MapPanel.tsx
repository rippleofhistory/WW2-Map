import { useEffect, useRef } from "react";
import type { Basemap, EchelonCap, Layers } from "../types.ts";

const LAYER_ITEMS: readonly { key: keyof Layers; label: string }[] = [
  { key: "fronts", label: "Front line" },
  { key: "controlAreas", label: "Control areas" },
  { key: "battles", label: "Battles" },
  { key: "labels", label: "Historical labels" },
];

const ECHELON_CAPS: readonly { id: EchelonCap; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "army+", label: "Army+" },
  { id: "division+", label: "Division+" },
  { id: "all", label: "All" },
];

const BASEMAPS: readonly { id: Basemap; label: string }[] = [
  { id: "terrain", label: "Terrain" },
  { id: "satellite", label: "Satellite" },
  { id: "dark", label: "Dark" },
];

interface MapPanelProps {
  open: boolean;
  layers: Layers;
  echelonCap: EchelonCap;
  basemap: Basemap;
  onToggle: () => void;
  onClose: () => void;
  onToggleLayer: (layer: keyof Layers) => void;
  onEchelonCap: (cap: EchelonCap) => void;
  onBasemap: (basemap: Basemap) => void;
}

export function MapPanel(props: MapPanelProps) {
  const dockRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(props.onClose);

  useEffect(() => {
    onCloseRef.current = props.onClose;
  }, [props.onClose]);

  useEffect(() => {
    if (!props.open) return;
    const onPointer = (event: PointerEvent) => {
      const node = dockRef.current;
      if (!(event.target instanceof Node) || !node?.contains(event.target)) onCloseRef.current();
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [props.open]);

  return (
    <div ref={dockRef} className="map-dock">
      <button
        type="button"
        className="map-menu-toggle"
        aria-expanded={props.open}
        aria-controls="map-menu"
        onClick={props.onToggle}
      >
        Map
      </button>
      <div
        id="map-menu"
        className="map-menu"
        hidden={!props.open}
        role="dialog"
        aria-label="Map layers"
        data-basemap={props.basemap}
        data-echelon-cap={props.echelonCap}
      >
        <div className="layers" role="group" aria-label="Layers">
          <label className="layer">
            <input type="checkbox" checked={props.layers.units} onChange={() => props.onToggleLayer("units")} />
            Units
          </label>
        </div>
        <div className="map-menu-group" role="radiogroup" aria-label="Echelon override">
          {ECHELON_CAPS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={props.echelonCap === item.id}
              onClick={() => props.onEchelonCap(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="layers" role="group" aria-label="Overlays">
          {LAYER_ITEMS.map((item) => (
            <label key={item.key} className="layer">
              <input type="checkbox" checked={props.layers[item.key]} onChange={() => props.onToggleLayer(item.key)} />
              {item.label}
            </label>
          ))}
        </div>
        <div className="map-menu-group" role="radiogroup" aria-label="Basemap">
          {BASEMAPS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={props.basemap === item.id}
              onClick={() => props.onBasemap(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
