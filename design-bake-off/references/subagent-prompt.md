# Variant Subagent Prompt Template

Use this template when dispatching each variant subagent in Step 7. Fill every `<...>` placeholder. The subagent must receive enough context to work in isolation without re-reading the user's original request.

Dispatch all subagents in a single tool-call batch using `Task` with `subagent_type: "generalPurpose"` and `description` like `"Variant 03: TimelineFirst"`.

## Template

```
You are generating ONE design variant for a parallel design bake-off. Many sibling subagents are running in parallel right now, each assigned a different design archetype. Do not deviate from your assigned archetype — sibling subagents own the other ideas.

## Your assignment
- Archetype: <ArchetypeName>
- Differentiator: <one-sentence what makes this archetype distinct from siblings>
- File to create (and ONLY this file): <absolute path to RequestVariantNN<ArchetypeName>.tsx>
- Component name: <RequestVariantNN<ArchetypeName>>
- Default export: yes

## What the variant must do
Render a complete full-page redesign of <PageName>. It is not a section, not a widget — it is the entire page body (everything inside the page shell, excluding the global app chrome).

### Information hierarchy (apply to your archetype)
Primary (must be visually dominant):
- <primary item 1>
- <primary item 2>
- ...

Secondary (must remain accessible but tucked away — expandable, drawer, tab, popover, etc., as fits your archetype):
- <secondary item 1>
- <secondary item 2>
- ...

### Must-ship elements (every variant includes these)
- <e.g., Lifecycle timeline — import and compose `<SharedTimelineComponent>` from `./SharedTimelineComponent`. Do NOT re-implement it. Place it according to your archetype: <where for this archetype>.>

## Hard rules
1. Create exactly one file at the path above. Do not create, edit, or delete any other file.
2. Do not modify the switcher, the shared types file, or any shared component.
3. Import the `VariantProps` type from `./types` and accept it as your component's props. Do not add or rename props.
4. Use only components, color tokens, typography, and styling primitives that already exist in the codebase. Do not introduce new dependencies, new colors, new typography utilities, or new design primitives. Re-use what is already there. Reference files:
   - <existing page file path> — the original page, for prop shape, palette, and current style.
   - <reference component 1 path> — example of how the codebase uses <relevant primitive>.
   - <reference component 2 path> — example of <another relevant primitive>.
5. **Prefer simplicity.** The point of this bake-off is to compare *layout and information hierarchy*, not visual styling. Plain, restrained, and consistent with the rest of the app beats decorated and novel. If a variant can be built from existing components and the existing palette alone, it should be. When in doubt, pick the simpler, plainer option.
6. Stay strictly within your archetype. If your archetype is `TimelineFirst`, the timeline is dominant — do not bury it in a sidebar. If your archetype is `Receipt`, the page must read like a receipt — do not turn it into cards.
7. Do not add comments that narrate the code. Brief comments are fine only to explain non-obvious archetype choices.
8. Use TypeScript and React function components.
9. Do not run lint, typecheck, build, format, or tests. The orchestrator will verify after the fan-out.

## Output
- The file you created (path).
- A one-sentence summary of how your variant expresses the archetype.
- Any reference component you wanted but could not find (so the orchestrator can decide whether to add it as shared scaffolding for a future run).

Begin now. You have everything you need.
```

## Notes for the orchestrator

- **Per-archetype customization.** The "where for this archetype" line under must-ship elements changes per variant. For `VerticalSidebar`, the timeline lives in the sidebar. For `HorizontalRibbon`, it lives in the ribbon. Be explicit so the subagent does not have to guess.
- **Reference component paths.** Pick 2–3 real existing components that demonstrate the design system primitives the subagent will need (cards, badges, layout shells, etc.). Without this, subagents tend to invent their own primitives.
- **Do not let subagents read the orchestrator's plan or sibling assignments.** They only need to know their own archetype and the rule "siblings own other ideas." Sharing the full plan invites them to "improve" the boundaries.
- **Failure handling.** If a subagent returns without a file, re-dispatch with the same template — do not let it negotiate scope. If it returns with a file that converges on a sibling archetype, re-dispatch with a sharper differentiator sentence.
