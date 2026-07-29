---
name: to-pr
description: Prepare, create, or update one pull request for the current branch after relevant verification passes, including supplied issue, QA, demo, or video evidence links. Use directly in prepare, draft, or ready mode; default to draft.
---

# To PR

Create one PR for the current complete branch scope. Never split one supplied change into multiple
PRs.

## Change contract

Accept a caller-supplied contract or derive one from the current branch and request:

```yaml
change_contract:
  source: <prompt-or-source-url-or-path>
  scope: []
  exclusions: []
  review_base: <sha>
  changed_files:
    - <repo-relative path>
```

Validate the complete diff against the contract before preparing the PR. Preserve the contract
unchanged because this skill does not modify code.

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

Read and follow the repository PR template before creating or updating a PR. Build the body from
the complete base diff, commit history, supplied working contract or planning documents, and known
issue links. Keep it concise and fill every required section.

When the caller supplies validation video, text evidence, or another approved artifact, add a
concise `PR evidence` section in the best matching template location. Link each artifact by name,
include its one-line summary, disclose non-blocking findings, and omit any artifact that was not
selected. Never publish credentials, raw local data, or private evidence URLs anywhere except the
intended PR.

## Process

1. Confirm the relevant verification passed, the working tree is clean, and `gh` authentication
   works.
2. Resolve base/head branches, existing PR state, Linear IDs, caller-supplied evidence links, title, and body.
3. Return `blocked` for an ambiguous base, conflicting IDs, or an unclear title category.
4. In `prepare` mode, return the draft content without remote writes.
5. In `draft` or `ready` mode, push if needed and create or update the PR with `gh`; return
   `body: null` after the remote write so the caller retains only compact orchestration state.
6. When later evidence is supplied, update the same PR body in place. Never create a second PR
   merely because evidence was unavailable during the first call.
7. Preserve the requested review state. Never merge the PR.

## Output

Return only:

```yaml
status: done | blocked
mode: prepare | draft | ready
change_contract:
  source: <prompt-or-source-url-or-path>
  scope: []
  exclusions: []
  review_base: <sha>
  changed_files:
    - <repo-relative path>
title: <title-or-null>
body: <markdown in prepare mode only; otherwise null>
url: <url-or-null>
base: <branch-or-null>
head: <branch-or-null>
blocker: null | <specific blocker>
```
