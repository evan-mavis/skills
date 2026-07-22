---
name: feature-qa-site
description: Review a feature branch against its repository's default branch, derive broad happy-path, negative, boundary, permission, lifecycle, data-state, regression, and edge-case scenarios, select feature-relevant local accounts with db-local, execute the scenarios in the real local application, document reproducible bugs with video evidence, and publish a private Notion-inspired QA review through an available site host. Use for exploratory QA, branch testing, pre-merge validation, bug hunts, release confidence reviews, or requests to turn a feature diff into a video-backed test report.
---

# Feature QA Site

Turn a branch diff into an evidence-backed QA review. Maximize useful coverage, reproduce failures carefully, and publish findings without fixing product code unless the user separately asks for fixes.

## Required companion skills

- Load `db-local` after diff analysis. Use it for account and data-state selection plus read-only before/after verification.
- Load the repository's local-development skill when available.
- Load the host's browser automation before executing UI scenarios. In Codex, prefer the current in-app Browser skill; in Cursor, use its native browser tools or Playwright. Follow the active tool's setup, locator, policy, and finalization rules exactly.
- Load `feature-demo-site` only for its browser-frame capture reference and media scripts. Do not substitute its presentation-oriented coverage workflow for this QA workflow.
- When Sites building and hosting skills are available, use them. Otherwise use an available, configured static-site workflow and hosting integration; never invent deployment credentials or silently publish publicly.

## Operating rules

- Test local development or an explicitly supplied preview environment. Never test production by default.
- Remain report-only. Do not change application source, migrations, configuration, or tests while investigating bugs unless the user explicitly asks for fixes.
- Direct database work must remain read-only. UI actions may create or update local test data when required by the scenario; restore reversible state and avoid destructive actions.
- Treat changed automated tests as clues, not proof that the feature works.
- Record facts. Separate observed behavior, expected behavior, and inference.

## Workflow

### 1. Map the branch

1. Resolve the default branch from `refs/remotes/origin/HEAD`; fall back to `main`, then `master`.
2. Review `git log <base>..HEAD`, `git diff --stat <base>...HEAD`, changed filenames, and the complete diff.
3. Trace each change through UI routes, APIs, entities, permissions, background jobs, emails, analytics, admin tools, migrations, and tests.
4. Build a feature map by actor, entry point, state transition, side effect, and downstream consumer.
5. Mark changes that are implementation-only and explain which behavior they protect.

### 2. Select accounts and data with `db-local`

1. Infer likely tables and relationships from the feature map.
2. Follow the `db-local` schema-discovery workflow before writing targeted SQL.
3. Query small read-only samples to find accounts representing:
   - Every affected role and permission level.
   - Eligible and ineligible users.
   - No records, one record, and many records.
   - Each relevant lifecycle status.
   - Single and multiple locations, organizations, brands, products, or other feature dimensions.
   - Legacy, nullable, stale, or partially configured data when present locally.
4. Create an account matrix:

| Actor | Account | Data characteristics | Scenarios | Why selected |
|---|---|---|---|---|
| Retailer | Local account identifier | Multi-location, pending records | RET-01–08 | Exercises location and decision paths |

5. Use read-only database queries to confirm side effects after UI actions when useful.
6. Never expose passwords or publish raw database rows. If authentication details are missing, ask only after returning the best candidate account identifiers.
7. If the local database is unavailable, stop and ask the user to start or verify it. Do not switch to a remote database.

### 3. Generate the scenario inventory

Read [references/test-scenario-catalog.md](references/test-scenario-catalog.md). Apply every relevant category to every affected actor, state transition, input, and downstream side effect.

Create stable scenario IDs and record:

| ID | Area | Risk | Preconditions/account | Steps | Expected | Status | Evidence |
|---|---|---|---|---|---|---|---|
| RET-01 | Request decision | High | Pending request | Approve with dates | Approved once | Planned | — |

- Generate as many plausible scenarios as the diff, local data, and environment support.
- Use risk-based pairwise combinations across roles, data states, and inputs instead of an unbounded Cartesian product.
- Include happy paths, negative paths, boundaries, permissions, lifecycle, side effects, regressions, and recovery.
- Reconcile scenarios with existing and changed tests, then add the cases those tests miss.
- Keep every planned scenario in the inventory, including blocked and not-run cases with a reason.

### 4. Execute systematically

- Run scenarios in logical workflow order, then edge cases, then cross-cutting regressions.
- Use fresh page or DOM evidence and unique locators from the active browser tool. Do not guess selectors or use raw CDP for interaction.
- Record actual result, status, account/data state, and evidence immediately after each scenario.
- Use these statuses: `Pass`, `Fail`, `Blocked`, `Not run`.
- Verify important UI side effects with `db-local` read-only queries when visible state alone is insufficient.
- Recheck shared behavior from each affected role rather than assuming symmetry.
- Test direct links, reload, browser navigation, repeated actions, and stale state when relevant.
- Do not stop after the first bug unless it blocks the remaining feature. Continue with independent scenarios.

### 5. Confirm and document bugs

Before calling behavior a bug:

1. Reproduce it at least twice when safe.
2. Confirm the account and database preconditions.
3. Rule out a stopped dependency, wrong local port, stale bundle, missing worker, or unavailable service.
4. Compare behavior with the diff, adjacent product behavior, and explicit requirements.
5. Reduce it to the shortest reliable reproduction.

For each confirmed bug, record:

- Concise title and severity: `Critical`, `High`, `Medium`, or `Low`.
- Affected actor, route, feature state, and scenario IDs.
- Preconditions and exact reproduction steps.
- Expected versus actual behavior.
- Frequency and whether it blocks other scenarios.
- Relevant console, network, worker, or read-only database evidence.
- A clean video showing orientation, triggering action, and visible failure.

Do not include credentials, tokens, private customer data, or irrelevant console noise.

### 6. Capture evidence

- Read the loaded `feature-demo-site` browser-capture reference and reuse its timestamped recorder when the host exposes an allowed CDP session; otherwise use its native-recording and screenshot fallback rules.
- Capture video for every confirmed reproducible UI bug unless policy or safety blocks it.
- Capture representative critical-path passes when they materially improve review confidence; do not make a video for every passing assertion.
- Prefer screenshots for static email output, audit rows, database verification summaries, or errors that disappear during interaction.
- Give each asset a stable scenario or bug identifier.

### 7. Build the QA review

Create the review site outside the feature repository unless updating a user-selected project. Prefer Sites when its building and hosting skills are available. Otherwise create the same standalone review with the host's available local web tooling and deploy it only through a configured, user-authorized static-site integration. Use a minimal Notion-inspired document with Solarized Light theming:

- Use these exact primary tokens: background `#FDF6E3`, foreground `#657B83`, accent `#B58900`, soft surface/border `#EEE8D5`, and muted text `#93A1A1`.
- Use Geist for UI text and Geist Mono for scenario IDs, routes, timestamps, code, and technical evidence.
- Use Notion-like components semantically: a page header, property rows for scope and branch, callouts for confirmed bugs, status tags, checklists for repro steps, simple database-style scenario tables, dividers, inline code, and media blocks.
- Keep components flat and content-led with restrained 4–8px radii, thin low-contrast borders, and almost no shadow.
- Use a fixed translucent sidebar near `rgba(253, 246, 227, .86)` with backdrop blur and only Overview, logical feature areas, Bugs, and Scenario Inventory.
- Use `#B58900` for active navigation, links, focus, and small highlights. Keep severity/status colors within Solarized accents: red `#DC322F`, orange `#CB4B16`, green `#859900`, blue `#268BD2`, with text labels always present.
- Small title and one-sentence scope caption.
- Compact summary counts for Passed, Failed, Blocked, and Not run.
- Bugs first, ordered by severity. Give each bug its own anchored section with media, expected/actual, repro steps, impact, and related scenarios.
- Follow with coverage sections grouped by user workflow or feature area. Include brief representative pass evidence where useful.
- End with `All scenarios tested` as the final substantive section.
- In that final section, list every planned scenario grouped first by workflow/feature area and then by risk category. Show ID, title, status, account/data profile, and a concise result or blocker.
- Keep media full-width by default. Avoid dashboards, dense card grids, gradients, decorative controls, oversized severity banners, and unnecessary components.

### 8. Reconcile and publish

Before publishing:

- Map every changed behavior to at least one scenario or an explicit not-testable reason.
- Confirm every `Fail` has evidence or a clear capture blocker.
- Confirm counts equal the final scenario inventory.
- Confirm bug severity and wording are supported by evidence.
- Confirm the final scenario section includes Pass, Fail, Blocked, and Not run rows.
- Confirm the rendered review consistently uses the Solarized Light tokens, Geist typography, translucent sidebar, and restrained Notion component language.
- Inspect capture manifests and first/middle/last frames; verify final MP4 metadata with `ffprobe`.
- Run the selected site workflow's required production build once after the review is complete.

Publish privately by default. Return the deployed URL first, then the scenario counts and a short list of confirmed bugs. If no publishing integration is available, preserve the validated local review and return its absolute path; when invoked by `forge-build`, report the missing private-URL capability as a blocker before PR creation. Do not claim comprehensive coverage without naming blocked or untested areas.

### 9. Clean up

- Keep the final site and compressed evidence.
- Move raw frames to Trash only after a successful deployment, using the `feature-demo-site` cleanup helper.
- Stop temporary servers after hosting completes.
- Leave product source unchanged.

## Failure handling

- If browser policy blocks a route, stop that capture path and mark the scenario `Blocked`. Do not attempt an indirect or raw-CDP workaround.
- If one account lacks required data, return to `db-local` and choose a better local account before manufacturing state.
- If an external integration cannot run locally, test the reachable boundary, capture truthful evidence, and mark downstream cases `Blocked` with the missing dependency.
- If the selected host cannot publish, preserve the validated local review and report the user-visible blocker without exposing hosting credentials or internals.
