export type AppRoute = "app" | "embed" | "snippet";

/** "on" shows battles. "off" hides them. A list opens those battle ids. */
export type BattleParam = "on" | "off" | readonly string[];

export interface EmbedOptions {
  hideChrome: boolean;
  battles: BattleParam;
}

export const MAP_MESSAGE_SOURCE = "ww2hub-map";

export function readRoute(pathname: string): AppRoute {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/embed") return "embed";
  if (path === "/snippet") return "snippet";
  return "app";
}

export function readEmbedOptions(search: string): EmbedOptions {
  const params = new URLSearchParams(search);
  const hideChrome = params.get("hidechrome") === "1";
  const raw = (params.get("battles") ?? "").trim().toLowerCase();
  if (raw === "" || raw === "1" || raw === "true" || raw === "on") return { hideChrome, battles: "on" };
  if (raw === "0" || raw === "false" || raw === "off") return { hideChrome, battles: "off" };
  const ids = (params.get("battles") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return { hideChrome, battles: ids };
}

export function postMapMessage(message: Record<string, unknown>): void {
  if (window.parent === window) return;
  window.parent.postMessage({ source: MAP_MESSAGE_SOURCE, ...message }, "*");
}

export function embedSrc(
  origin: string,
  fields: { theater: string; date: string; unit: string; play: boolean; battles: string; hideChrome: boolean; globe: boolean },
): string {
  const params = new URLSearchParams();
  params.set("theater", fields.theater);
  params.set("date", fields.date);
  if (fields.unit.trim()) params.set("unit", fields.unit.trim());
  if (fields.play) params.set("play", "1");
  if (fields.battles.trim()) params.set("battles", fields.battles.trim());
  if (fields.hideChrome) params.set("hidechrome", "1");
  if (fields.globe) params.set("view", "globe");
  return `${origin}/embed?${params.toString()}`;
}

export function iframeSnippet(src: string): string {
  return `<iframe
  title="WW2Hub Interactive Map"
  src="${src}"
  style="width:100%;height:70vh;border:0;"
  allow="fullscreen"
  loading="lazy"></iframe>`;
}
