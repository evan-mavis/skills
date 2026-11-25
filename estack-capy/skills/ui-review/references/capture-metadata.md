# Capture and highlight metadata

## Capture integrity

Before editing, identify and verify the pre-change Git baseline, including why that commit is appropriate for the issue or PR. Record its SHA, clean or dirty state, and how the running app was built from it. Use the project's safe baseline procedure. Do not reset a checkout with uncommitted work and do not alter product flags to get a screenshot. If a safe baseline run is blocked, leave the Before side missing and explain the gap. Never use the changed build as Before.

Record the current commit and the dirty patch digest when the head includes uncommitted changes. Confirm that the serving process uses that source and that any required rebuild has finished. Match account role, route, action sequence, fixture data, viewport, device scale, and scroll position. Capture through normal app actions. Record the capture time and tool, plus evidence of the running build. A SHA written into JSON alone does not prove provenance.

Build a coverage list from changed code and shared callers. Include the roles, permissions, loading, empty and populated data, validation, errors, disabled controls, content lengths, dialogs, menus, and responsive states that the change materially affects. Inspect each image before keeping it.

Export original screenshots from the browser tools. Keep them outside the application repository. Record each raw screenshot's SHA-256 and its capture provenance. Keep highlight metadata and any annotated viewing copy separate from the raw evidence. Avoid sensitive data at capture time. If an image holds a secret or a customer's record, discard it and recapture with safe data.

Use authenticated full-app captures first. When one is blocked, state the exact gap beside the comparison. A component preview may supplement the evidence with `kind: "component-preview"` and a short gap note. Use `kind: "example-fixture"` for template validation. Never present either as authenticated evidence. For entirely new UI, Before may show the previous entry point or the surrounding screen, with the comparison explaining that the new UI did not exist.

## Capture record

For each image, store a record in this shape. `diff-captures.mjs --review` writes `regions`; you supply the rest.

```json
{
  "src": "captures/head/requests--filled--desktop.png",
  "width": 1440,
  "height": 1000,
  "sha256": "64 lowercase hexadecimal characters from the original image",
  "regions": [
    { "x": 80, "y": 300, "width": 460, "height": 64, "label": "Responsibility copy" }
  ],
  "capture": {
    "kind": "authenticated-app",
    "commit": "full verified Git SHA",
    "dirtyPatchSha256": null,
    "buildEvidence": "Worktree path and serving process or build identifier",
    "capturedAt": "ISO-8601 timestamp",
    "tool": "capture tool used",
    "route": "/requests/example",
    "role": "brand",
    "state": "filled request",
    "dataKey": "safe-fixture-identity",
    "viewport": { "width": 1440, "height": 1000, "deviceScaleFactor": 1 },
    "scroll": { "x": 0, "y": 0 }
  }
}
```

Use actual PNG or JPEG pixel dimensions for `width`, `height`, and the rectangles, not CSS viewport units. Convert CSS measurements by the capture scale and crop origin. Keep region coordinates relative to that image. Each rectangle has positive dimensions and fits inside the image. Several rectangles are allowed. Mark an old location in Before and the new location in After for moved content. Exclude unrelated timestamps, avatars, animation, and other dynamic noise. Never mark the whole screen to hide an uncertain diff.

The page draws each region as a box sized from these coordinates, as a percentage of the stored width and height, inside a wrapper with the same aspect ratio. The image renders at `width: 100%; height: auto` with no letterboxing. A border uses `box-sizing: border-box` so it stays inside its rectangle. If you change the layout to contain or cover, account for the image offset and crop before reusing the metadata.

The validator requires Before to have no dirty patch and rejects a pair with the same commit and patch identity. Different SHAs do not establish a correct baseline. Inspect the Git history and the running build. Missing or mismatched evidence stays a reported gap even when metadata validation passes.

## Overlays

`regions` from the diff script carry a rectangle per changed area plus a `signature` of the before and after crop, and a `changedPixels` count. Keep the ones worth pointing at and give each a label that names what changed. Drop regions that only follow a layout shift, and replace them with one region around the moved block. Before uses red, After uses green. Never bake marks into the original image.
