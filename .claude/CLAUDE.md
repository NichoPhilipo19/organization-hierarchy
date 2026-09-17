# CLAUDE.md

Project memory for Claude Code. Read this before doing any work on `org-hierarchy-tree`.

> **At the start of every session, also read:**
> - `.claude/AGENTS.md` — workflows for specific task types (feature, review, test, debug)
> - `docs/TESTING_STRATEGY.md` — current coverage gaps and the pre-launch test checklist
> - `CONTRIBUTING.md` — branching model and PR workflow

---

## Project Overview

`org-hierarchy-tree` — a React component library: flat array of org-node data in, an
interactive org chart out. Zero *required* runtime dependencies — React is the only peer
dependency; `html-to-image` is a real `dependencies` entry but reached only via a dynamic
`import()` inside `exportToPng`, so it never enters a consumer's bundle unless they call it.
Published to npm. Solo-maintained, portfolio project — treat every change to `src/lib` as
public API surface with real semver consequences.

- **Language**: TypeScript + React 18+
- **Package manager**: pnpm (`packageManager` field in `package.json` pins the version)
- **Build**: Vite (`vite.config.ts` for the demo, `vite.lib.config.ts` for the published package)
- **Lint/format**: Biome (`biome.json`) — replaces ESLint + Prettier
- **Tests**: Vitest + Testing Library
- **Component workshop**: Ladle (`pnpm story`)

---

## Repo Layout

```
src/lib/       — the published package. Every file here is public API surface.
src/demo/      — the demo app (GitHub Pages). Not published, freer to experiment in.
src/bench/     — Vitest benchmarks (performance claims in docs/TECHNICAL_DESIGN.md).
scripts/       — one-off tooling (e.g. capture-visuals.mjs for README screenshots).
docs/          — PRD, technical design, analysis, competitive analysis, test strategy,
                 plus the README's screenshots/GIFs (docs/demo.png, docs/frames/).
.ladle/        — Ladle component-workshop config.
```

`src/lib/index.ts` is the only file that decides what's actually public — if it's not
re-exported there, consumers can't reach it, however public the file looks.

---

## Critical Rules (never skip)

| Rule | Detail |
|------|--------|
| **Zero *required* runtime dependencies** | `src/lib` ships with React as its only peer dependency. The one accepted exception is `html-to-image`, dynamically imported inside `exportImage.ts` for `exportToPng` — it's a real `dependencies` entry, but Rollup splits it into its own chunk, so a consumer who never calls `exportToPng` never downloads it (docs/TECHNICAL_DESIGN.md §7b). Never add another runtime dependency to `src/lib` — new or eager — without asking first and explaining why; this is a stated design goal, not a style preference. `src/demo` and dev tooling are not held to this. |
| **Public API changes are semver events** | Removing/renaming an export, prop, or theme id from `src/lib` is a breaking change unless it never shipped in a published version. Check `CHANGELOG.md`'s latest published version before assuming something is safe to change freely. |
| **WAI-ARIA treeview pattern** | `role="tree"` / `role="treeitem"` / `role="group"` + roving tabindex in `OrgChart.tsx`/`TreeView.tsx` is load-bearing accessibility behavior, not incidental markup. Don't refactor it away without re-reading docs/TECHNICAL_DESIGN.md §4. |
| **Theming via CSS custom properties only** | Never hardcode a color/size in `OrgChart.module.css` that a theme should be able to override — it must be a `var(--orgchart-*, <fallback>)`. See `src/lib/themes.ts`. |
| **All code, comments, docs, and commit messages are in English** | Regardless of what language the conversation with the user is in. This library is meant for a worldwide audience. |
| **Biome, not ESLint/Prettier** | `pnpm check` (biome check --write) before every commit. `biome.json` must stay comment-free — comments silently break config parsing in this Biome version and fall back to defaults. |

---

## Coding Conventions

- Variables/functions: `camelCase`. Components/types: `PascalCase`.
- Formatting: single quotes, semicolons, trailing commas (enforced by Biome, not manual).
- CSS module classes: `camelCase` (e.g. `nodeArea`, `cardTitle`).
- Prefer a pure function in `buildTree.ts`/`helpers.ts` over component-local logic when the
  logic doesn't need React — pure functions are the cheapest thing in this repo to test.
- Look at an existing, comparable file before adding a new one (e.g. read `ZoomPane.tsx`
  before writing another interactive sub-component) — this repo has consistent internal
  patterns (controlled/uncontrolled via `value`/`defaultValue` convention, refs stored to
  avoid re-firing effects, etc.) worth matching rather than reinventing.

---

## Communication Style

Reply to the user in Bahasa Indonesia in conversation. Code, code comments, commit
messages, PR descriptions, and every file under `docs/` or at the repo root (README,
CHANGELOG, this file) are written in English — no exceptions, regardless of which
language the surrounding conversation is in.

---

## Git Commit Rules

Format: `<type>: <subject>` — types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`.

- Subject: short, imperative, lowercase after the colon.
- **Always micro commits** — one logical change per commit, grouped by concern (e.g. a
  removal + a docs update touching the same file can be one commit; unrelated files
  should not share a commit just because they were edited in the same session).
- **Always output commit instructions as a ready-to-paste bash block**, never as prose
  describing the format. One block, staged commits in order. Claude never runs
  `git add`/`git commit`/`git push` itself — these blocks are for the user to run.
- **Always start the block with `rm -f .git/index.lock`** — this sandbox's device bridge
  cannot always clean up its own stale git lock file, and a leftover lock blocks every
  subsequent git command with a confusing "Unable to create index.lock" error.

```bash
rm -f .git/index.lock

git add <files>
git commit -m "$(cat <<'EOF'
<type>: <subject>

<optional body>
EOF
)"
```

---

## Branching Strategy

GitHub Flow — see `CONTRIBUTING.md` for the full guide. Condensed:

| Branch | Purpose |
|--------|---------|
| `main` | Always releasable/publishable. No direct commits — everything goes through a PR, even solo work. |
| `feat/<desc>`, `fix/<desc>`, `chore/<desc>`, `docs/<desc>`, `test/<desc>` | One branch per logical change, named after its Conventional Commit type. |

Merge method: **squash merge only** — keeps `main` history to one commit per PR regardless
of how messy the branch's own commits are. Releases are cut from `main` via a dedicated
`chore/release-vX.Y.Z` PR that bumps `package.json` and moves `CHANGELOG.md`'s
`[Unreleased]` section under a dated version heading, then tagged `vX.Y.Z`.

---

## Testing Standards

- Test files co-located with source: `*.test.ts` / `*.test.tsx`.
- `environment: node` for pure logic (`buildTree`, `helpers`, `themes`), `jsdom` for
  anything rendering a component (`environmentMatchGlobs` in `vite.config.ts` already
  routes this automatically by filename).
- Vitest + Testing Library; `describe`/`it` blocks cite the FR-n/NFR-n/US-n/T-n id they
  verify where one exists (see docs/PRD.md, docs/ANALYSIS.md) — keeps a test's purpose
  traceable without needing to open the PRD to know why it exists.
- Before writing a new test, check `docs/TESTING_STRATEGY.md` — it lists exact uncovered
  lines and example test cases per gap, so you're not guessing what's missing.

---

## Reference Files

| File | Purpose |
|------|---------|
| `docs/PRD.md` | Requirements & user stories (FR-x/NFR-x) |
| `docs/TECHNICAL_DESIGN.md` | Design decisions and their reasoning |
| `docs/ANALYSIS.md` | PRD → design → code → test traceability, bugs found & fixed |
| `docs/COMPETITIVE_ANALYSIS.md` | How this lib compares to other React/D3 org chart libs |
| `docs/TESTING_STRATEGY.md` | Pre-launch test plan, measured coverage gaps |
| `CONTRIBUTING.md` | Branching model, PR workflow |
| `CHANGELOG.md` | Release history (Keep a Changelog format) |
| `README.md` | Install, usage, props, theming reference for consumers |
