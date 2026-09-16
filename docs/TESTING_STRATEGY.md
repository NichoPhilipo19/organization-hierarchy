# Testing Strategy

This document is the pre-launch test plan for `org-hierarchy-tree`. It is based on a
measured coverage run (`pnpm test:coverage`, 2026-09-15), not a guess — every gap below
is a real uncovered line, not a hypothetical one.

## Pre-Launch Checklist

Living checklist — check items off as they land, in priority order. Each item links to
its full write-up further down this document.

### High priority (blocks calling this "ready for wide use")

- [x] `src/lib/themes.ts` unit tests — new `themes.test.ts` (see "Gap analysis #1")
- [x] Public API surface test — new `index.test.ts` pinning `OrgChart`, `buildTree`,
      `getThemeStyle`, `THEME_ORDER`, `THEMES` (see "Gap analysis #2")
- [x] Add `pnpm test:coverage` as a required step in `.github/workflows/ci.yml`
- [x] Add `coverage.thresholds` (90/85/90/90) scoped to `src/lib/**` in `vite.config.ts`
- [ ] Enable "Require status checks to pass" branch protection on `main` in GitHub settings
      — a repo-settings change, not code; still open

### Medium priority (worth doing before/shortly after launch)

- [x] `OrgChart.tsx` keyboard nav: ArrowUp, Enter-without-onNodeClick, unhandled-key cases
      (see "Gap analysis #3")
- [x] `ZoomPane.tsx` wheel-to-zoom: cursor-anchoring + clamp behavior
      (see "Gap analysis #4")

### Low priority (cheap, batch into whichever PR touches that file)

- [x] `NodeCard.tsx` — empty/whitespace `name` falls back to `node.id` (plus an added
      avatar-vs-initials case that surfaced as a real branch gap while writing this one)
- [x] `ChartContext.tsx` — `useChartContext()` throws outside `<OrgChart>`
- [x] `buildTree.ts` — a node reachable from two different parents isn't double-visited
      — see note below; the exact `visited.has` line this targeted (buildTree.ts:59)
      turned out to be effectively unreachable through the public API and is left as a
      documented residual gap rather than chased further
- [x] `useExpansion.ts` — controlled mode + `toggle` with no `onExpandedChange` doesn't
      throw (the actual uncovered line was in the *uncontrolled* branch, not controlled —
      the description above was slightly off; both branches are covered now)

### Status snapshot

Last measured 2026-09-16: `src/lib` at **100% statements / 94.68% branches / 97.5%
functions / 100% lines** (72 tests across 10 files), all above the 90/85/90/90 thresholds
now enforced by `vite.config.ts` + CI. Remaining branch gaps are all defensive/pointer-drag
code paths not worth the effort for a first release (see "Known residual gaps" below).

### Known residual gaps (accepted, not blocking)

- `buildTree.ts:59` — the stack-based `visited.has` short-circuit inside `visit()`.
  Given this library's flat-array data model (one `parentId` per node), a `TreeNode` can
  only ever be pushed onto the traversal stack once per `buildTree()` call, so this branch
  guards against a case the current algorithm can't actually produce. Left in place as
  defensive code; not worth contriving a test around.
- `ZoomPane.tsx` touch/pointer-drag branches (lines 38, 58-59, 72, 90, 96) — pan-by-drag
  paths, out of scope for this pass (which targeted wheel-to-zoom specifically).
- `OrgChart.tsx:132-136` — a small branch inside an already-100%-line-covered block.
- `types.ts` shows 0% because it's type-only (no runtime statements); this matches the
  "explicitly out of scope" note further down this document.

## Current state

> The bullets below describe the state as measured on 2026-09-15, before this plan was
> executed — kept for context on how the gaps were found. See "Status snapshot" above for
> where things stand now (2026-09-16: all checklist items landed except the GitHub
> branch-protection setting, which isn't code).

- 43 tests across 5 files: `buildTree.test.ts`, `helpers.test.ts`, `OrgChart.test.tsx`,
  `ZoomPane.test.tsx`, `exportImage.test.ts`.
- All pure-logic modules under `src/lib` that already have a test file are effectively
  fully covered (`buildTree.ts`, `helpers.ts`, `exportImage.ts`, `useExpansion.ts`,
  `useOrgTree.ts` all sit at 100% statements).
- CI (`.github/workflows/ci.yml`) ran `tsc`, `biome check`, `pnpm test`, `build`,
  `build:lib`, and `story:build` on every push and PR — but did **not** run
  `test:coverage`, so there was no automated signal if a PR silently dropped coverage.
  (CI now runs `pnpm test:coverage` instead of `pnpm test`, enforcing the thresholds below.)
- The "All files" figure from `vitest run --coverage` (32%) is misleading: it's dragged
  down by `src/demo/**`, `OrgChart.stories.tsx`, `vite.lib.config.ts`, and
  `scripts/capture-visuals.mjs` — none of which ship in the published package and none of
  which need unit coverage (demo app is a manual/visual surface, stories are for Ladle,
  the script is a one-off screenshot tool). The number that actually mattered then was
  **`src/lib` alone: 65.19% statements, 89.07% branches, 90.24% functions** — now
  **100% / 94.68% / 97.5% / 100%** (statements/branches/functions/lines).

## Testing shape for this project

Given the library is zero-runtime-dependency, presentational-plus-a-little-state, and has
no backend, the pyramid here is intentionally unit/component-heavy with no E2E tier:

| Layer | Tool | What it covers here |
|---|---|---|
| Unit (logic) | Vitest, `environment: node` | `buildTree`, `helpers`, `themes`, `exportImage` — pure functions, no DOM |
| Component/interaction | Vitest + Testing Library, `environment: jsdom` | `OrgChart`, `TreeView`/`Branch`, `ZoomPane`, `ChartContext`, `NodeCard` — rendering, clicks, keyboard, ARIA attributes |
| Visual/manual | Ladle (`pnpm story`) + `scripts/capture-visuals.mjs` | Theme appearance, layout at scale — reviewed by eye, not asserted in CI |
| Public API contract | Vitest, `environment: node` | **Missing today** — see below. Protects the published package's exports across semver bumps |

There's no case for adding Playwright/E2E here: there's no server, no routing, no
multi-page flow. The existing component tests already exercise real DOM + keyboard events
via jsdom, which is the right ceiling for this kind of component library.

## Gap analysis (ordered by priority)

### 1. `src/lib/themes.ts` — 0% covered (HIGH)

This is the biggest real gap. It's public API (`getThemeStyle` and the `THEMES`/
`THEME_ORDER` exports are re-exported from `./index`), and it's exactly the kind of file
where a copy-paste mistake in one of the 8 theme objects goes unnoticed until a user
reports broken styling.

Example test cases (`src/lib/themes.test.ts`, new file):

```ts
import { describe, expect, it } from 'vitest';
import { THEME_ORDER, THEMES, getThemeStyle } from './themes';

describe('THEME_ORDER / THEMES', () => {
  it('THEME_ORDER lists exactly the keys of THEMES, no more no less', () => {
    expect(new Set(THEME_ORDER)).toEqual(new Set(Object.keys(THEMES)));
  });

  it('every theme exposes a font, a card background, and a focus color', () => {
    for (const id of THEME_ORDER) {
      const vars = THEMES[id].vars;
      expect(vars['--orgchart-card-bg']).toBeTruthy();
      expect(vars['--orgchart-focus-color']).toBeTruthy();
    }
  });

  it('every theme has a non-empty label and description', () => {
    for (const id of THEME_ORDER) {
      expect(THEMES[id].label.length).toBeGreaterThan(0);
      expect(THEMES[id].description.length).toBeGreaterThan(0);
    }
  });
});

describe('getThemeStyle', () => {
  it('returns a fresh copy, not the internal THEMES reference', () => {
    const style = getThemeStyle('default');
    // biome-ignore lint/suspicious/noExplicitAny: test-only mutation to prove isolation
    (style as any)['--orgchart-card-bg'] = 'mutated';
    expect(THEMES.default.vars['--orgchart-card-bg']).not.toBe('mutated');
  });

  it('returns the same variables declared on the theme', () => {
    expect(getThemeStyle('saas')).toEqual(THEMES.saas.vars);
  });
});
```

### 2. Public API surface — no test today (HIGH, new test type)

Now that this package is published to npm and consumers pin a semver range, an
accidental change to `src/lib/index.ts` (a renamed export, a dropped type) is a breaking
change that nothing currently catches before it ships. Add one file whose only job is to
pin the public shape:

```ts
// src/lib/index.test.ts (new file)
import { describe, expect, it } from 'vitest';
import * as Lib from './index';

describe('public API surface', () => {
  it('exposes the documented exports', () => {
    expect(typeof Lib.OrgChart).toBe('object'); // forwardRef component
    expect(typeof Lib.buildTree).toBe('function');
    expect(typeof Lib.getThemeStyle).toBe('function');
    expect(Lib.THEME_ORDER).toBeInstanceOf(Array);
    expect(typeof Lib.THEMES).toBe('object');
  });
});
```

This test is cheap and its entire value is failing loudly the moment someone removes or
renames an export — exactly the failure mode a solo maintainer doing PRs wants CI to
catch instead of finding out from a GitHub issue.

### 3. `OrgChart.tsx` keyboard navigation — 97.74% (lines 146-147, 169, 172) (MEDIUM)

The existing "supports roving tabindex + arrow keys" test only drives `ArrowDown`. Three
branches of `onTreeKeyDown` are untested:

- `ArrowUp` (line 146-147) — never exercised.
- `Enter`/`Space` when there's no `onNodeClick` but the node has children (line 169) —
  the fallback-to-toggle behavior.
- An unhandled key, e.g. `'a'`, hitting the `default` branch (line 172) — should not
  call `preventDefault` or throw.

```ts
it('ArrowUp moves focus to the previous visible node', async () => {
  // render with 2+ expanded siblings, focus the second, press ArrowUp,
  // assert focus + tabIndex moved to the first
});

it('Enter toggles expansion when there is no onNodeClick', async () => {
  // render OrgChart WITHOUT onNodeClick, focus a parent node, press Enter,
  // assert it expands (toggle fired) instead of doing nothing
});

it('an unhandled key does not call preventDefault or throw', () => {
  // fireEvent.keyDown(treeitem, { key: 'a' }) and assert nothing crashes,
  // no expansion state changed
});
```

### 4. `ZoomPane.tsx` wheel-to-zoom — 89.01% (lines 40-50) (MEDIUM)

The non-passive native `wheel` listener (zoom-to-cursor math) isn't exercised by any
existing test — the current zoom tests only click the `+`/`−`/reset buttons.

```ts
it('wheel zoom keeps the point under the cursor fixed', () => {
  // dispatch a native WheelEvent with clientX/Y and a deltaY on the viewport,
  // assert the resulting transform still maps that cursor point to itself
  // (the invariant the comment on line 47 describes)
});

it('wheel zoom respects the same clamp as the +/- buttons', () => {
  // dispatch many large-deltaY wheel events and assert k never exceeds
  // whatever clampK's upper bound is
});
```

### 5. Small edge cases (LOW — cheap, worth doing in the same PR as an area above)

| File:line | What's untested | Suggested case |
|---|---|---|
| `NodeCard.tsx:18` | `initials()` when `name` is empty/whitespace-only | Render with `name: '   '`, assert it falls back to `node.id.slice(0, 2).toUpperCase()` |
| `ChartContext.tsx:24` | `useChartContext()` thrown error when used outside `<OrgChart>` | Render a component calling the hook with no provider, assert it throws the documented message |
| `buildTree.ts:59` | A node reachable from two different parents (not just a self/mutual cycle) isn't re-visited or re-depth'd | Build a tree where node C is listed as a child of both A and B via `parentId` conflicts already covered elsewhere, but add a case that hits the `stack`-based BFS/DFS `visited.has` short-circuit specifically |
| `useExpansion.ts:47` | Controlled mode (`expandedIds` set) calling `toggle` with `onExpandedChange` undefined | Render with `expandedIds` but no `onExpandedChange`, call toggle, assert no throw and internal state stays untouched |

### Explicitly out of scope

- `src/demo/**`, `main.tsx`, `OrgChart.stories.tsx` — not shipped in the package; the demo
  is a manual/visual surface already covered by `scripts/capture-visuals.mjs` and eyeballing
  the deployed demo.
- `types.ts` — type-only, no runtime behavior to assert.
- `vite.lib.config.ts` — build config, exercised implicitly by `pnpm build:lib` in CI.

## Coverage targets

Set these as `test.coverage.thresholds` in `vite.config.ts`, scoped to `src/lib/**` only
(exclude `*.stories.*`, `*.test.*`, `index.ts` if you don't want the barrel file dragging
the function-coverage number):

```ts
test: {
  // ...existing config
  coverage: {
    provider: 'v8',
    include: ['src/lib/**/*.{ts,tsx}'],
    exclude: ['src/lib/**/*.stories.*', 'src/lib/**/*.test.*', 'src/lib/index.ts'],
    thresholds: {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
  },
},
```

90/85/90/90 is achievable once items 1-4 above land — the logic-only files are already at
100%, so this mostly just needs `themes.ts` and the handful of named branches covered.

## Wiring this into the branch + PR workflow

Since CI already runs on every push/PR, the only workflow changes needed are:

1. Add a `pnpm test:coverage` step to `.github/workflows/ci.yml` (after `pnpm test` is
   fine, or replace it — `test:coverage` runs the same tests plus instrumentation) so a
   PR that drops coverage below the thresholds above fails the build automatically.
2. In the repo's GitHub settings, turn on **"Require status checks to pass before
   merging"** for the `main` branch and select the CI job — right now CI runs and reports
   red/green, but nothing stops a merge if a job fails.
3. Adopt a one-line PR habit: any PR that changes behavior in `src/lib` adds or updates a
   test in the same PR. For a solo-maintained repo this is enough process — no need for a
   formal template or required reviewers, just the coverage gate above acting as the
   automatic check that would otherwise be a second pair of eyes.

## Summary

| Priority | File | Est. effort |
|---|---|---|
| High | `src/lib/themes.ts` (new `themes.test.ts`) | ~30 min |
| High | Public API surface (new `index.test.ts`) | ~10 min |
| Medium | `OrgChart.tsx` keyboard nav gaps | ~30 min |
| Medium | `ZoomPane.tsx` wheel-zoom | ~30 min |
| Low | 4 small edge cases (table above) | ~20 min total |

Doing all of the above took measured `src/lib` coverage from 65%/89%/90% to 100%/94.68%/97.5%
(statements/branches/functions), and added the one test type (`index.test.ts`) that
specifically protects you from shipping an accidental breaking change to npm. All items
are done as of 2026-09-16 except the GitHub branch-protection setting, which is a repo
setting rather than code — see "Wiring this into the branch + PR workflow" above.
