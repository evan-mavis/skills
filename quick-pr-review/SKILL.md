---
name: quick-pr-review
description: Give a fast, high-level pull request briefing and independent code review for someone short on time. Use when the user asks for a quick PR review, executive summary, merge read, what matters, what to focus on, what to ignore, or questions worth continuing with. Summarize the shipped feature, bug fix, or improvement; run a fresh subagent through Codex's code-review feature; verify and surface only material findings; and respond in a casual, concise format.
---

# Quick PR Review

Review the PR read-only and optimize for the user's attention. Explain the product or engineering change, not the diff line by line.

Treat time as a real constraint. Aim to finish the full briefing in about five minutes: spend roughly one minute orienting, up to three minutes on the independent review, and the remaining time verifying and synthesizing.

## Guardrails

- Do not edit code, post comments, approve, merge, stage, commit, push, or change PR state.
- Follow repository instructions. Do not run tests, builds, lint, formatting, or typechecking unless the user explicitly asks.
- Keep the review scoped to the PR. Exclude pre-existing problems and unrelated branch history.
- Ignore style nits, naming preferences, speculative redesigns, and low-value test suggestions unless they expose a material risk.
- Prefer no finding over a weak finding. Never invent certainty from an ambiguous diff.

## Workflow

### 1. Resolve the PR and review range

Use a supplied PR URL or number. Otherwise, resolve the PR associated with the current branch. Determine the repository, base branch or base SHA, head SHA, title, body, commits, changed files, and CI state when available.

Compare the merge-base range for the PR, not the entire branch's unrelated history. If the repository, PR, or base cannot be resolved safely, ask for the missing target.

### 2. Build the high-level feature map

Read the PR metadata, diff stat, changed-file list, and enough of the complete diff and adjacent code to answer:

- Is this mainly a feature, bug fix, improvement, refactor, or maintenance change?
- What user or system behavior changes?
- What is the main path from entry point to side effect?
- Which areas carry meaningful correctness, data, permission, security, rollout, or regression risk?
- Which noisy files are generated, mechanical, test-only, or supporting detail?

Do not expose this working map verbatim. Use it to produce the short summary and focus list.

### 3. Run one independent Codex review agent

Start exactly one fresh reviewer agent through Codex's code-review feature. Treat that review process as the subagent; do not create a generic subagent that then launches another nested reviewer. Give it the raw repository path, PR identifier, base ref, head SHA, and review scope; do not give it the main agent's conclusions.

Have the reviewer use Codex's code-review feature against the PR range. For a local git checkout, prefer:

```bash
codex review --base <base-ref> "Review only this PR. Find actionable correctness, security, data-integrity, permission, regression, or serious maintainability issues introduced by the diff. Skip style, nits, pre-existing issues, and speculative improvements. Return findings with priority, file and line, impact, and a concise explanation."
```

If the host exposes an equivalent native code-review action, use that instead. The review agent must remain read-only and must not run broad validation by default.

Cap this step at about three minutes. If the review agent has not returned, interrupt it and continue from the main agent's inspection. State briefly in `Quick take` that the independent review timed out and the read is lower confidence. Do not retry or start another reviewer.

### 4. Verify the findings

Check every candidate finding against the actual diff and adjacent code before presenting it. Keep only findings that are introduced by the PR, reproducible from the code, and likely to matter. Merge duplicates and drop anything vague, cosmetic, pre-existing, or unsupported.

Use these practical priorities internally:

- `Blocker`: likely data loss, security or permission failure, broken core behavior, or a merge-stopping regression.
- `Important`: a credible bug or significant maintainability problem worth addressing before or just after merge.

Do not surface lower-value findings in the rushed review.

### 5. Write the rushed briefing

Use this exact section order:

```markdown
## Quick take

<2-3 casual sentences: category, user-visible or system behavior, and the overall merge read. Mention architecture only when it affects the decision.>

## Findings

- **Blocker/Important — short title** — <impact in plain language>. `<file:line>`

<Or: No material findings.>

## Focus here

- **Area** — <why it matters>. **Worth asking:** “<a concrete follow-up question>”

## Skip for now

- <PR-specific detail that is safe to deprioritize, with a short reason>
```

Keep the whole response easy to skim. Aim for 1-4 bullets in `Focus here` and 1-3 in `Skip for now`. Add `Worth asking` only when a real product, architecture, rollout, data, or ownership question would help the user understand or decide; do not manufacture questions to fill space.

Use casual, direct wording. Avoid corporate language, exhaustive file tours, implementation trivia, long test inventories, and praise. If CI or validation was not checked, say so briefly only when it affects the merge read.
