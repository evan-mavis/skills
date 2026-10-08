# Warehouse authentication and Olive

Warehouse authentication restricts operator access to admins, while Warehouse Olive lets operators inspect usage, logs, and individual conversations without intervening unless explicitly required.

## Sub-features

- `warehouse-login` covers validation, permission rejection, successful admin login, and sign-out.
- `auth-user-sessions` covers session filtering and deletion boundary.
- `auth-api-keys` covers API key listing and creation boundary.
- `olive-kpis` covers Warehouse Olive metrics.
- `olive-logs` covers conversation logs and detail.
- `olive-intervention` covers takeover, hand-back, reply, and review-save boundaries.

## How to get to it (user POV)

- Unauthenticated operators use `/login`; protected `/home/*` routes redirect there.
- Choose Auth → `User Sessions` or `API`.
- Choose `Olive` for `/home/olive`; use its KPI/Logs tabs and open `/home/olive/<conversationId>`.
- Use `Sign Out` in the Warehouse sidebar.

## Driving it

Preconditions:

- Runtime doctor passes.
- Use `/query-local-db` to select an active Admin account. Buyer or seller accounts must be rejected even when using the admin password bypass.
- Use read-only conversation fixtures. Never expose authentication tokens, API keys, user prompts, or private conversation content.

- **Login validation.** Open `/login`; require `Email`, `Password`, and `Sign In`. Exercise malformed email or too-short password and require validation without submitting real credentials.
- **Permission rejection.** When explicitly testing authorization, use a dedicated non-admin fixture and require `You do not have permission to access the warehouse dashboard.` End that session before admin setup.
- **Admin login.** Follow the parent Authentication section. Require final `/home`, Warehouse sidebar, and operator chrome.
- **User sessions.** Require `User Sessions` and applicable Created via/App filters. Inspect rows only; deleting a session can sign out users and is not a routine verification action.
- **API keys.** Require `API` and existing key metadata or explicit empty state. Open create and cancel. Never create, copy, reveal, or record a key during routine verification.
- **Olive dashboards.** Open `/home/olive`; require `Olive`, `KPIs`, and `Logs`. Verify metrics/table or explicit empty/error state, then open one conversation when test-safe.
- **Olive conversation.** Inspect the thread and intervention controls such as `Force takeover`, `Hand back to Olive`, `Reply as Olive`, or `Send message`. Do not invoke them or save a review unless explicitly scoped with synthetic content and cleanup.
- **Sign out.** Choose `Sign Out`; require the Warehouse session to end and a protected route to redirect to `/login`.
- **Proof.** Record only admin ID/email when safe, route, selected filters, conversation ID, and state. Redact all credentials, keys, prompts, messages, and user identity from artifacts.

## Gotchas

- `ADMIN_PASSWORD` authenticates the selected account but does not turn a buyer or seller into an Admin; Warehouse still rejects non-admin user types.
- Login can have competing redirect paths; require final `/home` operator chrome.
- Session deletion, API key creation, Olive takeover/hand-back/reply, and review saves are persistent or user-impacting.
- Olive metrics and logs may contain sensitive prompts and account context. Use synthetic fixtures or redact evidence.
- Sign-out is safe only for the temporary verification session.
