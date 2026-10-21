---
name: "close-release-issues"
description: "Use only for work in Airgoods-Inc/airgoods or when the user explicitly targets Airgoods. Otherwise, do not use this skill. Audit the selected production release against Linear issue scope, including stacked or consolidated PRs and previously shipped stale issues. Present linked evidence and mark issues Done only after explicit user confirmation. Use for release closeout or finding issues covered by a deploy."
---

# Close release issues

Use only for work in Airgoods-Inc/airgoods or when the user explicitly targets Airgoods. Otherwise, do not use this skill.

Audit what shipped in the user-selected production release. Discover issues regardless of Linear status or PR merge method. Mark issues Done only after the user reviews and explicitly confirms the final list in a follow-up message.

## Tools

Use the configured Linear integration in this Factory session. Read its callable schemas before use. Prefer `gh` for GitHub metadata and local Git for history and released content. Scope GitHub calls to `Airgoods-Inc/airgoods`.

## Workflow

### 1. Pin the selected release and snapshots

Start with the release PR, commit, or deployment the user selected. Never silently substitute a newer release. If none was selected, establish the intended production release before auditing.

For a selected release PR, inspect its metadata, for example:

```bash
gh pr view 1720 --repo Airgoods-Inc/airgoods \
  --json number,title,body,state,baseRefName,headRefName,headRefOid,mergedAt,url,mergeCommit,commits
```

Record the following immutable boundaries and their evidence:

- `release_commit` is the selected production commit. Confirm the production deployment corresponds to it before proposing shipped closures.
- `source_snapshot` is the exact source accepted by that release, usually its `development` parent for a normal dev-to-main merge. Resolve it from the merge parents and PR history. For squash or rebase merges, recover the accepted source and compare its changes with the production tree. Do not use today's branch tip.
- `previous_release` is the preceding production release in this release's deployed history. Identify it relative to the selected release, rather than taking today's latest two PRs.

Use deployment records, release PRs, and Git history to verify these boundaries. If the previous release is unavailable, report an incomplete baseline rather than inventing a date window. If the selected release or its source cannot be verified, report the gap and leave affected issues unresolved.

Inspect the actual release delta and commit messages:

```bash
git log <previous_release>..<release_commit> --format='%H%n%B'
git diff --name-status <previous_release> <release_commit>
git diff <previous_release> <release_commit> -- <relevant-paths>
```

Use the pinned production tree for final evidence. Account for release conflict resolutions, reverts, and differences from the source snapshot. Dates help find PRs. They do not prove inclusion.

### 2. Discover issues from released work without state filters

Build the included PR list from the release delta, commit-to-PR associations, release notes, and source history. Paginate GitHub results. Inspect included PR titles, bodies, commit messages, stack links, and references to absorbed PRs.

Resolve `AIR-` IDs from those sources, parent issue descriptions, and sub-issues. Fetch each issue's full description, acceptance criteria, relationships, attachments, canonical URL, and current state. Deduplicate by issue ID.

Search Linear by relevant feature names and requested behavior without a state filter. Include clearly covered requests without direct PR links. Paginate searches and child-issue queries. Do not limit discovery to Ready for Testing or Ready to Ship. Backlog, In Progress, In Review, and other stale states remain in scope.

Record how each issue was discovered. Use current states only to decide whether an update is necessary. Preserve existing Done, Duplicate, and Canceled states unless the user explicitly requests otherwise.

### 3. Trace stacks and consolidated implementations

Collect all relevant PRs for an issue, including attachments, parent stacks, and consolidation references. Do not choose only the newest attachment.

- Trace a child PR through its parent PRs into the released source. A feature-branch target alone is not a reason to skip it.
- For a PR closed without merging, locate the released PR that absorbed its implementation. Compare patches, changed symbols, and released behavior. A consolidation reference alone is insufficient.
- Check commit reachability in the source and production histories. Squash merges can replace original SHAs. Negative ancestry alone does not establish that work was omitted.
- Inspect the implementation at `release_commit`, including relevant deleted or renamed files. Existing ancestry or filenames alone do not establish that the behavior survived.

Use the read-only [evidence helper](scripts/collect-release-evidence.sh) to collect PR metadata, commit ancestry, and changed-file presence in the previous and selected production snapshots:

```bash
bash "<resolved-close-release-issues-dir>/scripts/collect-release-evidence.sh" \
  <previous_release> <release_commit> 1224 1139 1309 1716
```

The helper requires local Git objects, `gh`, and `jq`. It returns evidence, not completion verdicts. Investigate missing history, API failures, or incomplete file lists. Compare source history and inspect released file contents yourself, especially for squashed or absorbed changes.

### 4. Compare each issue's scope with the released behavior

For every discovered issue, map the requested behavior and acceptance criteria to specific released changes. Record the PR chain and commit, patch, or file evidence that covers that scope.

An issue ID in a PR is a discovery clue. It can refer to a dependency, partial implementation, related request, or later follow-up. Propose closure only when the issue's full scope shipped. Leave partial, unrelated, unshipped, or uncertain work open with a concrete explanation of what is missing.

A missing PR attachment does not disqualify an issue. Parent-stack evidence and released implementation can prove a child request shipped. Apply the same scope check to issues found through search.

Use the release delta for the main audit. If an open issue discovered during this audit already shipped in or before `previous_release`, verify its earlier release and that its behavior remains in the selected snapshot. Report it separately as previously shipped stale work. Do not discard it because its PR's `mergedAt` predates this release. Label uncertain earlier provenance as unresolved.

If the user requests a broader backlog cleanup, expand discovery across relevant earlier releases without state filters. Keep the selected release pinned and distinguish newly shipped work from previously shipped work. Keep the same evidence and confirmation requirements.

### 5. Audit parents, sub-issues, and follow-ups by scope

Audit each sub-issue individually, including children without PR attachments. A shipped parent does not prove every child shipped.

An explicitly separate, unshipped follow-up stays open without automatically blocking closeout of the delivered parent feature. If the missing child is required by the parent's acceptance criteria, leave the parent open as partially shipped. Explain this distinction in the audit.

Do not close a broad epic because one part shipped. Default to leaf closures. Include an epic only when evidence covers its full scope and the user explicitly approves that epic in the final list.

### 6. Present the audit and wait for confirmation

Always end the first closeout turn with the audit only. Do not change Linear statuses in the turn that produces or revises the proposed list.

Show the selected release link, `release_commit`, `source_snapshot`, previous production release, and any deployment or evidence gaps. Describe discovery coverage and pagination limits.

Use separate tables for:

- Work shipped in this release proposed for Done.
- Previously shipped stale work proposed for Done, with its earlier release evidence.
- Items left open or unchanged, with concrete reasons, including preserved terminal states.

Every issue row includes a linked issue ID, title, current state, release evidence, and proposed action or reason. Link issue IDs using the integration's canonical `url`. Link PRs and pinned source evidence using observed URLs. Never guess Linear slugs. Include PRs with no resolved issue as unresolved discovery items rather than inventing an issue.

List the exact proposed closure set and counts for each table. Ask the user to confirm the final set or select a subset. Invoking this skill alone is not confirmation. If the user asks questions or changes the list, revise the audit and wait for confirmation of that final set.

### 7. Mark only confirmed issues Done

Only after explicit confirmation in a follow-up message, re-read the approved issues' states and any changed scope. Preserve Done, Duplicate, and Canceled unless the user explicitly approved changing those states. If scope or release evidence changed, return affected items for review.

Update only the confirmed issues to Done using the current Linear integration. Process approved sub-issues before approved parents. Report successful updates, unchanged items, and failures.

## Audit reasons

Use reasons tied to scope and evidence, for example:

| Reason | Evidence to report |
| --- | --- |
| `not_in_released_snapshot` | Implementation absent after checking history, consolidation, and released content. |
| `partially_shipped` | Requested behavior or acceptance criteria still missing. |
| `separate_follow_up` | Distinct future scope remains open. |
| `related_reference_only` | Referenced ID has a different scope from the released change. |
| `insufficient_evidence` | Specific missing history, content, or release provenance. |
| `preserve_terminal_state` | Current Done, Duplicate, or Canceled state needs no change. |

Previously shipped stale work is a separate proposal category, not a skip reason. PR state, target branch, merge date, and missing attachments cannot independently decide an issue's outcome.

Do not run the Airgoods application lint, typecheck, or tests for release closeout. Do not merge PRs, push Git, or deploy.

## Resources

Read [examples.md](examples.md) for the release #1720 regression cases and audit format. For helper changes, run the offline [regression fixtures](scripts/test_release_evidence.py).
