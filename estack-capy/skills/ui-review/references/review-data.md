# Review data

`review.json` holds one review. Rounds are append-only history.

## Shape

```json
{
  "title": "Request reminders",
  "pr": 1812,
  "feature": "Request reminders",
  "summary": "One sentence on what this review covers.",
  "issues": [{ "id": "checkout", "title": "Checkout", "kind": "feature" }],
  "rounds": [
    {
      "id": "round-1",
      "label": "Round 1",
      "summary": "First pass on the reminder.",
      "comparisons": []
    }
  ]
}
```

- `title` is the review's name. The pasted decisions carry it, and the parser rejects a paste that names another review.
- `pr` (a positive integer) and `feature` (a non-empty string) are optional. The sidebar shows `PR #<pr>: <feature>`, falling back to `title` for a missing feature. They are display text only: the pasted decisions still carry `title`.
- `issues` are the sidebar groups, in display order. Give each a `kind` of `linear`, `feature`, or `ui`. A `linear` group requires its issue `url`; the other kinds may show a descriptive title alone. The field name comes from the earlier review format and also carries feature or UI groups.
- `rounds` are ordered oldest first. `id` and `label` are stable, and the round `id` is what `decisions.mjs` checks the paste against.

## Comparisons

```json
{
  "id": "request-reminder",
  "issueId": "checkout",
  "title": "Request reminder moves beside the price",
  "variant": "desktop",
  "tier": "judgment",
  "explanation": "The buyer sees the reminder next to the total instead of under the address.",
  "lookAt": "The reminder line under the total",
  "gap": "",
  "before": { "...": "capture record" },
  "after": { "...": "capture record" },
  "copyDiff": [
    { "type": "remove", "text": "Allow up to 5 days" },
    { "type": "add", "text": "Allow up to 7 days" }
  ],
  "video": "captures/head/request-reminder.mp4",
  "revises": "request-reminder",
  "archived": false,
  "feedback": [
    { "source": "thread", "text": "Move it under the total", "comparisonId": "request-reminder", "disposition": "fixed" }
  ]
}
```

- `id` is permanent and unique inside the review. The page addresses each comparison by `#<round-id>/<comparison-id>`.
- `variant` names the capture's device and viewport. The sidebar icon and tooltip read `tablet`, `mobile` or `phone` from it, and anything else shows as desktop.
- `tier` is `judgment` or `mechanical`. It is required on a live comparison and drives the agent's ordering and triage. The round does not show it.
- `explanation` says what changed and why the scenario matters, in plain sentences. `lookAt` points at the precise area when an overlay would be noise. Use one or the other, briefly.
- `before` and `after` are capture records from [capture metadata](capture-metadata.md). A side may be `null` with an `gap` sentence, and an unarchived comparison needs an After capture.
- `copyDiff` carries `equal`, `remove`, and `add` segments in original order and whitespace. Use it only when the change is text.
- `video` is a packaged relative path, kept only for a recording that already belongs to this review. A round normally holds still pictures.
- `revises` names an earlier comparison in an earlier round. A revision appears only in a later round, and it must keep the same matched baseline and current pair.
- `archived: true` keeps a comparison and its feedback out of the queue when the work no longer needs review.
- `feedback` records each request with its `source`, the reviewer's `text`, the `comparisonId` it applies to, and its `disposition`: `unresolved`, `approved`, `omitted`, `reopened`, `fixed`, or `answered`. Earlier comments carried into a new round keep that disposition, and the round shows them as fixed or open.

## What the validator checks

The validator is the guard against a review that looks right and misleads.

- Every packaged asset is a relative path inside the directory, with no query string or protocol.
- Every image is a real PNG or JPEG whose stored dimensions match its bytes and whose SHA-256 matches its record.
- Every image has a capture record with a full commit, a capture kind, build evidence, a valid timestamp, a tool, a route, a role, a state, a data key, a viewport, and a scroll position.
- Before has no dirty patch, and a pair never claims the same build twice.
- A pair matches on kind, route, role, state, data key, viewport, and scroll.
- Every highlight rectangle fits inside its image and covers less than the whole screen.
- `pr` and `feature`, when present, are a positive integer and a non-empty string.
- Comparison ids are unique, every `issueId` exists, every live comparison has an After capture and a tier, and every `revises` target exists in an earlier round.
- Feedback is complete and targets a known comparison.

Run it before every build. It cannot prove a capture came from the build it names; verify Git and the running process while capturing.
