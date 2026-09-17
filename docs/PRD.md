# PRD — Org Hierarchy Tree Component

**Version:** 1.0 · **Date:** 15 July 2026 · **Owner:** Nicho Philipo · **Status:** Approved for v1

---

## 1. Background & Problem Statement

Every HR/HCMS and enterprise application needs to visualize organizational structure: org charts, reporting lines, multi-company structures. Existing org-chart libraries typically suffer from one of these problems: locked into a single visual mode, forcing a specific nested data format, dependent on heavy dependencies (full d3), or not giving consumers control over styling.

This project builds a **reusable React component** for rendering an organizational hierarchy from flat data, with an idiomatic React API — while also serving as a portfolio piece that demonstrates library API design skills, not just another CRUD app.

## 2. Goals & Non-Goals

### Goals (v1)

| # | Goal | Success metric |
|---|---|---|
| G1 | Render a top-down org tree with visual connectors | A tree with 3+ levels renders correctly without broken layout |
| G2 | Collapse/expand per node | Toggle works on a tree of ~100 nodes with no perceptible lag (<16ms per toggle) |
| G3 | Multi-company / multiple roots | ≥2 roots render side by side from a single dataset |
| G4 | Zero *required* runtime dependency other than React | `dependencies` in package.json contains no eagerly-loaded runtime dependency — `html-to-image` is present but reached only via a dynamic `import()` inside `exportToPng` (NFR-2) |
| G5 | Consumers can fully customize node appearance | `renderNode` override works without CSS hacks |
| G6 | Dirty data does not break rendering | Orphans/cycles/duplicates are handled + reported |

### Non-Goals (v1) — explicitly deferred

- Zoom & pan (v2)
- Radial/alternate view (v2)
- Drag-and-drop org restructuring (not yet planned)
- Editing data from within the chart — this component is a **read-only view**
- Full virtualization for thousands of simultaneously visible nodes
- Publishing to the npm registry (buildable as a library is enough)

## 3. Target Users

| Persona | Needs | Priority |
|---|---|---|
| **Library-consuming developer** (primary persona) | Clear API, natural (flat) data format, TypeScript types, easy customization | P0 |
| **HR application end-user** | Easy-to-read chart, intuitive expand/collapse navigation, visible subordinate count when collapsed | P0 |
| **Recruiter/portfolio reviewer** | A demo that runs out of the box and looks polished; code that demonstrates technical depth | P1 |

## 4. User Stories & Requirements

### P0 — required for v1

- **US-1** — As a developer, I can render an org chart with just `<OrgChart data={flatArray} />` and no other configuration.
- **US-2** — As an end-user, I can collapse/expand branches, and when collapsed I can see the subordinate count immediately (badge count).
- **US-3** — As a developer, I can replace the node's appearance with my own component (`renderNode`).
- **US-4** — As a developer, I can control expand state from the outside (controlled mode) for features like "expand all" or deep-linking.
- **US-5** — As a developer, I get a structured error report if the data contains orphans/cycles/duplicates, and the chart still renders as best it can.
- **US-6** — As an end-user, I can see multiple companies (multiple roots) in a single chart.
- **US-7** — As a developer, I can receive a node-click event to open a detail view (e.g. an employee profile side panel).

### P1 — best effort for v1

- **US-8** — As an end-user with a keyboard/screen reader, I can navigate the tree (`role="tree"`, `aria-expanded`, toggle via Enter/Space).
- **US-9** — As a developer, I see a customizable empty state when data is empty.

### P2 — backlog

- **US-10** — Expand/collapse all via imperative ref.
- **US-11** — Arrow-key navigation between nodes.

## 5. Functional Requirements

| ID | Requirement | Story |
|---|---|---|
| FR-1 | Flat array input `{id, parentId, name, title?, avatarUrl?, data?}` | US-1 |
| FR-2 | Node with `parentId: null` is treated as root; multiple roots are supported | US-6 |
| FR-3 | Default expand up to depth 1 (root + first level); configurable via `defaultExpandedDepth` | US-2 |
| FR-4 | Expand toggle is a control separate from the card click | US-2, US-7 |
| FR-5 | Badge shows child count when node is collapsed | US-2 |
| FR-6 | Controlled mode (`expandedIds` + `onExpandedChange`) and uncontrolled mode coexist | US-4 |
| FR-7 | Data validation: orphan → becomes root, cycle → edge is broken, duplicate id → first-wins; all reported via `onDataError` | US-5 |
| FR-8 | `renderNode(node, state)` receives state `{isExpanded, hasChildren, childCount, depth}` | US-3 |
| FR-9 | Default card (name, title, avatar) available with no configuration | US-1 |
| FR-10 | Collapsed subtree is not rendered to the DOM | G2 |

## 6. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-1 | **Performance:** a 100-node dataset with 20% expanded → initial render < 100ms on modern hardware; toggle < 16ms |
| NFR-2 | **Dependency:** zero *required* runtime dependency (React as peer); `html-to-image` is dynamically imported, only for `exportToPng` (FR-12) — a consumer who never calls it never downloads it |
| NFR-3 | **Type safety:** public API fully typed, strict mode, no `any` on the public surface |
| NFR-4 | **Accessibility:** ARIA tree semantics, keyboard-operable toggle (P1) |
| NFR-5 | **Browser:** evergreen browsers (latest Chrome/Firefox/Safari/Edge); no IE support |
| NFR-6 | **Testability:** data logic (buildTree, expansion) separated from rendering and unit-tested |

## 7. v1 Deliverables

1. Library source in `src/lib` — buildable, tree-shakeable, with a barrel export.
2. Demo page (Vite dev server) with dummy data of ±50 nodes, 2 companies.
3. Unit tests for `buildTree` and expansion logic.
4. Documentation: this PRD, the Technical Design, and a usage README (README to follow in v1.1 — not a release blocker).

## 8. Success Metrics (portfolio context)

- A reviewer can run the demo with `npm install && npm run dev` with no extra steps.
- All acceptance criteria in the Definition of Done (Technical Design §9) are green.
- The code demonstrates: controlled/uncontrolled API design, render props, defensive data validation, and logic/view separation.

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| CSS connector breaks for certain child-count combinations (1 child, even/odd children) | Visual defects are fatal for a portfolio piece | Manual visual testing with a dataset covering 1-child, 2-child, and deep-subtree cases |
| Very wide tree overflows the screen | Poor UX | `overflow: auto` on the container (v1); zoom/pan in v2 |
| Scope creep into v2 features (radial, zoom) | v1 never ships | Non-goals are locked in this PRD; new features require a PRD amendment |
| Pathological data (10,000 nodes) makes tree building slow | Rare in real cases | buildTree is O(n); beyond that it's documented as a v1 limitation |

## 10. Open Decisions

| # | Question | Status |
|---|---|---|
| OQ-1 | Final npm package name | Deferred — not published in v1 |
| OQ-2 | RTL layout support | Deferred to v2, no demand yet |
| OQ-3 | Theming via CSS custom properties vs. className only | **Decided:** CSS custom properties for the default card's colors/spacing; `renderNode` for full customization |

---

## 11. Amendment — v1.1/v2 (15 July 2026)

Per the rule in §9 ("new features = PRD amendment"), the following scope was officially added and has been implemented:

| Item | Origin | Status |
|---|---|---|
| US-8 full accessibility (roving tabindex, aria-level/setsize/posinset) | P1 v1 | ✅ + component test |
| US-10 `expandAll/collapseAll` via imperative ref | P2 backlog | ✅ + test |
| US-11 arrow-key navigation (full WAI-ARIA tree) | P2 backlog | ✅ + test |
| Zoom & pan (`zoomable` prop, zero-dependency) | Non-goal v1 → v2 | ✅ |
| Search/highlight (`highlightedIds`, `ancestorsOf()`) | v2.1 roadmap | ✅ |
| `fromNested()` helper | Design §1 | ✅ + test |
| Component tests for the interaction layer + NFR-1 benchmark | Analysis finding | ✅ 32 tests, measured numbers |

Still **out of scope** (backlog with a reminder): SVG radial view, npm publish (OQ-1), RTL (OQ-2). New behavior defined: `defaultExpandedDepth` is re-applied when `data` changes in uncontrolled mode (see Technical Design §7).

## 12. Amendment — PNG Export (5 September 2026)

| Item | Origin | Status |
|---|---|---|
| US-12 — As a developer, I can trigger an export of the currently rendered chart to a PNG file from my own button, without adding a dependency cost for consumers who never use it. | Backlog v1.1/v2 (§11) | ✅ |

**FR-12** — `OrgChartHandle.exportToPng(filename?: string): Promise<void>` captures the currently rendered tree (visible nodes only — collapsed subtrees are automatically excluded per FR-10) and triggers a PNG file download. Implemented using `html-to-image`, *dynamically imported* inside its own method so consumers who never call `exportToPng` don't pay the bundle cost of that library (NFR-2 is preserved — see Technical Design §Export).
