/**
 * Empty JSON shape for a later archive file.
 * Each theater loads three arrays:
 *   public/data/{theater}/units.json
 *   public/data/{theater}/fronts.json
 *   public/data/{theater}/battles.json
 * War-spanning extra stops merge from public/data/world/units.json.
 * theater: normandy | nw-europe | italy | eastern-front | burma | pacific | north-africa
 * An empty array is valid. The map says "Data coming soon" when units, fronts,
 * and battles are all empty. The date slider still runs.
 * Do not invent coordinates. Leave the array empty until a source exists.
 * Missing or invalid Normandy files keep the embedded placeholder sample.
 *
 * Eastern Front and Burma use weekly front polygons, not daily battalion pins.
 * A named-commune allied/axis polyline may still paint. Do not invent a ring.
 * Campaign overview pins may live in battles.json without unit tracks.
 * A weekly front object uses "polygon" (a closed ring of at least four positions)
 * and omits allied/axis. The 0,0 values below are a paste template, not a location.
 *
 * {
 *   "id": "",
 *   "date": "YYYY-MM-DD",
 *   "theater": "eastern-front",
 *   "label": "",
 *   "source": "",
 *   "confidence": "low",
 *   "polygon": [[0, 0], [0, 0], [0, 0], [0, 0]]
 * }
 *
 * Normandy and the other daily theaters keep allied/axis polylines.
 * Optional sector (slug) and until (exclusive YYYY-MM-DD). Same sector: later
 * date replaces earlier. Distant sectors stay on the map together.
 * The player derives gold contact lines at runtime. Do not add a contact
 * field to the file.
 * {
 *   "id": "",
 *   "date": "YYYY-MM-DD",
 *   "theater": "normandy",
 *   "sector": "lodgement",
 *   "until": "YYYY-MM-DD",
 *   "label": "",
 *   "source": "",
 *   "confidence": "low",
 *   "allied": [[0, 0], [0, 0]],
 *   "axis": [[0, 0], [0, 0]]
 * }
 *
 * Unit (one track position object per dated location):
 * {
 *   "id": "",
 *   "name": "",
 *   "abbr": "",
 *   "nation": "",
 *   "side": "allied",
 *   "echelon": "division",
 *   "parent": "",
 *   "theater": "normandy",
 *   "source": "",
 *   "confidence": "low",
 *   "strength": 0.8,
 *   "track": [{ "date": "YYYY-MM-DD", "lng": 0, "lat": 0, "note": "", "theater": "normandy" }]
 * }
 * Optional strength is 0–1 (or 0–100 percent). Omit it when no archive figure exists.
 * Do not invent a strength value.
 *
 * War-global extra stops live in public/data/world/units.json and merge by id.
 * Same calendar date keeps the theater-folder row. Optional track.theater names
 * the camera frame when the pin sits outside the home theater, or outside every
 * frame (Montauban stays on the unit home theater when omitted).
 *
 * Battle:
 * {
 *   "id": "",
 *   "name": "",
 *   "theater": "normandy",
 *   "date": "YYYY-MM-DD",
 *   "lng": 0,
 *   "lat": 0,
 *   "zoom": 10,
 *   "summary": "",
 *   "source": "",
 *   "confidence": "low"
 * }
 *
 * side: allied | axis | soviet | japanese
 * echelon: army-group | army | corps | division | brigade | regiment | battalion | company
 */
export const EMPTY_NORMANDY_JSON = `{
  "units": [],
  "fronts": [],
  "battles": [],
  "labels": []
}
`;
