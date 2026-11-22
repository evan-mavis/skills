---
name: ketchup
description: "Catch the user up on this chat since their last message, with current status and every pending decision they need to make from the reply alone. Use for $ketchup or a request to catch up on this chat."
---

# Ketchup

Catch the user up on this chat since their last message before this request. Notifications and subagent results do not count as user messages. Use [Bro's plain voice](../bro/SKILL.md), without its restatement step. Use names the user knows for PRs, branches, and agents. Describe what changed for the user and help them understand each change. List every item waiting on them so they can decide from the reply alone. Omit hashes, paths, commands, and test counts unless the user needs them to act.

## Gather what changed

Keep this turn read-only, except for reply visuals made from existing evidence. Do not change code, start apps or jobs, or post material to create visuals. Collect the work and reports since that message. Check current PR, CI, and agent state through available tools. Say what is still running and what you could not check. Check each reported number against its source, and state any correction.

An action item is a decision or step only the user can take. Include pending items from before their last message. Work you can complete yourself is not an action item. Do not invent decisions or add steps the task does not need. For each pending item, collect its link, what it changes for users, the evidence behind your recommendation, its risk, and your recommendation. Mark needed facts you cannot verify as unknown. Omit links you do not have.

## Write the reply

Keep the main story brief. Let the reply grow with the pending items. Never omit, combine, or replace items with a count or link to meet a word budget. Do not repeat a fact in both text and a visual. Cut routine status before decision context.

Open with the number of action items, or say there are none. If nothing changed and nothing waits on the user, say so and stop.

Give the results and their meaning, most important first. Skip steps that changed nothing. Name work you can still complete within the user's authorized scope in one line.

For each action item, explain the decision, what it changes for users, the evidence, the risk, and your recommendation. Include its link when available. If several items share a call, state the call and recommendation once, then give every item its own bullet, riskiest first. Note any different recommendation beside that item. For choices, explain every option and its costs. State unknowns. Mention waiting costs only when waiting causes more than delay, such as a missed deadline or lost data. Links can add detail, but the reply alone must be sufficient to decide.

Compare the current state and the options side by side when useful. Embed existing screenshots or video inline when they help explain a visible change. Use a diagram for relationships or flows, or a table or diff for comparisons. Keep action items in plain text. Skip pictures that only repeat status. If useful visual evidence is missing, say so. Never invent numbers, screen captures, or artifact links.
