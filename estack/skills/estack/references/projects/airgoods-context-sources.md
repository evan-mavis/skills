# Airgoods context sources

Use this map for Estack's [Gather context](../../SKILL.md#gather-context) step on Airgoods work. It records how the team uses each service. It does not record whether a connector is available now. Confirm access and current tool names in the session before relying on a service, and report a missing one as a gap.

In Codex, check the session's MCP and connector tools before relying on a service.

Pick only the services that bear on the task, and read only what answers its open questions.

## Services

| Service | Used for | Questions it answers | why category |
| --- | --- | --- | --- |
| Linear | Issues, specs, and sprint state | What was asked and by whom, acceptance criteria, comments, attachments, linked Slack posts, customer requests, and related issues | Issue / ticket tracker |
| Slack | Team discussion and customer reports | What a linked post says, who reported the problem, and what the team already tried | Real-time team chat |
| Notion | Company knowledge, sprint planning, user interviews, and Evan's personal todos | Product intent, earlier decisions, sprint goals, and what users said in interviews | Long-form documents |
| PostHog | A/B tests, feature flags, and product analytics | Whether a flag or experiment gates the code, who sees which variant, and how users behave | Product analytics warehouse |
| Sentry | Backend logging and observability | Which errors fire, how often, since which release, and with what stack trace | Error / exception tracking |
| Render | Backend hosting, environment variable configuration, and database hosting | What is deployed and when, recent service logs, and which environment variable names a service has | Infrastructure observability |
| Vercel | Frontend hosting and the proxy | Which frontend build is live, its build and runtime logs, and how the proxy routes a request | Infrastructure observability |
| Neon | Database branches for isolated cloud and local development and testing | Which branch a development target uses and which parent it came from | Infrastructure observability |
| Expo | Mobile development and hosting | Which mobile build or update is live and how it was built | Infrastructure observability |
| Resend | Email | Whether an email was sent and delivered, and which template it used | Infrastructure observability |
| Algolia | Search and recommendations | How an index is configured and why a query returns its results | Other |
| Sanity | CMS | What content editors published and when | Other |
| Stripe | Payments | Payment, subscription, and payout state for an account | Other |

The why skill assigns investigators by the category column. A service marked Other gets its own investigator when it bears on the question.

## Database records

Read records through the repository skills in the Airgoods checkout: `.agents/skills/query-prod/SKILL.md` for production and `.agents/skills/query-local/SKILL.md` for development. If the needed skill is missing, stop database querying and report it.

Before trusting a development record, follow `docs/verification/dev-data.md` in the checkout to confirm the target database and when its data was copied. A development copy can lack the record you need or lag the checkout's schema. Report that as a gap. Never refresh, migrate, or write to a database only to gather context.

## Safety

Every lookup is read-only. Read environment variable names, never their values. Summarize database rows, Stripe records, and customer reports instead of copying them, and keep secrets, credentials, and customer data out of output. Read Evan's personal todos only when the task concerns them.
