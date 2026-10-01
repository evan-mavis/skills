---
name: estack
description: Use when the user invokes the estack plugin or asks for estack. Route setup cloud to the Airgoods cloud environment workflow. Apply poteto-mode with Evan's personal defaults, Airgoods verification, and PR babysitting preferences.
---

# estack

When the estack plugin is invoked, read [Personal defaults](references/personal-defaults.md) and [poteto-mode](../poteto-mode/SKILL.md) in full. Follow poteto-mode for the requested task. Repository instructions and explicit user requests take precedence.

This plugin runs in Codex.

For an Airgoods cloud setup request, including `@estack setup cloud`, read [setup-cloud-env](../setup-cloud-env/SKILL.md) and carry it through database and server readiness. Before work requiring a running Airgoods app in a cloud session, use that skill to resolve the handoff and start missing required services. Do not assume dependency installation started the dev servers or that Codex executed the repository bootstrap automatically. Documentation-only work does not need app startup.

For Airgoods PR babysitting, merge-ready requests, review-comment cleanup, or outstanding PR work, read [babysit-airgoods-pr](../babysit-airgoods-pr/SKILL.md) and use its overrides. Opening a PR alone does not trigger babysitting.

For Airgoods verification, read [verify-airgoods](../verify-airgoods/SKILL.md) and invoke the affected surface skills. User-visible bugs need a reproduction before editing and verification afterward. Features and improvements need a demo. Read the verifier before starting the work so its proof requirements guide the change.

Resolve bundled skills through the current skill catalog when their workflow applies. With a skill-resource reader, select the target skill and use its returned resource identifier; do not pass a sibling filesystem path as a resource of this entry skill. With filesystem tools, sibling paths are relative to the containing file. Preserve their supporting references and scripts. Report missing capabilities without claiming the workflow completed.
