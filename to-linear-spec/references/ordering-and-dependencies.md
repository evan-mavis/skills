# Subissue order and Linear dependencies

Build a small dependency graph before publishing. Each subissue should be a vertical slice that stands as one reviewable, verifiable, mergeable PR. A shared foundation is allowed when it establishes a contract later slices need, but avoid isolated backend/frontend tickets that cannot be completed independently. Give each subissue a short, outcome-focused title prefixed by its logical stage. Use two-digit stage numbers starting at `01`:

- One issue in a stage: `01 Define the shared pricing result`.
- Independent issues in the same stage: `02a Show total price on cards` and `02b Show total price on product pages`.
- A later stage: `03 Sort by total price`.

The `a`, `b`, and later letters mean the issues can proceed in parallel **relative to one another**. They may still share a prerequisite from an earlier stage. Assign suffixes in a stable reading order, not by estimated duration or assignee. Do not invent parallelism when the issues edit the same contract or one consumes the other's output. Do not split a coherent outcome solely to create parallel lanes.

Create a native Linear `blocked by` relation for every real prerequisite. For example, if `02a` and `02b` consume the result defined by `01`, both are blocked by `01`; they do not block each other. If `03` needs only `02a`, link `03` to `02a`, not automatically to `02b`. A higher stage number alone does not imply a blocker. Use the fewest direct edges that express the actual dependency. Avoid cycles and redundant transitive edges.

Create all endpoint issues before writing relations. On first adoption for an existing unnumbered tree, add stage prefixes to its subissue titles without replacing the issue IDs. On later updates, inspect existing titles and relations, preserve correct links, add missing ones, and remove a stale blocker only after verifying that its prerequisite no longer applies. Preserve existing numbering when adding a small amount of work rather than renaming an entire active tree. If the user asks to replan the tree, renumber and reconcile relationships together.

Use Linear's issue relationship feature, not a `Dependencies` section or plain text in the issue description. Read the relationships back after writing and check that each dependent issue names the intended blocker. If the connector cannot create or read a relation, state exactly which dependency remains uncreated or unverified.
