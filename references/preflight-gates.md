# Preflight Gates

Shared runtime, evidence, and closeout gates for `forge-issue` and `forge-build`. Profile and
HITL questions may interrupt the terminal output contract; everything else should not.

## Preflight confirm

After inspecting the source, code, and scope — and before provisioning, dispatch, or implementation
— render this block and **stop** until the user confirms or says **proceed with defaults**:

```yaml
# Working contract — confirm or edit
issue: <id-or-plan-slug>
host: cloud | local_worktree
data_profile: neon | local-preview | local | none
evidence_profile: video | text          # forge-build: pr_evidence
qa_profile: none | light | heavy        # forge-build only; omit for forge-issue
surfaces: [<user-visible apps touched>] # e.g. apps/web, apps/dashboard, apps/mobile
runtime_waived: false                   # true only when user explicitly opts out
review_base: <sha>
blockers: null | <specific blocker>
```

Rules:

- Do **not** provision runtime, dispatch slices, or implement until confirmed or explicitly waived.
- If no reply, ask **once** with a recommended default — never silently proceed.
- Persist under `working_contract` (forge-issue) or `## Forge Build Execution` (forge-build).

### Defaults (Airgoods)

- **`host: cloud`** → default `data_profile: neon`, not `none`.
- **Any user-visible surface** → default `evidence_profile: video`; forge-build also defaults
  `qa_profile: light` unless the plan is provably non-visual.
- **`frontend-only` is not a skip reason** when the flow needs backend, auth, or data (orders,
  claims, checkout, uploads, permissions).
- **`data_profile: none` or `runtime_waived: true`** only when the user explicitly opts out in
  this block.

## Blocking gates

These steps are **blocking** — do not open or finalize a draft PR until satisfied or explicitly
waived in the preflight confirm block:

| Gate | forge-issue | forge-build |
| ---- | ----------- | ----------- |
| Runtime provisioned + bound | capability step 2 | preflight, before first dispatch |
| Healthchecks / stack ready | before browser verify | before plan closeout QA |
| Browser exercise | Verify §3–4 | plan closeout manual QA when `qa_profile` is `light` or `heavy` |
| Evidence attached | Record §2–4 | plan closeout PR evidence |

`$run-ci` and unit tests **never** satisfy `evidence_profile: video` or `qa_profile: light|heavy`.

## Invalid `status: done`

Return `blocked` instead of `done` when:

- `evidence_profile: video` (or forge-build `pr_evidence: video`) and both `evidence` and `video`
  are null
- `data_profile: neon` (or `local-preview`) and `database_runtime` is not `verified`, unless
  `runtime_waived: true` was confirmed upfront
- user-visible surfaces were in scope and browser verification was skipped without waiver
- video capture or required runtime is unavailable — **do not** downgrade to `text` or `none`
  silently

## Agent mistake (AIR-7646)

> UI bug with a React-only diff ≠ skip Neon, unit tests only, ship PR.
> Correct: confirm working contract, provision runtime, exercise backend + web in browser, record
> video, attach to PR.
