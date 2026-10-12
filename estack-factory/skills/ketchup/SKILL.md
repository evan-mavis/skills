---
name: ketchup
description: "Catch the user up on this chat since their last message, with current status and decisions only they can make. Use for /ketchup or a request to catch up on this chat."
---

# Ketchup

Catch the user up on this chat since their last message before this request. Notifications and subagent results do not count as user messages. Use [Bro's plain voice](../bro/SKILL.md), without its restatement step. Use names the user knows for PRs, branches, and agents.

## Gather what changed

Keep this turn read-only, except for reply visuals made from existing evidence. Do not change code, start apps or jobs, or post material to create visuals. Collect the work and reports since that message. Check current PR, CI, and agent state through available tools. Say what is still running and what you could not check.

An action item is a decision or step only the user can take. Include pending items from before their last message. Work you can complete yourself is not an action item.

## Write the reply

Open with the number of action items, or say there are none. If nothing changed and nothing waits on the user, say so and stop.

Give the results and their meaning, most important first. Skip steps that changed nothing. Name work you can still complete within the user's authorized scope in one line.

For each action item, explain the decision, why it matters now, the options and their costs, your recommendation, and what happens without an answer. State unknowns. Link existing detail, but make the summary sufficient to decide.

Compare the current state and the options side by side. Use captured screenshots or video for visible changes, or a table, diff, or diagram. Make a comparison from existing evidence when useful. If no visual is possible, say so. Never invent numbers, screen captures, or artifact links.
