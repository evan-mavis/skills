---
name: to-linear
description: Sync PRD and issue Markdown files from the remote specs repo (`in-progress/` or `completed/`) into Linear. Use when the user explicitly wants to create or update Linear issues from specs repo plan files, preserve parent/sub-issue structure, and create blocking or related dependencies.
---

# To Linear

Create or update Linear issues from Markdown planning files in the [specs repo](../references/specs-repo.md). This is the only skill in this workflow that should create or update Linear issues.

This skill is directly callable after specs repo planning files are approved. It synchronizes planning
state only and does not start implementation.

Use the configured Linear plugin, connector, or provided Linear skill for every Linear read and write. If no Linear integration is available or authentication fails, stop and ask the user to connect Linear rather than inventing issue IDs or URLs.

## Inputs

[Resolve and bootstrap](../references/specs-repo.md#resolve-the-planning-store) the planning store from env, attached workspace roots, user-supplied repo URL/path, an existing plan file path, or an interactive ask. Return `blocked` if unresolved or if clone, pull, or read access fails.

Accept any of:

- a PRD file such as `$SPECS_REPO_PATH/in-progress/<slug>/PRD.md`
- an issue index such as `$SPECS_REPO_PATH/in-progress/<slug>/<slug>-index.md`
- a completed archive path such as `$SPECS_REPO_PATH/completed/<slug>/<slug>-index.md` when the user explicitly wants to sync or update completed work
- one or more issue files under `$SPECS_REPO_PATH`
- pasted plan or issue content
- a request to update existing Linear issues from specs repo files

If the user does not provide a path, inspect `$SPECS_REPO_PATH/in-progress/` and pick the most relevant current plan only when obvious. Treat `$SPECS_REPO_PATH/completed/` as archived and do not sync from it unless the user explicitly references a completed plan. Otherwise ask for the plan or issue path.

## Interaction Standards

When asking the user to choose a plan, target Linear issue, or sync action, follow [interactive choices](../references/host-surfaces.md#interactive-choices).

Use these standard decision prompts:

Missing or ambiguous specs repo plan:

- Header: `Plan`
- Question: `Which specs repo plan should I sync to Linear?`
- Options:
  - `Use detected plan (Recommended)`: Sync the most relevant plan from the specs repo checkout.
  - `Choose another`: Wait for a specific `$SPECS_REPO_PATH/in-progress/<slug>/<slug>-index.md` or `PRD.md` path.

Existing Linear target ambiguity:

- Header: `Target`
- Question: `How should I handle existing Linear issues?`
- Options:
  - `Update existing (Recommended)`: Update the matching Linear issue IDs from specs repo metadata.
  - `Create new`: Create new Linear issues instead.
  - `Stop`: Do not sync until targets are clarified.

## Output

Keep the final answer in the format below and omit a final-answer preamble. Commentary updates may still be used when required by the host.

**When pausing before sync:**

```markdown
**Linear**

- Plan: <slug>
- Target: create | update
- Next: sync | clarify target
```

**When done:**

```markdown
**Linear**

- Parent: [AIR-123](<linear url>)
- [AIR-124](<linear url>)
- [AIR-125](<linear url>) (parallel)
- Failed: None
- Next: start implementation in a fresh task
```

List parent first, then sub-issues in global issue order (ascending local issue number). Use the Linear issue URL for each link; label with the workspace issue id (e.g. `AIR-123`). Add `(parallel)` when the issue has `parallelizable: true`. One issue per bullet after the parent line.

Rules: no final-answer preamble; omit `Failed` when none; `Next:` always last.

## Process

### 1. Read source files

Read the PRD, issue index, and issue files needed for the sync from `$SPECS_REPO_PATH`.

Extract:

- YAML frontmatter from PRD and issue files; treat issue frontmatter as canonical when it exists
- parent PRD title and body
- local issue IDs and filenames
- stage folders and stage order
- global issue ordinals from local IDs and filenames; issue numbers are chronological across the whole plan and do not reset inside each stage folder
- issue titles, completion state, types, `hitl_timing`, statuses, **What to Build**, **HITL Requirement**, **Acceptance Criteria**, and **Approach** — read **Implementation Notes** for context only; never sync them to Linear
- dependency relationships: blocked by, blocking, related, parent/sub-issue
- existing `linear_issue` and `last_synced` frontmatter fields

If `<plan-slug>-index.md` disagrees with issue frontmatter, prefer frontmatter and update the index after successful sync.

### 2. Resolve Linear targets

Use Linear only after the user has explicitly invoked `to-linear`.

For each file:

- if frontmatter contains `linear_issue`, or the body contains a Linear issue ID or URL, fetch that issue and update it
- if the user names an existing Linear issue, fetch it and confirm it is the intended target
- if no Linear issue exists, create one

Treat the PRD as the main parent issue for the feature, improvement, or bug fix unless the user says otherwise.

### 3. Preserve structure

Map specs repo structure into Linear:

- PRD file -> parent Linear issue
- issue files -> implementation sub-issues where that structure fits
- staged folders -> dependency-safe creation order; files in the same stage may be parallel siblings
- global issue ordinals -> sub-issue ordering and local reference labels; preserve them when updating Linear bodies or metadata
- `blocked_by` / `blocking` -> Linear blocked/blocking relationships
- useful non-hierarchical relationships -> related issue links
- `HITL` / `AFK` and HITL timing -> include clearly in the issue body or label if the workspace supports it

Create or update issues in dependency-safe order:

1. create or update the parent PRD issue
2. create or update issues in ascending global issue ordinal, while respecting dependency relationships
3. create or update implementation sub-issues that were skipped until their dependencies existed
4. add blocked/blocking relationships
5. add related links only where useful

Do not close the parent PRD issue as part of this workflow.

### 4. Issue body format

Use Linear's collapsible section convention for every major heading. **Each section must be flat (level 1)** — open with `+++ ## Title`, close with `+++` on its own line, then start the next section. Never omit the closing `+++`; unclosed sections nest into a waterfall in Linear.

```markdown
+++ ## Collapsible title

Body content goes here.

+++

+++ ## Next section

More content.

+++
```

Linear uses the **same section names** as issue files, but shorter — a skim-friendly summary for the team. Do not copy issue files verbatim; compress each section.

- **What to Build** → 1–2 sentences. What ships and why it matters.
- **Acceptance Criteria** → same checkboxes, but trim if the list is long. Keep observable outcomes, drop implementation detail.
- **Approach** → 2–3 bullets max. Surfaces and constraints only — no file paths, migrations, or agent handoff notes.
- **HITL Requirement** → for HITL issues only, preserve the exact decision or action, timing, and evidence requirement.
- **Implementation Notes** → specs repo only. Never sync to Linear.

Each implementation issue body should use this shape:

```markdown
+++ ## What to Build

Short summary of what this ships and why it matters.

+++

+++ ## Acceptance Criteria

- [ ] Observable outcome
- [ ] Observable outcome

+++

+++ ## Approach

- Main surfaces or areas affected
- Key constraint or dependency, if non-obvious

+++

+++ ## Human Input

Timing plus the exact human decision or action. Include only for HITL issues.

+++

+++ ## Dependencies

Blockers or related Linear issues — only when needed. Link Linear IDs when available.

+++
```

Omit **Human Input** for AFK issues. Omit **Dependencies** when there are no meaningful blockers or related issues.

For the parent PRD issue, compress the PRD into Linear using its own sections (`Intent`, `Target Behavior`, `Scope`, `Key Decisions`) — not the issue template above.

Keep file paths, migration steps, and agent handoff detail in the specs repo only.

- For newly created Linear issues, write acceptance criteria as unchecked `- [ ]` checkboxes.
- For updates to existing Linear issues, preserve checked state from issue files when present.
- If acceptance criteria are plain bullets, convert them to `- [ ]` checkboxes when writing to Linear.
- Do not mark criteria `[x]` in Linear merely because the issue was created or synced; checked state reflects implemented work.

### 5. Update specs repo files

After successful Linear writes, update the Markdown files in `$SPECS_REPO_PATH`:

- set PRD frontmatter `linear_issue` and `last_synced` for the parent Linear issue
- set issue frontmatter `linear_issue` to the Linear ID or URL
- set issue frontmatter `last_synced` to the current date/time
- preserve completion state, implementation notes, and statuses
- preserve `type`, `hitl_timing`, and the full **HITL Requirement**
- regenerate or update `<plan-slug>-index.md` from issue frontmatter when an index exists
- preserve global issue numbering in file paths, local IDs, and index rows; do not renumber or reset issue files per stage during sync
- do not change `completed: false` to `completed: true` merely because a Linear issue was created; completion reflects implementation, not sync state

If a Linear write fails, do not mark the file as synced.

After updating files, [commit and push](../references/specs-repo.md#commit-and-push-after-mutations) the specs repo.
