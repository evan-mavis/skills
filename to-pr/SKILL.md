---
name: to-pr
description: Prepare, create, or update the single feature pull request after run-ci passes. Use with mode prepare, draft, or ready; default to draft for forge-build so the PR remains not-ready-for-review while CI and babysit run.
---

# To PR

Create one PR for the complete feature branch. Never create per-issue PRs.

## Modes

Use the caller-supplied mode without prompting. Default to `draft`.

- `prepare`: generate the title and body only; do not push or call GitHub.
- `draft`: push and create or update a GitHub draft PR. A draft PR is remote and may trigger CI, but must remain not-ready-for-review.
- `ready`: push and create or update a ready-for-review PR.

## Title

Use the repository's required format. Otherwise use:

```text
Feat|Fix|Improvement|Tech: <feature name> (AIR-123)
```

Omit the Linear suffix when no credible ID exists. Never invent one.

## Body

Read and follow the repository PR template before creating or updating a PR. Build the body from the complete base diff, commit history, PRD, completed issue files, and known Linear links. Keep it concise and fill every required section.

## Process

1. Confirm `run-ci` passed, the working tree is clean, and `gh` authentication works.
2. Resolve base/head branches, existing PR state, Linear IDs, title, and body.
3. Return `blocked` for an ambiguous base, conflicting IDs, or an unclear title category.
4. In `prepare` mode, return the draft content without remote writes.
5. In `draft` or `ready` mode, push if needed and create or update the PR with `gh`; return `body: null` after the remote write so the caller retains only compact orchestration state.
6. Preserve the requested review state. Never merge the PR.

## Output

Return only:

```yaml
status: done | blocked
mode: prepare | draft | ready
title: <title-or-null>
body: <markdown in prepare mode only; otherwise null>
url: <url-or-null>
base: <branch-or-null>
head: <branch-or-null>
blocker: null | <specific blocker>
```
