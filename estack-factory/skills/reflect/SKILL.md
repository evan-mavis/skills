---
name: "reflect"
description: "Spawn three parallel review subagents over the active transcript, surface learnings, and route each to a concrete edit on an existing skill. Use when the user says reflect."
---

# Reflect

Only the root Factory chat dispatches this skill's subagents. If invoked inside a droid, return the scoped delegation requests to the parent. Preserve independent review and report pending proof until the parent collects results.

Mine the current conversation for durable learnings, then route them into skill edits.

## When to invoke

Invoke when the user says "reflect" or "/reflect". Skip when the conversation is trivial, off-topic, or already covered by an existing skill the parent followed correctly. One-offs are not learnings.

## Process

### 1. Locate the active transcript

Use the current Factory conversation and any session-history capability exposed in this runtime. Before reading another session, verify its workspace and task identity from metadata or the user's scoped reference. Read only matching sessions and relevant regions. Do not assume a transcript directory or JSONL schema. If history is unavailable, use the current conversation, branch, and durable reports, and state the history gap. Do not read unrelated private chats.

The parent resolves the current session before fanning out. Pass its exact path or thread excerpt; if it cannot be read, write a tight digest of the session and pass that instead.

### 2. Spawn three reviewers in parallel

Launch three Factory subagents concurrently. Reviewers need available MCP tools for context lookups (tickets, chat threads, observability traces referenced in the transcript); tell them not to edit files.

Use a custom droid with `model: inherit` and omit Task `complexity` to inherit the parent model and reasoning. Task does not accept arbitrary model or reasoning fields. If the user requests another model, verify its availability and the selected droid or configured complexity tier before dispatch. Report unavailable selections and any routing that changes the effective model.

| Lens | Prompt template |
|---|---|
| Judgment | [`references/judgment-reviewer.md`](references/judgment-reviewer.md) |
| Tooling | [`references/tooling-reviewer.md`](references/tooling-reviewer.md) |
| Divergent | [`references/divergent-reviewer.md`](references/divergent-reviewer.md) |

Pass each template verbatim, substituting the transcript path or digest where marked. Reviewers return findings in their response bodies. Report their actual models; three independent passes on one model do not provide model diversity.

### 3. Synthesize

Spawn one Factory synthesizer subagent inheriting the parent model unless the user explicitly requests an available selection. Tell it not to edit files; its quality check spot-verifies citations using available MCP tools. Use [`references/synthesizer.md`](references/synthesizer.md) verbatim, with each reviewer's full output inlined where marked. The synthesizer returns a structured Accepted / Rejected / Backlog list.

### 4. Structural enforcement check

Sanity-check the synthesizer's Accepted list. For any item that would be enforced more reliably by a lint rule, script, metadata flag, or runtime check, move it from Accepted to Backlog. See the **encode-lessons-in-structure** principle skill.

### 5. Apply

Before applying any Accepted edit, present the synthesizer's full Accepted/Rejected/Backlog output to the user and wait for explicit approval. The user picks which subset to apply and may redirect routings. Skill changes affect every future agent in the org. Do not auto-apply.

Backlog items file to whatever devex / backlog tracker your team uses automatically. Only the Accepted list waits for approval.

For each approved Accepted item, follow the Routing field exactly:

- Trivial existing-skill edit (a one-line bullet, a tightened sentence, a stale fact corrected): parent does directly.
- Substantive existing-skill edit (a new section, a new pattern table, more than ~10 lines): hand to an available skill-authoring skill or the [native authoring workflow](../poteto-mode/playbooks/authoring-a-skill.md) and run its draft / test / iterate loop.
- `tune description: <skill path>` (the skill exists but didn't trigger when it should have): use the [native authoring workflow](../poteto-mode/playbooks/authoring-a-skill.md) and check routing with representative requests.
- `new skill via skill-creator: <kebab-name>`: use the [native authoring workflow](../poteto-mode/playbooks/authoring-a-skill.md). Preserve scoped triggers and validation.

If your environment ships a SKILL.md validator, run it on every touched skill before declaring done. Skip this step if it doesn't.

### 6. Summarize for the user

Short list, no preamble:

- Edits applied: `<skill path>`. What changed, one line each.
- New skills created: `<skill path>`. One line each (rare).
- Backlog filed to the devex tracker: `<issue title>` (`<tags>`). One line each.
- Dropped: one line per rejected finding + reason from the synthesizer.
