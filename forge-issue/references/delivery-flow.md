# Forge-Issue Delivery Flow

## Reproduce (bugs)

When `bug_evidence: before_after_video`:

1. Runtime bound + stack healthy.
2. Airgoods: impersonate affected user
   ([airgoods-runtime](airgoods-runtime.md#impersonation-bugs)); persist `repro_actor`.
3. Exercise real browser app on isolated runtime (not mocks/API-only).
4. Follow `working_contract.reproduction`.
5. **Blocking:** before MP4 per [video](../../references/video-and-delivery.md#forge-issue-bug-beforeafter).
6. Persist `evidence_before`; `reproduction_confirmed: true`.
7. Not reproducible after good faith → `blocked`. Do not implement on guesswork.

Skip when `bug_evidence: none`, `evidence_profile: text`, or empty `surfaces`.
No `$implement-slice` until step 6 or explicit waiver.

## Implement

`change_contract.review_base` = pre-change SHA. UI before/after requires
`reproduction_confirmed`. Four fresh subagents via
[capability pipeline](../../forge-build/references/capability-pipeline.md). Re-read diff;
`blocked` on unresolved behavior / scope creep. Repairs = continuation contract.

## Verify

1. Narrow repro + affected checks; bind DB before dependent commands.
2. `$run-ci` must pass; repair issue-caused failures via continuation.
3. **Blocking:** browser on same path as before clip when before/after; prove DB binding for
   `hosted-db` / `local-preview`. Unit tests / `$run-ci` ≠ video evidence.
4. Native automation; Playwright only as disclosed fallback.
5. Production untouched; one commit with allowed prefix.

## Record and deliver

1. Draft `$to-pr` (pending-evidence note).
2. **Blocking:** after evidence per [video](../../references/video-and-delivery.md); no silent
   downgrade from video → text.
3. Attach clips; update PR; Linear comment with SHAs when issue exists.
4. `$babysit` (stay draft); if HEAD moves → rerun CI / verify / evidence / `$to-pr`.

No `done` without evidence matching profile
([invalid done](../../references/preflight-gates.md#invalid-status-done)). No merge/ready/release.
No Linear issue solely for evidence.

## Cleanup

[Database cleanup](../../forge-build/references/database-runtime.md#cleanup). Stop services started
for the issue. Preserve before/after artifacts.
