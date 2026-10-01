import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const help = `Query a caller-verified Neon development branch over WebSocket, read-only.
Usage: bash query-airgoods-local.sh --database-url-env DATABASE_URL \\
  --project-id <verified-project> --branch-id <verified-branch> \\
  --expected-host <verified-endpoint-host> --expected-database <verified-database> \\
  [--show-source] [-c "select ..."]
Run from a package with @neondatabase/serverless and ws already installed.
Credentials are read only from the named environment variable. No target fallback.`;

export function parseRequest(args, env) {
  const options = {};
  const flags = new Map([
    ['--database-url-env', 'envName'], ['--project-id', 'projectId'],
    ['--branch-id', 'branchId'], ['--expected-host', 'host'],
    ['--expected-database', 'database'], ['-c', 'sql'],
  ]);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--show-source') options.showSource = true;
    else if (flags.has(args[i]) && args[i + 1] && !options[flags.get(args[i])]) {
      options[flags.get(args[i])] = args[++i];
    } else throw new Error('Unsupported, repeated, or incomplete argument. Use --help.');
  }
  for (const key of ['envName', 'projectId', 'branchId', 'host', 'database']) {
    if (!options[key]) throw new Error(`Missing verified target argument ${key}. Use --help.`);
  }
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(options.envName)) throw new Error('Invalid environment variable name.');
  if (!env[options.envName]) throw new Error('Named credential environment variable is unset.');
  let url;
  try { url = new URL(env[options.envName]); }
  catch { throw new Error('Invalid database URL.'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname.endsWith('.neon.tech')) {
    throw new Error('Expected a Neon PostgreSQL URL.');
  }
  if (url.hostname !== options.host || decodeURIComponent(url.pathname.slice(1)) !== options.database) {
    throw new Error('Credential endpoint/database does not match the verified target.');
  }
  if (!options.showSource && !options.sql) throw new Error('Provide --show-source or -c SQL.');
  if (options.sql) validateSql(options.sql);
  return { ...options, connectionString: url.href };
}

export function validateSql(sql) {
  const statement = sql.trim().replace(/;$/, '');
  if (!/^select\b/i.test(statement) || /;|--|\/\*|\*\//.test(statement)
      || /\b(insert|update|delete|merge|create|alter|drop|truncate|copy|call|do|set|reset|begin|commit|rollback|into|nextval|setval|set_config|pg_sleep|pg_advisory\w*|dblink\w*|lo_import|lo_export)\b/i.test(statement)) {
    throw new Error('Only one clearly read-only SELECT is supported; comments and control/mutation statements are rejected.');
  }
  return statement;
}

export async function queryReadOnly(pool, request) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN READ ONLY');
    await client.query("SET LOCAL statement_timeout = '15s'");
    const verification = await client.query("select current_database() as database, current_setting('transaction_read_only') as read_only");
    if (verification.rows[0]?.database !== request.database || verification.rows[0]?.read_only !== 'on') {
      throw new Error('Database/read-only verification failed.');
    }
    return request.sql ? await client.query(validateSql(request.sql)) : verification;
  } finally {
    try { await client.query('ROLLBACK'); }
    finally { client.release(); }
  }
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(help);
    return;
  }
  let pool;
  try {
    const request = parseRequest(process.argv.slice(2), process.env);
    const require = createRequire(resolve(process.cwd(), 'package.json'));
    const { Pool, neonConfig } = require('@neondatabase/serverless');
    neonConfig.webSocketConstructor = require('ws');
    pool = new Pool({ connectionString: request.connectionString, connectionTimeoutMillis: 10000 });
    console.error(`query-airgoods-local: project=${request.projectId} branch=${request.branchId} database=${request.database} host=${request.host} via=${request.envName}`);
    const result = await queryReadOnly(pool, request);
    console.log(JSON.stringify(result.rows, null, 2));
  } catch {
    console.error('I RAN INTO AN ISSUE: Neon query failed or its target/input could not be verified. No target was changed. Check verified target arguments, named credential variable, read-only SELECT, and installed @neondatabase/serverless/ws dependencies.');
    process.exitCode = 1;
  } finally {
    if (pool) {
      try { await pool.end(); }
      catch {
        console.error('I RAN INTO AN ISSUE: Neon connection cleanup failed. No target was changed. Check the installed WebSocket driver and network availability.');
        process.exitCode = 1;
      }
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
