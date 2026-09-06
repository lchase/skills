---
name: diagram
description: >-
  Create diagrams as editable tldraw documents (.tldr) plus a rendered PNG (and SVG). Use
  whenever the user wants a flowchart, architecture / system diagram, boxes-and-arrows
  sketch, process / workflow map, decision tree, org chart, state machine, or ER-style
  diagram, especially when they want it as a tldraw file they can open and tweak, or
  say "tldraw", ".tldr", "draw this diagram", "make a diagram of", "diagram this flow". Turns
  a natural-language description into a laid-out tldraw canvas and an image.
---

# tldraw diagrams

Turn a described diagram into two artifacts, **written to the current working directory**
(wherever the user is running from) unless they ask for another location:

1. **`<name>.tldr`** is a real tldraw document. It opens in the tldraw editor (tldraw.com,
   the desktop app, or an embedded `<Tldraw>`), fully editable. `.tldr` is the only
   extension tldraw recognizes; `.tldraw` will not open and cannot be rendered, so the
   script always writes `.tldr` (and rewrites any other extension you pass).
2. **`<name>.png`** (and `<name>.svg` when useful) is a flat render for pasting into docs,
   PRs, chat.

`<name>` comes from the spec's `title` (slugified), so give the spec a `title`. Both come
out of one bundled script. You never hand-write tldraw JSON.

## Workflow

### 1. Turn the description into a node/edge spec

Read the user's description and build a JSON spec: a list of **nodes** (the boxes) and
**edges** (the arrows between them). This is the only modelling step; layout and file
format are handled for you.

```json
{
  "title": "Request handling",
  "nodes": [
    { "id": "req",    "text": "Incoming request", "shape": "ellipse", "color": "green" },
    { "id": "auth",   "text": "Authenticated?",   "shape": "diamond", "color": "blue" },
    { "id": "handler","text": "Route handler" },
    { "id": "db",     "text": "Postgres",         "shape": "cloud" },
    { "id": "401",    "text": "401 Unauthorized",  "color": "red" }
  ],
  "edges": [
    { "from": "req",     "to": "auth" },
    { "from": "auth",    "to": "handler", "text": "yes" },
    { "from": "auth",    "to": "401",     "text": "no", "dashed": true },
    { "from": "handler", "to": "db" }
  ]
}
```

Guidance:
- **`title`**: names the output files (`<slug>.tldr` / `.png`). Defaults to the spec
  filename, then `diagram`, if omitted.
- **`id`**: any short string, referenced by edges. Not shown.
- **`text`**: the label. Keep it short; long text overflows the box.
- **`shape`** (optional, default `rectangle`): `rectangle`, `ellipse`, `diamond`,
  `cloud`, `hexagon`, `octagon`, `pentagon`, `triangle`, `rhombus`, `trapezoid`, `oval`,
  `star`, `heart`, `x-box`, `check-box`, `arrow-right`/`-left`/`-up`/`-down`.
  Convention: `ellipse` for start/end, `diamond` for decisions, `cloud` for external
  systems. (No cylinder shape exists; use `cloud` or a rectangle for datastores.)
  Unknown values fall back to `rectangle` with a warning.
- **`color`** (optional, default `black`): `black grey blue green red orange yellow violet
  light-blue light-green light-red light-violet`. Sets border and label color.
- **`fill`** (optional, default `none`): `none semi solid pattern`.
- **`w` / `h`** (optional, default 180 x 90): bump `w` for longer labels.
- **`x` / `y`** (optional): explicit top-left position. Only honored if **every** node
  sets both; otherwise auto-layout runs and any partial coordinates are ignored.
- **edge `text`** (optional): arrow label, e.g. branch conditions.
- **edge `dashed`** (optional): dashed line, good for error/fallback/async paths.
- **edge `color`** (optional): same palette as nodes.

Write the spec to a scratch file (the scratchpad, or `/tmp`). It's an intermediate, not a
deliverable. Only the `.tldr` and images belong in the user's directory.

### 2. Build the .tldr and render images

Run this **from the user's working directory** so the outputs land there:

```bash
node "$CLAUDE_PLUGIN_ROOT/skills/diagram/scripts/build-tldr.mjs" /tmp/diagram.spec.json --formats=png,svg
```

With no output-path argument the script writes `./<title-slug>.tldr` (plus `.png`/`.svg`)
into the current directory. Pass an explicit path as the second argument only if the user
wants the file somewhere specific.

(`$CLAUDE_PLUGIN_ROOT` is set when this runs as an installed plugin. Running the skill
standalone, use the path to `scripts/build-tldr.mjs` next to this file.)

Flags:
- `--formats=png,svg`: which images to render. Omit to write only the `.tldr`.
- `--dark`: render the images on a dark background.
- `--transparent`: transparent image background.

First run downloads a headless Chromium via `npx @kitschpatrol/tldraw-cli` /
`puppeteer` (~1 min, cached afterward). If it fails with "Could not find
chrome-headless-shell", run once:

```bash
npx -y puppeteer browsers install chrome-headless-shell
```

If the export step fails but the `.tldr` was written, hand the user the `.tldr`. It still
opens in any tldraw editor.

### 3. Show the result

Send the PNG to the user with `SendUserFile`. Tell them the `.tldr` path (in their working
directory) and that they can open it at tldraw.com (File then Open) or in the tldraw editor
to rearrange anything. Don't delete the outputs.

## Layout

Auto-layout is deliberately simple: nodes are placed in **layers top-to-bottom** following
edge direction (roots on top), centered per row. tldraw routes the arrows between shape
edges. It's a clean starting point, not a graph-drawing engine; for dense graphs the user
finishes the arrangement in the editor (that's why the `.tldr` is the primary artifact).

For precise control, provide `x`/`y` on every node and layout is left exactly as given.

## When the input is already structured

If the user hands you mermaid, Graphviz DOT, or a list of relationships, translate it
straight into the node/edge spec and use the same workflow from step 2.

## Reference

`references/tldr-format.md` covers the `.tldr` file structure, the record shapes the script
emits, and known constraints (id charset, fractional index keys, inline arrow bindings).
Read it only if you need to post-process the file or extend the script.
