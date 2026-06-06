---
name: auto-browser-qa
description: Generate a focused QA test-path checklist from the current thread, user-provided context, and the current browser page when available, then use the agent environment's browser automation tools to execute the checklist and update a local Markdown artifact with checkbox completion, pass/fail results, findings, and action items. Use when the user asks to QA a feature, create QA paths, verify UI flows, run manual-browser QA, or produce a local QA artifact/checklist before testing.
---

# Auto Browser QA

Create and execute a local QA checklist for a feature using the active thread context and whatever browser automation is available in the current agent environment.

## Required Tooling

Use the best available browser automation for the current environment. In Cursor, prefer the in-app browser tools or a browser-use subagent. In other agent environments, use Browser Use, Playwright CLI, or another configured browser automation skill when available. Before browser actions, inspect the current page or active tab when applicable, and operate on the active tab unless the user gives a different URL.

If no browser automation surface is available, stop and tell the user what is missing instead of pretending the QA was executed.

## Artifact Location

Create the QA artifact outside the current repo by default:

`~/Documents/resources/tests/<feature-slug>-qa-<YYYYMMDD-HHMMSS>.md`

Use a user-provided path when given. Do not place the artifact inside the repo unless the user explicitly asks.

## Workflow

1. Gather context from the current thread, latest user message, visible browser page, and relevant local files when needed.
2. Draft specific test paths in the artifact before running them. Each test must be a checkbox with a pending result.
3. Ask the human to verify the proposed test paths before any browser execution. Include the artifact path and a concise summary of coverage. Do not proceed until the user approves or edits the scope.
4. After approval, run every test path with the available browser automation. Stay on task until all tests are completed or explicitly blocked.
5. Update the artifact as each test completes:
   - Change `[ ]` to `[x]`
   - Set `Result:` to `Passed`, `Failed`, or `Blocked`
   - Add short evidence and notes
6. Finish by adding key findings and action items to the artifact, then summarize them to the user.

## Test Path Guidelines

Generate tests that match the feature’s actual risk. Prefer end-to-end user flows over isolated implementation details.

Each test should include:

- A short title
- Preconditions or setup
- Steps to execute
- Expected result
- Checkbox completion marker
- Result status
- Evidence/notes field

Cover major happy paths, edge cases mentioned in the thread, regressions previously found, state sync between related controls, validation timing, modal/dialog behavior, visual affordances, console errors, and persistence only when the user approves saving.

Avoid destructive or externally visible actions unless the user explicitly approves that exact action. When testing forms, prefer unsaved form-state verification unless persistence is part of the requested QA scope.

## Human Verification Gate

Before running tests, ask for approval in plain language:

`I created the QA plan at <path>. Please confirm whether to run these tests as written or tell me what to change.`

If the user changes scope, update the artifact first and ask for confirmation only if the updated scope materially changes risk or coverage.

## Artifact Format

Use the structure in `references/artifact-template.md`. Keep the artifact concise but specific enough that another engineer can rerun the tests.

## Final Response

Report:

- Artifact path
- Count of passed, failed, and blocked tests
- Key findings
- Action items
- Anything not tested and why
