# Linear Body Format

Collapsible sections: each is flat level-1 — open `+++ ## Title`, close with `+++` alone.
Never omit the closing `+++`.

Compress specs into skim-friendly Linear copy. Never sync Implementation Notes, file paths,
migrations, or agent handoff detail.

| Specs section | Linear |
| ------------- | ------ |
| What to Build | 1–2 sentences |
| Acceptance Criteria | Checkboxes; trim long lists |
| Approach | ≤3 bullets; surfaces/constraints only |
| HITL Requirement | Exact decision, timing, evidence (HITL only) |
| Implementation Notes | Specs only — never Linear |

## Implementation issue shape

```markdown
+++ ## What to Build

Short summary of what this ships and why it matters.

+++

+++ ## Acceptance Criteria

- [ ] Observable outcome

+++

+++ ## Approach

- Main surfaces
- Key constraint if non-obvious

+++

+++ ## Human Input

Timing + exact decision. HITL only.

+++

+++ ## Dependencies

Blockers / related Linear IDs when needed.

+++
```

Omit **Human Input** for AFK. Omit **Dependencies** when empty.

## Parent PRD issue

Compress with PRD sections (`Intent`, `Target Behavior`, `Scope`, `Key Decisions`) — not the
implementation template.

## Checkbox rules

- New issues: unchecked `- [ ]`
- Updates: preserve checked state from specs when present
- Plain bullets → convert to `- [ ]`
- Do not mark `[x]` merely because sync created the issue
