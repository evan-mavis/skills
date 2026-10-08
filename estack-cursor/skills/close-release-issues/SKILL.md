---
name: "close-release-issues"
description: "After a dev-to-main release, audit Linear \"Ready for Testing\" and \"Ready to Ship\" issues and present a linked closeout list for user verification. Only mark issues Done after the user confirms the list. Use when closing out a release, closing release issues, triaging Ready for Testing, or finding Linear issues for a deploy."
---

# Close Release Issues

Deterministic release closeout for Linear issues. **Audit first, close only after user verification.**

> Move to **Done** issues that have a GitHub PR attached and the PR is merged into `development`. Scan **Ready for Testing** and **Ready to Ship**. **Never** update an issue to Done until the user has reviewed the audit list and explicitly confirmed.

## When to use

- After `development` is merged to `main` and render / vercel deployments have completed
- User asks to mark release issues done, close Ready for Testing, or find Linear issues for a deploy

## Linear states (both in scope)

| Linear state | Meaning |
|--------------|---------|
| **Ready for Testing** | On `development`; needs QA on dev/preview |
| **Ready to Ship** | QA passed; approved for prod; waiting for dev→main deploy |

## Release modes

**Release window (default):** only close issues whose qualifying PR merged into `development` **after the previous dev→main release** and **on or before the latest dev→main release**.

**Backlog cleanup (optional):** user explicitly wants *all* Ready for Testing + Ready to Ship items with merged-to-dev PRs — drop the date window; still require merged + `baseRefName === development`.

## Tools

- **Available Linear integration** — use the configured Linear plugin, connector, or MCP tools in this Cursor session
- `gh` — verify PR merge state and base branch

Read the current Linear integration's callable schemas or skill instructions before calling; do not assume a host-specific tool name. Prefer `gh` over GitHub MCP.

## Workflow



### 1. Compute the release window (required unless backlog cleanup mode)

Fetch the last two dev→main merges:

```bash
gh pr list --base main --head development --state merged --limit 2 \
  --json number,title,mergedAt,url,mergeCommit
```

Define:


| Boundary        | Source                                                          | Meaning                                                                                      |
| --------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `release_start` | `mergedAt` of the **second** PR (previous release)              | Cutoff — work merged to `development` before this already shipped in an earlier prod release |
| `release_end`   | `mergedAt` of the **first** PR (latest / just-deployed release) | Upper bound for this closeout                                                                |


**Eligible PR merge time:** `mergedAt` to `development` must satisfy `release_start < mergedAt <= release_end`.

If only one dev→main merge exists in history, use its `mergedAt` as `release_start` and `release_end = now`, or ask the user for a start date.

Show both boundaries in the audit header, e.g. “Release window: after [PR #793](…) (Jun 19) through [PR #798](…) (Jun 23).”

Optional cross-check:

```bash
git log <PREV_MERGE_SHA>..<LATEST_MERGE_SHA> --oneline --no-merges
```



### 2. List release-candidate issues (both QA states)

Query **both** states and merge into one deduped list (same issue id only once):

```text
Linear integration: list issues
  state: "Ready for Testing"
  team: "Engineering & Product"   # if needed
  limit: 250

Linear integration: list issues
  state: "Ready to Ship"
  team: "Engineering & Product"
  limit: 250
```

Paginate each query with the integration's pagination cursor until no next page remains.

Record each issue’s current **Linear state** (`Ready for Testing` vs `Ready to Ship`) — include it in the audit table **State** column. **Ready to Ship** issues are usually the highest-confidence close candidates after a prod deploy.

### 3. For each issue, collect GitHub PR attachments

```text
Linear integration: get issue
  id: AIR-XXXX
```

From `attachments`, keep only GitHub PR links (`github.com/.../pull/N`). Ignore Slack, Notion, Intercom, etc.

Extract PR number from URL: `.../pull/682` → `682`.

**No GitHub PR attachment → skip** (report as `no_pr_attachment`).

### 4. Verify PR is merged into development

Run the helper script (batch) or `gh` per PR:

```bash
bash "<resolved-close-release-issues-dir>/scripts/check-prs-merged-to-dev.sh" 682 661 262
```

Or manually:

```bash
gh pr view 682 --json number,title,state,baseRefName,mergedAt,url
```

**Mark candidate only if ALL of:**

- `state` == `MERGED`
- `baseRefName` == `development`
- `mergedAt` is inside the release window: `release_start < mergedAt <= release_end` (skip with `outside_release_window`)

If an issue has **multiple** GitHub PR attachments, prefer the attachment whose PR passes all checks; if several qualify, use the **most recently merged** one.

If merged to another branch (e.g. feature branch stack), **skip** (`wrong_base_branch`) even if the stack tip eventually merged to `development` later — the attached PR’s `baseRefName` and `mergedAt` are what count.

### 5. Check sub-issues

For each parent issue marked as a candidate:

```text
Linear integration: list issues
  parentId: AIR-XXXX
```

Apply the same PR-attachment + merged-to-dev rules to each sub-issue. Include open sub-issues in the close list when they pass; report blocked parents whose sub-issues fail checks.

Epic parents (e.g. AIR-6564, AIR-4481): only mark Done if team convention is to close the epic when all sub-issues ship — **default: close leaf issues first; ask before closing epics**.

### 6. Present audit list — stop and wait for user

**Always end the first turn with the audit only.** Do not update Linear in the same turn you produce the list.

Show the full candidate + skipped tables, then ask the user to verify (e.g. “Confirm and I’ll mark these Done” / “Remove any you want to keep open”).

Accept confirmation phrasing like: “mark them done”, “looks good”, “confirmed”, or an edited subset the user approves.

If the user removes items or asks questions, revise the list — still no `save_issue` until they confirm the final set.

**Linking rules for the audit table:**

- **Issue column:** markdown link on the identifier — `[AIR-6922](<linear-url>)`. Use the `url` field from `get_issue` / `list_issues` (do not guess the slug).
- **PR column:** markdown link — `[#682](https://github.com/Airgoods-Inc/airgoods/pull/682)` (from attachment URL or `gh pr view … --json url`).
- **Merged to dev:** use ✅ / ❌ (or yes/no) — keep scannable.

Use separate tables for **→ Done** candidates and **Skipped** issues (group skips by reason when helpful).

```markdown
## Release closeout audit

**Context:** Release window after [PR #793](https://github.com/…/pull/793) (Jun 19) through [PR #798](https://github.com/…/pull/798) (Jun 23). Scanned 27 Ready for Testing + 0 Ready to Ship (27 total).

### → Done (3 issues)

| Issue | State | Title | PR | Dev merge | In window |
|-------|-------|-------|-----|-----------|-----------|
| [AIR-6922](https://linear.app/airgoods/issue/AIR-6922/pos-import-functionaility) | Ready for Testing | POS import | [#682](https://github.com/Airgoods-Inc/airgoods/pull/682) | Jun 21 | ✅ |

### Skipped (1 issue)

| Issue | Title | Reason |
|-------|-------|--------|
| [AIR-7127](https://linear.app/airgoods/issue/AIR-7127/…) | Square inventory | `outside_release_window` — [#762](https://github.com/…/pull/762) merged Jun 16 (prior release) |
| [AIR-7020](https://linear.app/airgoods/issue/AIR-7020/…) | Year founded filter | `not_merged` — PR #688 closed |

**Will close:** [AIR-6922](…), [AIR-6752](…), [AIR-6278](…)
**Skipped:** 24 (14 `wrong_base_branch`, 2 `no_pr_attachment`, …)
```



### 7. Mark Done (only after user verified the list)

**Gate:** user explicitly confirmed the final close list in a follow-up message. Invoking the skill alone is not confirmation.

Then, and only then:

```text
Linear integration: update issue
  id: AIR-XXXX
  state: "Done"
```

Process sub-issues before parents when both qualify. Report what was closed in a short summary.

## Skip reasons (use in audit)


| Reason                   | Meaning                                                                  |
| ------------------------ | ------------------------------------------------------------------------ |
| `no_pr_attachment`       | No GitHub PR linked on the issue                                         |
| `not_merged`             | PR open or closed without merge                                          |
| `wrong_base_branch`      | PR merged to a branch other than `development`                           |
| `already_done`           | Issue already Done                                                       |
| `sub_issue_open`         | Parent held back because a sub-issue failed checks                       |
| `no_linear_id`           | PR merged but no corresponding issue in either QA state                  |
| `outside_release_window` | PR merged to `development` before `release_start` or after `release_end` |




## Backlog cleanup mode

When the user explicitly wants to clear **all** Ready for Testing + Ready to Ship items (not just this release), skip the date check in step 4 but still require merged + `development` base. Report which items were included via backlog mode vs release window.

## PR without Linear issue

If a merged-to-dev PR has an AIR id in the title but no Ready for Testing issue (or no attachment), report it — do not invent Done status.

## Output

**First turn:** audit table(s) with linked issue IDs and PRs + counts + “awaiting your confirmation”. Do not mark Done.

**After user confirms:** mark only the approved issues, then report what was closed vs skipped. If nothing qualifies, say why.

Do not run lint/typecheck/tests. Do not merge PRs or push git.

## Additional resources

- Example audit output: [examples.md](examples.md)
