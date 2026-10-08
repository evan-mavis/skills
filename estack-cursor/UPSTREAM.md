# pstack source history

This file records the pstack snapshot reviewed for Estack and its source adaptations. This variant uses native Cursor metadata, agents, and Custom Modes. Codex, Devin, and Factory have separate editable variants in the same repository. Shared changes stay in sync through `AGENTS.md`.

## Snapshot

- Version: `0.15.10`
- Commit: [`4e5b1cf2ccb0ea3716f08c8ee0a5856b5ab93536`](https://github.com/cursor/plugins/commit/4e5b1cf2ccb0ea3716f08c8ee0a5856b5ab93536)
- Retrieved and compared: 2026-10-05
- Sources: `pstack/` and `cursor-team-kit/skills/deslop/`
- Previous snapshot: `0.15.5` at [`ecc249f1e306fc64ddf83c7bed16cacf7c2239db`](https://github.com/cursor/plugins/commit/ecc249f1e306fc64ddf83c7bed16cacf7c2239db), retrieved 2026-09-27. The 2026-10-01 comparison found no active skill or agent changes.

## Shared source history

- Estack skills and playbooks retain their shared workflows and Airgoods safeguards. This file preserves the shared source history.
- `skills/poteto-mode/SKILL.md` uses the lowercase skill name `poteto-mode`.
- PR titles and branch names follow the bundled personal defaults.
- `skills/deslop/` is vendored from the source snapshot and runs before commits.
- The Codex variant preserves the source license and includes its runtime adaptations directly.
- Codex session hooks adapt [Aqua's Codex port](https://github.com/Aqua-123/pstack-for-codex/tree/main/hooks), with Estack activation forms and state isolated by chat and project. `NOTICE-hooks` preserves the source license. Generic Codex subagents continue to use the bundled poteto-agent prompt; no custom agent profile is installed.

### Adopted from 0.15.6 through 0.15.10

- `benchmark-checklist` and `principle-explain-the-number` vet performance claims. The benchmark checklist supports both Linux and macOS core-count commands. Perf issue and Hillclimb use it before acting on measurements and prefer cheaper changes first.
- `correct` fixes proven repeated mistakes through architecture, types, lint, CI, or tests before adding prose rules. Codex history must be accessible, and fixes remain within the requested scope. A correction outside this workflow does not automatically authorize repository changes.
- Architect screens for split ownership, duplicate ways to perform a task, importable internals, and lists that need manual synchronization. The TypeScript cast example now validates the whole shape with a schema.
- Poteto-mode starts fresh subagents for new work unless costly live state requires reuse. Its agent prompt, Swarm retries, and Autopilot-full queue handoffs agree. Autopilot owners push after each verifiable unit, and audits check the pushed branch and decision trail.
- Default decisions accept replies in plain words. PR descriptions use separate headings, a short change list, explicit scope, and concise validation. Repository templates still win. Purpose-built PR tools take precedence for supported operations, and created PRs attach to the Codex task.
- The Codex `poteto-help` routes help questions to bundled Estack skills. It explains Codex model inheritance, activation hooks, real runtime evidence, Airgoods overrides, and authorized scheduling. Its shorter map replaces upstream's Cursor setup instructions and guide links.

### Deliberately retained or skipped

- Keep Codex model inheritance, session hooks, goal-tool authorization, bounded waits, and the existing 30-minute automation audit cadence. Do not import Cursor Custom Modes, `/loop 1h`, `.mdc` model rules, Cursor agent types, or Cursor cloud-only tools.
- Keep the current merge-prep rebase and patch-id safeguards. Skip the new Autopilot-full optimization that can avoid another rebase when trunk moves.
- Keep technical-writing source attribution. Upstream's removal of the attribution lines adds no workflow benefit.
- Personal defaults, Airgoods overrides, the custom logo, licenses, and account release identifiers remain unchanged. This source sync does not publish the private plugin.

## Cursor adaptation

The native manifest, agent routing, and skill layout were checked against the pstack snapshot above. Shared Estack prose, playbooks, supporting files, personal defaults, and Airgoods verification maps come from the maintained variants. Host-specific sections use current Cursor documentation.

- Custom agents use `model: inherit`. User-requested alternatives require an available model and a verified effective selection. Hardcoded upstream model IDs and per-role settings are not imported.
- Cursor's Custom Mode holds the selected skill in chat context. `icon` and `color` style it. Obsolete `mode` and `reminder` fields are omitted. The reviewed upstream snapshot contains no hook code. This variant ships no activation hooks.
- Task delegation permits direct children and grandchildren where available. Deeper requests return to the parent. Factory's flat-only delegation and automation API names are omitted.
- Browser verification resolves native Cursor tools or an installed driver. Video proof preserves the shared agent-browser recording recipe. Scoped host transcripts replace Codex's private JSONL schema.
- Cursor automations start separate cloud agents. Persist and verify ledger access and context tools before claiming a durable follow-up. The external Airgoods GitHub Codex reviewer keeps its identity and safeguards.
- The same artwork is declared through Cursor's supported `logo` field. Repository marketplace metadata points at `estack-cursor/`. No other plugin is required.
