# Archetype Library

Pull from this list when assigning archetypes in Step 3 of the workflow. Rename and adapt to the target domain (e.g., `Receipt` → `RequestReceipt`). Each archetype below comes with its core differentiator so you can defend why two archetypes in the same bake-off are actually different.

When you select N archetypes, ensure each pair differs on at least one axis: information grouping, spatial layout, disclosure pattern, or visual metaphor.

## Layout-driven

1. **CardStack** — three or more stacked, equally-weighted cards down a single column. Primary content reads top-to-bottom.
2. **KeyValueTable** — dense two-column key/value grid. Optimized for scanning facts quickly.
3. **TimelineFirst** — the must-ship timeline is the dominant element; everything else flows around or beneath it.
4. **VerticalSidebar** — left or right sidebar holds secondary/meta content; main column holds primary detail.
5. **HorizontalRibbon** — top ribbon (below header) holds the must-ship element horizontally; body holds detail.
6. **SplitPane** — two equal columns side-by-side, primary in one, secondary in the other.
7. **MasonryGrid** — variable-height tiles in a grid, breaks the visual monotony.
8. **CenteredColumn** — narrow centered column (max-width prose width), all content inline, very document-like.
9. **EdgeToEdge** — full-bleed sections stacked vertically; section backgrounds alternate for separation.

## Hierarchy-driven

10. **HeroSummary** — large hero block at top showing the 3–5 most important facts; details collapse below.
11. **InvertedPyramid** — most important fact huge at top, each row below is smaller and denser.
12. **PrimaryWithDrawer** — primary content fills the page; secondary content lives in a slide-over drawer/shelf.
13. **PrimaryWithModal** — primary content only; secondary content reachable via a "View details" modal.
14. **PrimaryWithPopover** — secondary facts surface via inline popovers/tooltips on the primary content.

## Disclosure-driven

15. **TabbedPanel** — primary content + tabs that switch between secondary sections (Description, Images, History, etc.).
16. **AccordionStack** — every section collapsible, only one open at a time, primary always open by default.
17. **SteppedReveal** — sections appear progressively as the user scrolls or expands.
18. **DetailDrawer** — main page is a compact summary, clicking any row opens a detail drawer with deep content.
19. **ContextualPopovers** — every key fact has an inline "i" / details popover. Page itself stays sparse.

## Metaphor-driven

20. **Receipt** — single column laid out like a printed receipt: monospaced facts, dashed dividers, totals at the bottom.
21. **StatusBanner** — a prominent status banner across the top dictates the entire page tone; details below.
22. **AnalyticsDashboard** — KPI tiles + chartlike timeline + supporting tables; treats the entity as a data subject.
23. **Conversational** — chat-bubble layout where each lifecycle event reads like a message; primary facts pinned.
24. **Inbox** — list-detail pattern: lifecycle events in a left list, selected event detail on the right.
25. **Invoice** — line-item table with totals; secondary content in a footer area.
26. **Ticket** — top half is "the ticket" (high-contrast summary card), bottom half is metadata and history.
27. **Passport** — heavy use of stamped/badged sections, each major fact a stamp; timeline as a stamp trail.
28. **Map** — when location matters, anchor the entire layout around a map; details in side panel.
29. **Calendar** — anchor the layout around dates/duration in a calendar view; details inline with date blocks.
30. **Newspaper** — multi-column print-style layout with headlines, decks, and pull-quotes for key facts.

## Interaction-driven

31. **Hover-to-Expand** — compact cards that expand on hover/focus to show secondary detail.
32. **Pinned-Primary** — primary detail card is sticky/pinned while everything else scrolls behind it.
33. **Floating-Toolbar** — primary actions live in a floating action bar; the page itself is purely informational.
34. **CommandPalette-Driven** — page is minimal; almost everything reachable via a keyboard command palette.

## Choosing strategy

For a typical 10–15 variant bake-off, spread picks across categories so you don't end up with five variations of "card stack". A solid spread looks like:

- 3 layout-driven (e.g., `VerticalSidebar`, `HorizontalRibbon`, `SplitPane`)
- 2 hierarchy-driven (e.g., `HeroSummary`, `PrimaryWithDrawer`)
- 2 disclosure-driven (e.g., `TabbedPanel`, `AccordionStack`)
- 4 metaphor-driven (e.g., `Receipt`, `StatusBanner`, `AnalyticsDashboard`, `Conversational`)
- 1 interaction-driven (e.g., `Pinned-Primary`)

Avoid picking two archetypes from the same row of the same category unless their differentiators are very strong.

## Banned pairings

These pairs converge too easily — pick at most one from each pair:

- `KeyValueTable` + `CenteredColumn` (both end up as dense single columns)
- `VerticalSidebar` + `Inbox` (both end up as left list + right detail)
- `HeroSummary` + `StatusBanner` (both put a giant element at top)
- `AccordionStack` + `SteppedReveal` (both are progressive disclosure stacks)
- `TabbedPanel` + `DetailDrawer` (both hide secondary content behind interaction)
