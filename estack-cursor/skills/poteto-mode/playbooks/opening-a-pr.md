### Opening a PR

Invoked at the end of every other playbook.

**Worktree.** Resolve the default base with `git symbolic-ref --quiet refs/remotes/origin/HEAD` and use that remote-tracking ref. If it is missing, verify the remote default branch and set `origin/HEAD` before continuing; do not assume a branch name. Work from a git worktree off that base. Subagents inherit it. Multiple Cursor subagent spawns on the same branch each get their own worktree. Before any `git reset --hard`, inspect `git status --short`; it discards uncommitted tracked work. Preserve unrelated edits in a patch or another worktree and never reset an active worker's checkout. For a reusable clean worktree, fetch and verify its exact remote branch before resetting to it. For a snarled worktree, preserve wanted edits and recreate it from the resolved base.

**Commits.** Commit liberally. Rebase into small, ordered commits before opening PRs. Each commit is a future PR: landable, ordered to tell the story. Amend when the fix belongs in a just-made commit. New commit when separable.

**PRs.** Run the bundled **deslop** skill (`../../deslop/SKILL.md`) over the diff before commit. Run the bundled **no-comments** skill (`../../no-comments/SKILL.md`) before review. Write every PR title, PR description, and commit body with the bundled **technical-writing** skill (`../../technical-writing/SKILL.md`), then apply **unslop** (`../../unslop/SKILL.md`). Apply every technical-writing layer except Diátaxis. Use one word for each action, keep articles, and avoid `-ing` when a plain verb works.

**Titles.** Start every commit subject and PR title with exactly one of `feat:`, `fix:`, `tech:`, `refactor:`, or `maintenance:`. `feat:` is a new feature or user-facing enhancement. `fix:` is a bug fix, including UI fixes. `tech:` is internal technical, infrastructure, or developer-experience work. `refactor:` restructures code without materially changing behavior. `maintenance:` is cleanup, CI, dependency updates, or PR polish. Pick the prefix for the primary purpose. Keep the subject lowercase, short, and imperative, except for case-sensitive symbols, product names, and issue IDs. Name a real symbol when one carries the change. End a PR title with its Linear issue IDs in parentheses, for example `fix: correct checkout total (ENG-456)` or `feat: add retailer workflows (ENG-123, ENG-456)`. Do not add a trailing period.

**Branches.** With a Linear issue ID, use `feat/<ID>-short-kebab-case` for features and enhancements and `fix/<ID>-short-kebab-case` for bug fixes. Keep the ID exactly as given. Without an ID, use `feat/short-kebab-case` or `fix/short-kebab-case`.

**Descriptions.** The PR body is a briefing, not the lab notebook. A reviewer who has the diff should learn why the change exists, what it leaves out, what it could break, and how you proved it works in under a minute. Write short, simple sentences with few identifiers. The squash commit body is the PR body. If the body would make the squash commit longer than about 40 lines, cut the body.

Read the repository's PR template first. Its structure wins. Otherwise put each section under a `##` heading in this order. Drop a section when it has nothing to say, except Scope.

- `## Why`. State the problem and approach in one to three short sentences. Do not list SHAs or rebase genealogy. Do not add a "based on the default branch" preamble.
- `## What changed`. Use one to three short bullets. Name a symbol or path when it carries the change. Name both sides of a rename or retarget.
- `## Scope`. Always name what the PR covers and what it leaves out, such as a follow-up or a known gap. Use one to three short items. Do not write a file-by-file essay.
- `## Tradeoffs`. Name only rejected alternatives that a reviewer would otherwise ask about. Skip this section when there was no real choice.
- `## Blast Radius`. In one or two sentences, name who or what the change touches and why the change is safe or risky. State the continuing cost if the default branch stays red without the fix.
- `## Verification`. Use one to three bullets that name real run paths and their outcomes. For a performance change, report one primary number with its unit in `before → after` form. Link the arena or swarm directory for the remaining evidence. Do not include sample-size methodology, swarm recitals, or metric tables.

After these sections, attach videos or screenshots when they prove a claim. For video capture and delivery, follow [Record a demo](../references/video-recording.md). Do not paste full SHAs, swarm or arena lane recitals, lever-correction essays, file-by-file checklists, or "CLEAN" verdicts. Put these details in a linked artifact. A commit body does not restate its subject.

**Forge.** Resolve the forge before the first PR operation and keep that choice for create, edit, view, watch, and merge. GitHub CLI (`gh`) is the default. If `command -v origin` succeeds and Origin can resolve the repository, prefer `origin pr ...`. If Origin is absent or cannot resolve the repository, stay on `gh` and record the fallback. Do not require Graphite (`gt`) outside the Orchestrate stacker role, which owns stack tracking and frontier recomputation.

**Built-in PR tool.** When a purpose-built PR tool is available, use it for creation, edits, retargeting, and readiness according to its instructions. Use the resolved forge for operations the tool does not cover. Record every created PR URL in the task and decision trail. Use a native attachment capability only when the current runtime exposes one.

**Size and stacks.** Prefer five narrow PRs to one large PR. A stack is a base-branch chain. The root PR targets trunk. Each child branch rebases onto its parent's exact tip and its PR targets the parent branch. Without a built-in PR tool, create a child with `origin pr create --status open --base <parent-branch>` or `gh pr create --base <parent-branch>` according to the resolved forge. Without a built-in PR tool, retarget an existing child with `origin pr edit <pr> --base <parent-branch>` or `gh pr edit <pr> --base <parent-branch>`. Branch from trunk only for independent work. Rebase on trunk before substantial stack work.

**Readiness.** Open every PR ready, never as a draft. With Origin, pass `--status open`. With `gh`, omit `--draft`. A built-in PR tool can default to draft, so set `draft: false` on creation when supported. If a PR still opens as a draft, mark it ready through the PR tool, or run `origin pr ready <number>` or `gh pr ready <number>` according to the resolved forge. Run `origin pr view <number>` or `gh pr view <number>` before you refer to PR status.

**Babysit.** Opening a PR does not start a babysit. Post the URL and keep building. Finish the phase or stack first. Run a separate babysit pass only when the user asks for one after the whole stack exists. A babysit for each new PR stalls the build and spends checks on commits that later waves restart. Push back when feedback drifts from intent.

A subagent that opens a PR runs the bundled **interrogate**, **deslop**, and **no-comments** skills, and posts the URL. Then it returns to the parent without babysitting, unless it is an Autopilot-full or Autopilot-stack owner. That owner's brief assigns the babysit loop and is the ask `playbooks/babysit.md` waits for. The owner starts the loop after its code-ready report and reports merge-ready or STACK-READY as its playbook says. The rules here and in `playbooks/babysit.md` that hold babysitting until a whole stack is built do not apply to that owner.
