# Publishing the final design doc

Keep UI review image-only. QA uses `capture` for video evidence after design and independent engineering review.

## Attach review images to the PR

Rounds with real dev data (copies of production) stay local on the reviewer's machine. Never commit them or publish them publicly, for example with `tools.pr.uploadAsset`, unless Evan explicitly says so.

1. Build the final doc with `node <skill>/scripts/build-round.mjs <review-directory> --final <review-directory>/rounds/final/final.html`.
2. Only when Evan explicitly says so, publish the final review images with `tools.pr.uploadAsset` and embed exactly the Markdown the tool prescribes in the PR body.
3. Add a **Design** section with one sentence per approved judgment call, the approved variant, and the reviewed base and head references. Keep the round folders and round history as the complete review artifact.

GitHub cannot render the HTML file inside a PR body. Do not upload video as part of this image-only review. QA publishes its final `capture` recording separately.

## Optional Drive copy

A Drive link is allowed, not required. The Drive viewer opens a single file, so build this copy with `--inline`: `node <skill>/scripts/build-round.mjs <review-directory> --final <review-directory>/rounds/final.html --inline`. Write that HTML to the project's Drive at `design-reviews/<owner/repo>/<feature>/final.html` and use `tools.drive.share`. Never make the link public. State the returned visibility. A private link is not accessible to the team until its owner changes the file's visibility on the Drive page. Confirm access before calling it a team attachment.

Share links follow the latest version, so retain the reviewed head reference in the PR. The inline HTML holds its images as data URLs and opens without a server or external assets. `--inline` fails above 3.5 MB. Over the limit, skip the Drive copy; the linked round folder remains the record.
