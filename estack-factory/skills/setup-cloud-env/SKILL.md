---
name: setup-cloud-env
description: Use only for work in Airgoods-Inc/airgoods or when the user explicitly targets Airgoods. Otherwise, do not use this skill. Set up or resume Airgoods on a Factory Droid Computer. Use for Factory cloud setup or missing development servers. Follow setup-droid for the durable Neon branch and persistent services.
---

# Set up the Factory environment

Use only for work in Airgoods-Inc/airgoods or when the user explicitly targets Airgoods. Otherwise, do not use this skill.

Read [setup-droid](../setup-droid/SKILL.md) and follow its persistent computer lifecycle. Factory setup uses one durable Neon child per computer. Do not run the Cursor or Codex per-run provisioner.

Before capturing visual evidence, follow [Capture](../capture/SKILL.md) and its [runtime requirements](../capture/references/runtime.md). Check Python 3.12, Pillow 12.3, numpy 2.3.5, FFmpeg 7.1.5 with libx264 and ffprobe, agent-browser 0.38.1, and Chrome 154.0.8037.92. Explicit setup includes missing recording prerequisites. Verification alone reports missing tools as blocked proof. Do not install tools while maintaining skills.
