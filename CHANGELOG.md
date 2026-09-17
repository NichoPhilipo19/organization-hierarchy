# Changelog

Follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions ≤1.1.0 are historical milestones reconstructed from `git log` and `ANALYSIS.md`, from before the package was ever published to npm; starting at 1.2.0 the version numbers here track actual npm release tags.

## [Unreleased]

### Added

- `.claude/CLAUDE.md` and `.claude/AGENTS.md` — project conventions and agent workflow guides for consistent AI-assisted contributions.
- `CONTRIBUTING.md` — branching model (GitHub Flow) and PR workflow.
- Test coverage per `docs/TESTING_STRATEGY.md`'s Pre-Launch Checklist: `themes.test.ts`
  and `index.test.ts` (the two High-priority gaps — theme presets and the public API
  surface had zero coverage before), keyboard-nav gaps in `OrgChart.test.tsx` (ArrowUp,
  Enter-without-`onNodeClick`, an unhandled key), wheel-to-zoom in `ZoomPane.test.tsx`
  (cursor-anchoring invariant, zoom-out direction, min/max clamp), and the remaining
  Low-priority edge cases: `NodeCard.test.tsx` (initials fallback + avatar rendering),
  `ChartContext.test.tsx` (`useChartContext()` throwing outside `<OrgChart>`), a
  multi-cycle case added to `buildTree.test.ts`, and `useExpansion.test.ts` (controlled
  and uncontrolled `toggle` with no `onExpandedChange`). `src/lib` coverage moved from
  65.19%/89.07%/90.24% to 100%/94.68%/97.5% (statements/branches/functions).
- `coverage.thresholds` (90/85/90/90, scoped to `src/lib/**`) in `vite.config.ts`, and
  `.github/workflows/ci.yml` now runs `pnpm test:coverage` instead of `pnpm test`, so a PR
  that drops coverage below those thresholds fails CI automatically.
- `.github/workflows/ci.yml`'s `test` job now annotates failed tests directly on the PR
  (`dorny/test-reporter`, fed by Vitest's `junit` reporter) and comments a per-file
  coverage report on every PR (`davelosert/vitest-coverage-report-action`, fed by the new
  `json-summary` coverage reporter in `vite.config.ts`) — a failure now shows exactly
  which test broke and how coverage moved, instead of just a red check.
- `.github/workflows/pr-title.yml` — checks every PR title against the Conventional
  Commit format from `CONTRIBUTING.md` (since squash merge uses the PR title as the
  commit message on `main`).

### Changed

- Moved `PRD.md`, `TECHNICAL_DESIGN.md`, `ANALYSIS.md`, `COMPETITIVE_ANALYSIS.md`, and `TESTING_STRATEGY.md` into `docs/`, alongside the existing README screenshots/GIFs.
- Reworded the "zero runtime dependency" claim in `README.md`, `docs/PRD.md` (G4/NFR-2), and `.claude/CLAUDE.md` to "zero *required* runtime dependency" — `html-to-image` has been a real (non-dev) `dependencies` entry since `exportToPng` shipped in 1.2.0, dynamically imported so it never enters a consumer's bundle unless they call that method. `docs/TECHNICAL_DESIGN.md` already documented this accurately; the other docs still claimed an unqualified zero.
- Fixed a stale test count (`README.md`: 32 → 72) and removed "publishing to npm" from the Roadmap section now that it's actually happening.
- Translated the remaining Bahasa Indonesia UI strings in the demo app (`src/demo/App.tsx`: theme label, dataset switch buttons, search placeholder, result count, data-error banner, node-clicked banner, export-failure log; `src/demo/sample-data.ts`: a header comment) to English, per `.claude/CLAUDE.md`'s all-English-in-files rule. Missed by the earlier repo-wide translation sweep.
- Split `.github/workflows/ci.yml`'s single `verify` job into four independent jobs — `lint`, `typecheck`, `test`, and `build` (the last depending on the first three) — so a failing PR check names the actual failure (e.g. "Test (Vitest + coverage)") instead of one opaque `verify`, and unrelated checks (lint, typecheck, test) run in parallel instead of one long sequential job.
- `.github/workflows/deploy-demo.yml` now runs `pnpm test:coverage` instead of the older `pnpm test -- --run`, matching `ci.yml`.

### Removed

- `CLAUDE_CODE_PROMPTS.md` — no longer used.
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
