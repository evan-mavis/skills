---
name: run-ci
description: Run the repository's relevant local CI checks once after forge-build integrates the complete plan and before to-pr. Use to produce a concise pass/fail contract for the landing orchestrator.
---

# Run CI

Run final local verification for the fully integrated feature branch. Invocation is explicit authorization to run the repository's documented CI-equivalent checks.

## Process

1. Read applicable repository instructions (`AGENTS.md`, `.cursor/rules`, or equivalent), package scripts, task-runner configuration, and PR workflows.
2. Resolve the base branch and inspect the complete branch diff.
3. Prefer the repository's documented CI command. Otherwise run applicable typecheck, lint, test, build, and format-check commands using the narrowest reliable scope.
4. Run all selected checks even if one fails.
5. Do not mutate code, weaken checks, push, or open a PR.

Return `blocked` when commands are ambiguous or required infrastructure is unavailable. Include only the shortest useful failure reason.

## Output

Return only:

```yaml
status: done | blocked
result: pass | fail
checks:
  - name: <check>
    result: pass | fail
failure: null | <one-line reason>
```
