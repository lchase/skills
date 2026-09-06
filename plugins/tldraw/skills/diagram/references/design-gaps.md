# diagram skill: design-language gaps to close

Backlog for `scripts/build-tldr.mjs` and the spec format. Derived from
`design-language-research.md` section 5 (gap list), ranked by how often the surveyed
corpus needs each. The `## Style` section of SKILL.md documents the current limits for
users; this file is the fix list.

Touch points for all of these: the spec schema documented in SKILL.md step 1,
`scripts/build-tldr.mjs` (layout + record emission), `references/tldr-format.md` (record
shapes and constraints).

---

## 1. Frames / containers for nested and grouped nodes

**Biggest gap: ~10 of 24 corpus examples, and structural not cosmetic.**

The skill cannot draw a labelled container around a set of nodes. Architecture diagrams
need it: C4 system boundary, Azure VNet then subnet nesting, AWS Region then VPC then AZ
nesting, sequence-diagram fragment frames, concept-map swimlanes. tldraw itself converts
Mermaid subgraphs into frames on import
(https://tldraw.dev/blog/turning-mermaid-code-into-shapes).

Proposed spec:

```json
{ "id": "vpc", "text": "VPC", "children": ["lb", "app1", "app2"] }
```

Rendered as a tldraw frame record with child coordinates frame-relative. Nesting (a group
inside a group) should work. Auto-layout lays out within a frame, then places frames.
`.tldr` already supports frame records.

## 2. Layout axis beyond top-to-bottom

The single TB auto-layout fits roughly half the corpus.

- **LR**: comparisons (old left / new right, https://tldraw.dev/blog/tldraw-mcp-app),
  sequence-in-space (linked list, array), pipelines.
- **Lane / rank hint**: roadmap Now/Next/Later columns, persona rows, tier bands.
- Radial / freeform: lower priority, concept maps, user finishes in the editor.

Proposed: spec-level `"layout": "tb" | "lr"` first; later an optional per-node `"lane"` or
`"rank"` hint honoured by the layout pass. TB stays the default.

## 3. Per-edge routing style (elbow / orthogonal vs curved vs straight)

Excalidraw shipped elbow arrows specifically because "straight arrows on a busy board can
get clunky fast" (https://plus.excalidraw.com/blog/building-elbow-arrows-part-one). Dense
architecture diagrams need orthogonal routing; concept-map cross-links want curved to
stand apart from the tree.

Proposed: optional edge property `"route": "straight" | "elbow" | "curved"` mapped to the
tldraw arrow bend / routing. Possibly a spec-level default.

## 4. Legend / key generation

C4: "all diagrams should have a key". Azure Well-Architected: provide a legend when
solid vs dashed or colour carry meaning. When a spec uses more than one colour or any
dashed edge, an auto-generated legend block (a small stack of swatch + label rows in a
corner) would materially help. The skill produces none.

Proposed: when the emitted diagram uses >1 colour or any dashed edge, generate a legend
frame. Optionally a spec `"legend": { "green": "AWS", "dashed": "async" }` for the labels,
with a sensible default when omitted.

## 5. Line weight / border weight control

Azure Well-Architected lists "line weights" among the things to standardise for similar
elements. C4 cross-links and boundary boxes conventionally differ in weight; emphasis
(highlight the changed node) is often done with weight. No knob today.

Proposed: optional `"weight": "thin" | "normal" | "bold"` on nodes and edges, mapped to
tldraw's stroke size.

## 6. Multi-line / structured node text

C4 container nodes deliberately carry name, type, technology, and a one-line
responsibility: 3 to 4 lines per box. The skill's `text` is a single blob and long text
overflows.

Proposed: allow `"text"` to be an array of lines, or add `"subtitle"` / `"meta"` fields
rendered smaller under the title. Node auto-sizing needs to account for line count.

---

## Lower priority (noted, not planned)

- **Opacity / de-emphasis** for annotations vs primary content, greyed-out out-of-scope
  external systems, Wardley inertia markers.
- **Icons / image nodes**: every real cloud architecture diagram uses official icon sets
  (Azure, AWS, GCP). Big lift; geo shapes only today.
- **Actor / person shape**: C4 Person element, identity-flow diagrams. `ellipse` is the
  current hack.
- **Distinct rendering for cross-links / layer-skipping edges**: auto-layout assumes a
  layered DAG; edges that jump layers are not visually differentiated.
- **Uneven whitespace / clustering** for concept maps vs even rows for flows. One layout
  cannot do both; low priority since the user finishes in the editor.
