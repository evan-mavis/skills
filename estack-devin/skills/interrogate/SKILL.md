---
{name: interrogate,description: "Use for \"interrogate\", \"adversarial review\", \"multi-model review\", \"challenge this\", \"stress test this code\", \"find blind spots\", or \"tear this apart\". Multiple LLM reviewers challenge changes from independent angles."}
---

# Interrogate

Use the live `run_subagent` and `read_subagent` tools for independent passes. Default to `subagent_general` with this workflow's role prompt. Provide the task, relevant evidence, paths, and constraints explicitly because Devin subagents do not inherit parent conversation history. Background mode permits concurrent work but denies tools without prior approval. If delegation or required permissions are unavailable, report the blocker and leave the independent-review gate incomplete. Do not replace it with another pass by the same agent. Plugin profiles load locally in CLI and Desktop, not cloud. Use only delegation capabilities exposed by the active session.

Spawn three independent reviewers to adversarially review code changes by default. Each gets the same prompt and rubric. Report the actual model for each; independent passes on the parent model do not provide model diversity.

The deliverable is a synthesized verdict. Do NOT auto-apply changes.

## Step 1, Determine Scope

Identify what to review from context:

- If the user points at specific files or a diff, use that
- If on a feature branch, use the caller's explicit base, or resolve it with `git symbolic-ref --quiet refs/remotes/origin/HEAD`. Run `git diff "${base_ref}...HEAD"` for the full changeset. If the default ref is missing, verify and set `origin/HEAD` before continuing; do not assume a branch name.
- If the user's message references recent work, gather the relevant files

Package the diff (or file contents) plus any surrounding context files the reviewers need to understand the code.

## Step 2, State the Intent

Before spawning reviewers, state the intent explicitly. Derive this from:

- The user's message
- Commit messages
- PR description if one exists
- The code itself

Write one clear paragraph. If you're unsure about the intent, ask the user before proceeding.

## Step 3, Spawn Reviewers

Launch three reviewers concurrently with the available Devin subagent tool unless the user requests another count. Give each a prompt that forbids edits.

Use Devin's built-in `subagent_general` profile with the required role prompt to inherit the parent model. Custom profiles and `subagent_explore` use Devin's subagent router unless configured otherwise. Use a different model only when the user requests an available selection. Devin has no assumed per-spawn reasoning-effort override. Report unavailable selections and any unobservable model identity.

Label them Reviewer A/B/C and record the actual models. Keep all three independent passes even when they inherit the same model; do not claim cross-model agreement.

Read [`references/reviewer-prompt.md`](references/reviewer-prompt.md) and fill in the template with:
1. The stated intent
2. The diff or file contents
3. The review rubric from [`references/rubric.md`](references/rubric.md)
4. The code-quality lens from [`references/code-quality-review.md`](references/code-quality-review.md)

The same filled template goes to all reviewers, so every model applies the code-quality lens.

## Step 4, Synthesize

As results come back, build a unified picture:

1. **Parse all findings** from the reviewers
2. **Identify consensus**. Findings raised by 2+ reviewers independently are highest signal.
3. **Identify lone-reviewer findings**. Still worth reading, but weight accordingly.
4. **Deduplicate**. Different reviewers may describe the same issue differently. Merge these and note which reviewers raised it.
5. **Note disagreements**. If one reviewer flags something and another explicitly says the opposite, that's useful context for the verdict.

## Step 5, Lead Judgment

You are the lead reviewer, a pragmatic senior engineer, not a neutral aggregator.

Read [`references/lead-judgment.md`](references/lead-judgment.md) for the full framework.

Categorize every finding using these buckets:

- **Act on**. Real issues affecting correctness, security, or maintainability given the actual goals. These would block a real PR.
- **Consider**. Legitimate points, but you're not sure they outweigh the cost of addressing them right now. Worth the user's attention.
- **Noted**. Technically valid but not actionable. Context-dependent, premature optimization, or low-impact given the current stage.
- **Dismissed**. Wrong, nitpicky, or missing context. Brief explanation why.

For each finding, include:
- Which reviewer(s) raised it
- The category (act on / consider / noted / dismissed)
- A one-line rationale for the categorization

## Output Format

Present the verdict in this structure:

### Intent
> [The stated intent paragraph from Step 2]

### Reviewers
- Reviewer [label]: [model name], [N findings] (one bullet per reviewer)

### Act On
[Findings that should be addressed. For each: description, which reviewers raised it, why it matters.]

### Consider
[Findings worth thinking about. For each: description, which reviewers raised it, tradeoff involved.]

### Noted
[Valid but low-priority. Brief list.]

### Dismissed
[Rejected findings with brief rationale.]

### Agreement Map
[Where did reviewers agree, where did they diverge, and what does the pattern of agreement/disagreement tell us?]
