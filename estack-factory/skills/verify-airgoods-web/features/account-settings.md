# Account settings
Account settings lets buyers and sellers manage personal details, shared business data, locations, team access, notification preferences, shipping defaults, and account security.

## Sub-features

- `account-settings-entry` covers desktop and compact navigation into role-specific settings.
- `account-personal-profile` covers buyer and seller contact details, profile image, password validation, and logout.
- `buyer-business-profile` covers the retailer’s shared business identity and qualification details.
- `seller-brand-profile` covers the seller’s public brand identity and launch-readiness fields.
- `buyer-shipping-addresses` covers saved shipping addresses and shipping/sample defaults.
- `buyer-locations` covers store locations, their address, store type, and optional payment and shipping defaults.
- `account-team-users` covers listing, inviting, editing, and removing users from the same retailer or seller account.
- `account-notifications` covers the overview plus email and in-app preference channels.
- `seller-shipping-settings` covers sender locations and reusable custom or carrier packages. Shipping profiles and rates at `/account/seller/shipping` remain covered by `seller-operations`.
- `account-security-state` covers protected-route behavior, password safeguards, logout, and the account-deletion request page.

## How to get to it (user POV)

- On a wide viewport, open the account avatar menu and choose `Settings`; this opens the role’s `My Team` page. The account sidebar’s `Settings` button reaches the same page.
- On a compact viewport, open `Airgoods menu`, choose `Settings`, then choose the desired settings item.
- Buyer settings routes:
  - `/account/buyer/settings/users` — `My Team`
  - `/account/buyer/settings/notifications` — `Notifications`
  - `/account/buyer/settings/notifications/in-app` — `In App`
  - `/account/buyer/settings/notifications/email` — `Email`
  - `/account/buyer/settings/locations` — `Locations`
  - `/account/buyer/settings/business-profile` — `Business Profile`
  - `/account/buyer/settings/profile` — `My Profile`
  - `/account/buyer/shipping` — saved shipping addresses
- Seller settings routes:
  - `/account/seller/settings/users` — `My Team`
  - `/account/seller/settings/notifications` — `Notifications`
  - `/account/seller/settings/notifications/in-app` — `In App`
  - `/account/seller/settings/notifications/email` — `Email`
  - `/account/seller/settings/shipping` — `Shipping settings`
  - `/account/seller/settings/profile` — `My Profile`
  - `/account/seller/my-brand` — `My Brand`
- `/account/buyer/settings` and `/account/seller/settings` redirect to their respective `settings/users` route. Legacy `settings/email-preferences` routes redirect to `settings/notifications/email`.
- `/account/delete` opens the public `Request account deletion` page. A signed-in user’s email is prefilled, but the page is also reachable anonymously.

## Driving it

Preconditions:

- Full mode doctor passes. Follow `Authenticated setup` in `../SKILL.md` separately for a buyer with a non-null store and a seller with a non-null supplier.
- Use `/query-local-db` and require the selected user to be non-deleted, have the expected buyer or seller user type, and belong to the store or supplier under test. Record user ID, account type (`Primary` or `Secondary`), store or supplier ID, and seller onboarding/live state.
- Use only the isolated local database. Snapshot every field, default, preference, user, address, location, and package that a reversible check may change.
- For shared-data checks, choose an account whose other users and active orders will not be disrupted. For permission checks, select both a `Primary` and `Secondary` user from the same account.
- Prefer read-only navigation. When a mutation is required, use a unique `Agent QA` marker, verify the result in the UI and with a read-only database query, restore the original value, and verify the restoration before cleanup.

- **Settings entry and role separation.** At wide width, choose `Open buyer account` or `Open seller account`, then choose `Settings`. Require the matching `/account/<role>/settings/users` URL and heading `My Team`. In the settings sidebar, require the role-specific items listed above and choose `Back` to return to main account navigation. At compact width, open dialog `Airgoods menu`, choose `Settings`, and use the visible item text. A buyer must never render seller settings, and a seller must never render buyer settings.
- **Personal profile.** Open `/account/<role>/settings/profile`. Require heading `My Profile`, button `Logout`, section `Personal Information`, fields `First Name`, `Last Name`, `Phone Number`, `Position at <business name>`, and `Email`, plus section `Password` with `Change Password` and `Confirm Password`. Editing a field must reveal `Update`; while saving it shows progress and success is `Profile updated Successfully` or `Profile Updated Successfully`. Change only a harmless text field, reload to prove persistence, then restore it. A request failure has no durable success state; require the original value to remain and retain the failed response as proof.
- **Password validation.** In `My Profile`, enter two different disposable test strings in `Change Password` and `Confirm Password`, choose `Update`, and require `Passwords do not match!`. Clear both fields without submitting matching values. Never change a fixture’s password during routine verification.
- **Buyer business profile.** Open `/account/buyer/settings/business-profile`. Require heading `Business Profile`; wait for the saved values in `Business Name`, `Reseller ID (ie. Certificate of Authority Number for NY)`, `Type of Store`, `Number of locations`, `City`, `State`, `Website`, `Years in Business`, and `Annual Sales`. `Physical store` additionally exposes `Select physical store type` and may expose `Cuisine` or `Other Type of Store`; `Other` exposes `Other Type of Store`. Editing reveals `Update`; success is `Profile updated successfully!`. Restore the original shared store value and reload. Blank fields after a failed account request are an error, not an empty profile.
- **Seller brand profile.** Open `/account/seller/my-brand`. Require heading `My Brand`, `View Brand Page`, and `Brand Page Information`. Wait for the loading progress indicator to disappear and require saved values or explicit missing-field readiness guidance. Stable field text includes `Brand Name`, `Website`, `Instagram`, `Year Established`, `Order Minimum`, `City`, `State`, `Country`, `Description or Story`, `Brand Values`, `Community`, and `Environmental & Social`. Editing reveals `Update`; success is `Profile updated successfully!`. For a reversible check, append an `Agent QA` marker to `Description or Story`, reload and optionally open `View Brand Page`, then restore the exact original. Do not upload, replace, or delete images unless media cleanup is explicitly in scope.
- **Buyer shipping addresses.** Open `/account/buyer/shipping`. Require heading `Shipping`, button `Add Address`, and either address cards or `No addresses found.` Search with `Search by name or address`; a miss must show `No address found`. Scope an address card by its visible recipient/business and address text, then open its adjacent action menu and use `Make Default`, `Make Sample Default`, `Edit`, or `Delete`. Add/edit opens `Add Shipping Address` or `Edit Shipping Address`; required fields include `First Name`, `Last Name`, `Email`, `Address Line 1`, `City`, `State`, `Zip Code`, `Phone Number`, and `Country`. Address validation may show `Confirm Address` with `Address Entered`, `Recommended Address`, and `Save Address`, or `Invalid Address` with `Edit` and `Save Anyway`. Prefer editing and restoring an existing branch-local address. If creating one, delete that exact temporary address after proof.
- **Buyer locations.** Open `/account/buyer/settings/locations`. Require heading `Locations`, button `Add Location`, and cards or `No locations found.` Search with `Search by location name`; a miss must show `No location found`. `Add Location` and `Edit Location` use `Location Name` and `Type of Store`; a physical store also requires `Store type` and `Location Address`. Optional selectors are `Default Shipping Address` and `Default Payment Method`. Save remains disabled until required inputs are complete. Success is `Location created successfully!` or `Location updated successfully!`. A card action menu offers `Make Default`, `Edit`, and `Delete`; the other exact success states are `Location set as default successfully!` and `Location deleted successfully!`. Prefer edit-and-restore. Only create/delete a temporary location when the store will retain another active location.
- **Team users.** Open `/account/<role>/settings/users`. Require heading `My Team`, button `Add User`, and user cards or `Give your team access to your account.` Cards expose buttons `Edit user` and `Delete user`. Buyer add/edit dialogs are `Add Team Member` and `Edit Team Member`, with `First name`, `Last name`, `Job Title`, `Email`, `Phone Number`, `Cancel`, and `Create` or `Update`; seller dialogs use `Add User` or `Edit User`, the same field labels, and `Add` or `Update`. Use a unique non-deliverable `@example.com` address only when invitation side effects are explicitly allowed. Verify the new card, remove that same user through `Delete user`, require dialog `Delete confirmation` and text `Are you sure you want to delete this user?`, choose `Yes`, and require `User deleted successfully!`. Never edit or delete the signed-in user.
- **Team permissions.** Repeat read-only team, business/brand, location, and shipping navigation with `Primary` and `Secondary` users. Treat both as account-wide users unless the rendered UI or response proves a restriction; do not assume `Primary` is an owner-only authorization boundary. A user from another store or supplier must not be visible or editable. Record any difference in visible controls, response status, and resulting state.
- **Notification overview.** Open `/account/<role>/settings/notifications`. Require heading `Notifications` and text `Notifications will always go to your Airgoods inbox.` While loading, accept `Loading…` only as transitional. Failure must show `Could not load notification settings.` and `Try again`. Success shows channel buttons whose accessible names begin `In App notification settings.` and `Email notification settings.`, each with `Enabled for <N> notification(s)`.
- **Notification channels.** Open a channel button or its exact route. Require heading `In App` or `Email`, back link `Notifications`, and the channel description. While loading, accept `Loading preferences…` only as transitional. Failure must show `Could not load preferences.` and `Try again`. Scope a switch by its containing visible preference title and description because editable switches share the name `Toggle notification`. A locked switch is disabled and its accessible name ends `Required for account security.` Flip one editable preference, wait for the request, reload to prove persistence and overview count, then return it to its original value and reload again. A failed update must show `Failed to update notification preference` and roll the switch back.
- **Seller shipping settings.** Open `/account/seller/settings/shipping`. Require heading `Shipping settings` and sections `Sender Locations` and `Saved Custom Packages`, each with its own `Add`. Loading indicators are transitional. Empty states are `Click add to create your first address` and `Click add to create your first package`. The sender-location `Add` opens `Add Shipping Address`; use the same address confirmation and invalid-address states described above. The package `Add` opens `Add Package to account`, with `Custom package`, `Carrier package`, `Package name`, dimensions, units, and empty weight. Card menus expose `Make Default`, `Edit`, and `Delete`; destructive choices require their `Delete confirmation`. Prefer edit-and-restore, or create one uniquely named temporary package and delete it after proof. Do not treat `/account/seller/shipping` profile/rate checks as part of this sub-feature.
- **Logout and protected state.** From `My Profile`, choose `Logout`; require the authenticated account chrome to disappear and a protected settings route to stop rendering the settings page. This ends only the temporary impersonation session and may be followed by a fresh authenticated setup.
- **Deletion request boundary.** Open `/account/delete`. Require heading `Request account deletion`, field `Email`, button `Submit request`, and copy `Deletion is not immediate.` Do not submit during routine verification: submission creates an external review request and the UI offers no cancellation. If explicitly authorized, require the generic success message without using it to infer whether the email belongs to an account.
- **Proof.** Record audience, selected email, user/account/store/supplier IDs, `Primary` or `Secondary`, exact route, initial and final values, empty/loading/error/success state, all created IDs, and cleanup confirmation. Never put passwords, tokens, full personal addresses, invitation links, or private notification contents in evidence.

## Gotchas

- Buyer and seller routes are protected and role-specific, but `/account/delete` is public. A redirect or wrong-role page is not proof of the requested settings surface.
- `Primary` and `Secondary` identify account relationship, not a reliable settings permission split. Shared profile, team, location, address, notification, and shipping changes can affect everyone on the store or supplier.
- Admin impersonation is valid for local navigation and reversible branch-local state checks. It is not proof of analytics, invitation or notification delivery, feedback submission, password-based login, or any behavior that suppresses impersonated sessions.
- Team creation may send an invitation and touch connected systems. Use a non-deliverable test address only with explicit mutation scope, and verify deletion afterward. Deleting a user is a soft account-state change; do not assume it erases historical data.
- Email edits can invalidate future sign-in assumptions. Password changes are not safely reversible unless the original credential is known. Avoid both in routine checks.
- Notification changes are optimistic and show no success toast. Reload the channel and overview to prove persistence; an immediate visual flip alone is insufficient.
- Some profile, team, address, and shipping failures only leave the form open or omit a success toast. Use the observed response plus a second UI/database read; never reinterpret blank content as a valid empty state.
- A buyer’s last active location cannot be deleted. Default location, shipping address, sample address, payment method, sender location, and package changes can affect checkout or fulfillment; restore every prior default.
- Address suggestions and validation can depend on external services. Record `Confirm Address`, `Invalid Address`, or the exact unavailable/error state, and never invent a successful validation.
- Seller brand saves can update launch readiness and, for live brands, public marketplace data asynchronously. Use a harmless reversible text value, wait for the public read only when needed, and restore it.
- Profile and brand image uploads create media side effects and may require asynchronous processing. A visual removal followed by cancel is not cleanup.
- Several card action triggers are icon-only. Anchor to the card’s unique visible name/address/email, take a fresh accessibility snapshot, then use the adjacent menu; never select an action by global DOM position.
