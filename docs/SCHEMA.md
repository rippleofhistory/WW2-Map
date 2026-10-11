# Normandy JSON schema

Files under `public/data/normandy/`.

## units.json

A JSON array of units. Not `{ "units": [...] }`.

```json
{
  "id": "easy-company-506",
  "name": "Easy Company, 506th PIR",
  "abbr": "E/506",
  "nation": "United States",
  "side": "allied",
  "echelon": "company",
  "parent": "506th PIR",
  "theater": "normandy",
  "source": "unit-level citation",
  "confidence": "medium",
  "featured": true,
  "track": [
    {
      "date": "1944-06-06",
      "place": "Brécourt Manor",
      "lng": -1.226111,
      "lat": 49.390056,
      "note": "What the source says for this day.",
      "source": "point-level citation",
      "confidence": "medium"
    }
  ]
}
```

`side`: `allied` | `axis` | `soviet` | `japanese`  
`echelon`: `army` | `corps` | `division` | `brigade` | `regiment` | `battalion` | `company`  
`confidence`: `high` | `medium` | `low`  
`lng` / `lat`: WGS84 numbers. JSON field order is `lng` then `lat`. A written pair `49.390056, -1.226111` is lat, lng.

A track point without `source` is dropped (no source, no pin). `note` is required text. One object per calendar date.

The player:

- draws the front whose date is `<=` the selected date (nearest previous)
- uses each unit’s last position on or before the selected date
- hides a unit before its first point
- badges **last reported** when the held point is older than the selected date (including a one-day gap, and when the gap is more than 3 days)
- does not interpolate a town for a missing date

## battles.json

Array. Optional `units` lists tagged unit ids. Villers-Bocage must list `4th-county-of-london-yeomanry` and `de-ss-pz-abt-101` only.

## fronts.json

Array. Daily theaters use `allied` and `axis` polylines of `[lng, lat]`. Weekly theaters use `polygon`.

## theaters.json

One object: `id`, `label`, `center`, `zoom`, `bounds` `[west, south, east, north]`, `start`, `end`, `frontCadence`, `disclaimer`. Bounds aim the default camera. Following a unit may fly outside them.

## world/occupation.json and world/regions.geojson

Zoom-out country fills. Not unit pins. `regions.geojson` is Natural Earth 110m with modern borders used as a schematic canvas. `occupation.json` is an array of states:

```json
{
  "id": "france",
  "name": "France",
  "codes": ["FRA"],
  "source": "Franco-German Armistice, 22 June 1940.",
  "confidence": "high",
  "track": [
    {
      "date": "1940-06-22",
      "side": "axis",
      "status": "occupied",
      "note": "Armistice. Occupied zone and Vichy.",
      "source": "Franco-German Armistice, 22 June 1940.",
      "confidence": "high"
    }
  ]
}
```

`side`: `allied` | `axis` | `soviet` | `japanese` | `neutral`  
`status`: `sovereign` | `occupied` | `puppet` | `cobelligerent` | `collapsed`

The player keeps the last sourced row on or before the selected date. Missing days do not invent a new control. Fills hide above zoom 6.25. Britain is Allied from 3 September 1939. The United States joins on 8 December 1941.

## WW2Hub unit references

`?unit=` accepts a map id or a WW2Hub unit id. Aliases live in `src/data/catalog.ts`. The map fetches `GET {VITE_HUB_URL}/api/map/units/:id` for the Hub path (battle dates and places, no coordinates). A Hub parent page may also `postMessage` `{ source: "ww2hub", type: "showUnit", unit, date }`. Pins stay in `units.json`. Hub dates without a track only move the slider and occupation fills.
