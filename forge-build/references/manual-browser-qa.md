# Manual Browser QA

Run manual QA against the exact integrated, CI-passing feature SHA. Use the host's best native
browser or computer-use capability against the real local application or an explicitly supplied
isolated preview. Never test production by default and never invoke site-building or
site-publishing workflows.

## Runtime preflight

1. Read the PRD, issue index, completed issue files, and complete feature diff.
2. Resolve every changed user workflow, actor, route, state transition, permission boundary,
   side effect, and downstream consumer.
3. Start only the application services and workers required by the selected QA profile.
4. Bind every database-dependent process to the persisted database profile.
5. For Neon, verify the connected child branch or endpoint matches the provision result and
   differs from the parent before migrations, workers, application startup, or browser actions.
6. Load the selected connection only into task-scoped process environments. Never edit `.env`,
   `.env.local`, other dotenv files, or shell profiles.
7. Use synthetic or task-scoped visible values. Never expose raw production-copy data,
   credentials, or private customer information in browser state, logs, screenshots, or chat.

Return `blocked` when the browser surface, required service, authentication, or selected database
cannot be established truthfully.

## QA profiles

### None

Do not run manual browser scenarios. Automated CI and required runtime/database checks still run.

### Light

Exercise the happy path for every meaningful changed user workflow:

- cover each materially different actor;
- start from the real entry point;
- perform the changed action;
- verify the visible final state;
- verify an important side effect when the UI alone is insufficient.

Keep scenarios small and independent. A single end-to-end flow may cover closely related changes
when every outcome remains explicit.

### Heavy

Generate and execute as many relevant, safe scenarios as the changed surface and environment
support. Apply every relevant category:

- happy paths and alternate valid paths;
- invalid input, empty state, and boundary values;
- permissions, roles, direct links, and unauthorized access;
- lifecycle transitions, repeated actions, cancellation, and recovery;
- no, one, many, legacy, nullable, stale, and partially configured data states;
- reload, back/forward navigation, concurrent or stale state, and idempotency;
- downstream jobs, notifications, analytics, and cross-actor consequences;
- focused regressions in adjacent behavior.

Use risk-based pairwise combinations rather than an unbounded Cartesian product. Prioritize
high-impact state transitions, irreversible actions, permission boundaries, and behavior changed
by the branch. Continue independent scenarios after a failure unless it blocks the remaining
surface.

## Execution record

Assign stable scenario IDs and record:

| ID | Actor/area | Preconditions | Steps | Expected | Actual | Status |
|---|---|---|---|---|---|---|
| QA-01 | Changed workflow | Selected account/state | Concise actions | Visible result | Observation | Pass |

Use only `Pass`, `Fail`, or `Blocked`. Record facts immediately after each scenario and separate
observed behavior from inference. Reproduce a suspected branch-caused failure twice when safe,
confirm its account and database preconditions, and rule out stopped services or stale bundles
before reporting it.

Return:

```yaml
qa_profile: light | heavy
tested_sha: <feature-sha>
database_binding: verified | not_needed | blocked
scenarios:
  passed: <count>
  failed: <count>
  blocked: <count>
failures:
  - <scenario-id-and-concise-finding>
blocked:
  - <scenario-id-and-specific-prerequisite>
```

Manual QA is verification, not PR evidence. Do not record a video for every scenario. The
orchestrator's separate evidence profile controls final demo capture.
