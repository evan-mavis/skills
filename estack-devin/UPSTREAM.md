# pstack source history

This file records the pstack snapshot reviewed for Estack and its source adaptations. This editable Devin variant preserves the source history below. Maintain it together with the Codex and Factory variants under the repository's AGENTS.md rules. The historical entries describe the original Codex adaptation.

## Snapshot

- Version: `0.15.10`
- Commit: [`4e5b1cf2ccb0ea3716f08c8ee0a5856b5ab93536`](https://github.com/cursor/plugins/commit/4e5b1cf2ccb0ea3716f08c8ee0a5856b5ab93536)
- Retrieved and compared: 2026-10-05
- Sources: `pstack/` and `cursor-team-kit/skills/deslop/`
- Previous snapshot: `0.15.5` at [`ecc249f1e306fc64ddf83c7bed16cacf7c2239db`](https://github.com/cursor/plugins/commit/ecc249f1e306fc64ddf83c7bed16cacf7c2239db), retrieved 2026-09-27. The 2026-10-01 comparison found no active skill or agent changes.

## Historical Codex source adaptations

- Estack skills and playbooks target Codex. This file preserves the shared source history.
- `skills/poteto-mode/SKILL.md` uses the lowercase skill name `poteto-mode`.
- PR titles and branch names follow the bundled personal defaults.
- `skills/deslop/` is vendored from the source snapshot and runs before commits.
- Estack preserves the source license and includes the Codex runtime adaptations directly.
- Session hooks adapt [Aqua's Codex port](https://github.com/Aqua-123/pstack-for-codex/tree/main/hooks), with Estack activation forms and state isolated by chat and project. `NOTICE-hooks` preserves the source license. Generic Codex subagents continue to use the bundled poteto-agent prompt; no custom agent profile is installed.

### Adopted from 0.15.6 through 0.15.10

- `benchmark-checklist` and `principle-explain-the-number` vet performance claims. The benchmark checklist supports both Linux and macOS core-count commands. Perf issue and Hillclimb use it before acting on measurements and prefer cheaper changes first.
- `correct` fixes proven repeated mistakes through architecture, types, lint, CI, or tests before adding prose rules. Codex history must be accessible, and fixes remain within the requested scope. A correction outside this workflow does not automatically authorize repository changes.
- Architect screens for split ownership, duplicate ways to perform a task, importable internals, and lists that need manual synchronization. The TypeScript cast example now validates the whole shape with a schema.
- Poteto-mode starts fresh subagents for new work unless costly live state requires reuse. Its agent prompt, Swarm retries, and Autopilot-full queue handoffs agree. Autopilot owners push after each verifiable unit, and audits check the pushed branch and decision trail.
- Default decisions accept replies in plain words. PR descriptions use separate headings, a short change list, explicit scope, and concise validation. Repository templates still win. Purpose-built PR tools take precedence for supported operations, and created PRs attach to the Codex task.
- `poteto-help` routes help questions to bundled Estack skills. It explains Codex model inheritance, activation hooks, real runtime evidence, Airgoods overrides, and authorized scheduling. Its shorter map replaces upstream's Cursor setup instructions and guide links.

### Deliberately retained or skipped

- Keep Codex model inheritance, session hooks, goal-tool authorization, bounded waits, and the existing 30-minute automation audit cadence. Do not import Cursor Custom Modes, `/loop 1h`, `.mdc` model rules, Cursor agent types, or Cursor cloud-only tools.
- Keep the current merge-prep rebase and patch-id safeguards. Skip the new Autopilot-full optimization that can avoid another rebase when trunk moves.
- Keep technical-writing source attribution. Upstream's removal of the attribution lines adds no workflow benefit.
- Personal defaults, Airgoods overrides, the custom logo, licenses, and account release identifiers remain unchanged. This source sync does not publish the private plugin.

## Devin adaptation

The Devin package uses native plugin metadata and skill triggers. Local custom profiles follow Devin's documented profile format. General workers receive the role prompt to inherit the parent model. Activation hooks adapt the Codex implementation to native Devin events, slash commands, project environment, and private state storage. Commands embed the source to avoid undocumented plugin-root variables. Codex UI metadata and the Codex JSONL session scanner are omitted. The same artwork is bundled without an unsupported icon manifest field. Scoped accessible history, live browser tools, and verified artifact delivery replace those host assumptions. Required independent-review gates remain incomplete when the host cannot delegate. Airgoods retains its external GitHub Codex reviewer.
