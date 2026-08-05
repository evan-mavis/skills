# Airgoods Runtime

Use when forge runs against the Airgoods monorepo.

## Env layering

- `NODE_ENVIRONMENT=development` always (never `production` for verification).
- Seed missing app `.env` from tracked `.env.example`.
- `DATABASE_URL`:
  - `hosted-db` — host-injected; never edit dotenv; no `$provision-neon-branch`
  - `local-preview` — previewctl `apps/backend/.env.local`; export into process shells; never print
- Task env overrides dotenv. If the app overwrites an already-set `DATABASE_URL`, stop — don't edit dotenv.
- Algolia `*_LOCAL` indexes when `NODE_ENVIRONMENT=development`. Don't switch to `testing` just for `*_DEV`.
- Do not refresh Neon `raw-production` parent (see `docs/previewctl/refresh-database.md`).

## Cloud variables

Always: `NODE_ENVIRONMENT=development`, host `DATABASE_URL`, `ADMIN_PASSWORD` (impersonation;
typically `123` from `.env`), `REDIS_HOST=127.0.0.1`, `REDIS_PORT=6379`.

As needed: `GH_TOKEN` / `LINEAR_API_KEY` if host auth is insufficient; AWS + Algolia from
`.env.example` (search-only key for search; disclose shared indexes before write; never
`NODE_ENVIRONMENT=production` for media — that selects `uploads/`).

Conditional: Stripe test keys + webhook listener for payment flows; `FFMPEG_PATH` /
`FFPROBE_PATH` only if not on `PATH`. Don't enable email/SMS unless the issue requires it.

Connectors (prod Postgres MCP, etc.) are host config — authenticate separately.

## Impersonation (bugs)

Sign in as the **affected user from the ticket**, same account for before/after.

1. Extract email / store / brand / route from the issue.
2. Resolve email via `$query-local-db` on the **isolated** DB (`--database-url-env DATABASE_URL`
   for hosted-db/local-preview). Lookup: email → `"user"`; store → join on `store_id`; brand → join on
   `supplier_id`. Persist `working_contract.repro_actor.email`.
3. Open the surface; login with email + `ADMIN_PASSWORD`. Don't show the password on video.
4. Follow `working_contract.reproduction`. Missing user / failed login → `blocked`.

## Local stack

Seller UI minimum: backend `:8000`, web `:3000`. Redis:

```bash
docker compose -f preview/compose.infrastructure.yaml up -d
```

`pnpm dev` starts the queue; selective: `pnpm --filter @airgoods/backend dev:queue`. Bind the same
DB handoff into backend + worker before jobs.
