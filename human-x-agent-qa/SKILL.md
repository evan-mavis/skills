---
name: human-x-agent-qa
description: Create and iteratively execute concise human-plus-agent QA plans from the current conversation, latest user request, and current Git branch diff against development. Use when the user asks for a QA plan, test scenarios, manual QA checklist, happy path and edge case coverage, branch-diff QA, or a pass/fail checklist with notes and local database validation using the db-local skill.
---

# Human x Agent QA

Build a concise, complete QA plan that a human tester and an agent can execute together. The human performs manual workflow checks, while the agent gathers branch context, prepares data when explicitly approved, uses [$db-local](../db-local/SKILL.md) to validate local database state when relevant, and keeps the plan updated.

## Nested Skills

When a QA scenario needs local database setup, schema discovery, or validation, load and use [$db-local](../db-local/SKILL.md). Do not load it for scenarios that do not touch local data.

## Artifact

Create or update QA plan Markdown artifacts outside the repo in this folder:

`/Users/evanmavis/Documents/resources/tests`

Default new artifact path:

`/Users/evanmavis/Documents/resources/tests/<feature-slug>-qa-<YYYYMMDD-HHMMSS>.md`

Do not place QA artifacts inside the current repository unless the user explicitly asks for a different location. Use an existing artifact when the user gives one or the current thread is already using one. Output inline only when the user asks for an inline plan.

Use `references/qa-plan-template.md` for the artifact structure. QA artifacts should stay simple and include only the `Scenario Matrix` and `Final Summary` sections, plus the document title and minimal metadata. Preserve the template's section order, table columns, status labels, and heading names so QA documents are consistent across runs.

## Context Gathering

1. Read the current conversation and latest user message for scope, feature intent, known risks, and manual testing preferences.
2. Inspect local Git context from the repo:
   - `git branch --show-current`
   - `git status --short`
   - `git diff --name-status development...HEAD`
   - `git diff --stat development...HEAD`
   - `git log --oneline development..HEAD`
3. If local `development` is unavailable, use `origin/development`. Do not fetch by default. If neither base exists, ask the user for the intended base branch.
4. Read relevant changed files and nearby code enough to identify user-facing behavior, API contracts, data changes, permissions, feature flags, and likely regressions.
5. Do not run lint, typecheck, tests, migrations, or workspace-wide validation unless the user explicitly asks.

## Plan Requirements

Generate scenarios justified by the conversation, diff, and changed code. Be concise but complete.

Cover the relevant risk areas directly inside the scenario rows:

- Happy paths for the core workflow.
- Edge cases and negative cases.
- Permission, role, feature flag, or tenant boundaries when relevant.
- Loading, empty, error, disabled, modal, navigation, and state-sync behavior when UI is touched.
- Persistence, rollback, idempotency, and data integrity checks when API or DB behavior is touched.
- Regression scenarios implied by changed shared components, utilities, schemas, or API contracts.

Each scenario row must have only:

- Human test steps.
- Expected result.
- Agent validation, especially targeted DB checks using [$db-local](../db-local/SKILL.md) when relevant.
- Result checkboxes: `[ ] Pass [ ] Fail [ ] Blocked [ ] Skipped`.

Do not add separate Scope, Changed Surface, Risk Notes, Execution Log, or Open Questions sections unless the user explicitly asks for them.
Do not add Stable ID, Type, Scenario, Setup/Data, or Test notes columns. Scenario context and notes should be communicated in the normal conversation.

## Output Contract

Use `references/agent-output-templates.md` for chat responses during plan creation and execution. Keep responses concise and use the same headings each time:

- `QA Plan Created`
- `Next Scenario`
- `Scenario Updated`
- `QA Complete`

Do not invent a new response format unless the user explicitly asks for a different format.

## Execution Loop

Move through the plan one scenario at a time.

1. Present the next scenario with only the human steps, expected result, and validation needed now.
2. If local data setup or validation is needed, use [$db-local](../db-local/SKILL.md). Prefer read-only validation queries. For DB writes or seed data, confirm the exact write with the user first.
3. Wait for the user to run the manual test or explicitly ask the agent to perform an available agent-side step.
4. After the user reports the result, run targeted local database validation with [$db-local](../db-local/SKILL.md) if relevant.
5. Update the artifact immediately: mark pass, fail, or blocked and update Final Summary counts. Keep detailed notes in the normal conversation unless the user asks to add them to the artifact.
6. Continue to the next scenario until all scenarios are passed, failed, blocked, or intentionally skipped.

## Result Handling

Do not mark a scenario as passed only because setup succeeded. Mark the final result after the human test and any relevant agent validation are complete.

For failures, capture:

- What failed.
- Actual vs expected behavior.
- Evidence, such as data rows, visible error text, console output, or network/API response when available.
- Whether the issue blocks further scenarios.

For blocked scenarios, capture the missing setup, unavailable environment, unclear requirement, or needed user decision.

## Final Summary

Report the artifact path, counts for pass/fail/blocked/skipped, key findings, remaining risks, and anything intentionally not tested.
