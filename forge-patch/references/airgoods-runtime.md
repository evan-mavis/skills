# Airgoods Runtime

Use this reference when `forge-patch` runs against the Airgoods monorepo.

## Environment layering

- Keep `NODE_ENVIRONMENT=development`. Never use `production` for patch verification.
- Create each missing app `.env` from its tracked `.env.example`. Treat the tracked example values as intentional development defaults.
- Inject real cloud credentials as environment secrets. Do not commit them or print their values.
- Set `DATABASE_URL` only through the protected task-scoped handoff returned by
  `$provision-neon-branch`. Load it into every database-dependent process and verify the active
  child identity before use. Never save the child, parent, or production URL in `.env`,
  `.env.local`, another dotenv file, a shell profile, or Cursor Cloud configuration.
- In local Codex or local Cursor, reuse the checkout's existing ignored `.env` files. A new isolated worktree or hosted agent must not assume those files were copied.

Tracked example values and existing ignored dotenv files provide ordinary development defaults
only. The task-scoped process environment must override them. If the application's configuration
loader overwrites an already-set `DATABASE_URL`, stop rather than editing a dotenv file.

The Airgoods backend chooses `*_LOCAL` Algolia indexes when `NODE_ENVIRONMENT=development`. Do not switch to `testing` merely to select `*_DEV`; that also changes database selection.

Infrastructure owns the periodic Render production snapshot import into Neon's `raw-production`
parent. Its operational documentation lives in `docs/previewctl/refresh-database.md`; agents
running `forge-patch` must not perform the parent refresh.

## Cursor Cloud variables

Configure these for every `forge-patch` environment:

### Workflow and database lifecycle

- `NEON_API_KEY` — secret
- `NEON_PROJECT_ID` — `billowing-lab-64900636`
- `NEON_PARENT_BRANCH_ID` — `br-old-mud-amx76cuc`
- `NEON_BRANCH_TTL_HOURS` — `24` or less
- `PREVIEWCTL_ENV_NAME`
- `GH_TOKEN` — only when Cursor's GitHub authentication does not already support `gh`, push, and draft PR creation
- `LINEAR_API_KEY` — only when the authenticated Linear connector cannot read the issue, upload the video, or post the evidence comment

The Airgoods production Postgres MCP and other connectors are host configuration, not application `.env` values. Confirm their authentication separately.

### Core application

- `NODE_ENVIRONMENT=development`
- `DATABASE_URL` — supplied dynamically through `$provision-neon-branch`'s protected task-scoped
  handoff; do not persist its value in Cursor settings
- `ADMIN_PASSWORD` — use the value from `.env` for admin-password bypass during impersonation
  login; it is typically `123`
- `REDIS_HOST=127.0.0.1`
- `REDIS_PORT=6379`

### AWS development storage

- `AWS_ACCESS_KEY` — secret
- `AWS_SECRET_KEY` — secret
- `AWS_BUCKET_NAME`
- `AWS_BUCKET_NAME_OLD`
- `AWS_BUCKET_NAME_AIRGOODS`
- `AWS_BUCKET_REGION`

Airgoods uses shared buckets and isolates non-production media under `uploads-testing/`. Never set `NODE_ENVIRONMENT=production`; that selects the `uploads/` prefix. Restrict mutations to task-created objects and never delete a broad prefix.

### Algolia

- `ALGOLIA_APP_ID`
- `ALGOLIA_SECRET_KEY` — secret; required only for indexing or configuration writes
- `ALGOLIA_SEARCH_ONLY_KEY`
- `ALGOLIA_PRODUCT_INDEX_LOCAL`
- `ALGOLIA_PRODUCT_EXPERIMENT_INDEX_LOCAL`
- `ALGOLIA_PRODUCT_INDEX_CREATED_AT_SORT_LOCAL`
- `ALGOLIA_PRODUCT_INDEX_BEST_SELLERS_SORT_LOCAL`
- `ALGOLIA_PRODUCT_INDEX_PRICE_LOW_HIGH_SORT_LOCAL`
- `ALGOLIA_PRODUCT_INDEX_PRICE_HIGH_LOW_SORT_LOCAL`
- `ALGOLIA_PRODUCT_INDEX_MARGIN_SORT_LOCAL`
- `ALGOLIA_PRODUCT_INDEX_BRAND_ORDER_SORT_LOCAL`
- `ALGOLIA_BRAND_INDEX_LOCAL`
- `ALGOLIA_BRAND_EXPERIMENT_INDEX_LOCAL`
- `ALGOLIA_BRAND_INDEX_SAMPLE_BOX_LOCAL`
- `ALGOLIA_QUERY_CONCEPT_INDEX_LOCAL`
- `ALGOLIA_EVENTS_ENABLED=disabled` unless the patch explicitly validates event delivery
- `VITE_APP_ALGOLIA_APP_ID`
- `VITE_APP_ALGOLIA_API_KEY`

Use the tracked `.env.example` index names unless the task explicitly requires a different isolated index. Search-only validation must not receive the Algolia write key. Before an indexing write, confirm the selected index is non-production and disclose that it is shared; create a task-specific index when destructive or collision-prone verification is required.

## Conditional variables

Set these only when the affected flow needs them:

### Payments

- `STRIPE_SECRET_KEY_LOCAL` — Stripe test-mode secret
- `STRIPE_PAYMENT_WEBHOOK_SECRET_LOCAL` — produced by the Stripe webhook listener

Ordinary local payment flows use Stripe test mode. Start a Stripe CLI listener only for webhook-dependent verification.

### Video processing

- `FFMPEG_PATH` — only when `ffmpeg` is not discoverable on `PATH`
- `FFPROBE_PATH` — only when `ffprobe` is not discoverable on `PATH`

Install both binaries when validating video processing.

Do not enable or test email or SMS unless the patch explicitly concerns them. Other integrations remain disabled through their tracked `*_ENABLED` defaults until the affected code proves they are required.

## Seller UI verification

The minimum stack for seller UI verification is:

- backend on port `8000`
- web on port `3000`

Use `ADMIN_PASSWORD` from `.env` for the admin-password bypass when the flow requires impersonation
login. Start workers, Redis, or other services only when the affected flow needs them.

## Redis and queue startup

Start the isolated Redis container:

```bash
docker compose -f preview/compose.infrastructure.yaml up -d
```

Running `pnpm dev` at the repository root already starts `dev:queue`. For a selective stack, start the worker explicitly:

```bash
pnpm --filter @airgoods/backend dev:queue
```

Start only the application services required by the affected flow. Load the same protected
task-scoped database handoff into the backend and worker, then confirm both use the selected Neon
child and local Redis before triggering jobs.
