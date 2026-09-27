# Subissue template

Prefix the Linear title with its stage, such as `01`, `02a`, or `02b`, following [ordering and dependencies](ordering-and-dependencies.md). Use these description headings and this order. Each `+++` pair is one Linear collapsible block. `Rules and edge cases` lives within Scope. Do not add References and inspo or Open questions here; those live on the parent.

```markdown
+++ ## What are we building?

One or two sentences describing the outcome this subissue delivers.

+++

+++ ## How should it work?

1. The user takes the first action in this part of the normal flow.
2. They see the resulting state.

For internal work with no direct user action, number the consumer input and observable result. Do not invent UI steps.

+++

+++ ## Scope

- State the part of the feature this subissue covers.

### Rules and edge cases

- State conditions and exceptions specific to this subissue.

+++

+++ ## Acceptance criteria

- [ ] State a result a user or reviewer can observe.
- [ ] Cover the consequential edge or failure case.
- [ ] Confirm affected existing behavior still works, when applicable.

+++

+++ ## Tech spec

Use the format in `references/tech-spec-template.md`. Include this block only when a developer needs a technical handoff or a shared contract.

+++
```

Acceptance criteria describe behavior and outcomes, not file edits or implementation tasks. Keep checked states from the existing Linear issue on updates. Omit Tech spec when behavior and acceptance criteria are enough for the implementer.
