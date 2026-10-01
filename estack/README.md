# estack

Evan's Codex plugin, built from pstack and personal skills. Invoke the estack plugin to route through `skills/estack/SKILL.md`, or invoke an individual bundled skill.

This directory is the sole editable plugin source. Edit its skills, references, agents, and metadata directly, then run these commands from the skills repository:

```sh
bun scripts/check-estack.mjs
bun scripts/check-estack-loader.mjs
```

Codex invocation policy comes from `agents/openai.yaml`; Cursor-only frontmatter is omitted. Routed pstack skills remain discoverable, and their bodies and references load only when needed.

The entry skill loads personal defaults from the package; installing the plugin does not install global `AGENTS.md` instructions. Skills and playbooks use Codex tools and workflows. The bundled guidance adapts tools, models, scheduling, transcripts, and verification for Codex while preserving the workflows derived from pstack.

Airgoods verification and babysitting use bundled sibling skills. Verification preserves feature maps, recorded evidence, cleanup, and the no-previewctl policy. Babysitting preserves the shared pstack workflow and applies the personal Airgoods overrides.

For automated web demos, use the [Codex recording recipe](skills/references/video-recording.md). It uses agent-browser with a visible cursor, checks the installed version, and covers cloud prerequisites and artifact delivery.

Workflows require the services and tools named by their skills. Cloud availability, plugin-mention routing, browser recording, GitHub authentication, and scheduled follow-ups require verification in the target session. A local installation does not prove cloud support.

pstack is derived from Lauren Tan's Cursor plugin. Its MIT license is preserved in `LICENSE`; the upstream snapshot and source adaptations are recorded in `UPSTREAM.md`. Personal workflows remain private content.
