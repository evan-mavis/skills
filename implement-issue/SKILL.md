---
name: implement-issue
description: Select and implement the next local issue from a plan, index, chat context, or specific issue Markdown file. Use when the user asks to implement an issue, continue a local plan, find the next unblocked issue, or execute one local issue slice. Linear issue IDs or URLs may be used only as optional context when the user explicitly asks for Linear.
---

# Implement Issue

Select and implement local issue slices from Markdown files under the repo's ignored `plans/` directory. Prefer one issue slice at a time unless the user explicitly chooses a parallel execution mode. When the user wants parallel work, generate prompts for separate agent threads.

This skill is the execution phase of the local planning workflow:

1. `grill-me` clarifies the work when needed
2. `to-prd` creates the local parent PRD
3. `to-issues` creates local implementation slice files
4. `implement-issue` executes one local slice
5. `to-linear` optionally syncs local plans or issue files to Linear

Assume other agents may be working on sibling local issue files. Stay tightly scoped to the single issue you were given. Do not expand into adjacent issues unless the current issue cannot be completed without it. Keep parallel work separated so each issue can be reviewed as its own diff.

## Inputs

Accept any of:

- a `plans/**/*.md` local issue file path
- a local PRD, plan file, or `plans/**/00-index.md`
- pasted local issue content
- a request like "implement issue", "continue this plan", or "find the next issue" when the current context points to a local plan
- a Linear issue ID or URL only when the user explicitly wants Linear context

If the user gives a Linear issue ID or URL without saying to use Linear, ask whether they want to run `to-linear` or paste/export the issue contents locally first.

## Workflow

### 1. Resolve the plan or issue context

First determine whether the user provided a specific issue or a plan/index context.

If the user provided a specific local issue file or pasted one issue, use that as the primary issue. Still try to locate its surrounding `00-index.md`, stage folder, and sibling issue files so you can detect other unblocked parallelizable issues in the same execution stage.

If the user provided a plan, PRD, `00-index.md`, or only chat context, find the active local issue set:

- prefer an explicitly attached or mentioned `00-index.md`
- otherwise inspect the referenced PRD or plan for linked issue files
- otherwise inspect the most relevant `plans/*/00-index.md` only when the active plan is obvious from the conversation
- if multiple plans are plausible, ask the user which plan/index to use

When scanning an index or issue directory, read enough issue files to determine:

- `Completed: [ ]` / `Completed: [x]`
- `Status`
- `Type`: `AFK` or `HITL`
- `Blocked By` and `Blocking`
- `Parallelizable`
- `Stage`
- global issue ordinal from the local ID and issue filename
- parent plan path
- issue title and filename

Treat `Completed: [x]` or `Status: Done` as completed. Treat an issue as blocked when any `Blocked By` local ID or filename points to an issue that is not completed.

Use staged folders as a scheduling hint:

- numbered stage folders execute in ascending order
- issue filenames and local IDs use global chronological ordinals across the whole plan, not ordinals that reset inside each stage
- do not select issues from a later stage while an earlier stage still has incomplete, unblocked issues
- issue files in the same stage are the first candidates for parallel execution
- dependency metadata remains canonical when it conflicts with folder placement
- when two eligible issues are otherwise equivalent, prefer the lower global issue ordinal

Choose eligible next issues using this order:

1. incomplete and unblocked foundation issues
2. incomplete, unblocked `AFK` issues
3. incomplete, unblocked `HITL` issues, only to gather clarification before implementation

Skip completed and blocked issues. If no eligible issue exists, summarize completed work and blockers, then stop.

When the user provided a specific primary issue, treat that issue as the default selected issue even if other eligible issues exist. If the primary issue is completed or blocked, stop and explain why before suggesting alternatives.

### 2. Confirm execution mode

Do not begin implementation from a plan/index scan without user confirmation.

When presenting candidates from a plan/index scan, keep the report concise:

- default single-thread execution: show only the single next eligible issue
- explicit parallel execution: show only the next-up parallelizable eligible issues, usually from the earliest eligible stage
- for each shown issue, include its local ID, title or path, and a one-line summary of what it implements
- do not list completed skipped issues, blocked skipped issues, recommended mode, or decision metadata unless the user asks for scheduling details

If exactly one eligible issue exists, present only that issue with a one-line summary and ask whether to start it.

If the user provided a specific primary issue, proceed with that issue in `single` mode by default. Do not ask for an execution-mode decision just because sibling issues are parallelizable. A specific issue path, pasted single issue, or parallel prompt pasted into an already-created worktree means the user has already selected the issue for this thread.

Only ask the specific-primary-issue execution-mode question when the user explicitly asks to consider sibling issues, asks to parallelize from the current thread, or asks how to schedule the remaining stage. In that case, present the primary issue plus the sibling candidates and ask whether to:

- implement only the primary issue in this thread
- use `parallel-prompts` for selected sibling issues while this thread handles the primary issue or waits
- use `batch-current-branch` to implement selected issues in this branch without separate isolation

If multiple eligible issues exist from a plan/index scan, present only the next-up candidates and ask the user to choose an execution mode:

- `single`: implement one selected issue in the current thread
- `parallel-prompts`: generate ready-to-use prompts for separate agent threads, one prompt per parallelizable issue
- `batch-current-branch`: implement multiple selected issues in the current branch, keeping the work separated by issue in summaries and commits only if the user explicitly asked for commits

Default to `single` when the user does not explicitly choose parallelism. When the user asks to parallelize while keeping chunks reviewable, recommend `parallel-prompts`.

Use the structured decision UI for every execution-mode question when available. Present 3-4 mutually exclusive choices, put the recommended option first, and label it `(Recommended)`. If the decision UI is unavailable, use the same choices as a concise numbered list.

Use these standard decision prompts:

Specific primary issue with parallel siblings:

- Header: `Mode`
- Question: `I found parallelizable sibling issues in this stage. How should I proceed?`
- Options:
  - `Parallel Prompts (Recommended for parallel work)`: Generate one ready-to-paste prompt per selected sibling issue.
  - `Single issue`: Implement only the primary issue in this thread.
  - `Batch in this branch`: Implement selected issues in the current branch without separate isolation.

Plan/index scan with one eligible issue:

- Header: `Start`
- Question: `I found the next unblocked issue. Should I start it?`
- Options:
  - `Start issue (Recommended)`: Implement the selected issue in this thread.
  - `Do not start`: Stop after reporting the candidate.

Plan/index scan with multiple eligible issues:

- Header: `Mode`
- Question: `Multiple unblocked issues are eligible. Which execution mode should I use?`
- Options:
  - `Parallel Prompts (Recommended for parallel work)`: Generate one ready-to-paste prompt per selected issue.
  - `Single issue`: Implement one selected issue in this thread.
  - `Batch in this branch`: Implement selected issues in the current branch without separate isolation.

For `batch-current-branch`, implement selected issues in the current branch only when the user explicitly chooses that mode. Keep work serialized, report changes issue-by-issue, and create separate commits only if the user explicitly asked for commits.

For `parallel-prompts`, do not implement. Output one prompt per selected issue and leave execution to the user in separate agent threads. Only include incomplete, unblocked issues marked parallelizable whose expected write areas are meaningfully disjoint. Keep foundation issues out of parallel prompt generation unless they are already completed.

Before generating parallel prompts, capture the current main feature branch context from the invoking thread:

- current workspace path, usually from `pwd`
- current branch, usually from `git branch --show-current`
- current short status, usually from `git status --short --branch`

Treat that branch as the destination feature branch that the parallel worktree branches are expected to merge back into. Do not invent branch names, worktree directory names, or worktree creation commands in generated prompts. Include the destination feature branch only when it is known from the current workspace. Use absolute paths for plan, index, PRD, and issue file references in generated prompts, rooted at the captured main workspace path when possible. Assume the user creates each isolated worktree through their environment before pasting the prompt.

Each prompt should include:

- exact issue file path, preferably absolute
- index path, preferably absolute
- parent PRD or plan path when known, preferably absolute
- destination feature branch name from the main thread, plus the main workspace path when known
- stage folder and why the issue is eligible now
- note that the issue is currently unblocked
- instruction to stay scoped to that issue
- instruction to run in the already-created isolated worktree/thread and keep the resulting diff reviewable
- instruction to read ignored plan docs from the absolute main workspace paths if the isolated worktree does not contain `plans/`
- instruction to confirm the current isolated workspace path and source branch before making changes
- instruction to preserve the destination feature branch context in the final summary so the main thread can later merge the source branch back with `merge-worktree-branch`
- instruction to summarize the completed slice, current branch, changed files, validation performed, and any blockers or follow-ups
- instruction to mark the selected local issue file as complete when finished by setting `Completed: [x]`, setting `Status: Done`, and adding implementation notes
- instruction to keep shared plan metadata reviewable in parallel work: update `00-index.md` and `diagram.md` only when appropriate for that isolated branch, and otherwise clearly report that shared metadata reconciliation remains for the destination branch

### 3. Resolve the selected issue context

Read the selected primary local issue file or pasted issue content first.

Then gather only related local context that is useful for implementation:

- read the parent PRD or plan when listed
- read blocking issue files when they materially affect current implementation
- read sibling or related issue files only when necessary
- do not pull in the entire local issue graph without a reason

Treat the parent PRD as product and scope context, not permission to broaden beyond the assigned slice.

If the issue depends on a foundation issue, treat that foundation as a prerequisite. Do not rebuild or reinvent the shared abstraction unless the issue explicitly owns that work.

Before implementation, inspect the top metadata block. If it says `Completed: [x]` or `Status: Done`, treat the issue as already completed unless the user explicitly asks to revisit it. Summarize the existing implementation notes and ask for the intended follow-up rather than reimplementing the same slice.

### 4. Classify the issue

Determine whether the issue is effectively `AFK` or `HITL`.

`AFK` means the issue can likely be implemented end-to-end without waiting on human clarification.

`HITL` means the issue still needs a human decision, such as:

- ambiguous product behavior
- missing acceptance criteria
- unclear technical direction with multiple valid choices
- dependency on unresolved parent or blocking issue context

If the issue is clearly `AFK`, proceed.

If the issue is `HITL`, do not guess through material ambiguity. Use `[grill-me](../grill-me/SKILL.md)` to gather the missing context before implementation.

### 5. Gather codebase context

Before changing code:

- identify the owning package or surface area
- inspect nearby implementation and existing tests
- check recent commits in the area you are touching when helpful
- optionally compare the current branch to `development` if that clarifies local context or overlapping work

Use branch diffs selectively. They are context-gathering, not a requirement for every issue.

### 6. Define the implementation slice

Restate the exact scope of the current issue in concrete terms:

- behavior that will change
- code areas in scope
- work explicitly out of scope
- validation appropriate for this slice

Stay inside the issue boundary. If additional work belongs elsewhere, note it, but do not silently absorb it.

If the current issue reveals missing shared groundwork, stop and determine whether that work belongs in an existing foundation issue or a new local issue file.

### 7. Implement

Use `[tdd](../tdd/SKILL.md)` as the default execution method when the issue changes behavior and would benefit from regression coverage.

Do not treat `tdd` as a separate stage before `implement-issue`. `implement-issue` is the execution wrapper for the issue, and `tdd` is the implementation method used inside it when appropriate.

If the issue is trivial, mechanical, or non-behavioral, use a lighter implementation path. Otherwise, prefer `tdd`.

TDD and validation must still respect the user's instructions and the repo's local validation rules. If tests, typecheck, lint, or other validation are disallowed unless explicitly requested, do not run them without explicit request. You may still write or update focused tests when appropriate, but only run allowed validation commands.

For `airgoods`:

- backend: follow existing Vitest, factory, builder, helper, and repository patterns
- web: follow nearby Vitest and user-visible behavior testing patterns
- shared packages: test through exported interfaces

Prefer one vertical slice at a time. Do not broaden into multiple sibling issues.

### 8. Handle blockers

If implementation reveals a real blocker:

- check whether the blocker is already represented by a local blocking or related issue file
- if the blocker is unresolved and prevents completion, stop and surface it clearly
- if a small local workaround is valid within the current issue scope, use it and explain the tradeoff

Do not mutate the plan into a different issue just to keep moving.

### 9. Update the local issue file

Keep the local issue file accurate as implementation proceeds. If implementation changes the intended behavior, scope, acceptance criteria, technical approach, validation notes, local source links, or dependencies, update those sections directly before closeout so future agents do not work from stale planning text.

When implementation is complete, update the local issue file when one exists:

- set `Completed: [x]` when the issue is actually complete; this is required closeout work for direct `/implement-issue` execution, including when running inside an isolated worktree for a parallel issue
- leave `Completed: [ ]` only if the issue remains blocked or partial, and explain the blocker or remaining work in the issue file and final response
- set `Status` to `Done` or the most accurate current state
- add a short implementation note with key changed files, behavior shipped, and important decisions
- update the relevant issue sections directly if the implementation differs from the original plan
- add remaining blockers, follow-ups, or validation gaps
- preserve any `Linear Sync` section without changing Linear state unless the user explicitly asked for Linear updates

Also update the matching row in `00-index.md` when an index exists:

- set the `Done` checkbox to `[x]` only when the issue file has `Completed: [x]`
- keep `Status` aligned with the issue file
- preserve dependency columns unless the implementation changed the dependency reality; if it did, update both the index and affected issue files

Also update `diagram.md` when it exists:

- keep completion markers aligned with issue files
- keep node classes aligned with status and type
- update blocker arrows if dependency metadata changed
- preserve the strict Mermaid structure created by `to-issues`

## Operating Rules

- Focus on one issue by default unless the user explicitly chooses a parallel execution mode
- Assume other agents may be editing neighboring areas
- When invoked with a plan or index, act as a scheduler first: scan completion and blockers, then ask before implementing
- Do not spawn sub-agents or create isolated checkouts for parallel execution; generate prompts instead when the user chooses parallel work
- Prefer `parallel-prompts` when the user wants parallelism and reviewable code chunks
- Do not revert unrelated work
- Prefer the minimum code change that satisfies the issue
- Pull related local or Linear context only when it materially helps
- Use the top-level `Completed: [ ]` / `Completed: [x]` checkbox as the canonical completion signal for local issue files
- Update the relevant local issue sections directly when code reality differs from the original plan
- Use `grill-me` only when human clarification is actually needed
- Use `tdd` as the default implementation method for behavioral changes, while respecting repo and user validation constraints
- Keep the diff reviewable enough to merge as one small issue-scoped chunk

## Output Expectations

When invoked with a plan or index, first report:

```markdown
**Issue Selection**
- Next: <local id and title/path> — <one-line summary>
```

If the user explicitly asks for parallel execution and multiple next-up issues are eligible, use one `- Next:` line per issue. Do not include skipped completed issues, skipped blocked issues, recommended mode, or decision metadata by default.

At the start, briefly state:

```markdown
**Implementation Start**
- Issue: <local id and path>
- Type: AFK | HITL
- Stage: <stage>
- Scope: <one sentence>
- Context: <extra files being read or None>
```

Before edits, briefly state:

```markdown
**Edit Plan**
- Code Area: <package/surface>
- Method: TDD | focused implementation
- Tests: <planned local test edits or None>
```

At the end, report:

```markdown
**Implementation Complete**
- Issue: <local id and path>
- Changed: <short summary>
- Blockers: <None or summary>
- Follow-ups: <None or local issue needed>
- Issue File: Updated | Not updated
- Index: Updated | Not updated
- Diagram: Updated | Not updated
- Completion: `Completed: [x]` | still incomplete
```

When `parallel-prompts` is selected, report:

```markdown
**Parallel Prompts**
- Plan/Index: <path>
- Destination Feature Branch: <current main-thread branch or unknown>
- Main Workspace: <current main-thread workspace path or unknown>
- Selected Issues: <issue ids and paths>
- Prompts: <one ready-to-paste prompt per issue>
- Coordination Note: Keep each issue in a separate agent thread. When a worktree branch is ready, return to the main thread on the destination feature branch and use `merge-worktree-branch` to pull it in; reconcile shared plan metadata after reviewing completed work.
```
