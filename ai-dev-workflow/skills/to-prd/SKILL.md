---
name: to-prd
description: Turn the current conversation context into a detailed PRD Markdown file at `specs/<slug>/PRD.md` in the application repo. Use when the user wants to create a PRD, product spec, implementation spec, or planning document from the current context without creating Linear issues.
---

# To PRD

Write `<app-repo>/specs/<slug>/PRD.md`. No Linear. After slices exist, user runs `$to-linear`.

Agent-only master plan — precise constraints and execution cues, not stakeholder prose. Linear is
the human layer.

If core behavior/actors/scope/success are ambiguous and `$grill-me` has not run, use
[Clarify](../references/decision-prompts.md#clarify) or run `$grill-me`. Otherwise synthesize and
put gaps in Open Questions.

## Process

1. [Resolve](../references/specs-repo.md#resolve) `specs/`; [import](../references/specs-repo.md#import) if slug missing.
2. Explore the app repo only as needed; sketch deep modules / seams.
3. Write PRD from [template](references/prd-template.md). Update in place if the slug already exists.
4. **Do not commit** — `$to-slices` commits the full plan.
5. Reply with one concise sentence (see Output).

## Conventions

- Kebab-case slug; one dir per feature under `specs/<slug>/` on the feature branch.
- Frontmatter: `plan_slug`, `status` (`in_progress` \| `completed` \| `archived`), `linear_issue`, `last_synced`.
- Global issue ordinals later live in `issues/` with stage in frontmatter only.

## Output

Human-visible reply = **exactly one concise sentence**. No status blocks, bullet lists, or
preamble. Inline a markdown link when pointing at a file. Interactive choices
([decision-prompts](../references/decision-prompts.md)) may accompany the sentence mid-flow.

Examples:

- Pause: `This PRD still has meaningful ambiguity — run $grill-me or draft with assumptions?`
- Done: `Wrote [specs/<slug>/PRD.md](<absolute path>) — next $to-slices.`
- Blocked: `Blocked: need an app-repo checkout before writing the PRD.`