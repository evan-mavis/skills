---
name: design-bake-off
description: Generate N visually distinct full-page design variants of an existing page in parallel using subagents, wire them into a dev-only switcher overlay so the user can toggle through every variant live on the real page, and guarantee no two variants converge on the same layout idea. Use when the user wants to explore the design space for a page, compare layout options side-by-side, ideate UI variations, run a design spike, or generate multiple competing designs to pick a direction.
---

# Design Bake-Off

Run a parallel design exploration for a single page. The orchestrator (this thread) plans the work, builds shared infrastructure once, then fans out to many subagents that each produce one full-page design variant. Every variant is registered in a dev-only switcher overlay so the user can cycle through them live on the actual page.

## When to Use

The user wants to see many full-page design variations of an existing page and pick a direction by toggling through them in the running app. They are not asking for a single change — they are asking to explore the design space.

## Non-Negotiables

1. **Run subagents in parallel.** Dispatch every variant subagent in a single tool-call batch. Sequential dispatch defeats the point of this skill.
2. **No two subagents may produce the same idea.** The orchestrator pre-assigns each subagent a distinct, named design archetype before launching anything. Subagents do not get to pick.
3. **One file per subagent.** Each subagent writes exactly one variant file in the variants directory and touches nothing else. This prevents merge conflicts and lost work.
4. **Shared scaffolding is built once, by the orchestrator, before any subagent launches.** Types, "must-ship" components, and the switcher overlay all exist before the fan-out.
5. **Variants stay faithful to the existing design system and prefer simplicity.** Re-use the existing components, color palette, typography, spacing scale, and primitives that already live in the codebase. Do not invent new color tokens, new primitives, new typography, or new visual flourishes. If a variant can be built from existing components alone, it should be. The differentiator between variants is *layout and information hierarchy*, not visual styling. When in doubt, choose the simpler, plainer option over the more decorated one.
6. **The switcher must be dev-only and visually unobtrusive.** It must not change the page when disabled.

## Workflow

Copy this checklist and track progress:

```
- [ ] 1. Gather requirements
- [ ] 2. Explore the target page and design system
- [ ] 3. Assign distinct design archetypes (one per variant)
- [ ] 4. Confirm the plan with the user
- [ ] 5. Build shared scaffolding (types, must-ship components, switcher)
- [ ] 6. Wire the switcher into the real page (dev-only)
- [ ] 7. Fan out variant subagents IN PARALLEL
- [ ] 8. Register each completed variant in the switcher
- [ ] 9. Verify everything compiles and the switcher works
- [ ] 10. Report results to the user
```

### Step 1: Gather requirements

Confirm with the user:

- **Target page**: exact file path of the page being redesigned.
- **Must-ship elements**: any feature that every variant must include (e.g., "lifecycle timeline"). These become shared components.
- **Information hierarchy**: what is primary, what is secondary, what can be tucked away.
- **Constraints**: which design tokens, libraries, or primitives to stay within.

If the user already described all of this in the triggering message, do not re-ask. Restate your understanding instead.

**Always confirm the variant count via the structured decision UI**, even if the triggering message named a number — the user may want to adjust before paying for N parallel subagents. Use the `AskQuestion` tool (or whichever structured decision UI is available; fall back to a concise numbered list if none is). Default is 10. Put the recommended option first and label it `(Recommended)`.

- Header: `Design Bake-Off`
- Question: `How many variants should the bake-off generate?`
- Options:
  - `10 (Recommended)` — balanced exploration, ~10 parallel subagents.
  - `5` — quick spike, low cost.
  - `15` — broad exploration, higher cost.
  - `20` — exhaustive, near the limit of useful uniqueness given the archetype library.
  - `Custom` — ask the user for an exact number, then proceed.

If the user already explicitly stated a count in the triggering message (e.g., "generate 15 variants"), pre-select that option as `(Recommended)` instead of 10, but still present the picker so they can change their mind cheaply. Do not skip this gate.

### Step 2: Explore the target page and design system

Read the existing page file and the components it uses. Identify:

- The component primitives in use (buttons, cards, badges, layout shells, etc.).
- Color tokens, spacing scale, typography utilities.
- Any sibling page that looks "too similar" to the target — this is what the variants need to feel distinct from.
- Existing data shape / props the page receives. Variants must be drop-in compatible with this shape.

Pick a sibling "reference" page if one exists, so variants borrow real components rather than invent new ones.

### Step 3: Assign distinct design archetypes

Pull N archetypes from `references/archetype-library.md` and adapt the names to the domain. Each archetype must differ from every other on at least one of:

- Information grouping (what is primary vs. secondary).
- Spatial layout (where the must-ship element lives — sidebar, top bar, modal, inline).
- Disclosure pattern (everything inline vs. expandable vs. tabs vs. shelf).
- Visual metaphor (receipt, dashboard, conversation, timeline-first, hero-summary, etc.).

Produce a numbered list like:

```
01. CardStack         — three stacked detail cards, timeline as right sidebar
02. KeyValueTable     — dense two-column key/value layout, timeline above
03. TimelineFirst     — timeline is the dominant element, details flow around
04. VerticalSidebar   — left sidebar timeline, primary details center, images in side shelf
...
```

If you cannot articulate the difference between two archetypes in one sentence, they are the same archetype. Replace one.

### Step 4: Confirm the plan with the user

Show the archetype list and the planned file structure before launching anything. Format:

```
**Design Bake-Off Plan**
- Page: <relative path>
- Variants: <N>
- Must-ship: <required elements>
- Variants directory: <relative path>
- Switcher: <relative path to switcher file>
- Archetypes:
  01. <name> — <one-sentence differentiator>
  02. <name> — <one-sentence differentiator>
  ...
```

Ask: "Approve this plan and start the bake-off, or revise the archetype list?"

If the user approves, proceed without further check-ins until all variants are done. If they revise, update the list and re-confirm.

### Step 5: Build shared scaffolding

Create these files yourself before any subagent runs:

- `<variants-dir>/types.ts` — shared `VariantProps` interface that every variant component accepts. Mirror the props the real page already passes down.
- `<variants-dir>/<MustShipComponent>.tsx` — one shared component per must-ship element, so variants compose it rather than re-implement it. (Skip if no must-ship element.)
- `<variants-dir>/<PageName>VariantSwitcher.tsx` — the switcher overlay. Use the code in `references/switcher-overlay.tsx.md` as the starting point and adapt the import paths and the `VARIANTS` registry shape.

The switcher starts with an empty `VARIANTS` array. Subagents will not modify it; the orchestrator registers each completed variant after the fan-out.

### Step 6: Wire the switcher into the real page

Edit the actual page file to render the switcher and, when a variant is selected, render the chosen variant component in place of the default page body. The default (no variant selected) must render the original page unchanged.

Pattern:

```tsx
const [variant, setVariant] = useState<string | null>(null);

return (
  <>
    {variant ? <SelectedVariant {...sharedProps} /> : <OriginalPageBody {...sharedProps} />}
    {import.meta.env.DEV && <PageNameVariantSwitcher value={variant} onChange={setVariant} />}
  </>
);
```

Use the env guard that matches the framework (`import.meta.env.DEV` for Vite, `process.env.NODE_ENV !== 'production'` for Next/CRA).

### Step 7: Fan out variant subagents IN PARALLEL

Dispatch all N subagents in a single tool-call batch using `Task` with `subagent_type: "generalPurpose"`. Each subagent gets:

- The exact file path to create (only that one path).
- The assigned archetype name and one-sentence differentiator.
- The shared `VariantProps` type signature to import.
- The list of must-ship components to compose.
- A pointer to the existing page file and 2–3 reference component files so the subagent borrows the right primitives.
- The hard rule: do not edit, create, or read any file outside the variants directory except the listed reference files.
- The hard rule: do not modify the switcher, types file, or shared components.

Use the prompt template in `references/subagent-prompt.md`. Customize per archetype.

Set `run_in_background: false` so the batch resolves together. If the user prefers fire-and-forget, set `run_in_background: true` and proceed to the next step only after every completion notification arrives.

### Step 8: Register each completed variant in the switcher

After all subagents finish, edit the switcher's `VARIANTS` registry to import and list every completed variant component, in archetype order. This is the only place where the orchestrator touches subagent output.

### Step 9: Verify

- Confirm every variant file exists and exports a default React component matching the `VariantProps` type.
- Confirm the switcher imports them all and the registry array length equals the planned variant count.
- Confirm the page renders the original body when no variant is selected.
- Do not run lint, typecheck, build, or tests unless the user asks.

### Step 10: Report

End with:

```
**Bake-Off Complete**
- Page: <path>
- Variants generated: <N>/<N>
- Variants directory: <path>
- Switcher: <path>
- How to use: open the page in dev, the switcher floats in the bottom-right. Click or use ←/→ keys to cycle.
- Cleanup: when a winner is picked, delete the variants directory and the switcher import from the page.
```

## Switcher Overlay Code

The starting code for the switcher lives in [references/switcher-overlay.tsx.md](references/switcher-overlay.tsx.md). Copy it into the chosen switcher path, then rename the component and adjust import paths. Do not edit it inside the references file.

## Archetype Library

A long list of reusable design archetypes lives in [references/archetype-library.md](references/archetype-library.md). Pull from this list when assigning archetypes in Step 3. Adapt names to the domain.

## Subagent Prompt Template

The template the orchestrator sends to each variant subagent lives in [references/subagent-prompt.md](references/subagent-prompt.md). Fill in the placeholders per archetype before dispatching.

## Anti-Patterns

- **Sequential subagents.** Always parallel. If you need to launch 10 variants, that is one message with 10 `Task` calls.
- **Open-ended archetypes.** "Make a creative design" produces near-duplicates. Always pre-assign a specific named archetype with a one-sentence differentiator.
- **Subagent file sprawl.** Each subagent writes one file. Anything shared belongs to the orchestrator.
- **Inventing primitives.** Variants must reuse existing components. If a subagent needs a new primitive, that is a signal the orchestrator missed shared scaffolding — pause and add it, do not let one subagent introduce something the others cannot use consistently.
- **Switcher in production.** The switcher must be gated by a dev env check. Never ship it.
- **Re-running variants serially when one fails.** If a subagent fails, re-dispatch only the failed archetype, in parallel with any other retries, not one at a time.
