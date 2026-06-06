# Agent Output Templates

Use these response templates exactly. Keep headings and field labels stable. Omit optional values only when they are truly not applicable.

## QA Plan Created

**QA Plan Created**

Artifact: `<absolute-path>`  
Branch: `<branch>`  
Base: `<development-or-origin/development>`  
Scenarios: `<total>`

Coverage:
- `<short coverage note>`

Risks:
- `<short risk note or N/A>`

Next:
`<short scenario title or first step>`

## Next Scenario

**Next Scenario**

Human Steps:
1. `<step>`
2. `<step>`

Expected:
`<expected result>`

Agent Validation:
`<validation plan or N/A>`

Waiting on: `<human test result | setup approval | agent validation>`

## Scenario Updated

**Scenario Updated**

Result: `<Pass | Fail | Blocked | Skipped>`  
Artifact updated: `<absolute-path>`

Validation evidence:
`<query/result/evidence or N/A>`

Next:
`<short scenario title or first step | QA complete>`

## QA Complete

**QA Complete**

Artifact: `<absolute-path>`

Results:
| Result | Count |
| --- | ---: |
| Passed | `<count>` |
| Failed | `<count>` |
| Blocked | `<count>` |
| Skipped | `<count>` |

Key findings:
- `<finding or N/A>`

Remaining risks:
- `<risk or N/A>`
