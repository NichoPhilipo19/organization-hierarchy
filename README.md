# org-hierarchy-tree

A reusable React component for rendering an organization hierarchy from **flat data** — org chart, reporting lines, multi-company structures. Zero required runtime dependency (React is the only peer), fully typed, ~5 kB gzip. (`html-to-image` is dynamically imported only if you call `exportToPng` — see "Export to PNG" below — so it never touches your bundle otherwise.)

**🔗 <a href="https://nichophilipo19.github.io/organization-hierarchy/" target="_blank" rel="noopener noreferrer">Live demo</a>** — expand/collapse, search, zoom & pan right in your browser.

![Org Hierarchy Tree — multi-company org chart](docs/demo.png)

*Interactions: expand/collapse, expand all, search + highlight, zoom & pan:*

![Demo interactions — collapse/expand, search highlight, zoom & pan](docs/demo.gif)

## Installation

```bash
npm install org-hierarchy-tree
# or: pnpm add org-hierarchy-tree
# or: yarn add org-hierarchy-tree
```

`react` and `react-dom` >=18 are peer dependencies (not installed automatically).

```tsx
import { OrgChart } from 'org-hierarchy-tree';
import 'org-hierarchy-tree/style.css'; // required — CSS is not auto-injected

<OrgChart
  data={[
    { id: 'ceo', parentId: null, name: 'Aminah', title: 'CEO' },
    { id: 'cto', parentId: 'ceo', name: 'Budi', title: 'CTO' },
    { id: 'eng', parentId: 'cto', name: 'Citra', title: 'Engineer' },
  ]}
/>;
```

## Features

Per-node collapse/expand with a direct-report count badge · multiple roots (multi-company) · controlled & uncontrolled expand state · full `renderNode` override · dirty-data validation (orphan/cycle/duplicate) with a structured report · keyboard navigation following the WAI-ARIA tree pattern · optional zoom & pan · search highlight · `expandAll/collapseAll` via ref · export to PNG via ref · 8 ready-to-use theme presets (`THEMES`) on top of theming via CSS custom properties.

## Running the demo

```bash
pnpm install
pnpm dev        # Vite demo: 2 companies, ~50 nodes, dirty dataset, search, zoom
pnpm test           # 72 unit + component tests
pnpm bench      # buildTree & render benchmarks
pnpm build:lib  # → dist-lib/ (index.js + index.d.ts + style.css)
pnpm visuals    # regenerate the README screenshot/GIF (needs npx playwright install chromium)
pnpm story      # component workshop (Ladle) — each OrgChart state as its own story
pnpm check      # Biome: lint + format + organize imports (--write)
```

## Data shape

A flat array — the natural shape coming out of an API/database, no transformation needed:

```ts
interface OrgNode {
  id: string;
  parentId: string | null; // null = root; multiple roots = multi-company
  name: string;
  title?: string;
  avatarUrl?: string;
  data?: Record<string, unknown>; // free-form payload, passed through to renderNode
}
```

Have nested data instead? `fromNested(nested)` converts it in one call.

> `data` should be referentially stable across renders (state/memo, not an inline array). When the identity of `data` changes, the tree is rebuilt and, in uncontrolled mode, `defaultExpandedDepth` is re-applied.

## Props

| Prop | Type | Description |
|---|---|---|
| `data` | `OrgNode[]` | Required. Flat array. |
| `renderNode` | `(node, state) => ReactNode` | Override the card. `state = { isExpanded, hasChildren, childCount, depth, isHighlighted }` |
| `defaultExpandedDepth` | `number` | Uncontrolled. Defaults to `1` (root + level 1 open). |
| `expandedIds` | `ReadonlySet<string>` | Controlled. Contains the ids of the nodes that are **open**. |
| `onExpandedChange` | `(ids: Set<string>) => void` | Called when the user toggles a node. |
| `onNodeClick` | `(node) => void` | Card click — separate from the expand toggle. |
| `onDataError` | `(errors: TreeError[]) => void` | Orphan/cycle/duplicate — called once per data change, safe to pass inline. |
| `highlightedIds` | `ReadonlySet<string>` | Search-result nodes — the card gets a ring, and `state.isHighlighted` is available for a custom renderNode. |
| `zoomable` | `boolean` | Zoom (scroll/buttons) & pan (drag). Defaults to `false`. |
| `emptyState` | `ReactNode` | Shown when `data` is empty. |
| `className` | `string` | Extra class on the container. |
| `ref` | `Ref<OrgChartHandle>` | `{ expandAll(), collapseAll(), exportToPng(filename?) }` |

### Controlled vs. uncontrolled

Follows the `value`/`defaultValue` convention: pass `expandedIds` → controlled (state is yours); omit it → internal state, initialized from `defaultExpandedDepth`.

```tsx
const [expanded, setExpanded] = useState(new Set(['ceo']));
<OrgChart data={data} expandedIds={expanded} onExpandedChange={setExpanded} />;
```

### Search + auto-expand path

```tsx
import { ancestorsOf } from 'org-hierarchy-tree';

const hits = data.filter((n) => n.name.includes(q)).map((n) => n.id);
setExpanded((prev) => {
  const next = new Set(prev);
  hits.forEach((id) => ancestorsOf(data, id).forEach((a) => next.add(a)));
  return next;
});
<OrgChart data={data} highlightedIds={new Set(hits)} ... />;
```

### Keyboard

Tab into the chart (roving tabindex — a single tab stop), then: `↑`/`↓` between visible nodes, `→` expand / move to first child, `←` collapse / move to parent, `Home`/`End` jump to first/last, `Enter`/`Space` activate (`onNodeClick`, or toggle if there isn't one).

### Theming

The default card & connectors read CSS custom properties — set them on any container:

```css
.my-chart {
  --orgchart-card-bg: #0b1220;
  --orgchart-line-color: #334155;
  --orgchart-highlight-color: #f79009;
  --orgchart-focus-color: #2e90fa;
}
```

**Theme presets** — 8 ready-to-use combinations exported from the lib (`THEMES`, `THEME_ORDER`, `getThemeStyle()`), each just a bundle of values for the custom properties above:

| Theme | Look |
|---|---|
| `default` | No extra styling (built-in). |
| `saas` | Indigo accent, rounded cards, soft shadow. |
| `devDark` | Dark mode, monospace, emerald accent. |
| `editorial` | Warm paper tone, serif headings, thin lines. |
| `corporate` | Navy & white, formal. |
| `industrial` | Concrete & safety orange, thick lines. |
| `government` | White & maroon red, serif — official-letterhead style. |
| `startup` | Purple-cyan, large radius, colorful shadow. |

```tsx
import { OrgChart, getThemeStyle } from 'org-hierarchy-tree';

<div style={getThemeStyle('startup')}>
  <OrgChart data={data} />
</div>;
```

`getThemeStyle(id)` returns a style object with that theme's custom properties — place it on any container wrapping `<OrgChart>` (custom properties flow down via CSS inheritance to the elements inside it), or grab `THEMES[id].vars` directly if you want to merge it with other styles. Building your own theme is just an object with the same shape (see the `ThemeId`/`OrgChartTheme` types) — no need to touch the component code at all.

Structural customization: use `renderNode`.

### Dirty data

The chart still renders as much as it can; every issue is reported via `onDataError`: an orphan becomes a root, a cycle has one parent-link cut (the node becomes a root), and for a duplicate id the first one wins.

![Dirty data handling — orphan, cycle, duplicate still render, with an error report](docs/demo-dirty.png)

### Export to PNG

```tsx
const chartRef = useRef<OrgChartHandle>(null);

<button onClick={() => chartRef.current?.exportToPng('org-chart.png')}>
  Export PNG
</button>
<OrgChart ref={chartRef} data={data} />;
```

Captures the tree as currently rendered (visible nodes only — collapsed subtrees simply aren't rendered, so they're automatically excluded), at natural resolution, regardless of `ZoomPane`'s current zoom/pan state. Rejects with an error if the chart isn't mounted yet (e.g. `data` is empty). Uses the small `html-to-image` library, *dynamically imported* inside the method itself — consumers who never call `exportToPng` don't download this dependency at all (see docs/TECHNICAL_DESIGN.md §7b).

## Performance (measured, not claimed)

`pnpm run bench` — renderToString, Linux container (mean figures):

| Scenario | Result | NFR-1 target |
|---|---|---|
| buildTree 100 / 1,000 / 10,000 nodes | 0.013 / 0.15 / 2.5 ms | O(n) |
| Render 100 nodes, ~20% expanded | 0.52 ms | < 100 ms |
| Re-render after 1 toggle (100 nodes) | 0.53 ms | < 16 ms |
| Render 1,000 nodes, depth-3 expanded | 2.0 ms | — |

Collapsed subtrees are not rendered to the DOM, so cost follows the number of *visible* nodes, not the total.

## Roadmap

A radial view (SVG renderer, shared hooks) is next — see docs/TECHNICAL_DESIGN.md §8.

## Documentation

- **[PRD.md](docs/PRD.md)** — requirements & user stories (FR-x/NFR-x), including scope deliberately deferred (radial view, npm publish).
- **[TECHNICAL_DESIGN.md](docs/TECHNICAL_DESIGN.md)** — design decisions and their reasoning: why a flat array, why CSS connectors instead of SVG, why logic is separated from the view.
- **[ANALYSIS.md](docs/ANALYSIS.md)** — traces PRD → design → code → test per ID, and logs bugs found along with how they were fixed.
- **[COMPETITIVE_ANALYSIS.md](docs/COMPETITIVE_ANALYSIS.md)** — how this lib compares to other React/D3 org chart libraries.
- **[TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md)** — pre-launch test plan and coverage gap analysis.
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — branching model and how to open a PR.
- **[CHANGELOG.md](CHANGELOG.md)** — change history per release.
