---
{name: reflect,description: "Spawn three parallel review subagents over the active transcript, surface learnings, and route each to a concrete edit on an existing skill. Use when the user says reflect."}
---

# Reflect

Use the live `run_subagent` and `read_subagent` tools for independent passes. Default to `subagent_general` with this workflow's role prompt. Provide the task, relevant evidence, paths, and constraints explicitly because Devin subagents do not inherit parent conversation history. Background mode permits concurrent work but denies tools without prior approval. If delegation or required permissions are unavailable, report the blocker and leave the independent-review gate incomplete. Do not replace it with another pass by the same agent. Plugin profiles load locally in CLI and Desktop, not cloud. Use only delegation capabilities exposed by the active session.

Mine the current conversation for durable learnings, then route them into skill edits.

## When to invoke

Invoke when the user says "reflect" or "/estack-devin:reflect". Skip when the conversation is trivial, off-topic, or already covered by an existing skill the parent followed correctly. One-offs are not learnings.

## Process

### 1. Locate the active transcript

Use accessible Devin conversation history or a user-provided transcript. Confirm its repository, workspace, session, and topic before reading relevant excerpts. Do not scan unrelated chats or assume a local transcript path or schema. If no history source is available, use the current conversation and durable branch or task reports, and report the history gap.

The parent resolves the current session before fanning out. Pass its exact path or thread excerpt; if it cannot be read, write a tight digest of the session and pass that instead.

### 2. Spawn three reviewers in parallel

Launch three Devin subagents concurrently. Reviewers need available MCP tools for context lookups (tickets, chat threads, observability traces referenced in the transcript); tell them not to edit files.

Use Devin's built-in `subagent_general` profile with the required role prompt to inherit the parent model. Custom profiles and `subagent_explore` use Devin's subagent router unless configured otherwise. Use a different model only when the user requests an available selection. Devin has no assumed per-spawn reasoning-effort override. Report unavailable selections and any unobservable model identity.

| Lens | Prompt template |
|---|---|
| Judgment | [`references/judgment-reviewer.md`](references/judgment-reviewer.md) |
| Tooling | [`references/tooling-reviewer.md`](references/tooling-reviewer.md) |
| Divergent | [`references/divergent-reviewer.md`](references/divergent-reviewer.md) |

Pass each template verbatim, substituting the transcript path or digest where marked. Reviewers return findings in their response bodies. Report their models only when observable; three independent passes on one model do not provide model diversity.

### 3. Synthesize

Spawn one Devin synthesizer subagent inheriting the parent model unless the user explicitly requests an available selection. Tell it not to edit files; its quality check spot-verifies citations using available MCP tools. Use [`references/synthesizer.md`](references/synthesizer.md) verbatim, with each reviewer's full output inlined where marked. The synthesizer returns a structured Accepted / Rejected / Backlog list.

### 4. Structural enforcement check

Sanity-check the synthesizer's Accepted list. For any item that would be enforced more reliably by a lint rule, script, metadata flag, or runtime check, move it from Accepted to Backlog. See the **encode-lessons-in-structure** principle skill.

### 5. Apply

Before applying any Accepted edit, present the synthesizer's full Accepted/Rejected/Backlog output to the user and wait for explicit approval. The user picks which subset to apply and may redirect routings. Skill changes affect every future agent in the org. Do not auto-apply.

Backlog items file to whatever devex / backlog tracker your team uses automatically. Only the Accepted list waits for approval.

For each approved Accepted item, follow the Routing field exactly:

- Trivial existing-skill edit (a one-line bullet, a tightened sentence, a stale fact corrected): parent does directly.
- Substantive existing-skill edit (a new section, a new pattern table, more than ~10 lines): hand to an available skill-authoring skill, or the [Devin skill format](https://docs.devin.ai/cli/extensibility/skills/creating-skills) and validate the edited skill.
- `tune description: <skill path>` (the skill exists but didn't trigger when it should have): use an available skill-authoring skill or the Devin skill format and verify the revised trigger against representative requests.
- `new skill via skill-creator: <kebab-name>`: use an available skill-authoring skill or the Devin skill format. Do not invent the shape ad hoc.

If your environment ships a SKILL.md validator, run it on every touched skill before declaring done. Skip this step if it doesn't.

### 6. Summarize for the user

Short list, no preamble:

- Edits applied: `<skill path>`. What changed, one line each.
- New skills created: `<skill path>`. One line each (rare).
- Backlog filed to the devex tracker: `<issue title>` (`<tags>`). One line each.
- Dropped: one line per rejected finding + reason from the synthesizer.
