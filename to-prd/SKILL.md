---
name: to-prd
description: Turn the current conversation context into a detailed local PRD Markdown file under the repo's ignored `plans/` directory. Use when the user wants to create a PRD, product spec, implementation spec, or planning document from the current context without creating Linear issues.
---

# To PRD

Create a local PRD Markdown file in the current repository's ignored `plans/` directory. Do not create or update Linear issues from this skill. If the user wants Linear sync, tell them to run `to-linear` after the local plan is approved.

This skill takes the current conversation context and codebase understanding and produces a detailed PRD. If meaningful ambiguity remains and `[grill-me](../grill-me/SKILL.md)` has not already been used in the current chat context, use `grill-me` first to clarify the plan. Otherwise, synthesize what you already know and capture remaining ambiguity in `Open Questions`.

Optimize the PRD for future agents, not for polished human presentation. Prefer precise context, constraints, assumptions, decisions, and execution cues over narrative prose. The human-facing artifacts are usually the local issue files and any later Linear issues.

## Process

1. Confirm the current repo root with `git rev-parse --show-toplevel`.
2. Ensure `plans/` exists at the repo root. If possible, confirm it is ignored with `git check-ignore -v plans/test.md`.
3. Check whether the request has enough context to draft a useful PRD. If core product behavior, actors, scope, or success criteria are meaningfully ambiguous and `grill-me` has not already been used, run `grill-me` before drafting.
4. Explore the repo only as needed to understand the current state and likely implementation areas.
5. Sketch the major modules that may need to change. Look for deep modules that encapsulate meaningful behavior behind simple, testable interfaces.
6. Write a PRD Markdown file at `plans/<slug>/PRD.md`.
7. In the response, link the local file and summarize the highest-signal assumptions, open questions, and suggested next step.

Do not add extra clarification ceremony when the request is already clear or `grill-me` already ran. If module boundaries, implementation choices, or testing expectations are still uncertain after available clarification, document them as assumptions or open questions in the PRD.

## Interaction Standards

When asking the user to choose between options, use the structured decision UI when available. Present 2-3 mutually exclusive choices, put the recommended option first, and label it `(Recommended)`. If the decision UI is unavailable, use the same choices as a concise numbered list.

Use this standard decision prompt when ambiguity requires `grill-me` before drafting:

- Header: `Clarify`
- Question: `This PRD has meaningful ambiguity. How should I proceed?`
- Options:
  - `Run grill-me (Recommended)`: Clarify the plan before drafting.
  - `Draft with assumptions`: Create the PRD now and capture uncertainty in `Assumptions` and `Open Questions`.

Use these standard phase output shapes:

Before drafting when context was inspected:

```markdown
**PRD Context**
- Plan: <new or existing slug>
- Ambiguity: None | Meaningful
- Clarification: Not needed | `grill-me` recommended | already clarified
- Repo Context: <surfaces inspected or None>
```

After writing the PRD:

```markdown
**PRD Created**
- Path: <plans/slug/PRD.md>
- Status: Drafted | Updated
- Assumptions: <short summary or None>
- Open Questions: <count or None>
- Next Step: `to-issues` when ready
```

## File Conventions

- Use a short kebab-case slug from the feature or bug name.
- Use one plan directory per feature, bug, or improvement: `plans/<slug>/`.
- When the PRD discusses future implementation slices, assume issue ordinals are global across the plan, not reset per stage. Stage folders keep their own stage number (`01-foundation`, `02-core-flows`, `03-followups`), but issue files and local IDs should count upward chronologically across all stages (for example `01-foundation/01-...`, `01-foundation/02-...`, then `02-core-flows/03-...`, `02-core-flows/04-...`).
- If a matching PRD already exists, update it instead of creating a duplicate unless the user asks for a new version.
- Keep files self-contained so future agents can work from the Markdown alone.
- Make the PRD agent-friendly: explicit, scannable, and useful for future planning or implementation.
- Prefer stable concepts over specific file paths or code snippets unless the path is necessary to orient implementation.

## PRD Template

```markdown
# <Feature / Bug / Improvement Name> PRD

## Intent

The outcome that should exist after this ships.

## Current State

What exists today, including relevant product behavior, code behavior, workflow gaps, or failure modes.

## Target Behavior

What should change from the user, system, or operator perspective.

## Scenarios

> 1. A concrete actor is in a concrete situation and needs a concrete outcome.
> 2. Include meaningful workflows, edge cases, failure states, permission boundaries, or state transitions.

## Acceptance Criteria

- [ ] Observable criterion
- [ ] Observable criterion
- [ ] Observable criterion

## Scope

In:

- Work included in this plan

Out:

- Work intentionally excluded from this plan

## Key Decisions

- Confirmed product, technical, or workflow decision

## Assumptions

- Assumption that should be validated if it materially affects scope or behavior

## Implementation Notes

Likely surfaces, contracts, constraints, risks, or sequencing notes. Avoid over-specific file lists unless needed for orientation.

## Test Strategy

Nearest useful behavioral boundaries to test, based on existing repo patterns. Keep this focused on confidence, not ceremony.

## Open Questions

- Question that materially affects scope, behavior, or implementation
```

## Output Expectations

End with:

- local PRD path
- important assumptions or open questions
- whether `to-issues` is the logical next local step
