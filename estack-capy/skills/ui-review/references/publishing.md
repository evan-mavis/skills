# Publishing the final design doc

The final round answers "what did we approve". It has to land where the next reader looks, which is the PR, and it must not leak data. Three routes exist. This skill uses the second.

## Methods, and what each one really does

**A PR body holding the HTML file.** Does not work. GitHub renders Markdown, so an attached `.html` shows as a link to the raw file, which a reviewer's browser downloads instead of rendering, and the body cannot hold a page.

**`tools.pr.uploadAsset` on the round screenshots or the video.** Works mechanically: the tool returns a public, unauthenticated URL and the PR renders it inline. It is the wrong route for this doc. Application screenshots come from development data copied from production, so a public URL publishes a customer's account to anyone who finds it. Any image published this way must be one that is safe for a public reader, and the PR body must not include the page's own screenshots unless someone has reviewed them for that.

**A text section plus a Drive link.** Works, stays inside the organization, and survives later edits of the doc. This is the method the skill uses:

1. Build the final doc: `node <skill>/scripts/build-round.mjs <review-directory> --final <review-directory>/rounds/final.html`.
2. Write it into the project's Drive: `design-reviews/<owner/repo>/<feature>/final.html`.
3. `tools.drive.share` with the Drive location and that path returns a URL and a visibility.
4. Add a **Design** section to the PR body with that URL and a short text summary.
5. Set the file to organization visibility on the Drive page.

## Limits to state plainly

- **The link is private until step 5.** `tools.drive.share` returns `visibility: "private"`, which means only the reviewer opens it. Until they change it on the Drive page, the link in the PR is dead for everyone else. Say so in the reply; never report the doc as attached to a team without that confirmation.
- **Share links follow the latest version.** Rebuilding the doc updates the link, which is what a living design doc wants, and means an early reviewer's copy is not pinned.
- **The PR body is text.** Everything a reviewer learns from the PR body is the summary. Write one sentence per approved judgment call, and name the approved variant when a prototype chose between variants.
- **The HTML is the artifact.** It holds the images inline, so it opens with no server, no login, and no assets. Keep it under the file size the Drive accepts, or link the largest captures separately.
- **The Drive file is not a build output to keep forever.** It is the shared copy of a review; a new feature gets its own path.

## What to attach besides the doc

Anything the repository's verifier requires for its own evidence stays with that verifier. A public-safe capture may also go into the PR with `tools.pr.uploadAsset`, reviewed for customer data first. When in doubt, leave it out: the Drive link carries the evidence, and the PR carries the decision.
