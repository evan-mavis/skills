---
name: ui-review
description: Review every UI surface a branch changes as one linked HTML round per cycle, from Before and After screenshots computed on the base and head branches, then turn the pasted decisions into a fix list. Use for ui-review, a visual review of a PR or feature branch, design sign-off, or "show me what changed".
---

# UI review

A review is a directory: matched pairs of base and head screenshots, a `review.json` of what changed, and one round folder per cycle. A round folder holds `round-N.html` and an `images/` folder beside it. The reviewer marks each comparison and pastes the decisions back. The skill turns that paste into a fix list.

The review does not replace the repository's verifier. Its captures are review evidence, not proof the change works.

## Inventory every surface

The review exists so the reviewer can trust everything the PR ships. Inventory every user-facing surface the PR touches before you capture anything.

1. Resolve the base (the PR merge-base, or the agreed starting revision) and the reviewed head. Record both full SHAs as `coverage.base` and `coverage.head` in `review.json`.
2. Record the changed UI files:

   ```bash
   node <skill>/scripts/coverage.mjs <review-directory> <repository> --write
   ```

   The script lists the files that `git diff base...head` changed and that match the UI pattern, counts them by app, and stores them in `coverage.changedFiles`. Tests and stories are excluded. Set `coverage.uiPattern` when the project context names one.
3. Add one `coverage.items` entry for each distinct user-visible state the change reaches, in every app the repository has. The project context names the apps. Surfaces are routes, screens, modals, drawers and side carts, emails, and component variants. States include empty, loading, error, each feature flag on and off, and each signed-in role, when each looks different. Variants that render the same, such as ones that differ only in backend data or API behavior, share one item. An item lists the changed files that reach it. A changed shared component gets an item on each surface where its change is visible.
4. Capture web surfaces at the verify skill's desktop and mobile widths, or 1440 and 390 CSS pixels when it names none. When both widths look the same, keep one item and set `sameOnOtherPlatform` to a short reason instead of a second item. Capture native apps with the method in the repository's verify skill or project context.
5. Put a changed UI file that changes nothing a user can see in `coverage.notUserVisible` with the reason.
6. Rerun the script without `--write`. It fails while `coverage.changedFiles` is stale or any changed UI file is in no item and not marked not user-visible.

A surface you cannot reach stays in the inventory with an `uncovered` reason. Never drop one silently. Name every uncovered item, native ones included, in the message that hands over the round. Only the reviewer's explicit word waives an item. Record it as `waiver` with who gave it, when, and their exact words, and never waive an item yourself. [Review data](references/review-data.md) gives the fields.

## Discover the changes

Do not take the list of changes from the diff. Compute them.

1. Read the repository's own verify skill for the route map, accounts, fixtures, and how to build and start each revision. Both revisions run from that skill's environment. If the repository has no verify skill, stop and report it.
2. Build and start the base and the head as two separate revisions, such as two worktrees. Copy the same development data to both. Never point one revision at another's database.
3. Capture every inventory item on both revisions, once each. Capture another route or state only when it shows a user-visible change no item covers, and add an item for it. Match role, route, action sequence, data, viewport, device scale, and scroll between the two sides. Name each file `<route-slug>--<state>--<viewport>.png` and write it to `captures/base/` and `captures/head/`.
4. Capture through the browser tools and keep the original bytes. Read [capture and highlight guidance](references/capture-metadata.md) for the evidence this skill stores. Image-only reviews stop there. A round holds still pictures, so when an interaction needs video, that proof belongs to the repository's verifier, not to the round.
5. Compute the differences:

   ```bash
   node <skill>/scripts/diff-captures.mjs captures/base captures/head
   ```

   The script decodes both sides as PNG or JPEG, compares every pixel, and ignores channel differences of 32 or less (`--threshold`). It drops changed cells whose content only moved: when both sides match the other image at a shift that the changed content agrees on, such as everything below an inserted banner. It merges the remaining changed cells into regions in original pixels and reports changed, unchanged, added, and removed captures. It also groups regions whose before and after crops are identical under one cluster, which is the same fix appearing in several places.

   Once `review.json` lists the comparisons, write their highlights:

   ```bash
   node <skill>/scripts/diff-captures.mjs --review <review-directory>
   ```

   It diffs every live pair that has no regions yet and writes the boxes to both sides. It drops regions under 40 changed pixels, merges the rest down to at most 8 boxes, drops any box over 90% of the screen, and labels each `Changed area N` as a placeholder. `--replace` redoes pairs that already have regions. It lists the pairs that show no visible change.

   Curate the regions by hand before you build. Keep a region only around a change a user would see as different. Delete regions on shifted or unchanged content and on timestamps, avatars, and other dynamic noise. Label each kept region with what changed, such as `Reminder beside the total`. `Changed area N` is never a final label: every build lists the generic labels left, and the final build fails on them.
6. Drop unchanged captures that no inventory item points at. An item whose capture did not change keeps its comparison, with an `unchanged` note saying why nothing visible changed, so the reviewer can confirm it. The validator rejects a live pair with no regions and no `unchanged` note. Match each changed region against the route map and the diff to name the visible change in one sentence. Tier each kept comparison:
   - **judgment**: layout, hierarchy, wording, density, or a new affordance, where reasonable people disagree.
   - **mechanical**: spacing, alignment, a missing state, a copy typo, an unchanged component now in a new place.

   Record the tier in `review.json`. The round does not show it; it drives ordering and your own triage.

## Build the round

Write `review.json` following [review data](references/review-data.md). Point each inventory item at its comparison with `comparison`. Then check coverage, validate, and build:

```bash
node <skill>/scripts/coverage.mjs <review-directory> <repository>
node <skill>/scripts/validate-review.mjs <review-directory>
node <skill>/scripts/build-round.mjs <review-directory> round-1 <review-directory>/rounds/round-1/round-1.html
```

The build writes a linked round: the HTML, and each comparison's Before and After image in `images/<round-id>/<comparison-id>-before.jpg` and `-after.jpg` beside it. Each image's `src` is that relative path. Each PNG becomes a JPEG copy at quality 62, and captures at device scale 2 or higher are scaled to 75%. A 1x PNG that is already smaller than its JPEG stays PNG. The PNGs in `captures/`, their hashes, and the diff stay at full size. One round holds every comparison of the cycle, with no size budget. The build prints how many comparisons carry highlights, out of the total. Treat a zero as a missed `--review` run.

Add `--inline` only where a single file is required, such as the optional Drive copy in [publishing](references/publishing.md). It embeds every image as a data URL instead, and fails above 3.5 MB, the largest round known to open in the Capy Drive viewer.

A crew thread only captures. The coordinating agent collects every capture and `review.json` entry and builds the single round.

Deliver a round by copying the whole round folder to the reviewer's machine with `tools.transfer.files`. For Evan, that is his MacBook Pro at `~/Desktop/airgoods-review/<round-id>/`. The reviewer opens the HTML there from `file://`. Give the reviewer its path. The page autosaves each Looks good mark and comment, and which sidebar sections are open, in the browser's local storage, keyed by review title and round id, and restores them on reload. It ignores stored state that does not parse or names comparisons or sections the round no longer shows.

To carry decisions into a rebuilt round, save the reviewer's copied decisions text for that round to a file and add `--seed <decisions.txt>` to the build. The build fails when the text belongs to another review or round, or names a comparison the round does not show. The page starts from the seed only when the browser holds no saved state for that round.

`assets/round.html` is the default template. Its colours are CSS custom properties at the top of the file, so a project can re-theme it. The round shows:

- A sidebar titled `PR #<pr>: <feature>` when `review.json` sets them, with a coverage line (inventory items captured, waived, and uncovered), one row per comparison: a device icon, the truncated title, a review mark, and a tooltip with the full title and device on hover. The mark is an empty box until the reviewer acts, a purple ✓ for Looks good, and a black ! for a comment, which wins over Looks good. A reviewed row's title dims to 50% except on the current row. Marks update as the reviewer works and reflect autosaved or seeded state on load. A collapsed **Not captured · N** section comes last and lists each uncaptured item with its reason on hover. Drag its right edge to resize it from 180 to 560px; double-click resets it to 268px. The page remembers the width when the viewer allows storage. Below 600px the sidebar stacks above the comparison.
- A **Looks good** box at the top right of each comparison. Checking it, or pressing **A** outside a text field, approves the comparison and moves to the next one after 140 ms. Unchecking does not move. **←** and **→** step between comparisons.
- A **Comments to address** box.
- Clicking a screenshot opens it full screen. **←** and **→** switch between Before and After, and Esc or any click closes it.
- A footer with **Highlight changes**, **Previous**, **Next**, and **Copy all decisions**. Copying writes the decisions text to the clipboard and adds no UI. The button reads **Copied** for 1.6 s, or **Copy failed** when the browser blocks both the clipboard API and the `execCommand` fallback.

Open the built file from `file://` in a browser before handing it over. Check that it renders, that both images load and open in the lightbox, that the overlay toggle works, that **Copy all decisions** changes its label to **Copied**, and that marks and open sidebar sections survive a reload.

## Later rounds

Round 2 and later show only fixes and new states since the round the reviewer answered. Recapture only the items a fix touched and the states that are new.

- Set `revises` on each revised comparison to an earlier comparison id from an earlier round.
- Copy each earlier comment into the new round's `feedback` with `disposition: "fixed"` or `disposition: "unresolved"`, which the round shows as open. The round lists them under **Earlier comments** and links each one to the comparison that answered it.
- Do not repeat a comparison that was approved and has not changed. `archived: true` keeps a dropped comparison and its text in the data without returning it to the queue.
- Keep every earlier round in `review.json`. Rounds are append-only history.

Between rounds, apply UI-only fixes yourself. A UI-only fix changes presentation alone: styles, layout, copy, markup, or assets, with no change to data, APIs, state logic, or schema. Commit it to the PR branch, run the repository's local checks for the files you touched, and push. Coordinate writes with whoever owns the branch so two writers never push at once. Re-capture the affected items on the new head, build the next round, and report the new head to whoever coordinates the work. Send every other fix to the code's owner.

Build each round with its round id. A round is not final while any inventory item is uncovered without a recorded waiver. When every comparison is approved and the gate passes, build the final doc:

```bash
node <skill>/scripts/build-round.mjs <review-directory> --final <review-directory>/rounds/final/final.html
```

The final build fails and names each open item until it is captured or waived, and each highlight region whose label is still generic.

## Read the decisions

The reviewer pastes the copied block into the thread. Turn it into a fix list:

```bash
node <skill>/scripts/decisions.mjs <review-directory> decisions.txt --markdown
```

It fails, with the reason, when the paste names another review or round, carries an unknown comparison, repeats a comparison, has an unknown decision, or is cut off. Ask for the whole block again rather than repairing it by hand.

The rules the parser applies:

- A checked box is approval of that comparison in that round, and nothing else.
- A comment with no checkbox is a request. Each non-empty line is one request. A line that ends in `?` is a question, not a request, and stays open until someone answers it.
- An item with no box and no comment is neither approved nor rejected. The fix list reports it under **Approved without comment**: after the reviewer has seen the round, silence is acceptance unless the reviewer says otherwise. Never treat silence as approval of a round they have not seen.
- A comparison missing from the paste is not approved.

Apply the UI-only requests as **Later rounds** describes, and deliver the rest to whoever owns the code. The fix list ends with the coverage count and every uncovered item. Keep the disposition of each request in `review.json` with its source, as [review data](references/review-data.md) describes, so the next round can mark it fixed or open. Write approved decisions into the design-decisions section of the Linear spec through [to-linear-spec](../to-linear-spec/SKILL.md).

## Attach the final design doc to the PR

Rounds with real dev data (copies of production) stay local on the reviewer's machine. Never commit them or publish them publicly, for example with `tools.pr.uploadAsset`, unless Evan explicitly says so.

Evan explicitly accepted public final review images for the PR. Build the final round and publish its images with `tools.pr.uploadAsset`. Embed exactly the Markdown the tool prescribes in a **Design** section with the approved judgments, variant, and reviewed revisions. Never include secrets or credentials.

Keep this review image-only. QA uses `capture` for final video evidence after design and independent engineering review. A Drive link to the complete HTML remains optional, not required. Read [publishing](references/publishing.md) for the recorded decision, attachment steps, and Drive access limits.

## Handoff

- **In:** the base and head revisions, the repository's verify skill, the project context's app list and native capture method, and the Linear spec or issue the review belongs to.
- **Out:** the review directory with its coverage inventory, one round folder per cycle, each new head from UI-only fixes, the fix list for each pasted decision round, and the final design doc linked from the PR body.
