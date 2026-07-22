# Test scenario catalog

Apply the relevant categories to each actor, entry point, state transition, input, and side effect discovered in the branch diff. Favor depth and risk-relevant combinations over repetitive cosmetic variants.

## 1. Core workflows

- Complete each primary workflow from every affected role.
- Exercise first use and repeat use.
- Verify view, create, edit, cancel, submit, and delete/archive when present.
- Confirm the next actor sees the resulting state.
- Test the feature with the smallest and largest realistic local datasets.

## 2. Permissions and tenancy

- Correct role, wrong role, logged out, disabled account, and feature-disabled account.
- Direct URL access without navigating through the UI.
- Cross-organization or cross-tenant identifiers.
- Record ownership changes after the page loads.
- Admin/internal override versus customer controls.
- Read-only versus edit permissions.

## 3. Data states

- Empty, one item, many items, and pagination thresholds.
- Eligible and ineligible records.
- Every lifecycle status referenced by code or migration.
- Missing optional relation, null legacy field, soft-deleted relation, and stale reference.
- Duplicate-looking records and records with identical display names.
- Single versus multiple locations, brands, products, organizations, or feature-specific entities.

## 4. Inputs and validation

- Required field omitted, whitespace-only, minimum, maximum, and beyond maximum.
- Unicode, emoji, punctuation, multiline, rich text, pasted text, and HTML-like input.
- Duplicate submission and rapid double-click.
- Invalid identifiers and deleted referenced records.
- Numeric zero, negative, fractional, maximum, and formatting boundaries when relevant.
- File type, size, count, cancellation, retry, and duplicate upload when relevant.

## 5. Dates, time, and lifecycle

- Same-day, multi-day, past, today, future, reversed, overlapping, and boundary dates.
- Month/year boundaries, leap day, daylight-saving transitions, and different timezones.
- Every allowed state transition and attempted illegal transition.
- Repeating an already completed transition for idempotency.
- Scheduled workers running late, twice, or after manual intervention.
- Records missing the date needed for automatic progression.

## 6. Search, filters, sorting, and lists

- Exact, partial, case-insensitive, whitespace, punctuation, and no-result searches.
- Each filter alone and meaningful filter combinations.
- Counts before and after filtering or mutation.
- Ascending/descending sorting, equal values, null values, and stable ordering.
- Pagination after search, filter, create, update, or delete.
- Selected row disappearing after a state change.

## 7. Navigation and client state

- Deep link, reload, back, forward, new tab, and bookmarked URL.
- Unsaved changes followed by navigation or modal close.
- Modal open/close/reopen and nested navigation.
- Stale page after another actor updates the record.
- Session expiration during a form or decision.
- Reopening a pending or partially completed workflow.

## 8. Messaging, email, and notifications

- Correct sender, recipient, actor, and tenant.
- Correct context, status, dates, location, and CTA destination.
- Unread counts and per-actor read state.
- Duplicate event delivery, retry, and idempotency.
- Approved, declined, live, completed, failed, and cancelled variants when implemented.
- HTML and plain-text rendering, long content, and missing optional context.

## 9. Errors and resilience

- Loading, empty, partial, and explicit error states.
- API failure, timeout, malformed response, and dependency unavailable.
- Retry after failure without duplicate side effects.
- Worker unavailable or delayed.
- Network interruption during submit or upload.
- Validation error recovery without losing valid input.

## 10. Concurrency and consistency

- Two actors update the same record.
- Two tabs submit the same action.
- Read stale state, then attempt a decision.
- Background lifecycle transition during a manual action.
- Repeated webhook, queue job, or notification event.
- UI, API, database, messages, email, admin, and audit timeline agree on final state.

## 11. Accessibility and presentation

- Keyboard-only navigation and visible focus.
- Accessible names for controls, dialogs, media, and status.
- Logical tab order and focus restoration after modal close.
- Text zoom, narrow viewport, overflow, truncation, and long translated-like content.
- Status conveyed by text, not color alone.
- Reduced motion behavior when animation is introduced.

## 12. Operations, audit, and regression

- Admin listing and request editing when applicable.
- Actor, reason, timestamps, before/after values, and email delivery in the audit trail.
- Internal-only data remains hidden from customer roles.
- Existing adjacent workflow still functions.
- Parity with the product surface the branch claims to match.
- Analytics or event emission occurs once with the correct actor and context.

## Combination strategy

Use pairwise combinations for high-risk dimensions. Examples:

- Role × lifecycle state.
- Eligibility × data volume.
- Date boundary × timezone.
- Execution mode × location choice.
- Notification type × recipient role.
- Permission × direct-link access.

Add three-way combinations when the diff couples the dimensions or a failure would be severe. Avoid exhaustive low-value permutations that repeat the same implementation path.
