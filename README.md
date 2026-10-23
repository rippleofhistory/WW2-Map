# WW2Hub Map

Interactive Second World War situation map for [WW2Hub.net](https://www.ww2hub.net).

The loaded situation pack is Normandy, 6–13 June 1944, in `public/data/normandy/`. War-spanning tracks merge from `public/data/world/units.json` so one Hub id can be followed across theaters. Featured tracks include Easy Company, Sherwood Rangers Yeomanry, 2nd SS Das Reich, and German 4th Army. Encoding rules are in `SAMPLE_DATA.md`, `docs/SCHEMA.md`, and `docs/RESEARCH_CHECKLIST.md`.

```bash
npm install
npm run dev
```

The dev server is http://127.0.0.1:5199 so it does not collide with WW2Hub on port 5173.

Deep link:

```text
?theater=normandy&date=1944-06-06&unit=easy-company-506&play=1
```

WW2Hub.net unit pages embed this map with `unit` set to the Hub unit id and `date` set to a battle start. Hub ids such as `us-101st` resolve to a sourced track when one exists. Any other Hub unit still opens: the inspector lists that unit’s dated path, and country occupation shows who held the territory. No pin is drawn without a source. Set `VITE_HUB_URL` (local default `http://127.0.0.1:5173`, production `https://www.ww2hub.net`). Hub sets `NEXT_PUBLIC_MAP_URL` to this origin.

The page fills its frame. Give an embedding iframe a height.

A **Map** button in the top-right opens layers (units with Auto / Army+ / Division+ / All, front line, control areas, battles, historical labels) and the Terrain / Satellite / Dark basemap. Search stays top-left. The timeline stays at the bottom. Zoom and compass sit bottom-right. Keyboard `M` hides the side panels and campaign rails; Escape brings them back.

## Embed

The full app is `/`. The widget is `/embed`. Editors build the iframe at `/snippet`.

`/embed` accepts `theater`, `date`, `unit`, `play`, `battles`, and `hidechrome=1`. `hidechrome=1` keeps only the timeline and search. `battles=0` hides battle markers. `battles=d-day` opens that battle. A comma-separated list limits the battle list to those ids.

The widget posts to the parent page:

```js
{ source: "ww2hub-map", type: "dateChange", date, theater, playing }
{ source: "ww2hub-map", type: "unitSelect", unit, name, date, theater }
```

`unit` is the unit id, or null when the selection is cleared. Use an iframe at `width:100%;height:70vh`. The map resizes with that frame. Add `view=globe` to open the globe.

## Globe

The map opens in 2D. `?view=globe` loads a CesiumJS globe and keeps the same date, units, and playback. MapLibre stays the default because it is faster on phones. The Cesium code loads only after Globe is opened. The globe does not use Google Earth or a Cesium ion token. Dark uses CARTO OpenStreetMap tiles; Terrain and Satellite use Esri raster tiles. No new coordinates are added.

The Normandy campaign player runs from 6 June 1944 to 31 August 1944. Preset jumps are D-Day, Carentan, Epsom, Charnwood, Goodwood, Cobra, and Falaise. Charnwood, Goodwood, and Cobra open Overlord commune markers (Caen, Saint-Lô). Epsom has no named commune in that article. The Falaise preset is 12 August; the town pin is 16 August.

Each theater is a module with a camera frame, a published start and end, a default zoom, and three files under `public/data/{theater}/`: `units.json`, `fronts.json`, and `battles.json`. Theaters are normandy, nw-europe, italy, eastern-front, burma, pacific, and north-africa. The map says “Data coming soon” only when units, fronts, and battles are all empty. The date slider still runs across 1939–1945. Following a unit switches the camera frame to the theater of its current stop. Eastern Front and Burma are set up for weekly front polygons; a named-commune polyline may still paint. Do not invent a ring.

The Campaigns rail has one published window per major campaign from Poland (1939) through Tokyo Bay (1945). A click sets the theater, starts on the first day, plays through the last day, and flies to a sourced named-place overview pin. That pin is not a unit track. Units and fronts come later, campaign by campaign. Overlord reuses the D-Day pin and keeps the commune pins through Rouen on 30 August. Pearl Harbor and Midway sit west of the default Pacific camera frame; the campaign click still flies there.

The timeline marks published operations with named ticks. Overlord, Cobra, and Falaise stay labeled. Cobra is 25 July 1944 and Falaise is 12 August 1944. Cobra opens the Saint-Lô marker. Other ticks are the campaign start dates already in the Campaigns rail.

Clicking a unit flies the camera to its sample position on the current date and draws the path from its first sample stop through that date. The inspector lists every dated stop. Easy Company’s first stop is 6 June 1944. Stops after the current date stay in the list and are not drawn. Last-reported counters stay at the last sourced town until a newer battle line is out of reach, then they drop. No new coordinates are added.

Compare opens two maps of the same theater. The left date is the timeline. The right date starts at the other end of the 6–13 June 1944 sample and can be scrubbed on its own. Pan and zoom stay linked. Compare uses the 2D map. Opening the globe closes Compare. The address uses `compare=YYYY-MM-DD`. No new coordinates are added.

Side colours are colour-blind safe: Allied blue, Axis vermillion, Soviet purple with a star, Japanese amber. Contrast in the top bar raises the contrast of the chrome and those colours. The address uses `contrast=1`. No new coordinates are added.

## Add a unit

Edit `public/data/normandy/units.json` for Normandy stops, or `public/data/world/units.json` for extra dates on the same id. Each unit has one `track` array. Put one position object in `track` for each dated location. Do not invent a coordinate. Leave the unit out until you have a source.

For Sherwood Rangers Yeomanry, follow `SAMPLE_DATA.md` and `docs/RESEARCH_CHECKLIST.md`. No source, no pin. Do not invent extra dates.

```json
{
  "id": "example-unit",
  "name": "Example Unit",
  "abbr": "EX",
  "nation": "United Kingdom",
  "side": "allied",
  "echelon": "battalion",
  "parent": "Parent formation",
  "theater": "normandy",
  "source": "archive reference",
  "confidence": "low",
  "track": [
    {
      "date": "1944-06-06",
      "lng": 0,
      "lat": 0,
      "note": "What the source says for this day."
    }
  ]
}
```

`confidence` is `high`, `medium`, or `low`. `side` is `allied`, `axis`, `soviet`, or `japanese`. `echelon` is `army`, `corps`, `division`, `brigade`, `regiment`, `battalion`, or `company`.

Fronts for a daily theater go in `fronts.json` as allied and axis polylines. The map draws one gold contact between those traces, with side fills and unit counters posted on the line. Battles go in `battles.json`. For Eastern Front or Burma, a front object uses `polygon` (a closed ring of at least four positions) and leaves out the polylines. The paste template is in `src/data/schema.ts`. A `0, 0` pair in that comment is not a location.

Reload the map after saving. If any of `public/data/normandy/units.json`, `fronts.json`, or `battles.json` is missing or invalid, the map says so and keeps the embedded placeholder sample. `public/data/normandy.json` is the earlier combined file and is not loaded.
