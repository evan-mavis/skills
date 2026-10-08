---
{name: automate-me,description: "Use for \"automate me\", \"create/update/refresh my -mode skill\", \"turn/capture my preferences or working style into a skill\", or wanting agents to follow how the user works. Drafts or revises a personal -mode skill with skill-authoring guidance and unslop, optionally pulling fresh evidence from recent transcripts."}
---

# Automate me

A guided flow for turning the user's working conventions into a skill agents will follow. The output is one `-mode` skill tailored to them (e.g. `jay-mode`, `priya-mode`).

Mine the scoped history, draft with an available skill-authoring skill or the Devin skill format, and apply **unslop** to the prose.

## Flow

### 0. Check for an existing skill

Look for matching mode skills in the live catalog, project `.devin/skills/` or `.agents/skills/`, and personal `~/.config/devin/skills/` or `~/.agents/skills/`. Mode skills can live in a personal category directory (`.agents/skills/<handle>/`), not only at the top level. If one exists, confirm intent with the available structured question tool (unless they already said "update my skill" or similar):

- Update the existing skill (default for repeat runs)
- Start fresh (rare, ask why before doing it)

Update mode changes the rest of the flow:
- Step 1 mines only history since the skill was last edited (`git log -1 --format=%cI <path>`).
- Step 2 asks what's changed or missing, not what to capture from zero.
- Step 4 edits the existing file in place. Preserve sections the user hasn't contradicted. Revise ones with new evidence. Add new sections only for genuinely new rules.

### 1. Mine their history

Use accessible Devin conversation history or a user-provided transcript. Confirm its repository, workspace, session, and topic before reading relevant excerpts. Do not scan unrelated chats or assume a local transcript path or schema. If no history source is available, use the current conversation and durable branch or task reports, and report the history gap.

Survey recent agent conversations within that scope for recurring patterns. When the scoped history is accessible to delegates, run parallel subagents across slices of history, such as the last 2-4 weeks. Give each source references or scoped excerpts, and local paths only for verified exports. Each subagent reads its assigned records, looks for the signals below, and returns patterns with evidence pointers. If delegates cannot access history, mine it in the parent. If only the current conversation is available, use it without pretending to have sampled other sessions. Default signals worth hunting:

- Response preferences (length, tone, format, "dumb it down" corrections)
- Delegation habits (subagents, models, specialized workflows, parallelism)
- Verification posture (what "done" means, unit tests vs live repro, reviewers)
- Code and prose discipline (style, principles cited, lint/format tools)
- Process conventions (worktrees, commits, PRs, review/merge tooling)
- Meta preferences (fixing skills mid-task, proposing new ones)

Cross-check across slices before elevating a signal. Patterns seen in 2+ slices are high-confidence. Lone signals are weak and usually get dropped.

### 2. Ask the user directly

Mining misses intent that hasn't come up yet. Use the available structured question tool (structured multi-choice) rather than asking the user to type from scratch.

Shape: one or two short questions using the choices and limits the live question tool supports. Start broad ("Which areas matter most?"), then follow up on selected areas with specific options. If no structured question tool is available, ask in chat. After the structured rounds, one free-form chat question catches anything the options missed.

Don't dump 20 questions.

### 3. Cluster findings

Group the combined signals into sections. Common ones (use only what applies):

- **Response style**: length, tone, format.
- **Autonomy**: how much to do without asking, MCP tool use.
- **Understand first**: which skills to reach for when scoping or investigating a change.
- **Subagents**: default, parallelism, model-to-task, specialized workflows.
- **Prose / code discipline**: principles, lint tools, style guides.
- **Review and verify**: repro posture, verification skills, live-testing tools.
- **Process**: git worktrees, commits, PRs, review/merge tooling.
- **Skills**: skill-authoring habits, fix-the-skill-first, proposing new skills.

The **poteto-mode** skill shows the shape. Read it for granularity. Don't copy its content. The user's rules are not the same as poteto-mode's.

### 4. Draft the skill

Use an available skill-authoring skill, or the [Devin skill format](https://docs.devin.ai/cli/extensibility/skills/creating-skills) to author the skill. Placement:

- Path: preserve an existing mode skill's category. For a new mode, use `.agents/skills/<handle>/<handle>-mode/SKILL.md` when the repo has an established personal category for that handle. Otherwise default to `.agents/skills/<handle>-mode/SKILL.md` in the project (or `~/.agents/skills/<handle>-mode/` if the user prefers a personal skill).
- Handle: the user's first name or chosen identifier.
- Frontmatter `description`: trigger on their name + `$<handle>-mode` + "work in their style", not on generic keywords like "write code" or "review PR".
- Frontmatter formatting: follow the Devin skill format. Keep `description` as one YAML scalar. Quote it or use `description: >-` with indented continuation lines when punctuation or wrapping requires it.
- Preserve an existing invocation policy. For a new mode, keep automatic selection enabled unless the user requests explicit-only invocation. For explicit-only invocation, set `triggers: [user]` in `SKILL.md` frontmatter.

### 5. Iterate on prose

Apply the **unslop** skill and the available skill-authoring guidance to every line.

Show the draft to the user and take feedback. Expect multiple iterations. Cut ruthlessly. A mode skill is not a manual.

### 6. Land it

Resolve the default base with `git symbolic-ref --quiet refs/remotes/origin/HEAD` and use that remote-tracking ref. If it is missing, verify the remote default branch and set `origin/HEAD` before continuing; do not assume a branch name. Work in a worktree off that base. Commit and open a PR. Don't push directly to the default branch.

## Guardrails

- **Don't overfit to one conversation.** A preference stated once and contradicted another time is noise. Require multiple instances before codifying it.
- **Don't be clever.** Restating other skills' contents, inventing metaphors, or writing "poetic" prose for an agent reader is cost without benefit. Keep it operational.
- **Reference, don't inline.** Other skills the user relies on should appear as path references, not pasted excerpts. Same for any principle docs they maintain elsewhere.
- **Keep sections minimal.** Only add a section if the user has a specific, non-default rule there. "Communicate clearly" is not a section. "Short paragraphs. Tables when comparing options. Bullets only when items are genuinely parallel." is.
- **Name conventions generic.** Use "the user" or "the human" in imperatives, not the author's first name.
- **Don't force symmetry.** If a user has no process rules worth writing down, skip the Process section entirely.

## Evaluation

A `-mode` skill is subjective output. A `skill-creator`-style test/iterate benchmark loop isn't useful here. Vibe-check with the user: does it read like them? Did it miss anything? Then ship.

Run a description-optimization loop only if the skill's trigger accuracy turns out to be a problem in practice.

## When not to use

- User wants a task-specific skill (not working conventions): `skill-creator` alone, no mining required.
- User wants to capture one narrow workflow (e.g. "how I write commit messages"). That's a regular skill, not a mode skill.
