import { useEffect, useMemo, useState } from "react";
import { THEATERS } from "../data/theaters.ts";
import { WAR_END, WAR_START, isValidWarDate } from "../lib/dates.ts";
import { MAP_MESSAGE_SOURCE, embedSrc, iframeSnippet } from "../lib/embed.ts";

const LISTENER = `window.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.source !== "${MAP_MESSAGE_SOURCE}") return;
  if (data.type === "dateChange") {
    // data.date is YYYY-MM-DD. data.theater is the map theater.
  }
  if (data.type === "unitSelect") {
    // data.unit is the unit id, or null. data.name is the unit name.
  }
});`;

export function SnippetPage() {
  const [theater, setTheater] = useState("normandy");
  const [date, setDate] = useState("1944-06-06");
  const [unit, setUnit] = useState("");
  const [play, setPlay] = useState(false);
  const [battles, setBattles] = useState("");
  const [hideChrome, setHideChrome] = useState(true);
  const [globe, setGlobe] = useState(false);
  const [copied, setCopied] = useState(false);
  const [heardDate, setHeardDate] = useState("");
  const [heardUnit, setHeardUnit] = useState("");

  const safeDate = isValidWarDate(date) ? date : "1944-06-06";
  const src = useMemo(
    () => embedSrc(window.location.origin, { theater, date: safeDate, unit, play, battles, hideChrome, globe }),
    [theater, safeDate, unit, play, battles, hideChrome, globe],
  );
  const snippet = iframeSnippet(src);

  useEffect(() => {
    document.title = "Embed snippet · WW2Hub Map";
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { source?: string; type?: string; date?: string; unit?: string | null } | null;
      if (!data || data.source !== MAP_MESSAGE_SOURCE) return;
      if (data.type === "dateChange" && typeof data.date === "string") setHeardDate(data.date);
      if (data.type === "unitSelect") setHeardUnit(typeof data.unit === "string" ? data.unit : "");
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <main className="snippet-page">
      <p className="snippet-kicker">WW2Hub editors</p>
      <h1>Embed the map</h1>
      <p>The snippet is an iframe for an article page. It does not add coordinates.</p>
      <form
        className="snippet-form"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <label>
          Theater
          <select value={theater} onChange={(event) => setTheater(event.target.value)}>
            {THEATERS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Date
          <input type="date" min={WAR_START} max={WAR_END} value={safeDate} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label>
          Unit id
          <input value={unit} placeholder="easy-company-506" onChange={(event) => setUnit(event.target.value)} />
        </label>
        <label>
          Battles
          <input value={battles} placeholder="1, 0, or d-day" onChange={(event) => setBattles(event.target.value)} />
        </label>
        <label className="snippet-check">
          <input type="checkbox" checked={play} onChange={(event) => setPlay(event.target.checked)} />
          Play
        </label>
        <label className="snippet-check">
          <input type="checkbox" checked={hideChrome} onChange={(event) => setHideChrome(event.target.checked)} />
          Hide chrome (timeline and search only)
        </label>
        <label className="snippet-check">
          <input type="checkbox" checked={globe} onChange={(event) => setGlobe(event.target.checked)} />
          Globe
        </label>
      </form>
      <div className="snippet-output">
        <label htmlFor="embed-snippet">Iframe</label>
        <textarea id="embed-snippet" readOnly value={snippet} rows={8} />
        <button
          type="button"
          onClick={() => {
            const write = navigator.clipboard?.writeText(snippet) ?? Promise.reject(new Error("copy failed"));
            write.then(
              () => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1600);
              },
              () => setCopied(false),
            );
          }}
        >
          {copied ? "Copied" : "Copy iframe"}
        </button>
      </div>
      <h2>Parent page messages</h2>
      <pre>{LISTENER}</pre>
      <p data-parent-date={heardDate}>Parent heard date {heardDate || "—"}</p>
      <p data-parent-unit={heardUnit}>Parent heard unit {heardUnit || "—"}</p>
      <h2>Preview</h2>
      <iframe title="WW2Hub Interactive Map" src={src} style={{ width: "100%", height: "70vh", border: 0 }} allow="fullscreen" />
      <p>
        <a href="/">Open the full map</a>
      </p>
    </main>
  );
}
