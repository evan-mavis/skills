---
name: feature-demo-site
description: Review a feature branch against its repository's default branch, identify every user-visible workflow and supporting operational change, capture concise Chrome-backed videos with a target-anchored friendly #6248ff cursor and matching click rings or truthful screenshots from the real local application, and publish a minimal Notion-inspired walkthrough with a section sidebar through an available site host. Use for feature demos, release walkthroughs, PR showcases, stakeholder demo sites, or requests to turn a branch diff into a media-led walkthrough.
---

# Feature Demo Site

Turn a branch into a concise, shareable demo story. Treat the diff as the source of truth, the running application as the proof, and a private deployed URL as the preferred deliverable.

## Required companion skills

- Load `query-local-db` after reviewing the diff. Use it to select local accounts whose roles, eligibility, records, and lifecycle states best demonstrate the feature.
- Load the host's browser automation before recording. In Codex, prefer Chrome when any story beat calls for video; use the in-app Browser for screenshot-only work, when the user explicitly names it, or when Chrome is unavailable. In Cursor, use its native browser tools or Playwright. Follow the active tool's setup, locator, policy, and finalization rules exactly.
- When Sites building and hosting skills are available, use them. Otherwise use an available, configured static-site workflow and hosting integration; never invent deployment credentials or silently publish publicly.
- Use a repository-specific local-development skill when one is available.

## Workflow

### 1. Establish scope

1. Confirm the current repository and feature branch.
2. Resolve the default branch from `refs/remotes/origin/HEAD`; fall back to `main`, then `master`. Do not assume the base when it can be discovered.
3. Review all three surfaces:
   - `git log <base>..HEAD` for intent and sequencing.
   - `git diff --stat <base>...HEAD` and changed filenames for breadth.
   - The actual diff for routes, components, APIs, jobs, email templates, admin tools, migrations, analytics, and tests.
4. Distinguish user-visible changes from supporting implementation. Include supporting work in the narrative when it affects reliability, lifecycle, parity, notifications, or operations.

Create a coverage matrix before recording:

| Order | Actor | Story beat | Route/state | Proof to capture | Media |
|---|---|---|---|---|---|
| 01 | Retailer | Configure the feature | Settings route | Toggle, fields, preview | Video |

Every meaningful diff item must map to a story beat, a concise supporting note, or an explicit “not demo-visible” decision.

### 2. Plan one end-to-end story

- Order sections by the user's workflow, not by directory, commit, or ticket.
- Prefer actor → action → consequence → next actor.
- Keep one concept per section. Merge small related changes; split genuinely different workflows.
- Put internal/admin work last as an optional appendix unless it is central to the feature.
- Use the user's requested order when provided.

### 3. Select feature-relevant accounts

- Infer the relevant entities, roles, eligibility rules, and lifecycle states from the diff.
- Follow `query-local-db`: discover schemas first, then run small read-only queries against the local `stack` database.
- Find accounts with the exact data needed for each story beat: correct role, existing relationships, empty and populated states, edge lifecycle states, multi-entity data, and any eligibility prerequisite.
- Build a small account matrix with actor, local account identifier, qualifying records, target story beats, and why the account fits.
- Prefer the best evidence-bearing accounts over familiar defaults. If login credentials are not known, return the candidate emails or identifiers and ask only for the missing authentication detail.
- Never query production, expose passwords, or publish raw database output in the site.
- If the local database is unavailable, stop and ask the user to start or verify it instead of silently choosing arbitrary accounts.

### 4. Prepare the local application

- Use local development or an explicitly supplied preview environment. Never record production by default.
- Use supplied demo accounts only for this task; never place credentials in source, captions, screenshots, logs, or the final site.
- Prefer existing seeded records and reversible interactions.
- Restore toggles, cancel temporary edits, and avoid submitting or persisting data unless the user authorized it or the workflow requires it.
- If authentication, data, or an external service blocks a beat, exhaust safe local checks before requesting user input.

### 5. Capture proof

Read [references/browser-capture.md](references/browser-capture.md) before the first recording.

- Prefer video when motion or interaction explains the change: navigation, search, sorting, forms, decisions, calendars, lifecycle, messaging, or previews.
- Use a screenshot when the evidence is inherently static or a live interaction would add noise: final email layout, audit detail, empty state, or configuration summary.
- Record the real browser page. Do not make a slideshow of screenshots and call it a screen recording.
- Keep each clip focused, usually 8–25 seconds. Longer clips are acceptable when one continuous workflow is easier to follow.
- Show actual clicks and form interactions, pause briefly at important states, and add only short capture-time labels.
- Use the browser-capture helper's friendly `#6248ff` cursor, target-anchor it to the live control immediately before every meaningful action, and trigger its matching click ring immediately before each real click. Never place the cursor over an interactive control with guessed coordinates.
- Hide the cursor immediately after any action that removes or repositions its target, then reveal it only when anchored to the next live control.
- Capture all states needed for the coverage matrix, including both sides of shared workflows.
- Preserve capture timestamps and integrity metadata; do not estimate pacing when a manifest is available.
- Resolve `SKILL_DIR` to this skill's installed directory and use `$SKILL_DIR/scripts/encode-capture.sh` to turn captured frames into a timestamp-paced, normalized MP4.
- Switch to a traditional recording path for continuous animation, drag-and-drop, audio, desktop UI, or natural cursor movement. Do not force frame capture when it would misrepresent the feature.

### 6. Build the walkthrough

Create the site outside the feature repository unless the user selects an existing project. Prefer Sites when its building and hosting skills are available. Otherwise create the same standalone walkthrough with the host's available local web tooling and deploy it only through a configured, user-authorized static-site integration.

Use this default visual system unless the user asks for another direction:

- Use a Solarized Light theme with these exact primary tokens: background `#FDF6E3`, foreground `#657B83`, accent `#B58900`, soft surface/border `#EEE8D5`, and muted text `#93A1A1`.
- Use Geist for UI text and Geist Mono for code, branch names, IDs, timestamps, and small metadata.
- Build a Notion-inspired document, not a dashboard. Use familiar Notion-like components when they clarify content: breadcrumbs, property rows, callouts, status tags, checklists, simple tables, dividers, inline code, and media blocks.
- Keep components flat and content-led with restrained 4–8px radii, thin low-contrast borders, and almost no shadow.
- Use a minimal fixed translucent sidebar with only the title and section anchors. Set it near `rgba(253, 246, 227, .86)` with backdrop blur; do not add decorative Home or Search controls.
- Reserve `#B58900` for active navigation, links, focus, small highlights, and presenter cues rather than large solid areas.
- Compact hero: one simple title, one sentence, and optionally the story order.
- One numbered section per story beat.
- Each section contains a short heading, one-sentence caption, media, a tiny media label, and 2–4 bullets under “Show.”
- Prefer one full-width video. Use a two-column media row only when two perspectives must be compared.
- Avoid decorative toggles, unnecessary accordions, metric-card grids, ornamental illustrations, gradients, and excessive component chrome.
- Keep copy concrete, concise, and understandable without reading the diff.

Required content order:

1. Title and caption.
2. End-to-end sections in the coverage-matrix order.
3. Optional operations appendix.
4. Small footer with ticket or branch context.

### 7. Validate coverage and publish

Before publishing:

- Reconcile the final page against the coverage matrix and changed files.
- Confirm every section has working media or an intentional static fallback.
- Confirm videos show real interaction rather than only state changes between still frames.
- Review capture-manifest warnings and visually inspect the first, middle, and last frames for blank, stale, or sensitive content.
- Inspect frames before and after every meaningful action. Confirm the `#6248ff` cursor hotspot and click ring overlap the intended live control before the action and that the cursor is hidden or still truthfully anchored afterward.
- Check MP4 duration, dimensions, codec, and file size with `ffprobe`.
- Ensure captions contain no credentials, secrets, private tokens, or accidental customer data.
- Confirm the rendered site uses the Solarized Light tokens, Geist typography, translucent sidebar, and restrained Notion component language consistently.
- Run the selected site workflow's required production build once after implementation is complete.

Publish privately by default. Return the deployed URL first, followed by a one-sentence coverage summary and any intentionally omitted or screenshot-only beats. If no publishing integration is available, preserve the validated local site and return its absolute path; when invoked by `forge-build`, report the missing private-URL capability as a blocker before PR creation.

### 8. Clean up

- Keep final compressed media in the site.
- Resolve `SKILL_DIR` and run `$SKILL_DIR/scripts/cleanup-capture.sh` on raw frame directories only after the new site deploys successfully. Move superseded clips to Trash separately with exact paths.
- Stop temporary development servers after hosting completes.
- Do not modify the feature branch merely to produce the walkthrough.

## Failure handling

- If a browser page is blocked by policy, stop that capture path. Do not work around the restriction with raw CDP, another browser surface, or indirect navigation.
- If a feature cannot be exercised safely, use a truthful screenshot or concise text note and disclose the limitation.
- If the selected host cannot publish, preserve the validated local site and report the user-visible blocker without exposing deployment internals or credentials.
