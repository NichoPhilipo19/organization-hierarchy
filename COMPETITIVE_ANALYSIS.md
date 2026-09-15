# Competitive Feature Analysis — org-hierarchy-tree

Sources (scraped from GitHub, September 2026): [bumbeishvili/org-chart](https://github.com/bumbeishvili/org-chart) (1.2k⭐, D3), [ssthouse/tree-chart](https://github.com/ssthouse/tree-chart) (472⭐, D3/canvas), [unicef/react-org-chart](https://github.com/unicef/react-org-chart) (293⭐, D3-SVG), [daniel-hauser/react-organizational-chart](https://github.com/daniel-hauser/react-organizational-chart) (194⭐, JSX), [dabeng/react-orgchart](https://github.com/dabeng/react-orgchart) (150⭐, jQuery-style React port), [artdong/react-org-tree](https://github.com/artdong/react-org-tree) (92⭐), [n1crack/klad](https://github.com/n1crack/klad) (33⭐, canvas+worker, AGPL), [paulosabayomi/treeSpider](https://github.com/paulosabayomi/treeSpider) (21⭐, D3).

Legend: ✅ already in org-hierarchy-tree · 🟡 partially present · ❌ not yet present

## 1. Layout & Orientation
- 🟡 Horizontal vs vertical orientation toggle — present in bumbeishvili, artdong, ssthouse; we're vertical-only for now
- ❌ Radial / dendrogram / wheel layout — klad, treeSpider (`hSpiderWalk`) — already noted in TECHNICAL_DESIGN.md §8
- ❌ Dynamic layout switching at runtime — bumbeishvili
- ❌ Data-driven node sizing (node size varies with the data) — bumbeishvili

## 2. Interaction & Editing
- ✅ Per-node expand/collapse, direct-report count badge
- ✅ expandAll/collapseAll via ref
- ✅ onNodeClick separate from the expand toggle
- ❌ Drag-and-drop reparenting (move a node between parents/siblings) — dabeng, klad, bumbeishvili
- ❌ Multi-select nodes — dabeng (`multipleSelect`)
- ❌ Inline edit (change name/title directly on the card) — dabeng
- ❌ Programmatic add/remove node (`addNode`/`removeNode` API) — bumbeishvili

## 3. Navigation & Search
- ✅ Search highlight + auto-expand path (`ancestorsOf`)
- ✅ Full WAI-ARIA keyboard navigation (↑↓→← Home/End Enter/Space) — **more complete than every competitor here**, most of them have no keyboard nav at all
- ❌ Center/focus a node on screen (auto-pan to a given node) — bumbeishvili, klad
- ❌ Fit-to-screen / zoom-extent (reset zoom so everything renders in view) — bumbeishvili, unicef
- ❌ Go-to-node search with a camera animation — klad

## 4. Zoom & Pan
- ✅ Optional zoom & pan
- ❌ Zoom in/out/fit buttons that can bind to custom elements (the `zoomInId`/`zoomOutId`/`zoomExtentId` pattern) — unicef

## 5. Export
- ❌ Export to PNG — dabeng, unicef, bumbeishvili (every major competitor has this)
- ❌ Export to PDF — dabeng, unicef
- ❌ `getChartState()` / save-restore config (zoom position, expand state) — bumbeishvili, unicef (`loadConfig`/`onConfigChange`)

## 6. Data & Import
- ✅ `fromNested()` converter
- ✅ Dirty-data validation (orphan/cycle/duplicate) with a structured report via `onDataError` — **a unique feature**, no competitor has anything this thorough (klad only broadcasts a `warning` event for orphans, with no cycle/duplicate handling)
- ❌ Direct CSV import — bumbeishvili
- ❌ Lazy-load children/parent via callback (for very large trees, on-demand loading from an API) — unicef

## 7. Appearance & Theming
- ✅ Theming via CSS custom properties
- ❌ Ready-made theme presets (bumbeishvili: Default/Sky/Circles/Oval/Clean/Futuristic) — a quick win, just a few CSS variable sets + docs
- ❌ Per-connector custom line style (angle vs curve, color, width, radius) — unicef + daniel-hauser
- ❌ Minimap — bumbeishvili, klad

## 8. Performance & Scale
- ✅ O(n) buildTree, collapsed subtrees aren't rendered to the DOM (already measured & published, see README §Performance)
- ❌ Very-large-scale node claims (1 million collapsed / 5,000 expanded — unicef; 20k-node stress test — klad) — we haven't benchmarked at this scale
- ❌ Canvas/Web Worker rendering for very large trees — klad (a completely different architecture; our DOM-based approach likely won't hold up as well past >50k nodes — a trade-off to be aware of, not just "not yet implemented")

## 9. Framework Support
- 🟡 React-only by design; the major competitors (bumbeishvili, ssthouse) are multi-framework (Vue/Angular) — this is a strategic decision, not just a missing feature

## Priority Recommendations (quick win → large)

1. **PNG export** — cheap (html-to-image/dom-to-image), widely used by competitors, high perceived value
2. **CSS theme presets** (Default/Dark/Minimal/etc.) — just a few more custom property sets + docs
3. **Horizontal layout toggle** — extend the existing CSS connector logic
4. **Fit-to-screen / center-node** — zoom/pan logic already exists, just needs 1 new function
5. **PDF export** — reuse the PNG export (render into a PDF via jsPDF)
6. **Drag-and-drop reparenting** — large effort (needs real-time cycle validation + `parentId` updates), but the most frequently requested feature functionally
7. **Radial/dendrogram layout** — already on the roadmap, large effort (needs a separate SVG renderer, see TECHNICAL_DESIGN.md §8)
8. **Canvas/Web Worker for very large trees** — research the architecture thoroughly first, don't rush — only relevant if the target use case genuinely needs >50k nodes
