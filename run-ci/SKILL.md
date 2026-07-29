---
name: run-ci
description: Run the repository's relevant local CI-equivalent checks for the current scoped branch or checkout without modifying code. Use directly before delivery or whenever a caller needs one concise pass/fail contract covering the applicable documented checks.
---

# Run CI

Run local verification for the current scoped branch or checkout. Invocation is explicit
authorization to run the repository's documented CI-equivalent checks.

## Change contract

Accept a caller-supplied contract or derive one from the current request and branch diff:

```yaml
change_contract:
  source: <prompt-or-source-url-or-path>
  scope: []
  exclusions: []
  review_base: <sha>
  changed_files:
    - <repo-relative path>
```

Validate the current diff against `scope`, `exclusions`, and `changed_files`. Resolve an omitted
`review_base` from the merge base with the repository's default branch. Preserve the contract
unchanged because this skill does not modify code.

## Process

1. Read applicable repository instructions (`AGENTS.md`, host rules directories, or equivalent), package scripts, task-runner configuration, and PR workflows.
2. Inspect the complete diff from `change_contract.review_base`.
3. Prefer the repository's documented CI command. Otherwise run applicable typecheck, lint, test, build, and format-check commands using the narrowest reliable scope.
4. Run all selected checks even if one fails.
5. Do not mutate code, weaken checks, push, or open a PR.

Return `blocked` when commands are ambiguous or required infrastructure is unavailable. Include only the shortest useful failure reason.

## Output

Return only:

```yaml
status: done | blocked
result: pass | fail
change_contract:
  source: <prompt-or-source-url-or-path>
  scope: []
  exclusions: []
  review_base: <sha>
  changed_files:
    - <repo-relative path>
checks:
  - name: <check>
    result: pass | fail
failure: null | <one-line reason>
```
