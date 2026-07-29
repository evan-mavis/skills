# Output Schema

Return only YAML — no explanatory prose. When the host requires structured git or action
directives, append them after the contract block.

## Required

```yaml
status: done | blocked
plan_slug: <plan-slug>
blocker: null | <specific blocker>
branch: <feature-branch>
pr: <url-or-null>
completed_issues: <count>
remaining_issues: <count>
```

## Profiles and verification

```yaml
data_profile: none | local | neon | local-preview
host: cloud | local_worktree
database_runtime: verified | not_needed | blocked
qa_profile: none | light | heavy
qa_result: skipped | passed | blocked
evidence_profile: video | text | none
evidence: <artifact-url-or-inline-summary-or-null>
video: <absolute-path-or-artifact-url-or-null>
```

## QA counts

Include when manual browser QA ran:

```yaml
qa_scenarios:
  passed: <count>
  failed: <count>
  blocked: <count>
```

## Lifecycle cleanup

```yaml
neon_branch_deleted: true | false | null
local_preview_preserved: true | false | null
runtime_waived: true | false
```

## Invalid done

See [preflight gates — invalid done](../references/preflight-gates.md#invalid-status-done).
Return `blocked` instead of `done` when closeout violates those rules.
