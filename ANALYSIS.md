# In-Depth Analysis — PRD × Technical Design × Implementation

**Date:** July 15, 2026 · **Artifacts analyzed:** [PRD.md](PRD.md), [TECHNICAL_DESIGN.md](TECHNICAL_DESIGN.md), source code `src/`

This analysis examines three things: whether the three artifacts are consistent with each other, whether what was promised has actually been verified, and what real weaknesses remain — including ones that aren't visible from the outside.

---

## 1. Objective Verification Results

| Check | Result |
|---|---|
| `tsc --noEmit` (strict mode) | ✅ 0 errors |
| `vitest run` | ✅ 12/12 passing |
| `vite build` (demo) | ✅ 153 kB (49.5 kB gzip, including React) |
| `vite build --config vite.lib.config.ts` | ✅ **6.38 kB → 2.32 kB gzip** — the library itself is very small |
| Runtime dependency | ✅ 0 — only a React `peerDependencies` entry (G4 satisfied) |

## 2. Traceability: PRD → Design → Code → Tests

| PRD | Design | Code | Test/Evidence | Status |
|---|---|---|---|---|
| FR-1 flat input | §1 | `types.ts OrgNode` | tsc | ✅ |
| FR-2 multi-root | §1, §7 | `buildTree` roots[] | test "multi-company" + `.root` CSS gap | ✅ |
| FR-3 default depth | §3 | `idsUpToDepth`, default 1 | 3 tests for `idsUpToDepth` | ✅ |
| FR-4 toggle separate from click | §2 | `TreeView` button + `stopPropagation` | — (no interaction test yet) | ⚠️ implemented, untested |
| FR-5 badge count | §3 | `{children.length}` when collapsed | — | ⚠️ implemented, untested |
| FR-6 controlled/uncontrolled | §2, §3 | `useExpansion` | — (only used in the demo) | ⚠️ implemented, untested |
| FR-7 dirty data | §1 validation table | `buildTree` | 5 tests (orphan, duplicate, 2-cycle, self-cycle, cycle+subtree) | ✅ most thoroughly tested |
| FR-8 renderNode + state | §2 | `NodeState`, `Branch` | — | ⚠️ |
| FR-9 default card | §5 | `NodeCard` | — | ⚠️ |
| FR-10 collapsed ≠ rendered | §3 | `{isExpanded && <ul>}` | by construction | ✅ |
| NFR-1 performance (<100ms/<16ms) | §3 claim | — | **not measured** | ❌ claim without evidence |
| NFR-3 type safety | — | strict, no public `any` | tsc | ✅ |
| NFR-4 a11y (P1) | §6 | role/aria/button | — | 🟡 partial (see T-3) |
| NFR-6 logic separated from view | §4 diagram | buildTree & hooks are DOM-free | tests run in the `node` environment without jsdom — concrete proof of the separation | ✅ |

**Pattern observed:** the *data* layer (buildTree) is thoroughly tested; the *interaction* layer (toggle, controlled mode, renderNode) has no automated tests at all. This is consistent with the NFR-6 decision (logic separated so it's testable without the DOM) — but it means coverage stops exactly at that boundary.

## 3. Findings — Ordered by Severity

### T-1 · `types` in package.json points to a file that was never generated — **Critical for publishing, cosmetic for the demo**

`package.json` declares `"types": "./dist-lib/index.d.ts"`, but `build:lib` doesn't generate a `.d.ts` file (tsconfig has `noEmit`, and there's no `vite-plugin-dts`). Consumers who install this library lose the entire TypeScript surface — even though a "fully typed API" is NFR-3 and the library's main selling point. No test catches this because nothing consumes the build output.
**Context:** the PRD's Non-Goals state that "publishing to npm" isn't a v1 target, so this isn't a requirement violation — but a field pointing to a fictitious file is worse than no field at all. **Fix:** add `vite-plugin-dts`, or remove the `types` field until v1.1.

### T-2 · `onDataError` can fire repeatedly on every render — **High, a real API bug**

`OrgChart.tsx` calls `onDataError` inside a `useEffect` with dependencies `[errors, onDataError]`. `errors` is stable (from `useMemo`), but if a consumer writes `onDataError={(e) => ...}` inline — the most common pattern — the function reference changes on every render, the effect re-fires, and the callback keeps getting called. The demo doesn't surface this bug because it happens to use `useCallback`. **This is exactly the kind of bug that slips through because the demo's author is also the library's author.** Standard fix: store the callback in a ref (the `useEffectEvent` pattern) so only `errors` triggers it.

### T-3 · Accessibility claims exceed the implementation — **Medium**

PRD US-8 and Design §6 promise a "tree ARIA + keyboard-operable" experience. Reality: `role="tree/treeitem/group"` and `aria-expanded` are present, and the toggle is a real `<button>` (Enter/Space come for free). But the [WAI-ARIA tree pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/) demands more: roving tabindex, `aria-level`, arrow-key navigation. A screen reader will announce a half-finished structure — sometimes more confusing than plain markup. US-8 is P1 ("best effort"), so this isn't a violation, but Design §6 should honestly describe this as "ARIA scaffolding, not compliance."

### T-4 · The semantics of `defaultExpandedDepth` when `data` changes are undefined — **Medium**

`useExpansion` computes its initial state once (a `useState` initializer). If an uncontrolled consumer swaps out `data` (e.g., switching to a different company), the new tree renders almost entirely collapsed — `defaultExpandedDepth` isn't reapplied. Design §7 only discusses "a missing id is left in the Set" and skips the reverse case. No document defines the correct behavior; the code silently picked one. The demo doesn't surface this either, since it uses controlled mode. **Minimum: document it; ideally: remount via `key` or provide an explicit reset.**

### T-5 · PRD Risk #1 (CSS connector) has no executed mitigation yet — **Medium**

The PRD names a broken connector as the single biggest risk for the portfolio, with "manual visual testing" as the mitigation. Verification in this session went only as far as compile/unit/build — **no one has actually looked at the render yet**. The demo dataset deliberately covers the fragile cases (only-child at `qa-lead→sinta`, `sec-lead→vino`, `tc-log-1`; 1/2/3/4 children; 5 levels), so the test material is ready — it just needs `npm run dev` and a look. Until that happens, goal G1 is *unproven*.

### T-6 · The performance NFR is a made-up number — **Low but instructive**

"<100ms initial render, <16ms toggle" has never been measured and there's no benchmark harness. A specific number that's never been measured is more dangerous than a qualitative statement, because it creates an illusion of precision. Two honest options: measure it (React Profiler + a 100-node dataset), or rewrite NFR-1 as qualitative ("no perceptible lag at ~100 nodes").

### T-7 · Minor design↔code deviation on cycle-breaking — **Info**

Design §1 says a cycle "breaks the **last** edge"; the implementation instead breaks the edge at the first node detected as repeated during the walk-up — deterministic, and every node still renders (there's a test for it), but not literally "the last edge." The code also adds a policy the design never mentions: `parentId === id` (self-cycle) is handled as a special case. The code is *better* here than the document; the document needs to catch up.

### T-8 · The library's CSS isn't imported automatically — **Info**

`build:lib` produces a separate `style.css`; consumers have to `import 'org-hierarchy-tree/style.css'` themselves. That's a reasonable consequence of CSS modules + zero dependencies, but it isn't documented anywhere yet (the README was deferred to v1.1 by PRD §7).

## 4. Assessment of Design Decision Quality (with evidence from the implementation)

**Decisions that proved correct.** The logic/view separation (NFR-6) turns out not to be a slogan: every test runs in the `node` environment without jsdom, and the 2.3 kB gzip library build shows nothing is riding along for free. The flat-array input choice paid off while writing dummy data — 50 nodes written by hand without agonizing nesting — and made the `dirtyData` error-handling demo trivial. The HTML+CSS choice (over d3) is validated by the bundle size and by the fact that `renderNode` can hold any React component without a foreignObject bridge.

**Decisions whose cost is only showing up now.** The CSS pseudo-element connector moves complexity from JavaScript into CSS geometry — and geometry can't be unit-tested. All confidence in FR-4/5/8/9 currently rests on manual review (T-5). If this project is taken seriously, the highest-value next step isn't a feature — it's a *component test* (Testing Library + jsdom) for interaction, and one *visual snapshot* (Playwright) for the connector.

**The three documents keep each other honest.** The PRD locks down scope that the design wanted to widen (radial view held back for v2). The design makes a call the PRD had no business making (the Set holds expanded ids, not collapsed ones — meaning new nodes default to collapsed, which is safe for large orgs). The code finds a case both documents missed (self-parent). This feedback chain works — what doesn't work yet is the reverse flow: code-level findings (T-4, T-7) haven't been written back into the documents.

## 5. Conclusion & Follow-up Priorities

Honest v1 status: **the core functionality is complete and tested at the data layer; the interaction & visual layer is complete but has only been verified by the compiler, not by tests or human eyes.** Of the PRD's 6 goals: G3–G6 are met with evidence; G1–G2 are waiting on visual/performance verification.

Next work, ordered by impact/effort ratio:

1. **Run `npm run dev` and check the visuals** (T-5) — 10 minutes, unblocks G1's status.
2. **Fix the `onDataError` re-fire** (T-2) — a real API bug, ~5 lines.
3. **Fix or remove the `types` field** (T-1) — one plugin or one line.
4. Component tests for toggle/controlled/renderNode — close out the "untested" column in the §2 matrix.
5. Write T-4 & T-7 back into TECHNICAL_DESIGN.md; scale the §6 a11y claims down to match reality (T-3).
6. README (already scheduled for v1.1) — must cover how to import the CSS (T-8).

---

## 6. Addendum — Findings Resolution (July 15, 2026, follow-up session)

| Finding | Resolution |
|---|---|
| T-1 fictitious `types` | ✅ `vite-plugin-dts` — `build:lib` now generates `dist-lib/index.d.ts` |
| T-2 `onDataError` re-fire | ✅ Callback stored in a ref, effect only triggered by `errors` — with a regression test (inline callback, 2× re-render, called 1×) |
| T-3 a11y claims | ✅ Not scaled down — fulfilled instead: roving tabindex, `aria-level/setsize/posinset`, full arrow-key navigation + tests |
| T-4 data-change semantics | ✅ Defined & implemented: `defaultExpandedDepth` is reapplied; the requirement for stable `data` is documented |
| T-5 visual verification | ✅ Headless screenshots (Playwright) → `docs/demo*.png` + GIF; connector is correct for multi-root, only-child, 1–4 children, 5 levels. **Bonus: found a real bug** — `justify-content:center` on the scroll container made the left side of a wide chart unreachable by scrolling; already fixed (`.root { width:max-content; margin:0 auto }`). PRD Risk #1's mitigation is now executed. |
| T-6 made-up NFR | ✅ `npm run bench`: rendering 100 nodes ~20% expanded ≈ 0.5 ms; toggle re-render ≈ 0.5 ms; buildTree on 10k ≈ 2.5 ms |
| T-7 cycle-breaking deviation | ✅ Design §1 revised to match the implementation |
| T-8 CSS import | ✅ README §quick-start |

The "untested" column in the §2 matrix (FR-4/5/6/8/9) is now closed out by 13 component tests (jsdom). New features from this session: keyboard nav, `OrgChartHandle`, zoom & pan, `highlightedIds`, `fromNested()`, `ancestorsOf()` — recorded in PRD §11 (amendment). What's still pending: **manual visual verification (T-5 / G1)** and the radial view + npm publish backlog.

## 7. Publish readiness & CI (September 5, 2026)

Worked through six tasks from the implementor prompt, all of them applicable.

`node_modules` was already broken before anything started: `@rollup/rollup-darwin-arm64` was missing, a leftover from an earlier `vite` crash (visible from the pile of `*.timestamp-*.mjs` files, already in `.gitignore`). `npm install` cleared that up first.

| # | Task | Result |
|---|---|---|
| 1 | `LICENSE` + publish metadata | MIT, in Nicho Philipo's name. `package.json` gained `repository`, `homepage`, `bugs`, `author`, `keywords`, `sideEffects`. |
| 2 | `'use client'` directive | Added to `OrgChart.tsx`. Rollup strips the directive comment during bundling, so it's restored via `output.banner` in `vite.lib.config.ts` — verified directly in the `dist-lib/index.js` output, not just in the source. |
| 3 | Test `ZoomPane` (zero tests to six) | `src/lib/ZoomPane.test.tsx`: zoom in/out/reset, drag-to-pan, and an `onClickCapture` regression test (a drag that passes over a node must not fire that node's `onNodeClick`, a plain click still must). jsdom doesn't implement the Pointer Capture API yet, so it's stubbed minimally in `beforeAll`. |
| 4 | `.github/workflows/ci.yml` | Runs on every push (all branches) and every PR into `main` — verification only (`tsc`, tests, two builds). `deploy-demo.yml` was left untouched and remains the only workflow that deploys to Pages. |
| 5 | README → document links + `CHANGELOG.md` | New section after Roadmap. The changelog reconstructs v1.0.0 and v1.1.0 from `git log` + the §6 addendum, plus an Unreleased entry for tasks 1-5. |
| 6 (optional) | Build CJS + `exports` field | `vite.lib.config.ts` now builds `['es', 'cjs']`; `package.json` gained an `exports` map (types/import/require), `main` pointing to `.cjs`, `module` to `.js`. Verified that both `require()` and `import()` resolve to the same 8 exports. |
| 6 (optional) | `@vitest/coverage-v8` + `test:coverage` | Pinned to the same vitest version (2.1.9), no threshold yet — this is a baseline, not a gate. `src/lib` sits around 97% statements. The default report also picks up `demo/`, `scripts/`, `dist-lib/`, which aren't really relevant, but the excludes weren't touched since this task only asked for a baseline number. |

One thing that's still messy in the CJS build: the `"use strict"` prologue that Rollup auto-injects lands right after the `'use client';` banner with no newline (`"use client";"use strict";...`). Tried appending `
` to the end of the banner string, but Rollup trims that whitespace before inserting its own prologue. Doesn't affect functionality — `require()` still works, and the directive that Next.js App Router/webpack actually reads lives in the ESM build (`index.js`), not the `.cjs`. Left as-is rather than adding a custom plugin just to fix something cosmetic in an optional task.

Each task was fully re-verified (`npm test`, `tsc --noEmit`, `npm run build`, `npm run build:lib`) before moving on, and each became its own commit — six commits, see `git log`.

## 8. PNG export (September 5, 2026)

| PRD | Design | Code | Test/Evidence | Status |
|---|---|---|---|---|
| FR-12 PNG export (PRD §12, US-12) | Technical Design §7b | `exportImage.ts` (`exportChartToPng`), `OrgChart.tsx` (`useImperativeHandle` → `exportToPng`), `types.ts` (`OrgChartHandle.exportToPng`) | 5 tests: 3 unit (`exportImage.test.ts` — a null target is rejected, `toPng` is called with the correct element+options and then triggers a download, an error from `html-to-image` is propagated) + 2 component (`OrgChart.test.tsx` — export calls `html-to-image` with the actually-mounted `role="tree"` element, rejects when `data` is empty) | ✅ |

`dist-lib` size before/after (`npm run build:lib`, gzip):

| Build | Before | After |
|---|---|---|
| ESM (`index.js`, main chunk) | 4.71 kB | 4.91 kB (+0.20 kB) |
| ESM (`html-to-image`, separate chunk — only loaded when `exportToPng()` is called) | — | 5.72 kB |
| CJS (`index.cjs`, main chunk) | 3.93 kB | 4.12 kB (+0.19 kB) |
| CJS (`html-to-image`, separate chunk) | — | 5.25 kB |

The main chunk grows by <0.2 kB gzip (overhead from the `import()` call + wrapper). The cost of `html-to-image` (~5.7 kB gzip) is entirely opt-in via dynamic import — consumers who never call `exportToPng` don't download it at all, so NFR-2 (zero paid-by-default runtime dependency) isn't violated. Verification: `dist-lib/` produces a separate second chunk for both build formats.
