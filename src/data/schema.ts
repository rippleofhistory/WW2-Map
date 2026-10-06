/**
 * Empty JSON shape for a later archive file.
 * Each theater loads three arrays:
 *   public/data/{theater}/units.json
 *   public/data/{theater}/fronts.json
 *   public/data/{theater}/battles.json
 * theater: normandy | nw-europe | italy | eastern-front | burma | pacific | north-africa
 * An empty array is valid. The map says "Data coming soon" and the date slider still runs.
 * Do not invent coordinates. Leave the array empty until a source exists.
 * Missing or invalid Normandy files keep the embedded placeholder sample.
 *
 * Eastern Front and Burma use weekly front polygons, not daily battalion pins.
 * Their units.json and battles.json stay empty until a source exists.
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
 * Normandy and the other daily theaters keep allied/axis polylines:
 * {
 *   "id": "",
 *   "date": "YYYY-MM-DD",
 *   "theater": "normandy",
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
 *   "track": [{ "date": "YYYY-MM-DD", "lng": 0, "lat": 0, "note": "" }]
 * }
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
 * echelon: army | corps | division | brigade | regiment | battalion | company
 */
export const EMPTY_NORMANDY_JSON = `{
  "units": [],
  "fronts": [],
  "battles": [],
  "labels": []
}
`;
