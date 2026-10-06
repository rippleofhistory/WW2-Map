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
