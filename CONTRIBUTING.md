# Contributing

`org-hierarchy-tree` is solo-maintained, but every change — including the maintainer's
own — goes through a branch and a pull request. This keeps CI as a real gate instead of a
formality, and keeps `main` in a state that's always safe to publish to npm.

## Prerequisites

- Node 20+ (CI runs on Node 20)
- pnpm — version pinned by the `packageManager` field in `package.json`; run
  `corepack enable` once and pnpm will resolve to the right version automatically

```bash
pnpm install
pnpm dev      # demo app
pnpm story    # component workshop (Ladle)
```

## Branching model

This repo uses **GitHub Flow** — no `develop` branch, no long-lived release branches.

| Branch | Purpose |
|--------|---------|
| `main` | Always releasable/publishable. No direct commits, ever — everything goes through a PR. |
| `feat/<short-desc>` | A new feature or public-API addition. |
| `fix/<short-desc>` | A bug fix. |
| `chore/<short-desc>` | Tooling, dependencies, CI, repo maintenance. |
| `docs/<short-desc>` | Documentation only. |
| `test/<short-desc>` | Tests only, no behavior change. |
| `refactor/<short-desc>` | Internal restructuring, no behavior change. |

Branch off `main`, one branch per logical change. The prefix should match the
Conventional Commit type the branch's work will use (see below).

## Workflow

1. `git checkout main && git pull && git checkout -b <type>/<short-desc>`
2. Make the change. Commit as you go — commits within a branch don't need to be clean;
   they get squashed on merge (see below).
3. Before opening a PR, run the full local verification:
   ```bash
   pnpm exec tsc --noEmit
   pnpm exec biome check .
   pnpm test
   pnpm build
   pnpm build:lib
   pnpm story:build
   ```
   This is exactly what CI runs — catching a failure locally is faster than waiting on CI.
4. Push the branch and open a PR against `main`.
5. Once CI is green, **squash merge**. Use the PR title as the squash commit's subject
   line, in Conventional Commit format (see below) — this is what ends up in `main`'s
   history, so make it count even if the branch's own commits were messy.
6. Delete the branch after merge.

## Commit message format

```
<type>: <subject>

<optional body>
```

Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`.

- Subject: short, imperative, lowercase after the colon (e.g. `feat: add radial layout option`).
- One logical change per commit — a removal and the docs update for it can share a commit;
  unrelated files should not, just because they were touched in the same sitting.
- See `.claude/CLAUDE.md` for the exact ready-to-paste bash block shape this project uses
  when generating commits with AI assistance (it also covers a sandbox-specific
  `.git/index.lock` gotcha — not relevant if you're committing from your own terminal).

## Pull request checklist

Before merging (self-review counts — this is still real review, just without a second
person):

- [ ] `tsc`, `biome check`, `test`, `build`, `build:lib`, and `story:build` all pass.
- [ ] If the change touches `src/lib` behavior, a test was added or updated in the same PR.
  Check `docs/TESTING_STRATEGY.md` first — it may already describe the exact gap this PR
  should close.
- [ ] If the change touches public API (an export, a prop, a theme id), `CHANGELOG.md`'s
  `[Unreleased]` section is updated, and the change is flagged as breaking if it removes
  or renames something that shipped in a published version.
- [ ] If the change is user-facing, `README.md` reflects it.

## Releasing

Releases are cut from `main`, never from a feature branch directly:

1. Open a `chore/release-vX.Y.Z` branch.
2. Bump `version` in `package.json` following semver:
   - `fix` commits since the last release → patch
   - `feat` commits → minor
   - any breaking change (see the PR checklist above) → major
3. In `CHANGELOG.md`, move everything under `[Unreleased]` to a new `## [X.Y.Z] — YYYY-MM-DD`
   heading.
4. PR it, squash merge like any other change.
5. On `main`, tag the release: `git tag vX.Y.Z && git push origin vX.Y.Z`.
6. `npm publish` (runs `prepublishOnly` → `pnpm build:lib` automatically). npm requires
   2FA (or a granular token with "bypass 2FA" enabled) to publish — make sure that's set
   up on the npm account before this step, not during it.

## Repository settings (one-time setup)

Recommended branch protection for `main` (GitHub → Settings → Branches):

- Require a pull request before merging (no direct pushes, including from the owner).
- Require status checks to pass before merging — select the CI job from
  `.github/workflows/ci.yml`.
- Require branches to be up to date before merging.
- Restrict force pushes.
- Squash merging only — disable "Create a merge commit" and "Rebase and merge" in
  Settings → General → Pull Requests, so `main` can't accidentally end up with a messy
  merge commit.
- Automatically delete head branches after merge.

## Code style and testing

Formatting and linting are enforced by Biome, not by convention — run `pnpm check`
before committing and CI will catch anything missed. See `.claude/CLAUDE.md` for the
project's coding conventions and `docs/TESTING_STRATEGY.md` for what test coverage is
expected and where the current gaps are.
