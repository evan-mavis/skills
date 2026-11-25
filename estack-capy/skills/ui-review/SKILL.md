---
name: ui-review
description: Review a branch's visible UI change as one self-contained HTML round per round, from Before and After screenshots computed on the base and head branches, then turn the pasted decisions into a fix list. Use for ui-review, a visual review of a PR or feature branch, design sign-off, or "show me what changed".
---

# UI review

A review is a directory: matched pairs of base and head screenshots, a `review.json` of what changed, and one self-contained HTML file per round. The reviewer marks each comparison and pastes the decisions back. The skill turns that paste into a fix list.

The review does not replace the repository's verifier. Its captures are review evidence, not proof the change works.

## Discover the changes

Do not take the list of changes from the diff. Compute them.

1. Resolve the base (the PR merge-base, or the agreed starting revision) and the reviewed head. Record both SHAs.
2. Read the repository's own verify skill for the route map, accounts, fixtures, and how to build and start each revision. Both revisions run from that skill's environment. If the repository has no verify skill, stop and report it.
3. Build and start the base and the head as two separate revisions, such as two worktrees. Copy the same development data to both. Never point one revision at another's database.
4. Capture every route and state in the route map that either revision can reach. Match role, route, action sequence, data, viewport, device scale, and scroll between the two sides. Name each file `<route-slug>--<state>--<viewport>.png` and write it to `captures/base/` and `captures/head/`.
5. Capture through the browser tools and keep the original bytes. Read [capture and highlight guidance](references/capture-metadata.md) for the evidence this skill stores. Image-only reviews stop there. A round holds still pictures, so when an interaction needs video, that proof belongs to the repository's verifier, not to the round.
6. Compute the differences:

   ```bash
   node <skill>/scripts/diff-captures.mjs captures/base captures/head --cell 8 --threshold 24 --gap 2
   ```

   The script decodes both sides, compares every pixel, merges nearby changed cells into regions in original pixels, and reports changed, unchanged, added, and removed captures. It also groups regions whose before and after crops are identical under one cluster, which is the same fix appearing in several places.
7. Drop unchanged captures. Match each changed region against the route map and the diff to name the visible change in one sentence. Tier each kept comparison:
   - **judgment**: layout, hierarchy, wording, density, or a new affordance, where reasonable people disagree.
   - **mechanical**: spacing, alignment, a missing state, a copy typo, an unchanged component now in a new place.

   State the tier. It tells the reviewer where their opinion is the whole point.

## Build the round

Write `review.json` following [review data](references/review-data.md), then validate and build:

```bash
node <skill>/scripts/validate-review.mjs <review-directory>
node <skill>/scripts/build-round.mjs <review-directory> round-1 <review-directory>/rounds/round-1.html
```

The build inlines every screenshot as a data URL and every style, so the file works offline and alone. Give the reviewer the round's path and tell them to copy their decisions before closing it, because the page keeps no state across reloads.

Each comparison offers a **Looks good to me** checkbox and a **Comments to address** box. **Copy all decisions** writes a text block, and falls back to a selected text box when the viewer blocks the clipboard.

Open the built file in a browser before handing it over. Check that it renders, that both images load, that the overlay toggle works, and that the export panel appears with its text when the clipboard is blocked.

## Later rounds

Round 2 and later show only what changed since the round the reviewer answered.

- Set `revises` on each revised comparison to an earlier comparison id from an earlier round.
- Copy each earlier comment into the new round's `feedback` with `disposition: "fixed"` or `disposition: "unresolved"`, which the round shows as open. The round lists them under **Earlier comments** and links each one to the comparison that answered it.
- Do not repeat a comparison that was approved and has not changed. `archived: true` keeps a dropped comparison and its text in the data without returning it to the queue.
- Keep every earlier round in `review.json`. Rounds are append-only history.

Build each round with its round id. When every comparison is approved, build the final doc:

```bash
node <skill>/scripts/build-round.mjs <review-directory> --final <review-directory>/rounds/final.html
```

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

Deliver the fix list to whoever owns the code. Keep the disposition of each request in `review.json` with its source, as [review data](references/review-data.md) describes, so the next round can mark it fixed or open. Write approved decisions into the design-decisions section of the Linear spec through [to-linear-spec](../to-linear-spec/SKILL.md).

## Attach the final design doc to the PR

Build the final round, inspect its images for secrets and credentials, and publish the final review images with `tools.pr.uploadAsset`. Embed exactly the Markdown the tool prescribes in a **Design** section with the approved judgments, variant, and reviewed revisions. Evan accepted the public URLs and copied-production dev data for PR review images and QA recordings. Never include secrets or credentials.

Keep this review image-only. QA uses `capture` for final video evidence after design and independent engineering review. A Drive link to the complete HTML remains optional, not required. Read [publishing](references/publishing.md) for the recorded decision, attachment steps, and Drive access limits.

## Handoff

- **In:** the base and head revisions, the repository's verify skill, and the Linear spec or issue the review belongs to.
- **Out:** the review directory, one HTML file per round, the fix list for each pasted decision round, and the final design doc linked from the PR body.
