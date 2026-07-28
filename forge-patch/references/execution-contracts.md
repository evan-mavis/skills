# Execution Contracts

Apply every contract in this file during each `forge-patch` run. These procedures replace separate ambiguity, cleanup, code-review, CI, and PR skills.

## Ambiguity interview

After inspecting the source, code, and relevant read-only evidence:

1. Walk every material branch of the task's decision tree until expected behavior, scope, exclusions, and verification are mutually understood.
2. Answer questions through code, repository history, production data, or connected read-only sources whenever possible.
3. Ask the user only questions that require a human product, policy, or risk decision.
4. Ask one question at a time and include a recommended answer.
5. Do not implement while a material decision remains unresolved.

Produce a compact working contract before editing:

```yaml
problem: <observed behavior>
expected: <required behavior>
reproduction: <short path>
scope: []
exclusions: []
evidence: []
```

## Behavior-preserving cleanup

Run this directly in the implementation checkout after the change:

1. Inspect `git status --short`, tracked changes, untracked files, and every touched source, test, configuration, schema, and migration file. Skip generated artifacts and binaries; inspect lockfiles only for unintended churn.
2. Remove narration and stale comments, dead code, unused exports, obsolete branches, duplication, unnecessary casts or fallback branches, bloated types or plumbing, deep nesting, identity wrappers, and abstractions that add no clarity.
3. Prefer existing canonical helpers and local architecture.
4. Preserve behavior, acceptance criteria, public contracts, schemas, and externally required fields.
5. Re-read the complete diff once and clean any slop exposed by the first pass.

Do not stage, commit, push, run full CI, or broaden scope during cleanup. Stop as `blocked` when cleanup requires an uncertain behavior or contract decision.

## Structural code-quality review

Require the pre-change SHA or branch as `review_base`. Review `git diff <review_base>`, `git status --short`, all untracked files, and enough adjacent code to judge ownership and existing helpers.

Use a fresh reviewer/subagent when the host supports one; give it the raw task contract, repository state, and `review_base`, not the implementation conversation or rationale. Otherwise review inline and disclose that independent review was unavailable.

Apply high-confidence, behavior-preserving fixes for:

- ad-hoc conditionals or special cases that need a clearer model;
- logic in the wrong layer or package;
- duplicated logic or bespoke helpers that should use a canonical implementation;
- thin wrappers, pass-through layers, unnecessary generic machinery, and cast-heavy boundaries;
- giant changed files or components that need focused decomposition;
- dead code, obsolete exports, and incidental complexity exposed by the patch;
- sequential or partial-update orchestration whose simpler parallel or atomic structure is obvious.

Prefer deleting concepts and branches over rearranging them. Do not silently change acceptance behavior, public APIs, schemas, migrations, permissions, security, billing, or external contracts. Do not turn a patch into an architectural rewrite.

Scan, fix, and re-scan for at most three passes. Finish only when the diff has no clear structural regression, avoidable spaghetti growth, boundary leak, unjustified file-size explosion, unnecessary wrappers or casts, dead code, duplication, or obvious simpler implementation. Return `blocked` if a material issue remains or the base cannot be resolved.

Do not stage, commit, push, or run full CI during this review.

## CI-equivalent verification

Invocation of `forge-patch` authorizes the relevant repository-documented checks for the patch.

1. Read applicable repository instructions, package scripts, task-runner configuration, and PR workflows.
2. Resolve the base branch and inspect the complete branch diff.
3. Run the narrow reproduction and affected checks first.
4. Prefer the repository's documented CI command. Otherwise select the applicable typecheck, lint, tests, build, and format check using the narrowest reliable scope.
5. Run every selected check even if one fails.
6. Do not weaken checks or dismiss a failure without evidence.
7. Repair only failures caused by the patch, then rerun the complete selected suite.

Return `blocked` when commands are ambiguous or required infrastructure is unavailable. Record the shortest useful result:

```yaml
result: pass | fail
checks:
  - name: <check>
    result: pass | fail
failure: null | <one-line reason>
```

## Commit contract

Before committing:

1. Confirm the complete scoped diff is intended and contains no secret, raw production value, generated artifact, unrelated change, or temporary evidence.
2. Confirm selected CI passed.
3. Create one final commit using the repository's allowed prefix. For Airgoods use exactly one of `feat:`, `patch:`, `tech:`, `refactor:`, or `maintenance:`.
4. Tie all subsequent evidence to this exact commit SHA.

## Draft PR delivery

Create or update one PR for the patch. Never create multiple PRs for one patch and never merge it.

1. Require passing CI, a clean working tree, resolved base/head branches, and working GitHub authentication.
2. Read and follow the repository PR template.
3. Use the repository title format. Otherwise use `Fix|Improvement|Tech: <patch name> (AIR-123)` and omit the Linear suffix when no credible ID exists.
4. Build a concise body from the complete base diff, commit history, working contract, verification, and known Linear context.
5. Add a concise `PR evidence` section in the best matching template location. Link the video or other selected artifact, include a one-line outcome, and disclose non-blocking limitations.
6. Push if needed and create or update a GitHub draft PR with `gh`.
7. Preserve draft state. Do not mark ready, merge, deploy, or release.

Never publish credentials, raw production data, PII, or a private evidence URL outside its intended PR or associated Linear issue.
