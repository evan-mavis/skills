# Output Schema

Return compact YAML, then render video when the host supports it. Required fields must always be
present; optional fields apply when relevant.

## Required

```yaml
status: done | blocked
summary: <one line>
blocker: null | <specific blocker>
pr: <url-or-null>
change_contract:
  source: <prompt-or-source-url-or-path>
  scope: []
  exclusions: []
  review_base: <sha-or-null>
  changed_files:
    - <repo-relative path>
```

## Runtime and evidence

```yaml
data_profile: none | local | neon | local-preview
host: cloud | local_worktree
database_runtime: verified | not_needed | blocked
evidence_profile: video | text
branch: <git-branch>
commit: <final-green-sha-or-null>
linear_issue: <id-or-null>
evidence: <artifact-url-or-inline-summary-or-null>
video: <absolute-path-or-artifact-url-or-null>
limitations: []
runtime_waived: true | false
```

## Neon and local-preview lifecycle

Populate when the active profile used disposable infrastructure:

```yaml
neon_branch_id: <child-id-or-null>
neon_branch_deleted: true | false | null
local_preview_preserved: true | false | null
```

## Scope gate redirect

When [scope gate](execution-contracts.md#scope-gate) blocks single-ticket delivery:

```yaml
recommended_plan_path: grill-me → to-prd → to-slices → to-linear → forge-build
```

Otherwise `recommended_plan_path: null`.

## Invalid done

See [preflight gates — invalid done](../../references/preflight-gates.md#invalid-status-done).
Return `blocked` instead of `done` when closeout violates those rules.
