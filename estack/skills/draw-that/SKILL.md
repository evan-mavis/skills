---
name: draw-that
description: "Explain code, architecture, data flows, and PR changes with concise briefings and source-grounded diagrams. Use for $draw-that, 'draw that', or a visual walkthrough of how a system works."
---

# Draw that

Show how the requested system works with diagrams and short briefings. Keep the explanation
at the user's requested depth. Reuse findings already established in the conversation.

## Ground the drawing

Read the relevant code, schema, and callers before drawing. Reuse verified findings from
[how](../how/SKILL.md) when available. Trace only the paths needed for this request.
Distinguish current behavior from a proposed design. Mark uncertain links as unverified.
Do not invent tables, methods, schedules, or measurements.

Use the real entry-point methods, service calls, and database table names on the path.
Keep the key identifiers in participant labels or arrows, even in a short diagram.
Do not replace known names with generic labels such as `Refresh service` or `Prepared data`.
Pair an identifier with a short purpose when the name alone is unclear. Keep exact
identifiers intact. Link to the relevant source after the diagram.

## Brief, then draw

Before each diagram, write one to three short sentences that explain what the reader will
see. Use the ASD-STE100 sentence guidance in [technical-writing](../technical-writing/SKILL.md).
Keep one idea per sentence, use active voice and familiar words, and aim for 20 words or
fewer. Treat code identifiers as technical names. Apply [unslop](../unslop/SKILL.md).

Prefer a sequence diagram for calls, timing, transactions, and background work. Use a
flowchart for data lineage or system structure. Keep a sequence diagram when call order
matters; an overview is a different view, not an automatic replacement.

Use fenced Mermaid for static diagrams. Use an interactive visualization only when changing
state or inputs would help explain the behavior and the host supports it. Follow the
available visualization skill for that medium. Do not make a separate website for a
static explanation.

## Visual conventions

| Role | Icon |
| --- | --- |
| Database or persisted table | 📦 |
| PostHog | 🦔 |
| Background job or worker | 🔜 |
| API or service call | 🔌 |
| Frontend screen or client | 🖥️ |

Use these icons consistently when those roles occur. Label other providers by their real
names. Use cylinders for database nodes and supported database participants in sequences.
Keep API, worker, database, and frontend participants distinct. Do not box sequence lanes.
In flowcharts, group layers only when the grouping improves readability.
Prefer boundary participants with named calls on arrows over a separate lane for every
internal helper. Follow real caller and return paths; do not invent shortcut connections.

Keep labels concise. Use a short action on each arrow. Add the real method or table when
it matters. Distinguish reads, writes, synchronous calls, and queued work through labels
or standard sequence arrows. Do not rely on color alone or add an icon legend by default.

Show execution timing, transaction boundaries, freshness, failures, retries, or before/after
behavior when those details answer the question. Keep optional details out of small flows.
Split a dense system by responsibility, such as one overview and one diagram per screen.
Do not repeat the same flow across several diagrams without adding useful information.

## Check and deliver

Check identifiers, direction, call order, and source versus derived data against the code.
Parse Mermaid when a compatible validator is available. Check the database participant type
and visible label as well as syntax. Do not claim a visual render from a parser-only check.
Use supported syntax if the renderer lacks a requested shape.

Keep accepted wording and diagrams when revising an explanation. Make the requested change
without adding competing versions. Save to an existing README or document when asked,
remove superseded diagrams, and keep operational instructions intact. Explanation alone
does not require repository edits.

See [the reporting example](references/reporting-example.md) for the expected level of detail
and the distinction between an overview and a sequence diagram. Read it when a worked
example will help, not as a mandatory template for every request.
