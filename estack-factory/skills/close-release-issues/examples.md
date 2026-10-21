# Close release issues examples

## Selected release #1720 regression

These are regression expectations for the audit of Airgoods release PR #1720. Fetch canonical Linear URLs, current states, pinned commits, and implementation evidence when running an actual audit. The offline helper fixtures model the Git and PR shapes. They do not replace the scope review.

| Issue or work | Expected audit result | Required distinction |
| --- | --- | --- |
| AIR-7818 | Include as shipped through the demos stack. | Trace feature-branch PRs through their parents to the released implementation. |
| AIR-7904 and AIR-8199 | Include as shipped through consolidated PR #1224. | Their original PRs closed without merging. Verify the absorbed implementation rather than rejecting their PR state. |
| AIR-3045 and its shipped video sub-issues | Include in the audit and propose only scopes proven shipped. | In Progress or In Review states and missing child PR attachments do not exclude them. Read the parent and each child's requested behavior. |
| AIR-7955, AIR-7956, AIR-7957, AIR-7958, AIR-7959, AIR-7960, AIR-7961, AIR-7962 | Leave open as `not_in_released_snapshot`. | Parent PR #1139 remained open, its commits were outside the released source history, and its implementation files were absent. Check all of this, including possible absorbed changes. |
| AIR-5554 | Include separately as previously shipped stale work through #1309. | Show the earlier production release and surviving behavior. Its old merge date is not a reason to discard it. |
| AIR-8948 | Leave open unless independent evidence proves its separate "American" cuisine operation shipped. | PR #1716 changed icon-generation prompts. An issue reference or related prompt change does not establish completion of that operation. |

Keep #1720 selected even if a newer release exists. Pin its production commit, accepted source snapshot, and previous production release before discovery.

## Audit format

Use observed URLs and SHAs in place of placeholders. This template is not a live audit.

```markdown
# Release closeout audit

Selected release [#1720](<observed-release-url>).
Production commit `<release_commit>` from source `<source_snapshot>`.
Previous production release [<release>](<observed-previous-release-url>) at `<previous_release>`.
Deployment evidence <observed-deployment-reference>.
Discovery <included PRs, issue searches, child queries, and any pagination gaps>.

## Shipped in this release, proposed for Done

| Issue | Current state | Title | Released scope and evidence | Action |
| --- | --- | --- | --- | --- |
| [AIR-7818](<canonical-linear-url>) | <current state> | <issue title> | <child PR links>, <parent PR link>, and <pinned implementation> cover <requested behavior>. | Propose Done. |
| [AIR-7904](<canonical-linear-url>) | <current state> | <issue title> | <original closed PR link> was absorbed into <#1224 link>. <Pinned implementation> covers <requested behavior>. | Propose Done. |
| [AIR-3045](<canonical-linear-url>) | In Progress | <issue title> | <released parent stack and video implementation>. Audit each child separately. | Propose Done only if the full parent scope shipped. |

## Previously shipped stale work, proposed for Done

| Issue | Current state | Title | Earlier release evidence | Action |
| --- | --- | --- | --- | --- |
| [AIR-5554](<canonical-linear-url>) | <current state> | <issue title> | <#1309 link>, <earlier production release>, and <behavior in selected snapshot>. | Propose Done as previously shipped. |

## Left open or unchanged

| Issue | Current state | Title | Evidence and reason | Action |
| --- | --- | --- | --- | --- |
| [AIR-7955](<canonical-linear-url>) | <current state> | <issue title> | <#1139 link> is open. Its commits and implementation are absent from the released source and production snapshot. | Leave open, `not_in_released_snapshot`. |
| [AIR-8948](<canonical-linear-url>) | <current state> | American cuisine operation | <#1716 link> changes prompts. No evidence completes the separate operation. | Leave open, `related_reference_only`. |
| [<issue ID>](<canonical-linear-url>) | Duplicate | <issue title> | Current state needs no change. | Preserve, `preserve_terminal_state`. |

Proposed closures <exact linked issue list>, grouped by this release and previously shipped.
Counts <count per table>. Awaiting your confirmation of the final list.
```

Enumerate each shipped video sub-issue and each of AIR-7955 through AIR-7962 as its own row in an actual audit. Do not hide child decisions in a parent summary.

## Parent and follow-up decisions

A parent feature can qualify when its acceptance criteria shipped and an explicitly separate follow-up remains open. Show both rows and the scope boundary. If that follow-up is required by the parent's criteria, leave the parent open as `partially_shipped`.

A broad epic stays open while part of its scope is unshipped. Close shipped leaf issues only. Include the epic only with full scope evidence and explicit user approval.

## Confirmation

A request to "close release issues" starts the audit. It does not authorize status changes before review. Present the final proposed set, end the turn, and wait. After the user explicitly confirms, re-read states and update only the approved issues. Preserve Done, Duplicate, and Canceled unless the user explicitly asks to change them.
