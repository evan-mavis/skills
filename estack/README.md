# estack

evan's codex plugin, built from pstack and personal skills. invoke the estack plugin to route through `skills/estack/SKILL.md`, or invoke an individual bundled skill. use `/reword` to rewrite text in your warm, clear, lowercase voice.

this directory is the sole editable plugin source. edit its skills, references, agents, and metadata directly, then run these commands from the skills repository:

```sh
bun scripts/check-estack.mjs
bun scripts/check-estack-loader.mjs
```

codex invocation policy comes from `agents/openai.yaml`; cursor-only frontmatter is omitted. routed pstack skills remain discoverable, and their bodies and references load only when needed.

the entry skill loads personal defaults from the package; installing the plugin does not install global `AGENTS.md` instructions. skills and playbooks use codex tools and workflows. the bundled guidance adapts tools, models, scheduling, transcripts, and verification for codex while preserving the workflows derived from pstack.

substantive engineering requests can select estack or poteto-mode automatically. bundled hooks also remember an explicit `$estack`, `$poteto-mode`, or `@Estack` activation for the current chat and project. they repeat a short routing reminder on later prompts and after resume or compaction. say `disable $estack` or `disable $poteto-mode` to clear that state. casual turns and user opt-outs skip the playbook.

review and trust the plugin's hook definitions through codex's `/hooks` interface before relying on them. hooks require node.js and a supported execution environment; web installation alone does not deploy scripts. without a confirmed hook receipt, skill use is limited to the current turn. hook reminders do not prove playbook completion. no target-repository or global instruction changes are required. the adapted hooks' license is preserved in `NOTICE-hooks`.

airgoods verification and babysitting use bundled sibling skills. verification preserves feature maps, recorded evidence, cleanup, and the no-previewctl policy. babysitting preserves the shared pstack workflow and applies the personal airgoods overrides.

use [poteto-help](skills/poteto-help/SKILL.md) to choose a workflow, [correct](skills/correct/SKILL.md) to prevent recurring agent mistakes, and [benchmark-checklist](skills/benchmark-checklist/SKILL.md) to vet performance claims.

for automated web demos, use the [codex recording recipe](skills/poteto-mode/references/video-recording.md). it uses agent-browser with a visible cursor, checks the installed version, and covers cloud prerequisites and artifact delivery.

workflows require the services and tools named by their skills. cloud availability, plugin-mention routing, browser recording, github authentication, and scheduled follow-ups require verification in the target session. a local installation does not prove cloud support.

pstack is derived from lauren tan's cursor plugin. its mit license is preserved in `LICENSE`; the upstream snapshot and source adaptations are recorded in `UPSTREAM.md`. personal workflows remain private content.
