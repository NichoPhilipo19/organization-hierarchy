# Claude Code Implementation Prompts

Ready-to-use prompts for working through the backlog in [COMPETITIVE_ANALYSIS.md](COMPETITIVE_ANALYSIS.md) §Priority Recommendations. One section = one prompt = ideally one separate branch/PR/Claude Code session, worked through in order (quick wins first). Copy the code block's contents from each section and paste it into Claude Code.

Every prompt already includes **Context** (this repo's mandatory conventions) so the implementer doesn't need to ask again — if you run several prompts in the same Claude Code session back to back, you can skip the Context section after the first prompt.

---

## 0. Context (included in every prompt below)

```text
You're working in the org-hierarchy-tree repo: a reusable React component for org
charts built from flat data ({id, parentId, ...}), strict TypeScript, zero runtime
dependencies (React is only a peerDependency), targeting ~5kB gzip for dist-lib.
Read PRD.md, TECHNICAL_DESIGN.md, ANALYSIS.md, and README.md before starting — follow
the existing conventions:

- Add any new requirement as a new FR-<n>/NFR-<n> in PRD.md (continue numbering from
  the last FR), with a user story where relevant.
- If there's a design decision involved (e.g., why library X, why architecture Y),
  write the reasoning in TECHNICAL_DESIGN.md — not just in the commit message.
- Tests are MANDATORY (vitest + Testing Library for components, pure unit tests for
  logic). Never submit an implementation without tests — that's the exact pattern
  called out in ANALYSIS.md.
- Update the traceability table in ANALYSIS.md (a new row: new-FR → design → code →
  test/evidence → status).
- Update CHANGELOG.md under [Unreleased], following the Keep a Changelog format
  (Added/Changed/Fixed).
- Update README.md if there's a new public API (props table, code example, feature
  listed under Features).
- Before finishing, run these and make sure everything passes:
  npm run build   (tsc --noEmit + vite build)
  npm test        (vitest run)
  npm run build:lib
  Compare the dist-lib gzip size before/after — report the numbers, don't let it grow
  significantly without saying so (see README §Performance for the baseline).
- Don't add a new runtime dependency without a dynamic import/opt-in, unless its
  trade-offs have already been discussed explicitly in TECHNICAL_DESIGN.md — the
  zero-dep principle is the project's core selling point (NFR-2); don't violate it
  silently.
- Don't regress existing features that are our differentiators: dirty-data validation
  (onDataError), full WAI-ARIA keyboard navigation (roving tabindex, arrow keys,
  aria-level/setsize/posinset). If a new feature might conflict with these (e.g.,
  drag-and-drop vs. keyboard nav), design it so both keep working — accessibility is
  not optional here.
```

---

## 1. PNG export (quick win)

```text
[include the Context block above]

Task: add the ability to export the currently rendered chart as a PNG file.

Requirements:
- API: a new method on OrgChartHandle (ref), e.g. `exportToPng(filename?: string):
  Promise<void>`, so consumers can call it from their own button
  (`ref.current.exportToPng('org-chart.png')`).
- Implement using a lightweight DOM→image rendering library (e.g. html-to-image
  or dom-to-image-more) — install it as a regular dependency but import it dynamically
  (`await import(...)`) inside the export function, so consumers who never call export
  pay zero bundle cost.
- Must remain correct for collapsed subtrees (capture only what's currently
  rendered/visible, not the entire data set) and for the current zoom/pan state (or,
  if it makes more sense, a `{ fitContent: boolean }` option to auto zoom-to-fit
  before capturing — pick one and document why in TECHNICAL_DESIGN.md).
- Add an export button to the demo (src/demo or the App.tsx that serves as the live
  demo) so it's visible at https://nichophilipo19.github.io/organization-hierarchy/.
- Tests: mock the export library, verify the method is called with the correct
  container element and that the promise resolves/rejects correctly for error
  scenarios (e.g. the container isn't mounted yet).
- New FR: "Export the currently rendered chart to a PNG file" — record it in PRD.md
  and ANALYSIS.md.
```

---

## 2. CSS theme presets

```text
[include the Context block above]

Task: provide a handful of ready-made theme presets on top of the existing CSS
custom property mechanism (--orgchart-card-bg, --orgchart-line-color,
--orgchart-highlight-color, --orgchart-focus-color).

Requirements:
- Create at least 3 presets (e.g. `default`, `dark`, `minimal`) as a CSS class or
  `data-theme` attribute value, each resetting the existing custom properties —
  WITHOUT adding new custom properties unless necessary, to stay backward
  compatible with consumers already doing manual theming.
- Export as a separate CSS file (e.g. keep `style.css` as the base, add
  `themes.css`, or combine it using a `[data-orgchart-theme="dark"]` selector) —
  decide on the file structure and explain the reasoning in TECHNICAL_DESIGN.md
  (§Theming).
- Update the demo to have a theme switcher (dropdown/button) so it's visible in the
  live demo.
- Tests: a snapshot or assertion that computed style / class changes according to the
  selected theme prop/attribute.
- Update README §Theming with the list of presets and how to use them (via className
  or a `theme` prop on <OrgChart>).
- New FR in PRD.md + a row in ANALYSIS.md.
```

---

## 3. Horizontal layout toggle

```text
[include the Context block above]

Task: add an `orientation?: 'vertical' | 'horizontal'` prop (default `'vertical'`,
to stay backward compatible).

Requirements:
- Vertical = current behavior (root on top, children below). Horizontal = root on
  the left, children to the right (or the reverse — decide on the common convention
  and state the reasoning in TECHNICAL_DESIGN.md; also check how competitors
  artdong/react-org-tree and ssthouse/tree-chart define "horizontal" so we stay
  consistent with market expectations).
- The CSS connector (whose reasoning for CSS-over-SVG is already explained in
  TECHNICAL_DESIGN.md) needs to be adapted for the horizontal direction — the
  connector lines change from a vertical-branch to a horizontal-branch pattern.
- WAI-ARIA keyboard navigation (arrow keys) does NOT change semantics based on
  visual orientation — it follows DOM order (up/down stays next/prev sibling
  logically, left/right stays expand/collapse). Don't confuse screen reader users
  by having arrow-key meaning follow the visual orientation. Document this decision
  explicitly, since it's a point competitors frequently get wrong.
- Tests: render snapshots for horizontal vs vertical, make sure the existing keyboard
  nav tests still pass in both orientations (parametrize the existing tests if
  needed).
- New FR in PRD.md + a row in ANALYSIS.md + update the README props table.
```

---

## 4. Fit-to-screen / center-node

```text
[include the Context block above]

Task: extend ZoomPane + OrgChartHandle with two new methods:
- `fitToScreen(): void` — compute the bounding box of every currently rendered
  (visible, not collapsed) node, then set ZoomPane's scale & translate so everything
  fits the viewport with reasonable padding.
- `centerNode(id: string): void` — pan (without changing scale, or with an optional
  param to also change scale) so the node with that id ends up centered in the
  viewport. Useful paired with search: after a user picks a search result, auto-center
  on that node.

Requirements:
- Reuse the existing zoom/pan logic in ZoomPane — don't build a parallel transform
  system.
- Must remain correct when the chart is partially collapsed (the bounding box should
  only come from visible nodes).
- Tests: assert that transform/scale/translate state changes as expected for both
  methods, including the edge case where the node id isn't found (`centerNode` should
  either no-op or throw — decide and document which).
- Demo: a "Fit to screen" button + a search example that auto-centers on the first
  result.
- New FR in PRD.md + a row in ANALYSIS.md.
```

---

## 5. PDF export

```text
[include the Context block above]

Task: add `exportToPdf(filename?: string): Promise<void>` to OrgChartHandle, built
on top of #1's work (PNG export) — reuse the DOM→image capture, then embed that image
into a PDF (e.g. using jsPDF, also via dynamic import).

Requirements:
- Don't duplicate the capture logic — refactor #1 so there's an internal
  `captureAsImage()` function used by both exportToPng and exportToPdf.
- Handle a reasonable PDF page size (fit to the chart's size, or a
  `{ pageSize: 'a4' | 'fit' }` option — decide on a default and document it).
- Tests: mock jsPDF, verify the image is attached and save is called with the correct
  filename.
- Update README §Export covering both methods (PNG & PDF) together.
- New FR in PRD.md + a row in ANALYSIS.md (either combine into one FR "Export to
  PNG/PDF" with two acceptance criteria, or two separate FRs — whichever is
  consistent with the existing FR style in the file).
```

---

## 6. Drag-and-drop reparenting

```text
[include the Context block above]

Task: the biggest and most frequently requested feature among competitors (dabeng,
klad, bumbeishvili) — let users move a node to a different parent via drag-and-drop.

IMPORTANT — design before coding; write this up first in TECHNICAL_DESIGN.md:
- This library does NOT own the data state (data always comes from the consumer's
  `data` prop) — so drag-drop must NOT mutate data internally. Design it as a
  callback: `onReparent?: (nodeId: string, newParentId: string | null) => void`;
  the consumer is responsible for updating their own `data` and re-rendering.
- Cycle validation is MANDATORY BEFORE calling onReparent (reuse the cycle-detection
  logic that already exists in buildTree/validation — don't rewrite it) — if the drop
  target is a descendant of the node being dragged, reject the drop (visual feedback:
  a not-allowed cursor / red drop indicator).
- A keyboard alternative for the same operation is MANDATORY (mouse-only drag-drop
  would violate NFR-4/keyboard-accessibility, which is already one of our
  differentiators — see how klad handles this with an 'm' mode to activate drag mode
  via keyboard; the pattern can be borrowed but adapted to the keyboard nav scheme
  already in place here).
- Opt-in prop: `draggable?: boolean` (default false) — don't change the default
  behavior for existing users.

Requirements:
- Implement dragging with pointer events (not native HTML5 drag-and-drop, to stay
  consistent across devices, touch included).
- Visual: an indicator when hovering over a valid drop-target parent (line/highlight),
  and a rejection indicator when the target is invalid (a cycle, or the target is the
  node itself).
- Tests: extensive — drop onto a valid parent (callback called with the correct
  arguments), a drop that would create a cycle (callback NOT called), dropping onto
  itself, the keyboard alternative path end-to-end.
- New FR + an amendment in PRD.md (this is a large feature, likely needs to go in as
  an amendment section like the existing §11), a complete row in ANALYSIS.md.
```

---

## 7. Radial / dendrogram layout

```text
[include the Context block above]

Task: this is the roadmap item already mentioned in TECHNICAL_DESIGN.md §8 (radial
view, SVG renderer, shared hooks) — time to spec and implement an MVP.

Requirements:
- Read TECHNICAL_DESIGN.md §8 first, then write an addendum detailing the final
  design before coding (a separate renderer, but reusing buildTree/useExpansion —
  don't duplicate the data logic).
- Scope the MVP explicitly and WRITE that scope into PRD.md as Non-Goals for anything
  deliberately deferred (common example: the radial MVP might not support zoom/pan or
  full keyboard-nav parity with the tree view — if so, state that outright as
  beta/experimental, do NOT let it be silently incomplete the way T-3 in ANALYSIS.md
  called out for overstated a11y claims).
- Prop: `layout?: 'tree' | 'radial'` on <OrgChart>.
- Tests: at minimum a snapshot render + tests for the shared data logic (make sure
  the existing buildTree/useExpansion tests don't need to change — that's the signal
  that the reuse is done correctly).
- Update the README (new feature + a radial screenshot/GIF, generated via
  `npm run visuals`).
- New FR in PRD.md + a row in ANALYSIS.md, honestly flagging its status (🟡 if it's
  genuinely just an MVP/beta).
```

---

## 8. Large-scale research (Canvas/Web Worker) — SPIKE, not implementation

```text
[include the Context block above]

Task: this is a RESEARCH PROMPT, not an implementation prompt — don't jump straight
into writing a Canvas/WebWorker renderer.

Requirements:
- Run `npm run bench` with synthetic datasets much larger than what exists today
  (10,000 / 50,000 / 100,000 nodes), using the current DOM-based approach as-is
  (don't change the architecture yet).
- Measure: buildTree time, initial render time at various expanded percentages,
  re-render time after a single toggle, and (if feasible) a rough memory footprint.
- Compare those numbers against the competitor claims in COMPETITIVE_ANALYSIS.md
  (unicef: 1 million collapsed/5,000 expanded; klad: 20,000-node stress test) — write
  a conclusion: at what node count does our DOM approach start feeling slow (against
  the NFR-1 target: render <100ms, toggle <16ms)?
- Write the results up as a new addendum in ANALYSIS.md (not a code PR), with a
  go/no-go recommendation: is a rewrite to canvas/Web Worker worth the effort for
  this project's target use case (a portfolio component, not an enterprise HRIS with
  millions of employees), or is it enough to document as a known limitation in the
  README.
- Do NOT implement the rewrite in this prompt/session — that's a major decision that
  needs explicit sign-off once this research data exists.
```
