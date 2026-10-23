# Review Site template

## Minimal presentation

Use a high-contrast, Notion-like style: a white page, warm off-white sidebar, dark charcoal headings, muted gray text and links, quiet borderless toolbar controls, thin gray image borders, and generous whitespace. Use a neutral gray active navigation row, without purple accents or an outlined selection. The primary content is a heading, one short subheading explaining the change, and paired images. Keep provenance and detailed coverage outside the main comparison, in source data. Show actual missing-capture or verification gaps as one plain sentence, without a banner. Do not display generic fixture warnings, capture-kind subtitles, a Screens heading, a sidebar divider, a repeated issue link above the title, or Review notes. Keep fixture provenance in the validation report; component previews still need a concise label.

Use the bundled buildless template in `assets/site/` as a starting point. Copy its three files into the Site's static directory and add `review.json` plus durable screenshot assets. Do not publish template placeholders. Adapt an existing review rather than replacing its history or design wholesale.

- A narrow sidebar groups linked Linear subissues in their agreed order. Beneath each issue, list changed screens/states in agreed order, with a small outline monitor icon for desktop and a phone icon for mobile. Give icons accessible variant names, without visible desktop/mobile text. Do not sort by issue ID, title, or completion status. When no Linear subissue exists, use the actual feature or PR as a group and link its source; never invent an issue.
- The content shows one comparison at a time. A screen count, previous/next buttons, and hash links address each comparison. Count comparison entries in the selected round; desktop/mobile entries count separately. Collapse the sidebar above the content on small displays.
- Label paired images Before and After. Use two columns when readable, stacked on narrow screens. Keep the entire image visible and preserve its aspect ratio. Click either image to open a keyboard-dismissible enlargement with the same overlays and checkbox state.
- Highlight changes starts checked. Multiple translucent rectangles mark meaningful changes. Before uses red/pink borders and fills; After uses green. Never bake marks into the original image.
- For changed copy, show the full readable sentence beneath the images. Unchanged words stay plain; removed words use red with strikethrough, added words use green. Supply ordered `equal`, `remove`, and `add` segments with their original whitespace; do not show escaped HTML or raw patch syntax.
- Add video with native controls only when motion explains the interaction. Keep both static screenshots. Provide a brief gap note when evidence is incomplete.

## Review data and history

`review.json` contains `title`, `summary`, ordered `issues` with `id`, `title`, `url`, and ordered `rounds`. Each round has a stable `id`, `label`, `summary`, and ordered `comparisons`. Each comparison has `id`, `issueId`, `title`, `variant`, `explanation`, optional `gap`, `before`, `after`, optional `copyDiff`, optional `video`, and `feedback`. See [capture metadata](capture-metadata.md) for each image's fields.

IDs are permanent and unique within the Site. The template uses `#round-id/comparison-id`; preserve old routes. Keep rounds oldest first in data; the template selects the newest by default and offers earlier rounds in a compact selector at the top right beside the previous/next controls. On narrow displays, keep those controls right-aligned above the title. Within a round, issue order follows `issues`, and screen order follows `comparisons`. A later round includes only unresolved or reopened items and retains matched baseline/current pairs. Reuse the verified baseline asset when still applicable; explain any baseline change.

Store feedback as records with `source`, `text`, `comparisonId`, and `disposition` such as `unresolved`, `approved`, `omitted`, or `reopened`. Record explicit acceptance with its source. Store review identity, issue/PR links, coverage gaps, and feedback in durable source or the existing Site's supported storage. A local-only comment box is not durable feedback. Keep saved feedback in the review data rather than the comparison UI; collect new feedback through the user's existing chat/issue channels unless the Site already supports durable submissions.

Append rounds and assets, preserve existing feedback and media, and check historical links before publishing. If migrating an accessible legacy review, retain its source URL and earlier evidence; report inaccessible history. Do not create a fresh Site each round. Preserve the existing Site's audience through the current Sites skill. Use packaged local assets or supported durable storage, never local filesystem URLs or expiring capture links.

## Validation

Run `node <skill-directory>/scripts/validate-review.mjs <static-directory>` before publication. It checks local PNG/JPEG assets, hashes, capture dimensions, matching pair conditions, baseline/current provenance distinctions, rectangle bounds, IDs, and copy segments. It cannot prove a claimed capture came from the recorded build; verify Git and running-process provenance during capture.

Exercise a small example with a text replacement, an added or moved region, and desktop/mobile captures. Open it in a real browser. Verify sidebar order and issue links, counts, previous/next boundaries, hash reload/back navigation, round history, red/green word diffs, default highlights, toggle behavior, both image enlargements, Escape/focus return, image aspect ratios, and rectangle alignment at inline and enlarged sizes. Check every asset loads and the page works at a narrow width. Test missing evidence as a visible gap, not a successful comparison. Record actual results and limits. Example or component captures are supplemental, never authenticated application evidence.
