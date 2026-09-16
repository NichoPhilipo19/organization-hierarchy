# AGENTS.md

Workflows for specific task types. Read `.claude/CLAUDE.md` first — this file assumes its
rules (zero-dep, semver discipline, English everywhere in files, micro commits).

---

## General Principles

1. **Read CLAUDE.md first**, every session.
2. **Never assume** a missing detail (which theme a screenshot should use, whether a prop
   change is breaking) — surface it as a question before proceeding.
3. **Never commit to `main` directly.** Everything goes through a branch + PR, even
   single-file solo changes.
4. **Micro commits only** — see the format in `CLAUDE.md`.
5. **Check for an existing pattern first.** Before adding a new hook/component, read a
   comparable one already in `src/lib` (e.g. `useExpansion.ts` before writing another
   controlled/uncontrolled hook) rather than inventing a new shape.

---

## Agent: Feature Implementation

**Trigger**: "add a prop", "add a feature", "implement X"

### Workflow

1. Check `docs/PRD.md` for whether this is already scoped (has an FR-n) or is new scope —
   new public-API features should get an FR-n added, not just code.
2. Follow this order:
   ```
   types.ts        → new/changed prop or data shape
   buildTree/helpers → pure logic first, if any is needed
   hook            → state (follow the value/defaultValue controlled/uncontrolled
                      convention already used by useExpansion)
   component       → OrgChart.tsx / TreeView.tsx / NodeCard.tsx
   OrgChart.module.css → CSS custom properties only, with a sensible fallback
   tests           → co-located *.test.ts(x)
   OrgChart.stories.tsx → a story if the feature is visually distinct
   README.md / CHANGELOG.md → update if this is public API
   ```
3. Micro commit after each layer that's independently coherent (don't force one commit
   per file if two layers are trivially small and related).
4. Before calling it done: `pnpm exec tsc --noEmit && pnpm exec biome check . && pnpm test && pnpm build && pnpm build:lib`.

---

## Agent: Public API Change (removal / rename)

**Trigger**: "remove this theme", "rename this prop", "drop this export"

Lesson learned in this repo: grepping the type/prop name alone can miss a consumer that
accesses it through a destructure or a variable from a function call, without repeating
the name (e.g. a demo file reading `theme.id` from a loop variable, not from `THEMES`
directly). A sweep that only checks "does this string appear" can report clean while a
consumer still breaks.

### Workflow

1. Grep the export/prop/id name across `src/lib`, `src/demo`, `src/bench`, and `*.stories.tsx`.
2. Also grep for *usages* one level removed — anywhere a function that returns the type
   is called and its result is destructured or iterated (a caller doesn't have to repeat
   the type name to depend on a field of it).
3. Confirm with `pnpm exec tsc --noEmit` — TypeScript will catch most of what the grep
   sweep missed, but only if the removal actually changes a type signature (not if it's
   still structurally compatible, e.g. an optional field).
4. Check whether this ever shipped in a published version (`CHANGELOG.md`) — if yes, this
   is a breaking change: bump major/minor accordingly and document it under `### Removed`
   or `### Changed`. If it never shipped, it's safe and gets a note explaining why.
5. Update `CHANGELOG.md` and any doc (`README.md`, `docs/*.md`) that referenced it.

---

## Agent: Code Review

**Trigger**: "review this", "check this before I merge", "is this safe?"

### Review order

1. **Accessibility** — does it preserve the WAI-ARIA treeview pattern (roles, roving
   tabindex, `aria-expanded`/`aria-level`/`aria-posinset`/`aria-setsize`)? Keyboard-only
   usage should still work.
2. **Correctness** — matches the FR-n/NFR-n it claims to implement, if any.
3. **Performance / referential stability** — anything passed to `useMemo`/`useCallback`
   deps must actually be stable; `data` must stay referentially stable across renders for
   `useOrgTree`'s memoization to do anything (documented gotcha in `useExpansion.ts`).
4. **Naming & formatting** — `pnpm exec biome check .` clean.
5. **Error handling** — data errors (orphans, cycles, duplicates) reported via
   `onDataError`, never thrown — this library must render *something* for dirty data.
6. **Tests** — new behavior in `src/lib` has a co-located test; check `docs/TESTING_STRATEGY.md`
   for whether this touches an already-known gap.
7. **Public API / semver impact** — see the "Public API Change" workflow above if this
   touches an export.

### Must-flag conditions

- A new runtime dependency added to `src/lib` without prior discussion.
- A hardcoded color/size in `OrgChart.module.css` that should be a `--orgchart-*` custom
  property.
- `data` treated as safe to mutate (this library's contract is "never mutate input" — see
  `buildTree.ts`/`helpers.ts` tests).
- A thrown error for malformed input data instead of a reported one via `onDataError`.

---

## Agent: Test Writer

**Trigger**: "write tests for X", "add test coverage"

### Workflow

1. Check `docs/TESTING_STRATEGY.md` first — it may already have the exact uncovered lines
   and an example test case for what's being asked.
2. Read an existing test file in the same area for the house style: `describe` blocks
   named `"<Component> — <behavior> (<FR-n/US-n> if applicable)"`, `it` blocks stating the
   observable behavior, not the implementation.
3. `environment: node` tests (no render) for pure logic; Testing Library + `jsdom` for
   anything that mounts a component.
4. Cover: happy path, empty/edge input, and — for anything touching `buildTree` — dirty
   data (orphans, cycles, duplicate ids), since that's this library's stated resilience
   contract (FR-7).
5. Re-run `pnpm test:coverage` after adding tests and compare against the thresholds in
   `docs/TESTING_STRATEGY.md` to confirm the gap actually closed.

---

## Agent: Debug

**Trigger**: an error message, "this doesn't work", "the tree doesn't expand", etc.

### Workflow

1. **Reproduce** — get the exact data shape (or a minimal repro), which prop combination,
   browser/environment if it's a rendering issue.
2. **Isolate the layer**:
   ```
   Is the tree structure wrong?     → buildTree.ts / helpers.ts (pure, test in isolation)
   Is expand/collapse state wrong?  → useExpansion.ts (check controlled vs uncontrolled)
   Is rendering/layout wrong?       → TreeView.tsx / OrgChart.module.css
   Is keyboard nav wrong?           → OrgChart.tsx's onTreeKeyDown
   Is zoom/pan wrong?               → ZoomPane.tsx
   ```
3. **Diagnose** by reading the isolated file's existing tests first — a regression often
   means an existing test's assumption changed, not that there's no test at all.
4. **Fix** — smallest change that fixes the isolated layer; add a regression test in the
   same PR.
5. **Commit** — one micro commit for the fix, following the format in `CLAUDE.md`.

---

## Agent: Standup / Progress Summary

**Trigger**: "what did I do recently", "summarize my last few commits"

### Workflow

1. `git log --oneline --since="<period>"` on the current branch.
2. Group by commit type prefix (`feat`/`fix`/`chore`/`docs`/`test`).
3. Summarize as: **Done** / **In progress** / **Blocked** — keep it under 10 lines.
