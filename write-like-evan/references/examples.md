# Writing examples

These are Evan-authored examples from Slack and Gmail. Use them to infer tone and structure only. Never reuse their facts in unrelated drafts.

## Internal announcement: experiment results

Source: user-provided Slack example.

> Hi all, we are about to wrap up our first two PostHog A/B experiments :hedgehog:. I'll touch on these in the all-hands, but here's the quick summary:
>
> **Experiment 1 (Product Quick Add Pill vs Wide Pill):** Positive results - AOV was the only statistically significant finding at $344 vs $281, and cart interactions trended up overall.
> **Experiment 2 (Quantity Dropdown vs +/-):** The new dropdown actually reduced cart interactions, but my guess is that's because it's easier for users to select the quantity they want right away. Everything else was flat.
>
> We want to make a habit of posting the results from these experiments so that
>
> we can access the impact
> we can update our product marketing (since feature will be fully released and would be good to include in the changelog).
>
> One cool thing about running experiments is that if a new feature flops, we can turn it off instantly via feature flags without any code changes. Same goes for rolling out a winner to 100% of users when an experiment wraps up.
>
> Full breakdown in Notion: [Posthog Experiments (A/B tests)](https://www.notion.so/Posthog-Experiments-A-B-tests-31209c70ed378086a5c1caefb448cf84?pvs=21)
>
> Let me know if you have any questions!
>
> cc: Paolo

Signals:

- warm opener plus immediate context;
- structured facts followed by a candid interpretation;
- explains the practical habit and why it matters;
- uses one playful emoji, a useful link, and a low-pressure close.

## Internal Slack: proposal with reasoning

Source: Slack DM, July 27, 2026.

> Hey hey, I’m reviewing the admin create-order functionality, and there are quite a few changes I’d want to make before shipping.
>
> The PR matches the original spec from what I can see, but since this is a brand new order path, it feels like a good opportunity to move pricing fully to the backend and make it generic and not tied specifically to admins (a lot of services have admin naming). We can test it with admin orders first, then eventually move regular checkout onto it and reuse it for supplier-created orders.
>
> I also found a few bugs around overrides and the preview / create calculations that I want to clean up. I am going to create a followup PR but just wanted to make sure that all sounds good w/ you first.

Signals:

- friendly double greeting;
- states the concern without drama;
- uses "from what I can see" and "feels like" to calibrate certainty;
- explains the longer-term payoff before asking for agreement.

## Internal Slack: enthusiastic feature share

Source: Slack channel, July 22, 2026.

> Was testing codex's "Sites" feature last night and it is honestly super cool. You can basically one-prompt web apps that are fully deployed and managed by codex (looks like they are Next.js apps hosted on Cloudflare). Once, its done you get a shareable link you can send.
>
> I had two really cool use cases I ran overnight.
> 1. I had codex look at all the new features I introduced for the "demo feature parity w/ placements" build, and create a demo app w/ videos showcasing all the features. Honestly did a super good job, and the browser navigation in the video is really fast.
> 2. I had another agent review this same branch and test as many cases as it could think of, and then build a site w/ video recordings reproducing the bugs so I could verify them this morning. Also worked super well and caught some real bugs.

Signals:

- enthusiasm is specific and backed by examples;
- explains the feature in plain language before listing use cases;
- phrases like "honestly super cool" and "caught some real bugs" feel conversational rather than promotional.

## Internal Slack: short project handoff

Source: Slack DM, July 14, 2026.

> Yo yo! Just finished up the draft for the Notifications Core Workflow: [link]
>
> Lmk what you think - especially on whether the priorities and scope feel right. You have a much better understanding here, so feel free to make any edits / comments. Happy to talk through anything too!

Signals:

- opens casually and gets to the artifact immediately;
- makes the feedback request specific;
- invites direct edits and conversation without ceremony.

## Internal Slack: concise reactions

Sources: Slack messages, July 2026.

> 100%, feel like that would be good just so everyone is on the same page

> Honestly I feel like the spec was super clear + detailed, think they just need to do some more testing

> Oh cool, this will be super nice to have! Just took a look, looks great to me, only left one comment.

> That looks urgent, lmk if you want me to take a look

Signals:

- quick agreement or judgment first;
- brief practical reason or next step;
- contractions, fragments, and shorthand are normal in casual contexts.

## Internal email: forwarding for visibility

Source: Gmail sent mail, July 14, 2026.

> I'm not sure if they've reached out to you, but they have sent me multiple emails. Seems to be a web accessibility company - just wanted to forward it your way for visibility.

Signals:

- no unnecessary greeting in a close internal relationship;
- uncertainty is stated directly;
- the reason for forwarding is explicit and brief.

## Customer-facing email: warm and clear

Source: Gmail sent mail, March 5, 2026.

> Hi Dianna,
>
> Thank you for reaching out! We approved this retailer based on their seller documentation and their plan to launch an online store. We just moved them to a "paused" state and are currently following up with them directly to gather some additional details.
>
> In the meantime, you're welcome to cancel your order if you'd prefer. Thanks again for flagging this for us :)
>
> Best,
> Evan

Signals:

- warmer and more polished than Slack without becoming stiff;
- explains both the original decision and the action now taken;
- gives the recipient a clear option;
- closes with appreciation and a light human touch.

## Very short email replies

Sources: Gmail sent mail, July 2026.

> Oh sick thanks, will check that out

> 100%, I love how concise and simple it is

> Looks super cool!

Signals:

- mirror the brevity of the thread;
- lead with a real reaction;
- do not add a formal greeting or signoff when the exchange does not need one.
