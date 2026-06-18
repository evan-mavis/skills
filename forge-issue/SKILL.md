---
name: forge-issue
description: Select and implement the next local issue from an active plan under `plans/in-progress/`, an index, chat context, or a specific issue Markdown file. Use when the user asks to implement an issue, forge a slice, continue a local plan, find the next unblocked issue, or execute one local issue slice. Completed archives under `plans/completed/` are only revisited when explicitly referenced. Linear issue IDs or URLs may be used only as optional context when the user explicitly asks for Linear.
---

# Forge Issue

Execute one local issue slice from `plans/in-progress/`. Default to one issue at a time.

Stay scoped to the assigned slice. Other agents may be editing siblings; keep the diff reviewable as one issue-sized chunk.

Part of the AI dev workflow:

- **Single / handoff:** `grill-me` → `to-prd` → `to-issues` → `to-linear` → **forge-issue** → `deslop` → `thermo-nuclear-code-quality-review` → `merge-worktree` → `run-ci` → `to-pr` → `babysit`
- **Parallel subagent:** **forge-issue** (`parallel-subagent-prs`) → sub-agent: `deslop` → `to-worktree-pr` → merge on GitHub → main thread index refresh → `to-pr` + `babysit` when feature-ready

## Source of truth

- Issue YAML frontmatter is canonical; `00-index.md` is generated from it. On conflict, trust frontmatter and refresh the index.
- Key fields: `local_id`, `stage`, `type` (`afk`/`hitl`), `status`, `completed`, `parallelizable`, `blocked_by` / `blocking` / `related`, `linear_issue`, `last_synced`

## Inputs

Issue file, pasted issue, PRD, `00-index.md`, or "forge next issue" with plan context. `plans/completed/` is archived unless explicitly referenced.

Linear IDs/URLs only when the user asks for Linear — otherwise offer `to-linear` or a local paste.

## 1. Select the issue

**Specific issue given:** use it. If completed or blocked, stop and explain.

**Plan/index scan:** prefer attached `00-index.md`, then PRD links, then the obvious `plans/in-progress/*/00-index.md`. Ask if multiple plans match.

**Scheduling rules:**

- Blocked = any incomplete entry in `blocked_by`
- Stages run in ascending order; issue numbers are global across the plan, not reset per stage
- Do not pick later-stage work while an earlier stage has incomplete unblocked issues
- Eligible order: foundation → AFK → HITL (HITL for clarification only)
- Tie-break: lower global issue ordinal
- Parallel candidates: same stage, `parallelizable`, unblocked, meaningfully disjoint write areas

If nothing is eligible, summarize completed work and blockers, then stop.

From a plan/index scan, show only the next candidate(s): local ID, path, one-line summary. Ask before implementing.

## 2. Execution mode

Do not implement from a scan without confirmation. A specific issue path or worktree prompt means the user already chose — proceed in `single` mode.

| Mode | Use when |
| ---- | -------- |
| `single` (default) | One issue in this thread |
| `parallel-handoff-prompts` | Parallel slices via paste-ready prompts; local `merge-worktree` |
| `parallel-subagent-prs` | Parallel slices via tool sub-agents + isolated worktrees + parallel PRs into the feature branch |

If multiple eligible issues exist, ask which mode. Default to `single`. Recommend `parallel-subagent-prs` when issues are parallelizable and isolation matters; recommend `parallel-handoff-prompts` when sub-agent spawning is unavailable or manual paste is faster.

Use structured decision UI when available.

### `parallel-handoff-prompts`

Do not implement in this mode. Generate **one paste-ready prompt per issue** for the user to open in a new chat thread **inside that issue's worktree**.

Each prompt must be self-contained — the new thread has no prior context. Do not assume the agent will infer paths or plan state.

**Main thread first** (before generating prompts):

1. Capture **main workspace** path and current **feature branch**.
2. For each parallel-eligible issue, create a worktree + branch off the feature branch:
   - branch: `wt/<plan-slug>/<local-id>`
   - worktree path: e.g. `<main-workspace>-wt-<local-id>` or repo convention from `.cursor/worktrees.json`
3. Generate one filled prompt per worktree for the user to paste into a new chat opened in that worktree.

**Each prompt includes:**

- absolute paths to the **issue file**, **PRD**, and **`00-index.md`** (in main workspace when `plans/` is missing from the worktree)
- **worktree path** — where the agent is checked out and implements
- **main workspace** — original repo root; plan files live here
- **feature branch** (destination) and **head branch** (`wt/<plan-slug>/<local-id>`)
- one-line slice summary pulled from the issue
- instruction to read the issue file first, then run `forge-issue` on that specific issue
- stay-scoped instruction — do not touch sibling issues or shared foundation work
- closeout: update issue file + `00-index.md` (use absolute main-workspace paths when needed), then `deslop`, thermo-nuclear review; main thread runs `merge-worktree` when threads finish, then `run-ci` when the feature branch is ready

Only include parallelizable, unblocked, disjoint issues — skip foundation work unless already done.

Fill **Handoff prompt template** exactly for each issue — same headings, field order, and closeout steps every time. Replace placeholders only; do not paraphrase structure or omit fields.

**Handoff prompt template** (one per issue — copy-paste ready):

```markdown
Implement this forge-issue slice in a new chat thread. You are working inside an isolated git worktree.

- Worktree: <absolute worktree path>
- Main workspace: <absolute main workspace path>
- Issue: <absolute issue file path>
- PRD: <absolute PRD path>
- Index: <absolute 00-index.md path>
- Feature branch: <feature-branch>
- Head branch: wt/<plan-slug>/<local-id>
- Local id: <local-id>
- Summary: <one-line slice summary from issue>

Implement in this worktree. Read the issue file first (use absolute main-workspace paths when `plans/` is missing here). Run [/forge-issue](<absolute forge-issue SKILL.md path>) scoped to this issue only.

Stay scoped to this slice. Do not touch sibling issues or shared foundation work.

Closeout:
1. Update issue file (`completed: true`, Implementation Notes) and refresh `00-index.md` — use absolute main-workspace paths when needed
2. Run [/deslop](<absolute deslop SKILL.md path>)
3. Run [/thermo-nuclear-code-quality-review](<absolute thermo-nuclear-code-quality-review SKILL.md path>)

Do not run merge-worktree, run-ci, to-pr, or babysit — the main thread handles merge and landing.
```

### `parallel-subagent-prs`

Main thread orchestrates; do not implement issue slices in this thread.

Each sub-agent opens a **parallel PR into the feature branch** — not a stacked PR chain. Every `wt/<plan-slug>/<local-id>` branch targets the same feature branch independently. They do not target each other.

**Tool detection (run before spawning):**

1. Detect the current agent environment.
2. **Cursor** — prefer the Task/subagent tool with isolated worktrees. **Multitask Mode must be on** for parallel sub-agents. If it is off, stop and tell the user to enable Multitask Mode in Cursor before continuing. Retry only after they confirm it is on or you have enabled it through available Cursor controls.
3. **Other tools with sub-agents** (e.g. Codex) — use that product's native parallel sub-agent / background agent feature with the same worktree + prompt contract below.
4. **No parallel sub-agent support** — stop and recommend `parallel-handoff-prompts` instead. Do not fake parallelism in one thread.

Stay tool-agnostic in the **Sub-agent spawn prompt** — paths, branches, and closeout are the same regardless of host.

**Orchestrator workflow:**

1. Capture main workspace path and current **feature branch** (destination).
2. Select parallel-eligible issues (same rules as above).
3. Run **Tool detection** and confirm parallel sub-agents are available.
4. For each issue, derive `<plan-slug>` from `plans/in-progress/<plan-slug>/` and `<local-id>` from issue frontmatter.
5. Create worktree + branch off the feature branch:
   - branch: `wt/<plan-slug>/<local-id>`
   - use worktree creation for the host tool (`.cursor/worktrees.json` runs `setup-worktree.sh` for env + deps in Cursor)
6. Spawn one sub-agent per issue with **Sub-agent spawn prompt** below.
7. Track open parallel PRs (`gh pr list --head wt/<plan-slug>/<local-id>`).
8. **On user say-so** after a parallel PR merges on GitHub:
   - `git pull` on the feature branch
   - regenerate `00-index.md` from issue frontmatter
   - commit index update on the feature branch
9. Document cleanup for the user (do not run automatically):

```bash
git worktree remove <worktree-path>
git branch -d wt/<plan-slug>/<local-id>
```

**Sub-agent spawn prompt** (one per issue — fill exactly):

```markdown
Implement this forge-issue slice in this worktree.

- Worktree: <absolute worktree path>
- Main workspace: <absolute main workspace path>
- Issue: <absolute issue file path>
- PRD: <absolute PRD path>
- Index: <absolute 00-index.md path>
- Plan slug: <plan-slug>
- Local id: <local-id>
- Feature branch (PR base): <feature-branch>
- Head branch: wt/<plan-slug>/<local-id>
- Summary: <one-line slice summary from issue>

Implement in this worktree. Read the issue file first (use absolute main-workspace paths when `plans/` is missing here). Run [/forge-issue](<absolute forge-issue SKILL.md path>) scoped to this issue only.

Stay scoped to this issue only. Do not touch sibling issues or shared foundation work.

Closeout:
1. Implement per issue Acceptance Criteria
2. Update **issue file only** (`completed: true`, Implementation Notes) — use absolute main-workspace path; do **not** touch `00-index.md`
3. Run [/deslop](<absolute deslop SKILL.md path>)
4. Commit (user prefix rules; reference <local-id> in message) and push
5. Run [/to-worktree-pr](<absolute to-worktree-pr SKILL.md path>)

Do not run thermo-nuclear review, run-ci, merge-worktree, to-pr, or babysit.
```

If `plans/` is missing in a worktree, use absolute paths into the main workspace for issue reads and updates.

## 3. Implement

Applies to `single` mode and sub-agents in `parallel-subagent-prs`. Skip when generating handoff prompts or orchestrating parallel sub-agents.

1. Read the issue, parent PRD, and blocking issues only as needed. PRD is context, not permission to expand scope.
2. Already complete (`completed: true` / `status: done`) → summarize and ask intent unless the user wants rework.
3. **HITL** (ambiguous AC, product behavior, technical fork, unresolved blocker context) → run `[grill-me](../grill-me/SKILL.md)` first. **AFK** → proceed.
4. Inspect the owning package, nearby code/tests, and optionally the branch diff for overlap (`git diff <base>...HEAD`, or `gh pr diff` if a PR exists).
5. Restate in-scope behavior, code areas, out-of-scope work, and validation. Missing shared groundwork → stop; do not absorb sibling work.
6. Implement with high quality. Follow repo best practices and existing patterns. **Do not take shortcuts** — no hacky fixes, bolt-on branches, or "good enough for now" code. If code you touch can be refactored to be cleaner or more readable, make that change without hesitation while staying within the issue scope. **Remove dead code** you expose and **dedupe** copy-pasted logic — reuse existing helpers instead of adding near-duplicates. Test-first when behavior changes and practical. Respect user/repo validation rules.
7. Blocker → match to an existing issue or stop. Do not morph this slice into a different issue.

## 4. Close out

### `single` and `parallel-handoff-prompts` (per thread)

Update the issue file when complete:

- set `completed: true` and `status: done`
- fill in **Implementation Notes** with what shipped, key files touched, and important decisions
- update **Acceptance Criteria** or **Approach** if reality diverged from the plan
- leave `linear_issue` unchanged unless the user asked for Linear updates
- refresh `00-index.md` from frontmatter

If `plans/` is missing in this worktree, update the issue file and `00-index.md` in the main workspace using absolute paths.

When every issue is complete with no blockers or open HITL gaps, move `plans/in-progress/<slug>/` to `plans/completed/<slug>/`.

After implementation, run `deslop`, then thermo-nuclear review, before merging parallel handoff work with `merge-worktree`. Run `run-ci`, then `to-pr` and `babysit` when the feature branch is ready.

### `parallel-subagent-prs` (sub-agent only)

- update **issue file only** — no `00-index.md`
- `deslop` → commit → push → [`to-worktree-pr`](../to-worktree-pr/SKILL.md)
- skip thermo-nuclear review, `run-ci`, `merge-worktree`, `to-pr`, `babysit`

Main thread refreshes `00-index.md` after the user confirms each parallel PR merged.

## Output

Final reply only. No preamble or process narration.

**When selecting an issue:**

```markdown
**Forge**

- Issue: [<local id>](<issue file path>) — <one-line summary>
- Next: confirm to start
```

**When done (`single`):**

```markdown
**Forge**

- Issue: [<local id>](<issue file path>)
- Changed: <one line>
- Next: [/deslop](../deslop/SKILL.md)
```

**When generating handoff prompts** — output each filled prompt in full (one fenced block per issue, using **Handoff prompt template** exactly), then end with:

```markdown
**Forge**

- Mode: parallel-handoff-prompts
- Issues: <local-id list>
- Next: [/merge-worktree](../merge-worktree/SKILL.md) when threads finish
```

**When orchestrating parallel subagent PRs:**

```markdown
**Forge**

- Mode: parallel-subagent-prs
- Tool: Cursor Multitask | <other sub-agent host> | unavailable → use parallel-handoff-prompts
- Issues: <local-id list>
- Branches: wt/<plan-slug>/<local-id> → <feature-branch> (parallel PRs, not stacked)
- Next: sub-agents close out with [/to-worktree-pr](../to-worktree-pr/SKILL.md)
```

Rules: no preamble; `Next:` always last with a skill link.
