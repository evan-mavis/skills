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
	[uploaded screenshot]
	[optional supporting caption]
	### Feedback
	<empty-block/>
	---
	### 2. Review before submitting
	[uploaded screenshot]
	### Feedback
	<empty-block/>
	---
	### 3. Retailer selects a proposed time
	[uploaded screenshot or video]
	[optional supporting caption]
	### Feedback
	<empty-block/>
```

Repeat the media section for every covered screen or action. Use descriptive headings for distinct states, such as `Submit a request with missing times` or `Reschedule on mobile`. A caption can identify a role or fixture condition that the heading and media do not explain. For a video, include timestamps only when they help locate the relevant action.

For subsequent rounds, use the same section pattern under `## Round N {toggle="true"}`. Keep all older round toggles below it with their media and feedback intact. Do not add a table of contents or tracking sections.
