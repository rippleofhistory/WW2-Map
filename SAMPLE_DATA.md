# Encoding Sherwood Rangers Yeomanry from war diaries

This is the encoding recipe for daily positions of the Sherwood Rangers Yeomanry (`id`: `sherwood-rangers-yeomanry`). `?unit=sherwood-rangers` still opens it. It matches the parser in `src/data/parse.ts` and the player in `src/lib/position.ts`. Do not invent a coordinate, a grid, a parent formation, or a diary quote. No source, no pin.

The live starter pack is in `public/data/normandy/units.json`. Research steps are in `docs/RESEARCH_CHECKLIST.md`.

## File

Edit `public/data/normandy/units.json`. That file is a JSON **array of units**, not an object with a `units` key.

`public/data/normandy.json` is not loaded. Fronts stay in `fronts.json`. Battles stay in `battles.json`. Leave those files alone when you only have unit diaries.

North Africa days belong in `public/data/north-africa/units.json` with `"theater": "north-africa"`. Do not put 1940–43 diary days into the Normandy file.

Reload the map after saving. If `units.json` is missing, invalid, or any one unit fails to parse, Normandy shows a banner and keeps the embedded placeholder sample. A trailing comma, a string where a number belongs, or an empty `note` rejects the whole file.

## Keep this identity

Use the existing object. Do not add a second Sherwood Rangers unit. Deep links use `?unit=sherwood-rangers-yeomanry` or the alias `?unit=sherwood-rangers`.

| Field | Value | Why |
|---|---|---|
| `id` | `sherwood-rangers-yeomanry` | Stable. `sherwood-rangers` is a URL alias. |
| `name` | `Sherwood Rangers Yeomanry` | Display name. |
| `abbr` | `SRY` | Marker label. |
| `nation` | `United Kingdom` | Filter value. |
| `side` | `allied` | Marker colour. Allowed: `allied`, `axis`, `soviet`, `japanese`. |
| `echelon` | `regiment` | Yeomanry regiment. Allowed: `army`, `corps`, `division`, `brigade`, `regiment`, `battalion`, `company`. |
| `theater` | `normandy` | Must match this file. |
| `parent` | diary heading, or `Not in this sample` | Copy the formation named on the diary cover or daily heading. Do not guess a corps. |
| `source` | archive citation | Unit-level. Replace `placeholder pending archive geocoding` once the track is from a diary. |
| `confidence` | `high`, `medium`, or `low` | Optional. A bad value rejects the file. Omit it rather than guess. |

`source` and `note` must be non-empty strings. `track` must be a non-empty array.

## Spreadsheet first

Work off the map until the row has a sourced coordinate.

```text
date        place_in_diary    map_sheet    grid    lng    lat    note    source    confidence
1944-06-06
```

1. Open the Sherwood Rangers Yeomanry war diary for that month at The National Archives. Northwest Europe 1944–45 diaries sit in record series **WO 171**. Look the piece up in Discovery. Do not type a catalogue number you have not seen.
2. For each calendar day the diary reports a location, copy the date, the place-name, the map sheet if given, and the grid if given, into the spreadsheet. Quote the diary in `note` later. Skip a day when the diary is silent on location.
3. Geocode only from that row. Convert a British military grid with the sheet named in the diary. A modern pin on a village of the same name is not a source.
4. Only then fill `lng` and `lat` as WGS84 numbers.
5. Paste finished rows into `track`.

`place`, `map_sheet`, and `grid` are spreadsheet columns. They are **not** JSON fields. The map reads `date`, `lng`, `lat`, and `note`.

## One track object per dated location

```json
{
  "date": "1944-06-06",
  "lng": -0.55,
  "lat": 49.35,
  "note": "PLACEHOLDER note for Sherwood Rangers Yeomanry on 1944-06-06. Sample track point only. Not an archive diary entry."
}
```

That object is the current 6 June sample. Replace `lng`, `lat`, and `note` on that day when the diary for 6 June 1944 has been geocoded. Leave the object in place until then. Do not paste `0, 0`.

Rules the parser and player actually use:

- `date` is `YYYY-MM-DD` and must fall on or between 1939-09-01 and 1945-09-02. Invalid calendar dates (`1944-06-31`) reject the file.
- `lng` and `lat` are JSON numbers, not strings. `lng` is −180 to 180. `lat` is −90 to 90.
- `note` is a non-empty string. Put the diary place-name, the grid if any, and a short what-happened line here.
- One object per calendar date. The player takes the first point for a date after sorting. Two objects with the same date hide one of them.
- If the regiment moved twice in a day, encode the location the diary treats as that day’s position (night leaguer, harbour, or the last named place). Do not invent a midpoint between two diary places.
- Sort order in the file does not matter. The parser sorts by `date`.
- A day with no object is a gap. Do not invent a coordinate for a silent day.

## How Play treats gaps

The player does **not** interpolate across a missing day.

- On a date that has a point, the marker sits on that point and is marked **reported**.
- During Play, it glides in a straight line only when **the next calendar day also has a point**. 7 June glides toward 8 June only if both 7 June and 8 June exist in `track`.
- If 8 June is missing, 7 June stays put through 8 June and shows **last reported**.
- Before the first track date, the unit is hidden.
- After the last track date, the unit holds the last point as **last reported** until a newer schematic front is out of reach. No later coordinate is invented.

So: copy days the diary locates; omit days it does not. A week of silence in the diary should be a week of gaps in `track`.

If the diary says they remained at yesterday’s place, you may repeat yesterday’s `lng`/`lat` because that repeat is sourced. That is not interpolation.

## Confidence

| Value | Use when |
|---|---|
| `high` | Diary gives a map sheet and grid, converted on that sheet. |
| `medium` | Diary names a place, geocoded to that place with no grid. |
| `low` | Area only, or the point is still a placeholder. |

The sample uses `"confidence": "low"` on the unit. You may keep that until the track is archive-geocoded. Per-point confidence is not a field; the unit has one `confidence`.

## Source strings

Unit `source` is one string for the whole unit. Example shape after you have the piece in hand:

```text
TNA WO 171/<piece> Sherwood Rangers Yeomanry war diary, <month year>
```

Write the piece number you actually opened. Until then keep `placeholder pending archive geocoding`.

Every sample feature on the map still uses that placeholder string. When you replace SRY coordinates, change that unit’s `source`. Do not change Easy Company or the fronts unless those have sources too.

## Finished unit shape

After a sourced day exists, the object looks like this. The numbers below are still the **current placeholders**. Swap them for diary geocodes. They are not archive positions.

```json
{
  "id": "sherwood-rangers",
  "name": "Sherwood Rangers Yeomanry",
  "abbr": "SRY",
  "nation": "United Kingdom",
  "side": "allied",
  "echelon": "regiment",
  "parent": "Not in this sample",
  "theater": "normandy",
  "source": "placeholder pending archive geocoding",
  "confidence": "low",
  "track": [
    {
      "date": "1944-06-06",
      "lng": -0.55,
      "lat": 49.35,
      "note": "PLACEHOLDER note for Sherwood Rangers Yeomanry on 1944-06-06. Sample track point only. Not an archive diary entry."
    }
  ]
}
```

A sourced `note` should read like: place-name from the diary, grid if present, one sentence of what the entry says for that day, then the citation. Do not fill that sentence until you have the page.

Keep the other five Normandy units in the array. Replacing only the SRY `track` is enough.

## Check on the map

1. Save `public/data/normandy/units.json`.
2. Reload http://127.0.0.1:5199/?theater=normandy&date=1944-06-06&unit=sherwood-rangers
3. The inspector lists every `track` date. Stops after the current date stay in the list and are not drawn on the path.
4. Scrub to a gap day: the marker stays on the previous point and reads last reported.
5. If the banner says the Normandy JSON is invalid, undo the last edit; one bad field rejects the file.

## What not to do

- Do not geocode from memory, from a film, or from a secondary narrative without the diary place-name in `note`.
- Do not add a midpoint for a day the diary skips.
- Do not change `id`.
- Do not set `"theater": "normandy"` on a North Africa diary day.
- Do not invent a parent corps.
- Do not leave `note` blank. The parser requires text.
- Do not wrap the file as `{ "units": [ ... ] }`. It is a bare array.
