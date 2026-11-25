---
name: prototype
description: Build several structurally different variants of a UI decision inside the real app, switchable with ?variant=, so a person picks one before the build starts. Use for prototype, "show me options", "a few directions for this screen", or a design decision with no precedent.
---

# Prototype

A prototype answers one design question. The answer is a variant, and the branch that holds it starts the real build.

Adapted from Matt Pocock's `prototype` skill (MIT, copyright 2026 Matt Pocock). See [LICENSE](LICENSE) for the notice.

## Scope the question

Write the question down before writing code: which layout, which interaction, which density, or which primary affordance. If the work is "build the thing" with no open question, stop and route to the repository's feature work.

Open UI questions come from the Linear spec. When the spec has none, the prototype is not needed.

## Count the variants

- **Five** for a key screen or a new interaction: a surface the user meets often, or the first instance of a new pattern.
- **Two or three** for everything else.
- **None** for a screen that follows an existing pattern. Copy the pattern and say so.

Variants must disagree about structure: layout, information hierarchy, or the primary affordance. Five tints of one card grid are one variant.

## Build them in the app

1. Read the repository's verify skill. Its dev branch is the data source and its route map names the screens.
2. Use the real route, with the real header, sidebar, components, and data. A prototype in a vacuum answers nothing, because every variant looks fine alone. When the decision lives inside an existing page, put the variants there.
3. Add a throwaway route only when the decision has no page to live in. Follow the project's routing conventions and put `prototype` in the path.
4. Gate the variants on a `?variant=` URL search param, and add one floating bar at the bottom centre:
   - arrows that cycle the variants and wrap at both ends;
   - the current key and its name, such as `B (Sidebar layout)`;
   - arrow keys that cycle when focus is not in a text field;
   - styling that looks foreign to the page, so nobody mistakes the bar for part of the design;
   - a guard that hides the bar in production builds.
5. Keep data read-only and in memory. Persistence and mutations are not the question.
6. No tests, no error handling beyond what makes it run, no abstractions. Delete the code when the answer lands.

## Capture the variants

Screenshot every variant at the app's real viewport through the browser tools, with the variant key in the filename. Keep the originals with their provenance, following the [capture guidance](../ui-review/references/capture-metadata.md).

When an interaction needs to move, resolve the video capture skill from the available skill catalog and record through it. Do not hand-roll a recorder.

## Hand off the choice

Show the variants with their keys, one line on the structural bet each one makes, and the path to the running app. The answer is often "the header from B with the sidebar from C", which is itself a variant. Treat it as a new key rather than arguing for one of the existing ones.

## After a variant wins

- **Keep the branch.** The winning variant starts the real build. Keep its route or component, and delete every losing variant and the switcher before the PR opens.
- **Write the decision.** Update the design-decisions section of the Linear spec through [to-linear-spec](../to-linear-spec/SKILL.md): the chosen variant, one sentence of reason, and which variants lost. Never leave the prototype as the only record.
- **Hand off the branch.** The build owner starts from it and rewrites what the prototype needs properly: tests, error handling, and the real data path.

## Handoff

- **In:** the Linear spec with open UI questions, the repository's verify skill, and its design-decisions section.
- **Out:** the variants branch with the winning variant and no losers, screenshots of every variant, and the updated design-decisions section naming the choice and its reason.

## Attribution

Matt Pocock's `prototype` skill, `github.com/mattpocock/skills`, MIT licensed. This adaptation rewrites the workflow for in-app variants on a shared development branch. [LICENSE](LICENSE) carries the notice.
