# Technical Design — Org Hierarchy Tree Component (v1)

**Stack:** React + TypeScript + Vite · **Styling:** CSS Modules · **v1 Scope:** Tree view + collapse/expand
**Reference:** [PRD.md](PRD.md) — this document implements FR-1…FR-10 & NFR-1…NFR-6

---

## 1. Data Structure

### Input: flat array (not nested)

```ts
interface OrgNode {
  id: string;
  parentId: string | null;   // null = root
  name: string;
  title?: string;            // job title
  avatarUrl?: string;
  data?: Record<string, unknown>; // consumer-owned free-form payload
}
```

**Why flat, not nested?**

- It's the most common shape coming from an API/database (`SELECT id, parent_id, name FROM employees`). Consumers don't need any transformation at all.
- Multi-company support comes for free: multiple nodes with `parentId: null` = multiple roots = multiple companies in one chart.
- Nested input can still be supported later via a `fromNested()` helper — that one-way conversion is cheap.

### Internal: a tree built once per data change

```ts
interface TreeNode {
  node: OrgNode;
  children: TreeNode[];
  depth: number;
}
```

Built via `buildTree(nodes: OrgNode[]): { roots: TreeNode[]; errors: TreeError[] }` — a single O(n) pass using a `Map<id, TreeNode>`, memoized with `useMemo` against `data`.

**Validation inside `buildTree` (no silent failures):**

| Case | Handling |
|---|---|
| `parentId` points to a non-existent id (orphan) | Promote to root + record in `errors` |
| Cycle (A→B→A) | The parent link of the first node found to repeat during the walk-up is broken, and that node is promoted to root — deterministic, all nodes still render. *(Revised from "break the last edge" to match the actual implementation — analysis finding T-7, 15 Jul 2026.)* |
| `parentId === id` (self-cycle) | Special case: promoted to root immediately + recorded as a cycle |
| Duplicate id | First node wins, recorded in `errors` |

`errors` is exposed via the `onDataError?` callback so consumers can log or toast it. The callback is kept in a ref inside `OrgChart` so that only `errors` triggers the effect — consumers can pass an inline callback without causing re-fires (fix T-2, with a regression test).

---

## 2. Props API

```tsx
interface OrgChartProps {
  data: OrgNode[];

  // Rendering
  renderNode?: (node: OrgNode, state: NodeState) => React.ReactNode;
  // NodeState = { isExpanded, hasChildren, childCount, depth }
  // default: built-in card (name + title + avatar)

  // Expand/collapse — uncontrolled OR controlled
  defaultExpandedDepth?: number;        // uncontrolled; default 1 (root + level 1 open)
  expandedIds?: ReadonlySet<string>;    // controlled
  onExpandedChange?: (ids: Set<string>) => void;

  // Interaction
  onNodeClick?: (node: OrgNode) => void;

  // Data quality
  onDataError?: (errors: TreeError[]) => void;

  className?: string;
}
```

**Design decisions:**

- `renderNode` is a render prop → consumers can style nodes completely without the library getting in the way. The default card still exists so zero-config usage works out of the box.
- The controlled/uncontrolled pattern follows React convention (`value`/`defaultValue`). If `expandedIds` is provided → controlled; if not → internal state derived from `defaultExpandedDepth`.
- The expand toggle is separate from `onNodeClick`: the expand control is its own element (the child-count badge below the card), and clicking the card does not toggle it. This avoids the "click for detail vs. click to collapse" conflict.

---

## 3. Collapse/Expand Logic

State: a `Set<string>` holding the ids of nodes that are **open**.

```ts
function useExpansion(props, roots) {
  const [internal, setInternal] = useState<Set<string>>(
    () => idsUpToDepth(roots, props.defaultExpandedDepth ?? 1)
  );
  const expanded = props.expandedIds ?? internal;

  const toggle = (id: string) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    props.expandedIds ? props.onExpandedChange?.(next) : setInternal(next);
  };
  return { expanded, toggle };
}
```

- A collapsed node's subtree is **not rendered at all** (not `display:none`). For orgs with hundreds of nodes, this is free, simple virtualization.
- The set holds open nodes (not closed ones) → nodes newly added to the data start out collapsed automatically, a safe default for large orgs.
- The expand badge shows `childCount` when collapsed (a standard org-chart pattern: "▼ 12").

---

## 4. Rendering: HTML + CSS, not SVG/canvas

v1 uses **nested flexbox + a CSS pseudo-element** for the connector lines — not d3/SVG.

```
<ul class="level">
  <li class="branch">
    <div class="card">…</div>
    <ul class="level">…children…</ul>
  </li>
</ul>
```

Connectors are drawn with `::before`/`::after` (border-top + border-left on `li`), a proven CSS org-chart technique.

**Rationale:**

- Layout is computed by the browser → no need to implement a tree-layout algorithm (Reingold–Tilford) ourselves.
- Nodes are real DOM → `renderNode` can contain any React component, normal event handling, selectable text, and `<ul>/<li>` semantics come free for accessibility.
- Zero dependency — the library's selling point.

**Consciously accepted trade-off:** SVG is more flexible for custom edge routing and a radial view. When the radial view lands (v2), its rendering will indeed be SVG (d3-hierarchy layout, still rendered as React) — the architecture separates *data/state* from *view*, so two renderers live side by side:

```
useOrgTree(data) ──► roots, errors      (shared)
useExpansion()   ──► expanded, toggle   (shared)
      ├─► <TreeView/>    v1, HTML+CSS
      └─► <RadialView/>  v2, SVG
```

---

## 5. Component & File Architecture

```
src/
  lib/                        # published
    OrgChart.tsx              # public component, wires hooks + view
    TreeView.tsx              # recursive <ul>/<li> renderer
    NodeCard.tsx              # default card
    useOrgTree.ts             # buildTree + memo + validation
    useExpansion.ts
    types.ts
    OrgChart.module.css       # connectors + layout
    index.ts                  # barrel export
  demo/                       # dev only, not published
    App.tsx
    sample-data.ts
```

`TreeView` is a simple recursive renderer:

```tsx
function Branch({ tree }: { tree: TreeNode }) {
  const { expanded, toggle } = useChartContext();
  const open = expanded.has(tree.node.id);
  return (
    <li className={s.branch}>
      <NodeSlot tree={tree} open={open} onToggle={toggle} />
      {open && tree.children.length > 0 && (
        <ul className={s.level}>
          {tree.children.map(c => <Branch key={c.node.id} tree={c} />)}
        </ul>
      )}
    </li>
  );
}
```

Context (`ChartContext`) carries `expanded/toggle/renderNode/onNodeClick` so there's no prop-drilling through the recursion.

---

## 5b. Theming (PRD OQ-3)

The default card and connectors read CSS custom properties with fallbacks:

```css
.card {
  background: var(--orgchart-card-bg, #fff);
  border: 1px solid var(--orgchart-card-border, #d0d5dd);
  border-radius: var(--orgchart-card-radius, 8px);
}
.level li::before { border-color: var(--orgchart-line-color, #d0d5dd); }
```

Consumers can theme via the container without touching the CSS module; structural customization uses `renderNode`.

## 6. Accessibility & Keyboard — WAI-ARIA tree pattern (revised, v1.1)

*Revised 15 Jul 2026 (finding T-3): the initial version was just "ARIA scaffolding." It now follows the [WAI-ARIA tree pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/) in full:*

- `<ul>/<li>` structure + `role="tree"` / `role="treeitem"` / `role="group"`, `aria-expanded`, **`aria-level`/`aria-setsize`/`aria-posinset`**, `aria-selected` for highlighting.
- **Roving tabindex** — a single tab stop for the whole tree; the most recently focused treeitem keeps `tabIndex=0`, the rest `-1`. The toggle button is set to `tabIndex=-1` (redundant with the arrow keys).
- Full keyboard support: `↑`/`↓` between visible nodes (DFS order), `→` expand / move to first child, `←` collapse / move to parent, `Home`/`End`, `Enter`/`Space` to activate (`onNodeClick`, falling back to toggle). Handled via event delegation on `<ul role="tree">`; the visible-node list is memoized from `roots × expanded`.
- Covered by component tests (jsdom + Testing Library + user-event).

---

## 7. Edge Cases

- **Empty data** → renders the empty-state slot (`emptyState?: ReactNode`, default simple text).
- **Multiple roots** → rendered side by side (the multi-company case). Roots are always expandable just like any other node.
- **Node with no name / minimal data** → default card falls back to `id`.
- **Data changes while expand state exists** → ids that disappear from the data are left in the Set (harmless, not rendered); no pruning needed.
- **Data changes in uncontrolled mode (T-4, now defined)** → `defaultExpandedDepth` is **re-applied** against the new tree (the "derive state during render" pattern). Consequence: `data` must be referentially stable across renders — an inline array will keep resetting the expansion state (the same requirement as the `useOrgTree` memo). Documented in the README + component test.
- **Very wide tree** → container `overflow: auto` (horizontal scroll); zoom & pan (`zoomable` prop) for extreme cases. **Bug note found during visual verification (15 Jul 2026):** `justify-content: center` on overflowing content prevented the left side from being scrolled to (`scrollLeft` can't go negative) — fix: `.root { width: max-content; margin: 0 auto }` (still centered when narrow, fully scrollable when wide).

---

## 7b. PNG Export (PRD §12, FR-12)

`OrgChartHandle.exportToPng(filename?: string): Promise<void>` — a new imperative method alongside `expandAll`/`collapseAll`.

**What gets captured:** the `<ul role="tree">` element itself (the same ref already used for keyboard nav, `treeRef`), **not** the `ZoomPane` viewport and **not** the current scale/translate state. This is a deliberate decision, for two reasons:

1. `treeRef` always points to the entire *rendered* subtree (visible nodes only — collapsed subtrees simply aren't in the DOM, per FR-10), regardless of whether `zoomable` is active, currently scrolled, or currently zoomed/panned. Consumers want the whole chart in the file, not whatever fragment happens to be visible in the viewport at the moment the export button is pressed.
2. `html-to-image` measures the target element via its own `scrollWidth`/`scrollHeight`, not `getBoundingClientRect()` — so a CSS `scale(...)` transform on an *ancestor* (`ZoomPane`'s `.zoomCanvas`) does not shrink or grow the captured result. The effect is automatically "print at natural resolution," with no need for an extra fit-to-screen API or resetting zoom before capture.

Consequence: `exportToPng` doesn't need a `fitContent` option — the result is always complete and at natural scale, because the capture target simply isn't the zoomed/panned area. Accepted trade-off: if a consumer wants a file that mirrors exactly what they see on screen (e.g. already cropped to one subtree via scrolling), that's out of scope for v1 — use a custom `renderNode` plus manual capture instead.

**Why `html-to-image` (not a native `<canvas>` or a screenshot API):** it serializes the actual DOM (including the theming CSS custom properties from §5b, and any custom `renderNode` card) into an SVG `foreignObject` and then into a PNG — no need to reimplement card rendering in canvas. Known trade-off: cross-origin fonts/images without CORS headers can fail to embed (a "tainted" canvas) — documented in the README rather than handled automatically (outside the library's control).

**Why a dynamic import, not a regular dependency:** `html-to-image` (~5.7 kB gzip) is added as a normal `dependencies` entry in `package.json` (not a devDependency — it runs in the consumer's runtime), but it is `import()`-ed inside `exportImage.ts`, invoked only once `exportToPng()` is actually called. The bundler (Vite/Rollup/webpack) splits it into a separate chunk; a consumer who never calls `exportToPng` never downloads that chunk at all. Verified: `npm run build:lib` produces `index.js` (main) plus a separate second chunk for `html-to-image` — see README §Performance for gzip numbers before/after.

**Error handling:** if `treeRef.current` is still `null` (chart not yet mounted — empty `data`, or the method called before the first render), `exportToPng` rejects with a clear message instead of silently no-op'ing or crashing inside `html-to-image`.

## 8. Roadmap After v1

1. ~~**v1.1** — arrow-key navigation, `expandAll/collapseAll` via imperative ref handle.~~ ✅ **Done 15 Jul 2026** (§6; `OrgChartHandle` via `forwardRef` + `useImperativeHandle`, `setExpanded` in `useExpansion` respects controlled/uncontrolled).
2. **v2** — ~~zoom & pan~~ ✅ **Done** (`ZoomPane.tsx`: non-passive wheel zoom-to-cursor, pointer-capture pan with a 4px threshold + click suppression, ±/reset overlay buttons; opt-in via the `zoomable` prop). Radial view (SVG renderer, shared hooks) is **still backlog**.
3. **v2.1** — ~~search/highlight node~~ ✅ **Done** (`highlightedIds` prop + `state.isHighlighted` + the `ancestorsOf()` helper for auto-expanding the path). ~~PNG export~~ ✅ **Done** (§7b; `OrgChartHandle.exportToPng()`, `html-to-image` dynamic import).
4. `fromNested()` helper (mentioned in §1) ✅ **Done** — `helpers.ts`, with a unit test.
5. **Next up in the backlog:** SVG radial view, npm publish (package name = PRD OQ-1), visual regression testing (Playwright) for the connector CSS.
6. ~~**Tooling wishlist:** migrate the package manager from npm to pnpm.~~ ✅ **Done 15 Sep 2026** — `pnpm-lock.yaml` + `pnpm-workspace.yaml` (`allowBuilds`), a `packageManager` field in `package.json`, CI (`ci.yml`, `deploy-demo.yml`) using `pnpm/action-setup`. The `npm run *` scripts in the README were replaced with `pnpm *`.
7. ~~**Tooling wishlist:** adopt Biome for lint + format.~~ ✅ **Done 15 Sep 2026** — `biome.json` (2-space, single quote, `organizeImports`), `lint`/`format`/`check` scripts, run in CI (`pnpm exec biome check .`). The `noNonNullAssertion` and `noDescendingSpecificity` rules are turned off (see the comment in `biome.json`); four a11y findings in the ARIA treeview pattern (`role="tree"`/`role="group"`, node clicks) are suppressed inline with `biome-ignore` + a reason, because keyboard handling is already covered by roving tabindex in `onTreeKeyDown` — not an actual gap.
8. ~~**Tooling wishlist:** a component showcase for this library.~~ ✅ **Done 15 Sep 2026** — chose **Ladle** (not Storybook): a cold start of ~1 second fits a project this small, and being Vite-based keeps it consistent with the demo app and the rest of the toolchain (pnpm, Biome), all picked for the same reason — speed. `src/lib/OrgChart.stories.tsx` — 5 separate stories: `Default`, `ThemePicker` (a `select` control over `THEME_ORDER`), `CustomRenderNode`, `DirtyData` (showing off `onDataError`), `ZoomAndPan`. Run with `pnpm story` (dev) / `pnpm story:build` (also checked in CI).

---

## 9. Definition of Done (v1)

- [x] `buildTree` + orphan/cycle/duplicate validation, with unit tests (Vitest)
- [x] `OrgChart` renders a 3+ level tree with correct CSS connectors *(component test for structure; manual visual verification is still recommended — `npm run dev`)*
- [x] Collapse/expand works: uncontrolled & controlled *(component test)*
- [x] Custom `renderNode` override works *(component test)*
- [x] Multi-root (multi-company) renders correctly *(unit test)*
- [x] Demo page with dummy data of ~50 nodes, 2 companies

### v1.1/v2 additions (15 Jul 2026)

- [x] Component tests for the interaction layer (13 tests: toggle, controlled, renderNode, onNodeClick, onDataError regression T-2, data-change T-4, ref handle, keyboard, highlight, empty state)
- [x] `build:lib` produces `.d.ts` via `vite-plugin-dts` (fix T-1)
- [x] Benchmark harness (`npm run bench`) — NFR-1 is now measured: rendering 100 nodes ~20% expanded ≈ 0.5 ms (target <100 ms); re-render after toggle ≈ 0.5 ms (target <16 ms); buildTree on 10,000 nodes ≈ 2.5 ms
- [x] README with CSS import instructions (fix T-8)
