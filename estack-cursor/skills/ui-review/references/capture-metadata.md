# Capture and highlight metadata

## Capture integrity

Before editing, identify and verify the pre-change Git baseline, including why that commit is appropriate for the issue/PR. Record its SHA, clean/dirty state, and how the running app was built from it. Use the project's safe baseline procedure. Do not reset a checkout with uncommitted work or alter product flags to get a screenshot. If a safe baseline run is blocked, leave Before missing and explain the gap. Never use the changed build as Before.

Record the current commit and dirty patch digest when After includes uncommitted changes. Confirm the serving process uses that source and any required rebuild has finished. Match account role, route, action sequence, fixture data, viewport, device scale, and scroll position. Capture through normal app actions. Record capture time and tool, plus evidence of the running build. A SHA written into JSON alone does not prove provenance.

Build a working coverage list from changed code and shared callers. Include relevant roles, permissions, loading, empty/populated data, validation, errors, disabled controls, content lengths, dialogs, menus, and responsive states when materially affected. Inspect each resulting image. Retain immutable raw screenshots from [Capture](../../capture/SKILL.md) outside the application repository and copy them unchanged into the review Site's durable assets. Record each raw screenshot's SHA-256 and capture provenance. Require the packaged copy's SHA-256 to equal the raw screenshot's exact hash. Keep highlights as metadata overlays and polished derivatives separate from raw evidence. Avoid sensitive data at capture time; if an image contains secrets, discard it and recapture with safe data.

Use authenticated full-app captures first. When blocked, state the exact gap beside the comparison. Component previews may supplement evidence with `kind: "component-preview"` and a visible label. Use `kind: "example-fixture"` for template validation. Never present either as authenticated evidence. For entirely new UI, Before may show the previous entry point or surrounding screen; explain that the new UI did not exist.

## Image contract

Each `before` and `after` is either `null` with a comparison `gap`, or an object with:

```json
{
  "src": "captures/request-desktop-before.png",
  "width": 1440,
  "height": 1000,
  "sha256": "64 lowercase hexadecimal characters from the original image",
  "regions": [
    {"x": 80, "y": 300, "width": 460, "height": 64, "label": "Responsibility copy"},
    {"x": 900, "y": 420, "width": 320, "height": 72, "label": "Request reminder"}
  ],
  "capture": {
    "kind": "authenticated-app",
    "commit": "full verified Git SHA",
    "dirtyPatchSha256": null,
    "buildEvidence": "Verified baseline checkout and serving process/build identifier",
    "capturedAt": "ISO-8601 timestamp",
    "tool": "capture tool used",
    "route": "/requests/example",
    "role": "brand",
    "state": "filled request",
    "dataKey": "safe-fixture-identity",
    "viewport": {"width": 1440, "height": 1000, "deviceScaleFactor": 1},
    "scroll": {"x": 0, "y": 0}
  }
}
```

Use actual PNG/JPEG pixel dimensions for `width`, `height`, and rectangles, not CSS viewport units. Convert CSS measurements by the capture scale and crop origin when necessary. Keep region coordinates relative to that specific original image. Each rectangle has positive dimensions and fits inside the image; multiple regions are allowed. Highlight changed words or affected UI blocks with a small margin. Mark an old location in Before and the new location in After for moved content. Exclude unrelated timestamps, avatars, animation, and other dynamic noise. Never mark the whole screen to hide an uncertain diff.

The template places an overlay inside the image's exact aspect-ratio wrapper. It converts each coordinate to a percentage of the stored width/height. The image renders at `width: 100%; height: auto`, without `object-fit` letterboxing. The same wrapper and metadata render in the enlargement. A border uses `box-sizing: border-box` so it stays inside its rectangle. If changing the layout to contain/cover, account explicitly for image offsets and cropping before reusing the metadata.

The validator requires Before to have no dirty patch, and rejects a pair with the same source commit/patch identity. Different SHAs do not establish a correct baseline; inspect Git history and the running build. Missing or mismatched evidence remains a reported gap even if metadata validation passes.
