# Changelog

Follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions ≤1.1.0 are historical milestones reconstructed from `git log` and `ANALYSIS.md`, from before the package was ever published to npm; starting at 1.2.0 the version numbers here track actual npm release tags.

## [Unreleased]

### Removed

- The `ormas` theme preset — removed from `THEMES`/`THEME_ORDER` (a breaking change for anyone already using `getThemeStyle('ormas')`; it never shipped in a published version, so this is safe).

## [1.2.0] — 2026-09-15

First publish to the npm registry. Includes: publish readiness tracked in `ANALYSIS.md` §5, theme presets + dummy avatars in the demo, and tooling migration (pnpm, Biome, Ladle).

### Added

- `prepublishOnly` script (`pnpm build:lib`) so `dist-lib` can never go out stale or empty if the manual build step is forgotten. An "Installation" section in the README (`npm install org-hierarchy-tree`).
- `OrgChartHandle.exportToPng(filename?)` — exports the currently rendered tree (visible nodes only, independent of the current zoom/pan) to a PNG file via `html-to-image`, dynamically imported so consumers who don't use it don't pay its bundle cost. An "Export PNG" button was added to the demo. See `TECHNICAL_DESIGN.md` §7b and `PRD.md` §12 (FR-12).
- `LICENSE` (MIT) and publish metadata in `package.json`: `repository`, `homepage`, `bugs`, `author`, `keywords`, `sideEffects: ["*.css"]`.
- `'use client'` in `OrgChart.tsx` for React Server Components / Next.js App Router compatibility. Preserved through a Rollup output banner so it doesn't get stripped during the build.
- Tests for `ZoomPane`: zoom in/out, reset, drag-to-pan, and a regression test for `onClickCapture` vs `onNodeClick`. There were previously no tests at all for this interaction.
- `.github/workflows/ci.yml` — runs on every push and PR to `main`, verification only. `deploy-demo.yml` remains the only workflow that deploys to Pages.
- The README now links to `PRD.md`, `TECHNICAL_DESIGN.md`, `ANALYSIS.md`, and this changelog, which was newly added.
- Theme presets (`THEMES`, `THEME_ORDER`, `getThemeStyle()`) exported from the lib: `default`, `saas`, `devDark`, `editorial`, `corporate`, `industrial`, `government`, `startup` — each just a bundle of `--orgchart-*` custom property values, so consumers can use them directly or build their own preset in the same shape without touching the component code. The demo gets a theme switcher that persists its choice to `localStorage`. Two new custom properties (`--orgchart-avatar-radius`, `--orgchart-line-width`) were added to `OrgChart.module.css`, with defaults matching the previous look so it's backward-compatible.
- Demo: some nodes in `sampleData` were given a dummy `avatarUrl` (DiceBear SVG, deterministic per id) — intentionally only some of them, so both the photo and initials-fallback card states (`NodeCard`, FR-9) are visible in the live demo at once.
- Migrated the package manager from npm to pnpm: `pnpm-lock.yaml` + `pnpm-workspace.yaml`, `package.json` gained a `packageManager` field, CI (`ci.yml`, `deploy-demo.yml`) now uses `pnpm/action-setup`. Commands in the README changed from `npm ...` to `pnpm ...`.
- Biome as linter + formatter (there was none before): `biome.json`, `lint`/`format`/`check` scripts, and `pnpm exec biome check .` added to CI. A few small a11y gaps were fixed (a missed `type="button"`, a stable React key, etc.); four other findings that are actually part of an intentional ARIA treeview pattern (roving tabindex) were suppressed with `biome-ignore` + a reason, rather than force-refactored away.
- Component workshop using [Ladle](https://ladle.dev) (`src/lib/OrgChart.stories.tsx`) — 5 separate stories: `Default`, `ThemePicker` (switch between the 8 theme presets via a control), `CustomRenderNode`, `DirtyData`, `ZoomAndPan`. `pnpm story` script (dev, ~1s cold start) and `pnpm story:build` (also checked in CI).

### Fixed

- `vite-plugin-dts` was also generating a `.d.ts` for `OrgChart.stories.tsx` and letting it leak into `dist-lib` (caught via `npm pack --dry-run` before the first publish) — `vite.lib.config.ts` now excludes `**/*.stories.*` too, same as `*.test.*`.

## [1.1.0] — 2026-08-06

A large batch following the resolution of the `ANALYSIS.md` §6 addendum (T-1 through T-8).

### Added

- 13 new component tests (jsdom + Testing Library) closing out FR-4/5/6/8/9, which were previously untested.
- Full keyboard navigation following the [WAI-ARIA tree](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/) pattern: roving tabindex, arrow keys, `aria-level`/`aria-setsize`/`aria-posinset`.
- Zoom & pan (`ZoomPane`) — scroll to zoom-to-cursor, drag to pan, overlay buttons.
- Search highlight (`highlightedIds`, `state.isHighlighted`).
- `OrgChartHandle` (`expandAll()`/`collapseAll()` via ref).
- `fromNested()` and `ancestorsOf()` helpers (recorded as an amendment in PRD §11).
- Benchmark harness (`npm run bench`) — measures `buildTree` and render instead of claiming performance without evidence.
- Demo screenshot & GIF (Playwright, `npm run visuals`) for visually verifying the connector CSS.

### Fixed

- `onDataError` was being called repeatedly on every render when a consumer wrote the callback inline — now stored in a ref, so the effect only triggers on actual `errors` changes.
- `defaultExpandedDepth` wasn't re-applied when the identity of `data` changed (uncontrolled mode) — now defined and re-implemented properly.
- `justify-content: center` on the scroll container made the left side of a wide chart unreachable by scrolling (found during visual verification) — replaced with `.root { width: max-content; margin: 0 auto }`.
- `vite-plugin-dts` was added so the `types` field in `package.json` no longer points at a file that was never generated.

## [1.0.0] — 2026-07-15

Initial release.

### Added

- `<OrgChart data={OrgNode[]} />` from a flat array — multi-root (multi-company), not just a single tree.
- Per-node collapse/expand with a direct-report count badge, separate from `onNodeClick`.
- Controlled (`expandedIds`/`onExpandedChange`) and uncontrolled (`defaultExpandedDepth`) expand state via `useExpansion`.
- Full `renderNode` override with `NodeState` (isExpanded, hasChildren, childCount, depth).
- Dirty-data validation (orphan → becomes a root, cycle → one edge is cut, duplicate id → the first one wins) via `buildTree`, reported through `onDataError`.
- Default card (`NodeCard`), zero-config.
- Logic separated from the view (`buildTree`, `useExpansion` are DOM-free) — the entire data-layer test suite runs in the `node` environment without jsdom.
