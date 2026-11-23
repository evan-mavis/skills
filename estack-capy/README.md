# Estack for Capy

This package adapts the Codex and Devin Estack workflows for Capy. Skills retain their supporting files in `skills/`. The package does not provision services, credentials, or application environments.

## Install

For cloud threads, add this GitHub folder as a plugin in **Settings → MCP & plugins → From GitHub repository** using the repository's `estack-capy` folder URL. For a private repository, install the Capy GitHub App on it first. Use **Sync** on the plugin page after changes are pushed. Plugin skills are not available on paired-device threads.

Alternatively, copy the desired complete skill folders into a Drive scope's `skills/` directory, or into a repository's root `.agents/skills/` directory and commit them. Start a new thread on the updated branch for repository skills. Copies do not update automatically; copy them again to refresh. Include the referenced sibling skills when a workflow calls them.

Use `$estack` or `$poteto-mode` in a task, or select a skill with the composer. Capy resolves duplicate names in repository, Drive, built-in, then plugin order. Check the picker if a skill does not appear. Capy ignores plugin hooks and custom agent profiles, so invocation does not persist through a hook. Invoke the workflow again when needed. Delegation uses Capy's subagents and available tools rather than Devin or Codex agent profiles.

See [Capy's skill documentation](https://docs.capy.ai/skills) and [plugin documentation](https://docs.capy.ai/integrations/plugins). Editing this package does not publish or install it.

## Video evidence

Use [capture](skills/capture/SKILL.md) for required video evidence and polished same-take walkthroughs. It uses native Capy recording or the documented macOS capture path, preserves originals and provenance, and bundles the shared compositor. Its [finishing dependencies](skills/capture/references/runtime.md) are provisioned separately. Native recordings preserve their source cursor. They do not supply the Codex adapter's synchronized pointer timeline. Image-only UI review keeps its existing screenshot workflow and publishing.
