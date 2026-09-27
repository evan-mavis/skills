# Video and Delivery

Native desktop browser automation + host screen recording. See
[host surfaces](host-surfaces.md#gui-verification-and-screen-recording). Playwright only as
disclosed fallback. Never silently replace a resolved `video` profile with text.

## Capture standard

- H.264 MP4 outside the repo, usually &lt;100 MB, 10–90s
- Visible trigger + verified final state; no credentials/PII/tooling noise
- Record exact tested SHA alongside the asset
- Inspect start/middle/end and sensitive state changes before upload
- Never commit video to the app repo or Git LFS

Bind the verified `data_profile` DB when the flow is database-dependent. Never record production
by default.

## Forge-build demo

1. From PRD / issues / feature diff, pick the smallest coherent end-to-end story.
2. Cover meaningful user-visible outcomes; merge related flows; leave non-visual notes for the PR.
3. Include one natural negative/regression case when it fits.
4. Draft PR must exist before delivery.

## Forge-issue bug before/after

When `bug_evidence: before_after_video`:

- **Before (blocking, pre-implement):** on `review_base`; same route/actor/data as after; show
  trigger → broken outcome (~10–30s). Airgoods: impersonation per
  [airgoods-runtime](../forge-issue/references/airgoods-runtime.md#impersonation-bugs).
- **After (blocking, closeout):** on final green commit; same numbered
  `working_contract.reproduction` path + same actor; show fixed outcome + one regression check.
- Label both with SHAs in Linear/PR. Prefer Linear for before when an issue exists.

## Delivery

1. Prefer Linear upload when a parent issue exists (prepare → upload → finalize; URLs expire).
2. Else attach to the draft PR, or private artifact storage + PR link.
3. Update draft PR with evidence link, one-line outcome, tested SHA, limitations.
4. Evidence comment: SHAs + clip links. Never create a Linear issue solely for storage.
