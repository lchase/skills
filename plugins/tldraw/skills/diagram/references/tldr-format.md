# The `.tldr` file format

A `.tldr` file is JSON:

```json
{
  "tldrawFileFormatVersion": 1,
  "schema": { "schemaVersion": 1, "storeVersion": 4, "recordVersions": { ... } },
  "records": [ /* flat list of document-scope records */ ]
}
```

`build-tldr.mjs` emits a **schemaVersion 1** file on purpose: tldraw has robust, well-tested
migrations from v1 to whatever the current runtime schema is, so the same file keeps opening
across tldraw releases. The `schema` block is copied verbatim from a known-good tldraw
export and should not be edited.

## Records the script emits

Only three record types, all at page scope:

| typeName   | id form              | notes |
|------------|----------------------|-------|
| `document` | `document:document`  | one, fixed |
| `page`     | `page:page`          | one, `index: "a1"` |
| `shape`    | `shape:<21 chars>`   | the geo boxes and the arrows |

Everything else (instance, camera, pointer, instance_page_state, presence) is session scope,
which tldraw recreates on load, so it's omitted.

### geo shape (a box)

```json
{
  "x": 0, "y": 0, "rotation": 0, "isLocked": false, "opacity": 1, "meta": {},
  "id": "shape:...", "type": "geo", "parentId": "page:page", "index": "a2",
  "props": {
    "w": 180, "h": 90, "geo": "rectangle",
    "color": "black", "labelColor": "black", "fill": "none", "dash": "draw",
    "size": "m", "font": "draw", "text": "label",
    "align": "middle", "verticalAlign": "middle", "growY": 0, "url": ""
  },
  "typeName": "shape"
}
```

`props.text` is a plain string in schemaVersion 1; tldraw's migration converts it to the
current rich-text representation on load. Do not pre-convert it.

### arrow shape

```json
{
  "x": 0, "y": 0, "rotation": 0, "isLocked": false, "opacity": 1, "meta": {},
  "id": "shape:...", "type": "arrow", "parentId": "page:page", "index": "a9",
  "props": {
    "dash": "draw", "size": "m", "fill": "none", "color": "black", "labelColor": "black",
    "bend": 0,
    "start": { "type": "binding", "boundShapeId": "shape:...", "normalizedAnchor": {"x":0.5,"y":0.5}, "isPrecise": false, "isExact": false },
    "end":   { "type": "binding", "boundShapeId": "shape:...", "normalizedAnchor": {"x":0.5,"y":0.5}, "isPrecise": false, "isExact": false },
    "arrowheadStart": "none", "arrowheadEnd": "arrow", "text": "", "font": "draw"
  },
  "typeName": "shape"
}
```

Arrows connect to shapes via **inline bindings** in `start` / `end` (the v1 style). With
`isPrecise: false` and a centre `normalizedAnchor`, tldraw computes the actual edge
attachment point and routes the line (the arrow's own `x`/`y` are ignored for bound
endpoints). tldraw's migration turns these inline bindings into separate `binding:` records.

For an unbound endpoint use `{ "type": "point", "x": <num>, "y": <num> }` instead.

## Constraints learned the hard way

These all surface as the opaque error `Couldn't parse tldr file: invalidRecords`:

1. **Record ids must match `/^[A-Za-z0-9]+$/`** after the `type:` prefix. No `-` or `_`, so
   `base64url` / raw nanoid ids are rejected. The script uses a 62-char alphanumeric
   alphabet.
2. **Fractional index keys** (`index`) must be well-formed: `a` followed by base62 digits
   (`a1`…`az`), then `b` + two digits (`b10`…), etc. `"b1"` is malformed. Keys must also be
   strictly increasing in string order across the page's shapes.
3. **`geo` must be a known value** (see the list in `SKILL.md`). Notably there is **no
   `cylinder`**. The script whitelists and falls back to `rectangle`.
4. `color` / `labelColor` must be from the tldraw palette; arbitrary hex is rejected.

## Image export

`build-tldr.mjs --formats=png,svg` shells out to
[`@kitschpatrol/tldraw-cli`](https://github.com/kitschpatrol/tldraw-cli), which loads the
`.tldr` into a headless-Chromium tldraw instance and triggers its native export. This is the
only reliable headless PNG path, because tldraw's own `editor.toImage()` / `getSvgString()`
need a live browser editor. First run pulls Chromium via puppeteer (cached after).

CLI directly, if needed:

```bash
npx -y @kitschpatrol/tldraw-cli export diagram.tldr --format png --output ./ --name diagram
#   flags: --format png|svg|tldr  --dark  --transparent  --padding <n>  --scale <n>  --frames "<name>"
```
