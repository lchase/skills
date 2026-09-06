# Visual design language for the tldraw `diagram` skill, research

Primary-source research to inform how the `diagram` skill turns a node/edge spec into a
readable diagram. Every aesthetic claim below is tied to a specific cited example or a
first-party design statement.

**Scope reminder, the skill's expressible surface today:** ~25 geo shapes; 13 named
colors (border + label only); fill `none|semi|solid|pattern`; edges with optional
label / dashed / colour; per-node `w`/`h`; all-or-nothing explicit `x`/`y`; one
auto-layout (layers top-to-bottom following edge direction, centred per row); `--dark`
and `--transparent` outputs. No frames, no groups, no per-edge routing style, no line
weight, no font control, no opacity, no left-right or radial layout.

**A note on source quality.** tldraw and Excalidraw publish design reasoning but few
annotated "here is a good diagram" galleries. The strongest first-party visual corpus is
the tldraw blog's agent-generated diagrams (real PNGs, URLs verified below) and the
tldraw Mermaid-import write-up. Excalidraw's contribution is mostly *design rationale*
(hand-drawn aesthetic, elbow arrows, fill styles) plus its example galleries. Where I
could not verify a rendered image at a URL, I say so.

---

## 1. Corpus

### Genre A, Explaining technical concepts

**A1. tldraw MCP App, "curve calculation optimization" (old vs new, side-by-side)**
Source: https://tldraw.dev/blog/tldraw-mcp-app (also referenced in
https://tldraw.dev/blog/text-is-not-enough)
The agent drew "the old approach on the left, the new approach on the right, and
annotations to highlight the key optimization." Concrete choices: a **left-right
comparison axis** (not top-down), two parallel columns of boxes, and free-floating
**annotation callouts** pointing at the diff rather than being nodes in the graph. The
comparison only works because the two halves are visually siblings at the same vertical
level.

**A2. tldraw Mermaid-import, flowchart conversion**
Source: https://tldraw.dev/blog/turning-mermaid-code-into-shapes
Mermaid shape vocabulary is mapped down to tldraw geo shapes (diamond = decision,
hexagon, stadium/oval, cylinder). Arbitrary CSS colours from `classDef` are **snapped to
tldraw's ~12-colour palette** via nearest-colour matching (weighted Euclidean / redmean,
with special lift for pale pastels). Takeaway: a *constrained* palette is treated as a
feature, and semantic shape mapping is explicit. Font sizes are inflated on import
because tldraw's hand-drawn face is wider than Mermaid's, text sizing is shape-driven.

**A3. tldraw Mermaid-import, sequence diagram**
Source: https://tldraw.dev/blog/turning-mermaid-code-into-shapes
Paired actor shapes top and bottom, vertical **lifelines**, signal arrows bound
shape-to-shape, and **fragment frames** ("loop"/"alt" boxes) drawn as containers around
a span of the interaction. This is a time-ordered diagram: the axis is vertical and
*means elapsed time*, which is different from the skill's "layers follow edge direction."

**A4. tldraw Mermaid-import, subgraphs become frames**
Source: https://tldraw.dev/blog/turning-mermaid-code-into-shapes
"Subgraph rendering converts Mermaid subgraphs into tldraw frames while preserving
parent-child relationships." A labelled rectangular **container** groups related nodes;
child coordinates are frame-relative. Grouping is structural, not decorative.

**A5. Excalidraw example, singly / doubly linked list**
Source: https://www.devtoolsdaily.com/diagrams/excalidraw/examples/linked-list/ ,
`/doubly-linked-list/` (third-party gallery of Excalidraw scenes; I did not visually
verify the render)
Described as "boxes plus next-pointer arrows" in a single horizontal row; the doubly
variant adds "distinct next (forward) and prev (backward) pointer arrows." Concept
teaching: **one row, left-to-right, uniform box size**, arrows carry the whole meaning
(direction = traversal). No colour.

**A6. Excalidraw example, binary tree / BFS traversal**
Source: https://www.devtoolsdaily.com/diagrams/excalidraw/examples/binary-tree/ ,
`/graph-bfs-dfs/` (third-party gallery, not visually verified)
Tree drawn top-down, radial-ish branching. The BFS version is "each layer color-coded,
showing how the traversal spreads outward level by level", colour here encodes
**distance/step**, i.e. colour = data, not decoration.

**A7. Excalidraw, "Building Elbow Arrows" worked examples**
Source: https://plus.excalidraw.com/blog/building-elbow-arrows-part-one
Flowchart-style boards where every connector is **orthogonal (90°)**. First-party
rationale: "straight arrows on a busy board can get clunky fast"; elbow routing gives
"clean, professional-looking diagrams that are easy to follow," with "shortest routes,
minimal segments, proper arrowhead orientation, shape avoidance." Elbow arrows are the
default mental model for process/flow diagrams.

**A8. tldraw, hand-drawn "draw shapes" aesthetic (concept sketches)**
Source: https://tldraw.dev/blog/engineering-imperfection-with-draw-shapes
Not one diagram but the house style: subtle per-shape wobble, angle-varying corner
rounding, multi-pass texture. Stated purpose, imperfection "loosens up wireframes …
looks better alongside sketches drawn freehand" and signals *work in progress*, inviting
edits. Sharp geometry "reads as computer-generated and final."

### Genre B, Architecture / system overviews

**B1. tldraw MCP App, "User system login flow" (agent's first draft)**
Source image (verified): https://cdn.sanity.io/images/ij3ytvrl/production/245429a28475b321e1485dbce4eb64b7bca372bb-1500x1358.png
(context: https://tldraw.dev/blog/tldraw-mcp-app)
Agent-planned auth architecture: labelled rectangles for components, arrows for calls,
roughly top-to-bottom request flow. Portrait aspect (1500×1358), vertical stack of
stages. Modest node count (~6-8). This is close to what the skill's auto-layout produces.

**B2. tldraw MCP App, "Revised login flow with social sign-on"**
Source image (verified): https://cdn.sanity.io/images/ij3ytvrl/production/724706bcf4c323378af77e733c4981a6c12e57a2-1474x1610.png
The same diagram after the agent added Google/GitHub auth. Even taller (1474×1610): new
branches were added *downward and outward*, the diagram grew along its main axis. Shows
how an overview diagram is edited incrementally, nodes appended, not re-laid-out.

**B3. tldraw MCP App, MCP App architecture / protocol flow**
Source: https://tldraw.dev/blog/tldraw-mcp-app and https://tldraw.dev/blog/text-is-not-enough
"Interactions between clients, the transport layer, the tool dispatch system, and the
tldraw editor instance." A **layered** architecture picture: tiers stacked, each tier one
row, arrows crossing tier boundaries. Hierarchical/relational layout is what makes the
layers legible.

**B4. tldraw "technical design" use-case page**
Source: https://tldraw.dev/use-cases/technical-design
Marketing page; images are CDN-embedded and I could not extract per-image visual detail.
Text frames the genre: "UML, ERD, or architecture editors" with "snap-to-ports",
"connection validation, conditional branching". Notable that *ports* (fixed connection
points on a box) are considered part of good architecture tooling, the skill has none.

**B5. Excalidraw example, "system architecture diagram" (client / API / cache / DB)**
Source: https://www.devtoolsdaily.com/diagrams/excalidraw/examples/system-architecture/
(third-party gallery; the fetch could only paraphrase, not verify the render)
Described: rectangles per layer, single-direction arrows for data flow, minimal labels
(component identification only), generous whitespace, no elaborate colour coding, "visual separation rather than colour." Progression client → backend → datastore.

**B6. Excalidraw example, API request flow / URL-shortener / cloud deployment**
Source: `/api-request-flow/`, `/url-shortener-design/`, `/cloud-deployment-diagram/` at
devtoolsdaily (not visually verified)
Recurring structure: **separate read and write paths**, an explicit cache box beside the
datastore, a load balancer fanning out to N identical app instances. The fan-out (one
box → several identical boxes) and the split-path are the signature moves of this genre.

**B7. Azure Architecture Center, baseline App Service architecture (reference diagram)**
Source page: https://learn.microsoft.com/en-us/azure/architecture/icons/
Image (SVG, referenced on that page): `images/baseline-app-service-architecture.svg`
Described in-page: a **VPC/VNet boundary box** containing three labelled **subnet
containers**; official product icons with the product name printed next to each icon;
arrows show private-endpoint calls to SQL, Key Vault, Storage. Nested boundaries
(network → subnet → service) carry most of the information.

**B8. AWS Architecture Icons toolkit**
Source: https://aws.amazon.com/architecture/icons/
Icons "designed to be simple"; released quarterly; grouped by service category mirroring
the console. AWS's canonical diagram style (from the toolkit templates) nests
Region → VPC → Availability Zone → subnet as concentric labelled rectangles. The skill
can't nest boxes at all.

**B9. C4 model, container diagram**
Source: https://c4model.com/ and https://c4model.com/diagrams/notation
Boxes = containers (apps / datastores), each box carrying **name + type + technology +
one-line responsibility** (3-4 lines of text per node, deliberately). Every arrow
labelled with intent + protocol ("Reads from, via JDBC"). Every diagram carries a
title and a legend. Colour is explicitly *optional and free choice*.

### Genre C, Mapping ideas / concept maps

**C1. tldraw, "clustering comments without measuring a thing"**
Source: https://tldraw.dev/blog/clustering-comments-without-measuring-a-thing
Spatial clustering of items by proximity, no arrows, no layout algorithm, meaning comes
from *which things are near which*. Concept-map cousin: grouping by position.

**C2. tldraw MCP App, sketch → polished concept diagram**
Source images (verified):
sketch https://cdn.sanity.io/images/ij3ytvrl/production/dc13f26288b72d6a7ce0f35f7aa3661643f2eae4-1458x2040.png
polished https://cdn.sanity.io/images/ij3ytvrl/production/ee91b0d8641546b0f7449c476c1982dd1a61b526-2632x2014.png
The polished version keeps the sketch's **freeform placement** (not a grid), uses
whitespace to separate idea groups, and adds arrows only where a relationship is
asserted. Landscape 2632×2014, a concept map spreads horizontally, unlike the portrait
architecture flows in B1/B2.

**C3. Excalidraw example, brainstorming whiteboard**
Source: https://www.devtoolsdaily.com/diagrams/excalidraw/examples/brainstorming-whiteboard/
(not visually verified)
"Moodboard-style layout with topic clusters." No single axis; ideas in loose regions;
minimal connective tissue. Density varies across the canvas (dense clusters, empty
gutters), the opposite of the skill's evenly-spaced rows.

**C4. Novak/Cañas concept map (canonical reference)**
Source: https://cmap.ihmc.us/docs/theory-of-concept-maps ,
https://cmap.ihmc.us/Publications/ResearchPapers/TheoryUnderlyingConceptMaps (PDF)
Concepts in boxes/ovals; connected by lines with a **linking phrase on every line**
("gives rise to", "is required by") so each concept-line-concept triple reads as a
sentence (a *proposition*). Organised **hierarchically, general at top → specific
below**. **Cross-links**, lines connecting distant branches, are called out as the
highest-value, most creative element.

**C5. Wardley map (canonical reference)**
Source: https://www.wardleymaps.com/glossary/value-chain , https://en.wikipedia.org/wiki/Wardley_map
Nodes = capabilities, joined by dependency lines into a value chain. **Y axis = visibility
to the user** (anchor/user need pinned at the very top), **X axis = evolution**
(genesis → custom → product → commodity, left to right). Both axes carry meaning; a node's
*position* is the entire point. Plain nodes and thin lines; almost no colour.

**C6. Excalidraw example, product roadmap / story map**
Source: https://www.devtoolsdaily.com/diagrams/excalidraw/examples/product-roadmap/
(not visually verified)
"Now / Next / Later board with story cards", column swimlanes, uniform cards, the
*column a card sits in* is its meaning. A banded/lane layout the skill can't express.

**C7. tldraw, "text is not enough" (general thesis)**
Source: https://tldraw.dev/blog/text-is-not-enough (Steve Ruiz)
Argument: visual, complex, abstract ideas resist linear text; a diagram lets you show
*structure and relationship at a glance*. Frames the whole reason concept maps exist.

**C8. Excalidraw, hand-drawn default as an idea-mapping affordance**
Source: https://plus.excalidraw.com/blog (Excalidraw in 2024 etc.), and
https://github.com/excalidraw/excalidraw
"Sketchy" style signals draft; "stakeholders debate structure, not pixel polish." For
concept mapping this lowers the cost of being wrong, which is the point of the genre.

---

## 2. Rubric across the corpus

| # | Palette (meaning vs decoration) | Shape semantics | Arrow semantics | Text / node | Grouping | Layout axis | Whitespace |
|---|---|---|---|---|---|---|---|
| A1 curve opt | none / mono | uniform boxes | plain; annotations as callouts | short + separate notes | 2 implied columns | **LR compare** | even, symmetric halves |
| A2 mermaid flowchart | snapped palette, semantic (decision colour) | diamond=decision, hex, cylinder=store | directed, labelled on branches | 1 line | none | TB | layered |
| A3 sequence | minimal | actor boxes + lifelines | signal arrows, bound; time-ordered | 1 line | **fragment frames** | vertical = time | tight columns |
| A4 subgraphs | subtle | boxes | directed | 1 line | **labelled frames** | TB nested | frame padding |
| A5 linked list | none | identical boxes | direction = traversal; fwd/back distinct | 1 word | none | **LR** | one row, tight |
| A6 tree / BFS | **colour = step/layer** | nodes identical | parent→child | 1 word | none | TB radial | branch spread |
| A7 elbow flows | light | flowchart boxes | **orthogonal routing**, arrowheads oriented | 1 line | none | mixed | routing avoids overlap |
| B1 login flow v1 | light accent | rectangles | directed calls | 1 line | none | **TB portrait** | even rows |
| B2 login flow v2 | light accent | rectangles | directed; branches | 1 line | none | TB, grew downward | even |
| B3 MCP arch | tier tints | rectangles by tier | cross-tier calls | 1 line | tiers as rows | **layered TB** | row bands |
| B5 client/API/cache/DB | none, "visual separation" | rectangles | single-direction data flow | identifier only | none | TB | generous |
| B6 read/write split | light | rectangles + cache | split paths; fan-out | 1 line | none | TB / LR | fan spacing |
| B7 Azure baseline | official icon colours; **pattern+colour** | product icons | private-endpoint calls | icon + product name | **nested VNet/subnet boxes** | freeform in boundary | boundary padding |
| B9 C4 container | optional, free, consistent | typed boxes | **every arrow labelled** + protocol | **3-4 lines**: name/type/tech/role | boundary boxes | freeform | legend + title space |
| C1 comment clusters | none | dots/cards | none | phrase | **proximity clusters** | freeform | dense/sparse varies |
| C2 concept sketch | sparse accent | mixed | only where asserting relation | phrase | whitespace groups | **freeform landscape** | irregular |
| C4 Novak map | none | boxes/ovals | **linking phrase on every line**; + cross-links | short phrase | hierarchy levels | **radial / TB hierarchy** | branch-driven |
| C5 Wardley | none | plain nodes | dependency lines (undirected-ish) | short label | none | **XY, both axes semantic** | position-driven |
| C6 roadmap | lane colour | uniform cards | none | title | **swimlane columns** | banded LR | column grid |

Cross-corpus reading:

- **Colour is meaning, not decoration, in every well-regarded example.** Where colour
  appears it encodes a category (A2 decision), a step/distance (A6 BFS), a lane (C6), or
  an official product identity (B7). Monochrome is common and never looks wrong (A1, A5,
  C4, C5). Azure WAF and C4 both say explicitly: never rely on colour alone, pair it with
  pattern/shape, keep it consistent across the set.
- **Shape is a small controlled vocabulary.** diamond=decision, cylinder/store=data,
  rounded/stadium=start-end, hexagon=preparation. Beyond ~4 shapes, meaning dilutes.
  Nobody in the corpus uses star/heart/octagon/trapezoid semantically.
- **Arrows are directed and, in the good examples, labelled.** C4 forbids bare "Uses";
  Azure WAF: "Lines without arrows make relationships unclear. Always use arrows",
  "Avoid bidirectional arrows, use single-ended arrows … client → server." Dashed is
  reserved for a *different kind* of relationship (async, fallback, trust boundary
  crossing), and only meaningful next to a legend.
- **Text density splits hard by genre.** Concept/architecture-context nodes carry a
  phrase or a single identifier (A5, C4). C4 container nodes deliberately carry 3-4
  lines. Flowchart steps: one line. Long labels overflow, the skill already warns this.
- **Grouping/containers appear in the majority of architecture examples** (A3, A4, B7,
  B9) and all lane-based concept maps (C6). This is the single most common thing the
  skill cannot do.
- **Layout axis is chosen to match the message:** LR for comparison and sequence-in-space
  (A1, A5), TB for flow and hierarchy (A2, A6, B1-B3), XY for maps (C5), freeform/radial
  for concept maps (C2, C4), banded for roadmaps (C6). "Always TB" is right for maybe
  half the corpus.
- **Whitespace rhythm is deliberately uneven in concept maps** (dense clusters, empty
  gutters, C1, C3) and deliberately even in flows/architecture (regular rows, B1, B3).

---

## 3. Per-genre patterns

### Architecture / system overview, what it consistently does

- **Boundary containers.** Region / VPC / VNet / subnet / trust boundary drawn as nested
  labelled rectangles (B7 Azure, B8 AWS, B9 C4 "always include an explicit boundary").
  The nesting *is* the architecture.
- **Layers / tiers as rows**, arrows crossing tier lines (B3). A reader should be able to
  say "this row is the data tier" at a glance.
- **Split paths and fan-out.** Read path vs write path drawn as separate lanes; one
  service fanning to N identical instances behind a load balancer (B6). Symmetry signals
  "these are the same kind of thing."
- **Every node names its technology / type**, every arrow names the call and often the
  protocol (B9). Bare boxes with one noun are a context diagram only.
- **Icons + product names** for concrete tech (B7, B8, Azure WAF "use official icons and
  service names … don't substitute marketing logos for generic API-gateway blocks").
- **One diagram, one altitude.** Context → container → component, each its own diagram
  (C4 leveling; Azure WAF "Layer, don't overload … progressive disclosure").
- Directed, single-ended arrows; solid = sync, dashed = async only with a legend.

### Concept map / idea map, what it does that architecture does not

- **Linking phrase on every edge** so each triple reads as a sentence (C4 Novak). An
  unlabelled arrow in a concept map is a defect; in an architecture flow it is often
  fine.
- **Hierarchy by vertical position**: most general concept at top, specific below (Novak).
  Or a **semantic coordinate space** where both X and Y mean something (Wardley: value
  chain × evolution).
- **Cross-links** deliberately connecting far-apart branches, the payoff move, visually
  distinct (often curved, sometimes coloured).
- **Freeform / radial placement**, uneven whitespace, clusters (C1, C2, C3). No load
  balancers, no protocols, few or no icons.
- **Fewer shape types, little colour, no containers**, usually just boxes/ovals and
  lines. Meaning lives in *topology and position*, not in styling.
- Roadmap/story-map variant: **swimlanes** (Now/Next/Later, or persona rows) where the
  lane is the meaning (C6).

### Explaining a technical concept, its own recurring structure

- **Comparison layouts**: old-left / new-right, or before/after stacked, with annotation
  callouts on the delta (A1). The two halves must be visual siblings.
- **Uniform repeated units in a single row/tree** (linked list, array, tree, A5, A6)
  where one shape = one element and the arrow = the operation being taught.
- **Colour used as a data channel**, highlight the changed node, colour BFS layers by
  distance (A6).
- **Time or sequence made spatial**, left-to-right steps, or top-to-bottom lifelines
  with fragment frames (A3).
- Smaller node counts than architecture diagrams; more annotation; hand-drawn wobble is
  an asset because it says "this is an explanation, not a spec" (A8).

---

## 4. Tool-agnostic principles worth importing

**C4 model, Simon Brown (https://c4model.com, https://c4model.com/diagrams/notation)**
- *Leveling / progressive disclosure.* Four zoom levels (context → container → component
  → code); each diagram answers one question at one altitude. Import: when a spec has
  >~15 nodes or clearly two altitudes, produce two diagrams, not one dense one.
- *Notation independence.* C4 "doesn't prescribe any particular notation … use whatever
  colours you like", but *be consistent and add a key*. Import: the skill's fixed
  palette/shape set is fine; consistency matters more than any specific choice.
- *Every element typed; every relationship labelled with intent + technology.* "Avoid
  vague single-word labels like 'Uses'." Import: nudge edge labels toward verbs/protocol.
- *Every diagram has a title and a legend.* The skill has `title` but emits no legend;
  worth generating one whenever colour or dashed edges carry meaning.

**Azure Well-Architected, "Create architecture design diagrams"
(https://learn.microsoft.com/en-us/azure/well-architected/architect-role/design-diagrams)**
The most actionable primary checklist found:
- "Always use arrows"; "Avoid bidirectional arrows, use single-ended … client →
  dependency."
- "Label everything clearly", icons, grouping containers, and relationships.
- "Maintain consistency", standardized colours, icon sizes, **line weights**, line
  types, arrowheads, border styles for similar elements.
- "Provide a legend" if border/line semantics are introduced (solid=sync, dash=async).
- "Design for accessibility … avoid relying solely on colour … pair colour with pattern."
- "Layer, don't overload … context diagram → container diagram → focused component /
  sequence diagram."
- "Include metadata", title, description, last-updated, author, version.
- Use **generic shapes for external systems**, product icons only for concrete tech.

**Azure / AWS icon guidance (https://learn.microsoft.com/en-us/azure/architecture/icons/,
https://aws.amazon.com/architecture/icons/)**
- Put the product/component **name next to the icon**, don't rely on icon recognition.
- Don't distort, recolour, rotate icons. Consistent icon size.
- Canonical cloud style nests Region ▸ VPC/VNet ▸ AZ ▸ subnet as concentric labelled
  boxes, grouping containers do the heavy lifting.

**Tufte, data-ink ratio
(https://jtr13.github.io/cc19/tuftes-principles-of-data-ink.html and Tufte, *The Visual
Display of Quantitative Information*)**
- Maximise data-ink / total-ink; "erase non-data-ink … and redundant data-ink." For
  diagrams: no gratuitous fills, drop shadows, 3-D, decorative colour, heavy borders.
  A box needs a thin outline and a label, not a solid fill unless the fill *means*
  something. Supports keeping `fill: none` as the default and using `solid`/`pattern`
  only to encode a category.
- Chartjunk = "ink that does not tell the viewer anything new." Star/heart shapes,
  rainbow palettes, and thick coloured borders with no referent are chartjunk.

**Concept mapping, Novak & Cañas
(https://cmap.ihmc.us/docs/theory-of-concept-maps)**
- Put a **linking phrase on every connector**; concept, phrase, concept should read as a
  proposition.
- Organise **hierarchically, general to specific, top to bottom**.
- Add **cross-links** between branches and make them visually distinct, they carry the
  insight.

**Wardley mapping, Simon Wardley
(https://www.wardleymaps.com/glossary/value-chain, https://en.wikipedia.org/wiki/Wardley_map)**
- Anchor on a **user need at the top**; build the value chain downward as a dependency
  graph.
- **Both axes mean something**: Y = visibility to user, X = evolution (genesis → custom →
  product → commodity). A node's *coordinates* are the content. Any diagram where
  position is semantic needs true x/y control and axis labels.

---

## 5. Gap list, what the corpus proves important that the skill cannot produce

Ranked by how often the corpus needs it.

### 1. Grouping / frames / containers (nested, labelled boxes)
Needed by: B7 Azure (VNet ▸ subnet), B8 AWS (Region ▸ VPC ▸ AZ), B9/C4 (system
boundary), A3 (sequence fragments), A4 (Mermaid subgraphs → frames, tldraw itself does
this on import), C6 (swimlanes), C1 (proximity clusters). Azure WAF and C4 both say a
boundary is mandatory for context/architecture diagrams. **This is the single biggest
gap**, it appears in ~10 of 24 corpus entries and is structural, not cosmetic. The
skill emits no frame/group records even though `.tldr` supports frames.

### 2. Layout axis other than top-to-bottom
Needed by: A1 (LR comparison), A5 (LR sequence-in-space), C5 Wardley (semantic XY),
C4 Novak (radial hierarchy), C2 (freeform landscape), C6 (banded lanes), A3 (vertical =
*time*, semantically distinct from "follows edges"). The current single TB auto-layout
fits roughly half the corpus. At minimum: an LR option; ideally LR/TB/radial plus
"respect a lane/rank hint."

### 3. Per-edge routing style (elbow / orthogonal vs curved vs straight)
Needed by: A7 (Excalidraw shipped elbow arrows specifically because "straight arrows on
a busy board get clunky"), B3/B7 (dense architecture), C4 cross-links (curved to stand
apart). Azure WAF: consistent "line types" for similar relationships. The skill exposes
no routing control; tldraw arrows have an elbow mode.

### 4. Legend / key generation
Needed by: B9/C4 ("all diagrams should have a key"), Azure WAF ("Provide a legend" when
solid/dash or colour carry meaning), A2/A6 (colour encodes category/step). Whenever the
spec uses >1 colour or any dashed edge, an auto-generated legend block would materially
help. Skill produces none.

### 5. Line weight / border weight control
Needed by: Azure WAF explicitly lists "line weights" among the things to standardise for
similar elements; C4 cross-links and boundary boxes conventionally differ in weight;
emphasis (highlight the changed node in A1/A6) often done via weight. No knob today.

### 6. Multi-line / structured node text
Needed by: B9/C4 (name / type / technology / responsibility = 3-4 lines per box),
B7 (icon + name), C4 Novak propositions. The skill's `text` is a single blob and long
text overflows; there's no title+subtitle or bulleted node.

### 7. Opacity / de-emphasis
Needed by: A1 (annotations vs primary), context diagrams that grey out "out of scope"
external systems (Azure WAF generic-external-system guidance), Wardley "inertia"
markers. No opacity control.

### 8. Icons / image nodes
Needed by: B7, B8, and essentially every real cloud architecture diagram, Azure/AWS/GCP
all ship official icon sets and both vendors say to use them with names attached. The
skill is geo-shapes only. (Big lift; noting for completeness.)

### 9. Node shape for start/end vs process is fine, but "actor/person" is missing
Needed by: B9/C4 (Person element), C4 user-flow, Azure identity-flow diagrams. No
person/stick-figure affordance; `ellipse` is the closest hack.

### 10. Curved cross-links / non-tree edges rendered distinctly
Needed by: C4 Novak (cross-links are "the creative leap"), Wardley dependency lines that
skip levels. Auto-layout assumes a layered DAG; edges that jump layers aren't visually
differentiated.

### 11. Alignment / distribution finesse and uneven whitespace
Needed by: C1/C3 concept maps want *clusters* (dense + sparse); B1/B3 want *even* rows.
One layout can't do both. Lower priority since the user finishes in the editor.

---

## Sources

- tldraw MCP App, https://tldraw.dev/blog/tldraw-mcp-app
- tldraw "Text is not enough", https://tldraw.dev/blog/text-is-not-enough
- tldraw "Turning Mermaid code into shapes", https://tldraw.dev/blog/turning-mermaid-code-into-shapes
- tldraw "20 things I wish AI chatbots knew about tldraw", https://tldraw.dev/blog/20-things-i-wish-ai-chatbots-knew-about-tldraw
- tldraw "Agents can't point", https://tldraw.dev/blog/agents-cant-point
- tldraw "Engineering imperfection with draw shapes", https://tldraw.dev/blog/engineering-imperfection-with-draw-shapes
- tldraw "Clustering comments without measuring a thing", https://tldraw.dev/blog/clustering-comments-without-measuring-a-thing
- tldraw technical-design use case, https://tldraw.dev/use-cases/technical-design
- tldraw examples index, https://tldraw.dev/examples (mermaid, arrow-labels, frame-layouts, layout-bindings)
- Excalidraw blog index, https://plus.excalidraw.com/blog
- Excalidraw "Building Elbow Arrows, Part 1", https://plus.excalidraw.com/blog/building-elbow-arrows-part-one
- Excalidraw repo, https://github.com/excalidraw/excalidraw
- Excalidraw fill/stroke/sloppiness reference (Excalidraw Automate docs), https://zsviczian.github.io/obsidian-excalidraw-plugin/API/element_style.html
- devtoolsdaily Excalidraw example gallery (third-party, renders not visually verified), https://www.devtoolsdaily.com/diagrams/excalidraw/examples/
- C4 model, https://c4model.com/ , https://c4model.com/diagrams/notation
- Azure Well-Architected, "Create architecture design diagrams", https://learn.microsoft.com/en-us/azure/well-architected/architect-role/design-diagrams
- Azure architecture icons, https://learn.microsoft.com/en-us/azure/architecture/icons/
- AWS architecture icons, https://aws.amazon.com/architecture/icons/
- Tufte data-ink (summary), https://jtr13.github.io/cc19/tuftes-principles-of-data-ink.html
- Novak & Cañas, "The Theory Underlying Concept Maps", https://cmap.ihmc.us/docs/theory-of-concept-maps
- Wardley maps, https://www.wardleymaps.com/glossary/value-chain , https://en.wikipedia.org/wiki/Wardley_map

### Not verified / could not confirm
- I could not extract per-image visual detail from https://tldraw.dev/use-cases/technical-design (CDN-embedded images, no alt detail).
- https://libraries.excalidraw.com/ returned only an un-rendered template; I could not enumerate the AWS/GCP/Azure/software Excalidraw libraries first-hand.
- devtoolsdaily example pages (A5, A6, B5, B6, C3, C6) are a third-party gallery; the fetch tool paraphrased descriptions but did not visually verify the rendered `.excalidraw` scenes.
- Excalidraw "Building Elbow Arrows, Part 2" (https://plus.excalidraw.com/blog/building-elbow-arrows-part-two) returned 404 on fetch; Part 1 covers the rationale used above.
