# Close Release Issues — Examples

## Example 1: Standard closeout after PR #798

**User:** "We just merged dev to main — mark Ready for Testing issues done."

**Agent steps:**
1. `gh pr list --base main --head development --state merged --limit 2` → window: after #793 (Jun 19) through #798 (Jun 23)
2. `list_issues` state=`Ready for Testing` and state=`Ready to Ship` (dedupe)
3. For AIR-6922 → PR #682 → merged to dev Jun 21 → in window → OK
4. For AIR-7127 → PR #762 → merged to dev Jun 16 → `outside_release_window` → skip
5. Present audit table with linked issue IDs and PRs — **stop; wait for user confirmation**
6. User confirms → `save_issue` approved issues → Done

**Example audit snippet:**

### → Done (3 issues)

| Issue | State | Title | PR | In window |
|-------|-------|-------|-----|-----------|
| [AIR-6922](https://linear.app/airgoods/issue/AIR-6922/pos-import-functionaility) | Ready for Testing | POS import | [#682](https://github.com/Airgoods-Inc/airgoods/pull/682) | ✅ |
| [AIR-6752](https://linear.app/airgoods/issue/AIR-6752/sync-onboarding-stages-to-hubspot) | Ready to Ship | HubSpot onboarding sync | [#661](https://github.com/Airgoods-Inc/airgoods/pull/661) | ✅ |
| [AIR-6278](https://linear.app/airgoods/issue/AIR-6278/optimize-image-loading-by-using-small-format) | Ready for Testing | Sample box image loading | [#262](https://github.com/Airgoods-Inc/airgoods/pull/262) | ✅ |

## Example 2: Release window vs backlog

**Release window (default):** PR #793 merged Jun 19, PR #798 merged Jun 23 → only dev merges **after Jun 19 and on/before Jun 23** qualify. Result: 3 issues (682, 661, 262).

**Backlog cleanup:** user says "close everything in ready to test" → also closes AIR-7127 (#762, Jun 16), AIR-709 (#709, Jun 16), etc.

## Example 3: Sub-issues

**Parent:** AIR-6564 (epic)<br>
**Children:** AIR-7104, AIR-7105

Close AIR-7104 and AIR-7105 when their PRs pass checks. Ask before closing AIR-6564 epic unless all children are Done.

## Example 4: Skip — wrong signal

| Issue | Why skip |
|-------|----------|
| — | No Linear issue; PR #796 has no ticket |
| [AIR-2908](https://linear.app/airgoods/issue/AIR-2908/preorder-functionality) | Already Done |
| [AIR-6707](https://linear.app/airgoods/issue/AIR-6707/215-refactor-supplierintegrationservice-extract) | `wrong_base_branch` — stack not on development |
