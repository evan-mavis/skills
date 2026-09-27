# Personal Engineering Skills

This repository is the source for a cross-tool engineering workflow built
around pstack, with personal and Airgoods-specific skills alongside it.

## Pstack

[`pstack/`](pstack/) is copied from the
[upstream Cursor pstack plugin](https://github.com/cursor/plugins/tree/main/pstack).
The imported snapshot is upstream version `0.15.5`, commit
[`ecc249f1e306fc64ddf83c7bed16cacf7c2239db`](https://github.com/cursor/plugins/commit/ecc249f1e306fc64ddf83c7bed16cacf7c2239db),
retrieved on 2026-09-27. Its internal directory structure and contents are
preserved as upstream.

The upstream skills are Cursor-oriented. The next step is to adapt selected
skill content for Codex, Factory, GitHub-native stacked PRs, and personal
workflows. Those adaptations have not been made yet. Keep pstack's existing
layout intact while editing the contents of individual skills; document
meaningful adaptations here as they are made.

## Personal skills

These skills are organized by domain and remain separate from upstream pstack:

- [`personal/planning/`](personal/planning/): `grill-me`, `to-linear-spec`
- [`personal/airgoods/`](personal/airgoods/): Airgoods database, verification,
  and local development skills

## Deprecated

[`deprecated/ai-dev-workflow/`](deprecated/ai-dev-workflow/) contains the former
`ai-dev-workflow` plugin and its skills. It is retained for reference, not as
the active workflow. Its former install and sync scripts are archived in
[`deprecated/scripts/`](deprecated/scripts/) and should not be used for the
new pstack-based setup.

There is no active cross-tool installer yet. Installation and synchronization
will be designed after the pstack adaptations are reviewed.
