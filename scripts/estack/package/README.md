# estack

Evan's Codex plugin, built from pstack and personal skills. Invoke the estack plugin to route through `skills/estack/SKILL.md`, or invoke an individual bundled skill.

This directory is generated. Edit `pstack/`, `personal/`, or the templates and exact replacements under `scripts/estack/`, then run these commands from the skills repository:

```sh
bun scripts/build-estack.mjs
bun scripts/build-estack.mjs --check
```

The entry skill loads personal defaults from the package; installing the plugin does not install global `AGENTS.md` instructions. Skills and playbooks use Codex tools and workflows. Exact replacements under `scripts/estack/` adapt tools, models, scheduling, transcripts, and verification while preserving pstack's workflows.

Airgoods verification and babysitting use bundled sibling skills. Verification preserves feature maps, recorded evidence, cleanup, and the no-previewctl policy. Babysitting preserves the shared pstack workflow and applies the personal Airgoods overrides.

Workflows require the services and tools named by their skills. Cloud availability, plugin-mention routing, browser recording, GitHub authentication, and scheduled follow-ups require verification in the target session. A local installation does not prove cloud support.

pstack is derived from Lauren Tan's Cursor plugin. Its MIT license is preserved in `LICENSE`; the upstream snapshot and source adaptations are recorded in `UPSTREAM.md`. Personal workflows remain private content.
