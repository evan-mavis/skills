# Review page template

Use [UI reviews](https://app.notion.com/p/a0b35fbeb1ef41b3a1d707a4c79de4d1). Its data source is `collection://749d88fa-f258-464a-8a56-0a4f432d3508`. Fetch the current schema before writing.

Set these database properties:

- `Name` is `[feature name] ui review ([issue ID])`. Omit the issue suffix when there is no issue.
- `Issue` is the issue URL when available.
- `PR` is the PR URL when available.
- `Latest round` is the newest published round number, stored as a number.

These properties are the page header. Do not repeat them in the body or add other properties. Leave unavailable links empty.

Use this body structure. Replace bracketed examples with real content and uploaded media. Never publish scaffold placeholders. Use Notion's returned upload markup for the media block. Children of the round heading use tab indentation.

```markdown
[one or two sentences summarizing the change]

## Round 1 {toggle="true"}
	### 1. Propose three times
	Before
	[uploaded screenshot of the pre-change baseline]
	After
	[uploaded screenshot of the current branch]
	[optional supporting caption]
	### Feedback
	<empty-block/>
	---
	### 2. Review before submitting
	Before
	[uploaded screenshot of the pre-change baseline]
	After
	[uploaded screenshot of the current branch]
	### Feedback
	<empty-block/>
	---
	### 3. Retailer selects a proposed time
	Before
	[uploaded screenshot of the pre-change baseline]
	After
	[uploaded screenshot of the current branch]
	[optional uploaded video of the flow]
	[optional supporting caption]
	### Feedback
	<empty-block/>
```

Repeat the media section for every covered screen or action. Use descriptive headings for distinct states, such as `Submit a request with missing times` or `Reschedule on mobile`. A caption can identify a role or fixture condition that the heading and media do not explain. For a video, include timestamps only when they help locate the relevant action.

Round 1 always includes Before and After screenshots. A video can supplement them. For entirely new UI, Before shows the previous entry point or surrounding screen with a brief caption explaining that the new UI did not exist.

For subsequent rounds, use `## Round N {toggle="true"}` and include only items still awaiting review. Each section needs its current screenshot or video and Feedback area. Do not carry forward sections or media the user marked "approved" or "omit". Keep all older round toggles below the newest round with their media and feedback intact. Do not add a table of contents or tracking sections.
