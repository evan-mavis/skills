---
name: correct
description: "Prevent repeated agent mistakes in a repository with architecture, types, lint, CI, or tests. Prove each safeguard rejects a real past mistake. Use for /estack-devin:correct or a request to prevent recurring agent mistakes."
---

# Correct

The operator keeps correcting agents in this repo for the same mistakes. Change the repo so the next agent can't make them.

Assume every contributor is an agent that sees only the files it opened, copies the nearest example, and takes the shortest path that compiles. Design the repo so a change that looks right from one file is right for the whole repo.

## Find the mistake classes

First, read recent commits, reverts, review comments, agent instruction files, and comments that explain workarounds. Use accessible Devin history when it adds evidence. Restrict local transcripts to the current workspace and relevant task, as in [Recall](../recall/SKILL.md). Group the mistakes into classes and cite the occurrences. A class counts once it has happened twice. Missing history is a gap, not evidence of a repeat.

## Fix each class at the highest level that works

1. **Eliminate it with architecture.** Give each piece of state one owner and each task one supported way. Hide internals so the wrong import fails. Replace hand-synced lists with one source of truth. Delete old ways and dead code an agent would copy.
2. **Enforce it with types so the bad state can't be written.** If bad code still compiles, add a lint or CI check whose error names the file, type, or function to use instead. If the pattern is already common, fail only when a change adds more.
3. **Test the behavior.** Fix or delete any test that would still pass if every function it calls returned nothing.
4. **Write docs or agent rules last, only for judgment calls.** Nothing fails when an agent skips them.

## Fix and prove

Fix the most frequent classes within the requested scope, one commit each. Prove each new check fails on a real past mistake and passes on the fix. Run the same command locally and in CI. Exceptions go on the offending line with a reason, an expiry date, and a human's approval.

## Keep the rule table

Last, keep a table in the agent instruction file that pairs each rule with what enforces it. During this workflow, fix each correction and add its rule. If the rule was already there and nothing enforces it, that's a repeat. Fix it at the highest level within the task's scope. Drop a rule once its mistake can't happen.

**Reply:** each class with its evidence, the level you picked, and why a higher level didn't work.
