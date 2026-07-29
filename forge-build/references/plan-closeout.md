# Plan Closeout Procedures

Forge-build procedures after all issues are integrated. Tie QA and evidence to the exact
CI-passing feature SHA.

## Manual browser QA

1. For `qa_profile: none`, skip browser QA and persist `qa_result: skipped`. Do not skip `$run-ci`
   or required database runtime verification.
2. For `light` or `heavy`, follow [manual browser QA](manual-browser-qa.md) against the real local
   application or isolated preview. Bind the verified database environment when
   database-dependent.
3. Persist tested SHA, scenario counts, failures, blocked cases, data profile, and binding result
   under `## Manual QA` in the PRD.
4. Continue when all executed scenarios pass and every blocked case is disclosed and non-critical.

**QA repair** (max 3 attempts): dispatch the smallest repair in a dedicated worktree;
run the [capability pipeline](capability-pipeline.md); commit as `patch: fix manual QA findings`;
rerun complete `$run-ci`; rerun the full selected QA profile against the new SHA.

Return `blocked` for product decisions, out-of-scope failures, unsafe reproduction, exhausted
attempts, or unavailable browser/service/account/database. Never reduce `heavy` → `light` or
`light` → `none` silently.

## PR evidence

1. For `video`, follow [video and delivery](video-and-delivery.md): smallest coherent end-to-end
   story; host-native recording against the verified database when relevant; inspect H.264 MP4;
   attach to associated Linear issue, draft PR, or private artifact storage.
2. For `text`, record concise verification commands, results, and observed state — no raw
   production data or secrets.
3. For `none`, produce no separate artifact.
4. Persist profile, location or inline summary, and exact feature SHA under `## PR Evidence`.

Return `blocked` when native capture, application dependencies, or authorized storage is
unavailable. Never silently downgrade `video` → `text` or `none`.

## CI repair

Max 3 attempts; one attempt may address multiple failures sharing a root cause.

1. Persist attempt number, failing checks, signatures, and feature SHA under `## CI Repair`.
2. Classify before changing code:
   - **Mechanical or code** — branch-caused lint, type, build, or test failures: dispatch smallest
     repair, run [capability pipeline](capability-pipeline.md), commit as
     `patch: fix final CI failures`.
   - **Environment** — missing services, credentials, or transient network: orchestrator may apply
     documented non-code remediation and retry once. Never change product code to hide environment
     failure.
3. Never weaken CI, skip checks, delete meaningful tests, or update snapshots without verifying
   intended output.
4. Update plan contract `changed_files`, rerun complete `$run-ci` after every repair commit.
5. Clear `## CI Repair` after a full pass.

Return `blocked` when not safely repairable, remediation unavailable, same signature survives two
attempts, or three total attempts fail.
