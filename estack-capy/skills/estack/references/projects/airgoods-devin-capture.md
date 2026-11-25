# Devin capture prompt

Fill every `<placeholder>` before sending. Use synthetic or project-approved values. Never paste credentials into the prompt.

```text
Capture only. Do not write code, commit, push, or open pull requests.

Repository: airgoods-inc/airgoods
Before SHA: <base-sha>
After SHA: <head-sha>
Commits in range:
<commit list, one "<sha> <subject>" per line>

Database: use dev child branch <neon-branch-id> for both SHAs. It already has the PR's migrations. Do not create a branch.
Buyer: sign in as <test-buyer-email>, who has a multi-brand cart and credit. <If unavailable, use another buyer with a multi-brand cart and credit and record which one. | Do not substitute another buyer.>

Runtime: iPhone 16 on the universal iOS 26.5 runtime with the x86_64 dev client under Rosetta. ML Kit pods exclude arm64 simulators, so other boots show a black screen.
For each SHA, check it out and run the backend, tRPC, web on :3000, and Metro, then capture every shot on that SHA.
Loading and skeleton states: add an artificial delay of <ms> to <request> locally so the state stays visible. Do not commit it.

Shots (capture each on both SHAs with the same account, data, scroll, and actions):
01 <slug>: <screen and state, how to reach it>
02 <slug>: <screen and state, how to reach it>

Deliverables, attached to this session:
- One PNG per shot and side, named <nn>-<slug>-<before|after>.png
- manifest.json: [{"id","title","before","after","commit_before","commit_after","ios_runtime","device","account","notes"}]
In notes, say why any shot could not be captured. When done, stop and wait for me.
```
