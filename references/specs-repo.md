# Specs Repo

Remote or local Git checkout used as the versioned planning store for PRDs, slice files, indexes,
and execution state. Works on developer machines and ephemeral cloud hosts. Implementation code
stays in the **application repo**; only planning artifacts live in the specs repo.

There is no team-wide default URL baked into these skills. Resolve the planning store from context
each session — env vars, user input, attached workspace roots, or an explicit ask.

## Layout

Same structure everywhere — only the root changes from `<app-repo>/plans/` to `$SPECS_REPO_PATH/`:

```
in-progress/<plan-slug>/PRD.md
in-progress/<plan-slug>/<plan-slug>-index.md
in-progress/<plan-slug>/<stage>/<nn>-<issue-slug>.md
completed/<plan-slug>/...
```

Plan paths are always absolute under the resolved `$SPECS_REPO_PATH`:

- `$SPECS_REPO_PATH/in-progress/<slug>/PRD.md`
- `$SPECS_REPO_PATH/in-progress/<slug>/<slug>-index.md`
- `$SPECS_REPO_PATH/in-progress/<slug>/<stage>/<nn>-<issue-slug>.md`

Never write planning artifacts under `<app-repo>/plans/`. There is no fallback to gitignored local
plans.

## Resolve the planning store

Run **before** bootstrap on every skill that reads or writes plans. Set both `SPECS_REPO_PATH`
(checkout on disk) and `SPECS_REPO_URL` (remote origin when known).

### Resolution priority

Use the first match that applies:

1. **Environment** — `SPECS_REPO_URL` and/or `SPECS_REPO_PATH` already set in the shell or host config.
2. **User input this turn** — repo HTTPS/SSH URL, GitHub link, or absolute local checkout path the
   user named for planning.
3. **Existing plan path** — user or prior step supplied an absolute path to `PRD.md`, an index, or
   an issue file; set `SPECS_REPO_PATH` to that file's Git root (`git -C "<dir>" rev-parse --show-toplevel`).
4. **Attached workspace root** — among agent workspace roots, choose a root that is **not** the
   application repo and matches any of:
   - top-level `in-progress/` or `completed/` directories;
   - repo name or purpose clearly indicates planning (`specs`, `planning`, `plan-docs`, etc.);
   - user attached it alongside the app repo for this task.
5. **Same-session choice** — planning store already resolved earlier in the conversation.

When a candidate attached root is already a Git checkout, use it as `SPECS_REPO_PATH` and read
`SPECS_REPO_URL` from `git -C "$SPECS_REPO_PATH" remote get-url origin` when needed.

### Application repo vs planning repo

The **application repo** is where implementation runs — branches, worktrees, code commits, PRs.
Identify it with `git rev-parse --show-toplevel` in the workspace where code changes happen.

When multiple workspace roots are open, do **not** assume the non-app root is the planning store
unless it matches the signals above. Two app monorepos attached together still requires an ask.

### When ambiguous — ask once

If no rule above yields a single clear planning store, pause and use
[interactive choices](host-surfaces.md#interactive-choices). Do not guess a private default repo.

- Header: `Planning store`
- Question: `Where should I read and write this plan?`
- Options (include only those that apply):
  - `Attached repo (Recommended)` — name the candidate workspace root when one exists.
  - `Remote Git repo` — user supplies HTTPS or SSH URL; clone to a writable checkout.
  - `Local checkout` — user supplies an absolute path to an existing Git checkout on disk.

After the user chooses, persist `SPECS_REPO_PATH` and `SPECS_REPO_URL` for the rest of the session.
Re-ask only if the user switches planning stores or the resolved checkout becomes unavailable.

Return `blocked` if the user declines to choose and no store can be inferred — do not fall back to
`<app-repo>/plans/`.

## Bootstrap preflight

After resolution succeeds:

```bash
# SPECS_REPO_PATH must be set — no hardcoded default repo URL or path

if [ -n "$SPECS_REPO_URL" ] && [ ! -d "$SPECS_REPO_PATH/.git" ]; then
  mkdir -p "$(dirname "$SPECS_REPO_PATH")"
  git clone "$SPECS_REPO_URL" "$SPECS_REPO_PATH"
elif [ -d "$SPECS_REPO_PATH/.git" ]; then
  git -C "$SPECS_REPO_PATH" pull --rebase
fi
```

**Attached local checkout** — when `$SPECS_REPO_PATH` is already an open workspace root, skip clone;
pull only when the remote is configured and reachable.

**Cloud hosts** — when cloning from a URL, prefer a session path such as
`/tmp/<repo-basename>` unless the user or environment set `SPECS_REPO_PATH`.

Verify write access (cloud hosts need GitHub auth scoped to the resolved repo). Return `blocked` if
clone, pull, or auth fails.

Ensure `$SPECS_REPO_PATH/in-progress/` and `$SPECS_REPO_PATH/completed/` exist after bootstrap
(create and commit if missing on first use).

## Commit and push after mutations

Cloud sessions are ephemeral; unpushed work is lost. After any plan write — PRD, slice, index,
frontmatter, HITL answers, Implementation Notes, Execution Blockers, or plan closeout — commit and
push in the specs repo:

```bash
git -C "$SPECS_REPO_PATH" add -A
git -C "$SPECS_REPO_PATH" commit -m "<prefix>: <summary>"
git -C "$SPECS_REPO_PATH" push
```

Use the same commit prefixes as the application repo (`feat:`, `patch:`, `tech:`, `refactor:`,
`maintenance:`). Summarize the planning change, not application code.

When `$SPECS_REPO_URL` is unset (pure local checkout with no remote), commit locally and tell the
user push is skipped until a remote is configured.

## Canonical state split

| Concern              | Canonical location                                               |
| -------------------- | ---------------------------------------------------------------- |
| PRD, slices, index   | Resolved specs repo (`$SPECS_REPO_PATH`)                         |
| Frontmatter, HITL    | Specs repo issue files                                           |
| Implementation Notes | Specs repo issue files                                           |
| Execution Blockers   | Specs repo issue files                                           |
| Branches, worktrees  | Application repo                                                 |
| Code commits, PRs    | Application repo                                                 |
| Linear issues        | Optional compressed team view; full detail stays in specs repo   |

Linear sync is optional. Never copy Implementation Notes, file paths, or agent handoff detail into
Linear — those stay in the specs repo only.

## Cloud hosts

1. Resolve planning store (URL from user/env, or ask).
2. Clone to a session-writable `$SPECS_REPO_PATH` when not already attached.
3. Read and write plan files under `$SPECS_REPO_PATH`.
4. Commit and push after every mutation.
5. Run `forge-build` implementation work in the application repo checkout — do not copy plan files
   into the app repo.

## Plan archive

Move a plan from `in-progress/` to `completed/` only when every remaining issue has
`completed: true` and `status: done`. After moving, commit and push the specs repo.
