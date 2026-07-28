# Airgoods Runtime

Use this reference when `forge-patch` runs against the Airgoods monorepo.

## Environment layering

- Keep `NODE_ENVIRONMENT=development`. Never use `production` for patch verification.
- Create each missing app `.env` from its tracked `.env.example`. Treat the tracked example values as intentional development defaults.
- Inject real cloud credentials as environment secrets. Do not commit them or print their values.
- Set `DATABASE_URL` at runtime from the disposable Neon child branch. Do not save a parent or production URL in Cursor Cloud.
- In local Codex or local Cursor, reuse the checkout's existing ignored `.env` files. A new isolated worktree or hosted agent must not assume those files were copied.

The Airgoods backend chooses `*_LOCAL` Algolia indexes when `NODE_ENVIRONMENT=development`. Do not switch to `testing` merely to select `*_DEV`; that also changes database selection.

## Cursor Cloud variables

Configure these for every `forge-patch` environment:

### Workflow and database lifecycle

- `NEON_API_KEY` — secret
- `NEON_PROJECT_ID` — `billowing-lab-64900636`
- `NEON_PARENT_BRANCH_ID` — `br-old-mud-amx76cuc`
- `NEON_BRANCH_TTL_HOURS` — `24` or less
- `GH_TOKEN` — only when Cursor's GitHub authentication does not already support `gh`, push, and draft PR creation
- `LINEAR_API_KEY` — only when the authenticated Linear connector cannot read the issue, upload the video, or post the evidence comment

The Airgoods production Postgres MCP and other connectors are host configuration, not application `.env` values. Confirm their authentication separately.

### Core application

- `NODE_ENVIRONMENT=development`
- `DATABASE_URL` — supplied dynamically by the bundled Neon branch lifecycle
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

## Redis and queue startup

Start the isolated Redis container:

```bash
docker compose -f preview/compose.infrastructure.yaml up -d
```

Running `pnpm dev` at the repository root already starts `dev:queue`. For a selective stack, start the worker explicitly:

```bash
pnpm --filter @airgoods/backend dev:queue
```

Start only the application services required by the affected flow. Confirm the backend and worker both use the Neon child `DATABASE_URL` and local Redis before triggering jobs.
