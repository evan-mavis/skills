---
name: to-linear
description: Sync local PRD and issue Markdown files from the repo's ignored `plans/` directory into Linear. Use when the user explicitly wants to create or update Linear issues from local plan files, preserve parent/sub-issue structure, and create blocking or related dependencies.
---

# To Linear

Create or update Linear issues from local Markdown planning files. This is the only skill in the local planning workflow that should create or update Linear issues.

Use the available Linear integration for all Linear reads and writes. In Cursor, prefer the Linear MCP/plugin. In other agent environments, use the configured Linear MCP, plugin, or skill when available. If no Linear integration is available or authentication fails, stop and ask the user to connect Linear rather than inventing issue IDs or URLs.

## Inputs

Accept any of:

- a local PRD file such as `plans/<slug>/PRD.md`
- a local issue index such as `plans/<slug>/00-index.md`
- one or more local issue files
- pasted local plan or issue content
- a request to update existing Linear issues from local files

If the user does not provide a path, inspect `plans/` and pick the most relevant current plan only when obvious. Otherwise ask for the plan or issue path.

## Interaction Standards

When asking the user to choose a plan, target Linear issue, or sync action, use the structured decision UI when available. Present 2-3 mutually exclusive choices, put the recommended option first, and label it `(Recommended)`. If the decision UI is unavailable, use the same choices as a concise numbered list.

Use these standard decision prompts:

Missing or ambiguous local plan:

- Header: `Plan`
- Question: `Which local plan should I sync to Linear?`
- Options:
  - `Use detected plan (Recommended)`: Sync the most relevant local plan.
  - `Choose another`: Wait for a specific `plans/<slug>/00-index.md` or `PRD.md` path.

Existing Linear target ambiguity:

- Header: `Target`
- Question: `How should I handle existing Linear issues?`
- Options:
  - `Update existing (Recommended)`: Update the matching Linear issue IDs from local metadata.
  - `Create new`: Create new Linear issues instead.
  - `Stop`: Do not sync until targets are clarified.

Use these standard phase output shapes:

Before writing to Linear:

```markdown
**Linear Sync Plan**
- Local Plan: <plans/slug/00-index.md>
- Parent Target: Create | Update <id>
- Issues: <count>
- Existing Links: <count>
- Dependencies: <count>
- Decision Needed: <Plan | Target | None>
```

## Process

### 1. Read local source files

Read the PRD, issue index, and issue files needed for the sync.

Extract:

- parent PRD title and body
- local issue IDs and filenames
- stage folders and stage order
- global issue ordinals from local IDs and filenames; issue numbers are chronological across the whole plan and do not reset inside each stage folder
- issue titles, completion checkboxes, types, statuses, acceptance criteria, technical approach, and implementation notes
- dependency relationships: blocked by, blocking, related, parent/sub-issue
- existing `Linear Sync` fields, if present

### 2. Resolve Linear targets

Use Linear only after the user has explicitly invoked `to-linear`.

For each local file:

- if it contains a Linear issue ID or URL, fetch that issue and update it
- if the user names an existing Linear issue, fetch it and confirm it is the intended target
- if no Linear issue exists, create one

Treat the PRD as the main parent issue for the feature, improvement, or bug fix unless the user says otherwise.

### 3. Preserve structure

Map local structure into Linear:

- PRD file -> parent Linear issue
- local issue files -> implementation sub-issues where that structure fits
- staged folders -> dependency-safe creation order; files in the same stage may be parallel siblings
- global issue ordinals -> sub-issue ordering and local reference labels; preserve them when updating Linear bodies or local metadata
- `Blocked By` / `Blocking` -> Linear blocked/blocking relationships
- useful non-hierarchical relationships -> related issue links
- `HITL` / `AFK` -> include clearly in the issue body or label if the workspace supports it

Create or update issues in dependency-safe order:

1. create or update the parent PRD issue
2. create or update local issues in ascending global issue ordinal, while respecting dependency relationships
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

Each implementation issue body should include:

- `What to Build`
- `Scenarios / Outcomes Covered`, when present locally; preserve block quote formatting for each item
- `Acceptance Criteria`
- `Technical Approach`
- `Implementation Notes`, when present locally

**`What to Build` must be transformed for Linear — do not copy the local issue verbatim.**

Local issue files are agent-oriented execution slices. Linear `What to Build` is a **standalone, human-readable spec** for sprint planning. Synthesize it from the local issue, parent PRD (`Intent`, `Target Behavior`, `Scenarios`, `Scope`), and key decisions.

Write `What to Build` so AF/EH, PM, or eng can read only this section and explain the issue in standup without opening `plans/`.

Include:

- **Context** — 1–2 sentences on the current pain or gap and why this issue exists
- **Who it's for** — primary users (e.g. AF/EH ops)
- **What ships** — 3–6 bullets describing concrete capabilities or outcomes in plain language
- **Scope note** — what this issue does *not* include when that helps bound expectations (especially foundation vs UI issues)

Keep it **high level** in this section: no file paths, migration column names, tRPC/router names, or folder structure. Put that detail in `Technical Approach` and specific verifiable items in `Acceptance Criteria`.

Target length: ~1 short paragraph plus bullet list. Be **more comprehensive and readable** than the local `What to Build`, not a condensed copy.

**Acceptance Criteria must use Markdown task checkboxes** in Linear, one criterion per line, all unchecked at sync time:

```markdown
+++ ## Acceptance Criteria

- [ ] Observable criterion
- [ ] Observable criterion

+++
```

- Preserve `- [ ]` / `- [x]` from local issue files when syncing updates.
- If local acceptance criteria are plain bullets, convert them to `- [ ]` checkboxes when writing to Linear.
- Do not mark criteria `[x]` in Linear merely because the issue was created or synced; checked state reflects implemented work.

### 5. Update local files

After successful Linear writes, update the local Markdown files:

- set `Linear Issue` to the Linear ID or URL
- set `Last Synced` to the current date/time
- preserve local completion checkboxes, implementation notes, and statuses
- update `00-index.md` with created or updated Linear IDs when an index exists
- preserve global issue numbering in file paths, local IDs, and index rows; do not renumber or reset issue files per stage during sync
- do not change `Completed: [ ]` to `Completed: [x]` merely because a Linear issue was created; completion reflects implementation, not sync state

If a Linear write fails, do not mark the local file as synced.

## Output Expectations

End with:

```markdown
**Linear Sync Complete**
- Parent: <created/updated Linear issue>
- Issues: <created/updated count>
- Dependencies: <created/updated summary>
- Local Metadata: Updated | Partially updated | Not updated
- Failed Syncs: <None or list with reason>
```
