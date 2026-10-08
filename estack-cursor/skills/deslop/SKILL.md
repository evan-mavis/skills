---
name: "deslop"
description: "Remove AI-generated code slop and clean up code style"
---

# Remove AI code slop

Resolve the default base with `git symbolic-ref --quiet refs/remotes/origin/HEAD` and use that remote-tracking ref. If it is missing, verify the remote default branch and set `origin/HEAD` before continuing; do not assume a branch name. Check the diff against that base and remove AI-generated slop introduced in the branch.

## Focus Areas

- Extra comments that are unnecessary or inconsistent with local style
- Defensive checks or try/catch blocks that are abnormal for trusted code paths
- Casts to `any` used only to bypass type issues
- Deeply nested code that should be simplified with early returns
- Other patterns inconsistent with the file and surrounding codebase

## Guardrails

- Keep behavior unchanged unless fixing a clear bug.
- Prefer minimal, focused edits over broad rewrites.
- Keep the final summary concise (1-3 sentences).
