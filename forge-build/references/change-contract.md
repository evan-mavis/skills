# Change Contract

Shared scope manifest for implementation, cleanup, structure, review, CI, and delivery.

## Schema

```yaml
change_contract:
  source: <prompt-or-source-url-or-path>
  scope:
    - <included behavior or path>
  exclusions:
    - <explicitly excluded behavior or path>
  review_base: <sha>
  changed_files:
    - <repo-relative path>
```

`scope` and `exclusions` are hard boundaries. Mutating capabilities update only `changed_files`.
Preserve `source`, `scope`, `exclusions`, and `review_base` unchanged. Return `blocked` rather
than absorbing an unexplained file.

## Derive review_base

When the caller does not supply `review_base`:

- use `HEAD` for a purely uncommitted diff;
- use the merge base with the repository's default branch for a committed branch diff or a diff
  containing both committed and uncommitted changes;
- return `blocked` when the intended scope remains ambiguous.

## Validate before editing

1. Resolve `review_base` and inspect `git diff <review_base>`, `git status --short`, and every
   untracked file in scope.
2. Confirm every changed file belongs to `scope` and none belongs to `exclusions`.
3. Do not review or edit unrelated branch history.

## After mutating

Replace `changed_files` with the exact repo-relative manifest for the resulting diff. Reject
any widened scope, changed exclusions, changed base, or manifest that does not match the checkout.
