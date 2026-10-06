import type { Map as MapInstance } from "maplibre-gl";
import { cssVar, SIDE_FALLBACK } from "../lib/palette.ts";

function fillFor(element: Element): string {
  if (element.classList.contains("battle-marker") || element.classList.contains("cluster-marker")) {
    return cssVar(element, "--gold", "#f0d78c");
  }
  const color = getComputedStyle(element).color;
  return color && color !== "rgba(0, 0, 0, 0)" ? color : SIDE_FALLBACK.allied;
}

/** WebGL canvas plus the HTML unit and battle markers. Returns an error message, or null. */
export function exportMapPng(map: MapInstance, container: HTMLElement, date: string): string | null {
  const source = map.getCanvas();
  const out = document.createElement("canvas");
  out.width = source.width;
  out.height = source.height;
  const ctx = out.getContext("2d");
  if (!ctx) return "Could not open a canvas.";
  try {
    ctx.drawImage(source, 0, 0);
  } catch {
    return "The basemap blocked the image export.";
  }
  const ratio = source.width / Math.max(1, source.clientWidth);
  const mapRect = container.getBoundingClientRect();
  const markers = container.querySelectorAll(".unit-marker, .cluster-marker, .battle-marker");
  for (const marker of markers) {
    const rect = marker.getBoundingClientRect();
    const x = (rect.left - mapRect.left + rect.width / 2) * ratio;
    const y = (rect.top - mapRect.top + rect.height / 2) * ratio;
    const radius = Math.max(8, (rect.width / 2) * ratio * 0.72);
    ctx.beginPath();
    if (marker.classList.contains("battle-marker")) {
      ctx.moveTo(x, y - radius);
      ctx.lineTo(x + radius, y);
      ctx.lineTo(x, y + radius);
      ctx.lineTo(x - radius, y);
      ctx.closePath();
    } else {
      ctx.arc(x, y, radius, 0, Math.PI * 2);
    }
    ctx.fillStyle = "rgba(12, 16, 12, 0.9)";
    ctx.fill();
    ctx.lineWidth = 2 * ratio;
    ctx.strokeStyle = fillFor(marker);
    ctx.stroke();
    const label = marker.querySelector(".abbr")?.textContent ?? (marker.classList.contains("cluster-marker") ? marker.textContent : "");
    if (label) {
      ctx.fillStyle = "#f3efe2";
      ctx.font = `${Math.round(12 * ratio)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label.trim(), x, y);
    }
  }
  const link = document.createElement("a");
  link.href = out.toDataURL("image/png");
  link.download = `ww2hub-map-${date}.png`;
  link.click();
  return null;
}
