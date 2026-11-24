# Review feedback storage

## Sites

Use shared feedback for reviews where someone will leave comments for later implementation. Keep one Site and database per review. Use the Site's existing access policy and built-in sign-in. Approvals belong to the signed-in reviewer and the comparison in its round. Comments belong to a comparison in a round and are visible to people with access to the private review. A checked **Looks good to me** box records explicit approval.

Read the current Sites storage and identity references before deployment. Use the supported server-backed starter or migrate the existing static Site in place. Preserve the Site ID, audience, asset URLs, review routes, and review history.

1. Copy the [server handler](../assets/server/review-feedback.mjs) into the server source. Add the [schema](../assets/server/schema.ts) to the starter's Drizzle schema. Declare D1 using the Sites hosting manifest and generate the migration using the starter. Keep deployed tables and migrations across rounds.
2. Mount the handler as GET and POST at `/api/ui-review`. Pass the request, the server-bound D1 database, and the same review data used by the frontend. In the Vinext starter, put the canonical `review.json` outside `public/`, import it from the API route, and copy it byte-for-byte into the served asset directory on build. Use the starter's D1 binding from `cloudflare:workers`. Use the route example below for signed-in request-time feedback.
3. Set `"feedbackStorage": "shared"` in the review data. The frontend then requires a successful server load and write. A failed shared write leaves the comment available to retry.
4. Test with a signed-in preview and read back saved approvals and comments. Verify that a second reviewer gets their own approval state and can see the same comments. Keep the database and stable round/comparison keys when publishing later rounds. If upgrading from inspection-only checkboxes, create the new approvals table with an additive migration and keep old checks out of it.

Example for `app/api/ui-review/route.ts` with a `DB` binding:

```ts
import { env } from "cloudflare:workers";
import review from "@/data/review.json";
import { reviewFeedback } from "@/lib/review-feedback.mjs";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return reviewFeedback(request, env.DB, review);
}

export const POST = GET;
```

For a buildless or local review, omit `feedbackStorage` to use browser storage. The page identifies this mode. Download feedback to collect the whole review's comments and approvals as JSON with stable comparison links. Attach that file to the review chat or issue when handing off. Browser storage is specific to the review URL and browser profile.

## Batch feedback

For a deployed shared review, use Sites' database overview and paginated table reads to collect `ui_review_comments` and `ui_review_approvals`. Follow the returned cursor or offset until exhausted. Match each row's `view` to its round and comparison and use the comment ID to avoid duplicate work. The comparison link is the Site URL with `#round-id/comparison-id`. Use downloaded JSON if access to the database is unavailable. Keep reviewer text in the original record and track each request's disposition in durable review data.

## Platform choice

Keep Sites for togglable highlights, matched-image enlargement, and keyboard and hash navigation through many states. Browser-local Sites is the lightest setup. Shared feedback adds a server route, a migration, and a deployment check, then each round reuses them.

Notion supplies saved checkboxes, block comments, and collapsible groups with no custom backend. It is a good fit when those built-in collaboration features matter most or Sites is unavailable on the target platform. It can attach comments to an image block. For precise visual highlighting, the Notion workflow uses annotated viewing copies and keeps untouched originals separately. That adds capture and upload work and gives up the overlay toggle. Avoid keeping duplicate reviews in both platforms unless the user asks for it.
