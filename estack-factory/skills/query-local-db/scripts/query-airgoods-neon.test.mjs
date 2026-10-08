import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseRequest, queryReadOnly, validateSql } from './query-airgoods-neon.mjs';

const args = ['--database-url-env', 'TASK_DB', '--project-id', 'project-test', '--branch-id', 'br-test', '--expected-host', 'ep-test.neon.tech', '--expected-database', 'stack', '--show-source'];
const env = { TASK_DB: 'postgresql://test:fake-secret@ep-test.neon.tech/stack' };

test('only the explicit matching endpoint and database are accepted', () => {
  const target = parseRequest(args, env);
  assert.equal(target.host, 'ep-test.neon.tech');
  assert.equal(target.database, 'stack');
  assert.throws(() => parseRequest(args, { DATABASE_URL: env.TASK_DB }), /unset/);
  assert.throws(() => parseRequest(args, { TASK_DB: 'postgresql://test:fake-secret@ep-other.neon.tech/stack' }), /does not match/);
  assert.throws(() => parseRequest(args, { TASK_DB: 'postgresql://test:fake-secret@ep-test.neon.tech/other' }), /does not match/);
  assert.throws(() => parseRequest(args, { TASK_DB: 'postgresql://test:fake-secret@localhost/stack' }), /Neon/);
});

test('SELECT guard rejects transaction escape, stacked statements, and mutations', () => {
  assert.equal(validateSql(' select id from public.supplier limit 10; '), 'select id from public.supplier limit 10');
  for (const sql of ['update supplier set name = 1', 'select 1; commit; select 2', 'select 1 /* hidden */', 'select set_config(\'transaction_read_only\', \'off\', false)', 'select nextval(\'ids\')', 'select 1 into scratch']) {
    assert.throws(() => validateSql(sql), /read-only SELECT/);
  }
});

function databaseFixture(database = 'stack', readOnly = 'on') {
  let active = false;
  let released = false;
  let count = 0;
  return {
    state: () => ({ active, released, count }),
    connect: async () => ({
      async query(sql) {
        if (sql === 'BEGIN READ ONLY') { active = true; return; }
        if (sql === 'ROLLBACK') { active = false; return; }
        if (!active) throw new Error('Query outside transaction');
        if (sql.startsWith('SET LOCAL')) return;
        if (sql.includes('current_database()')) return { rows: [{ database, read_only: readOnly }] };
        count++;
        if (sql === 'select id from supplier limit 1') return { rows: [{ id: 'supplier-test' }] };
        throw new Error('query failed');
      },
      release() { released = true; },
    }),
  };
}

test('query returns rows in a verified transaction and releases it', async () => {
  const pool = databaseFixture();
  assert.deepEqual(await queryReadOnly(pool, { database: 'stack', sql: 'select id from supplier limit 1' }), { rows: [{ id: 'supplier-test' }] });
  assert.deepEqual(pool.state(), { active: false, released: true, count: 1 });
});

test('verification failures prevent substantive SQL and release the transaction', async () => {
  for (const pool of [databaseFixture('other'), databaseFixture('stack', 'off')]) {
    await assert.rejects(queryReadOnly(pool, { database: 'stack', sql: 'select id from supplier limit 1' }), /verification failed/);
    assert.deepEqual(pool.state(), { active: false, released: true, count: 0 });
  }
  const pool = databaseFixture();
  await assert.rejects(queryReadOnly(pool, { database: 'stack', sql: 'select broken()' }), /query failed/);
  assert.deepEqual(pool.state(), { active: false, released: true, count: 1 });
});

test('CLI reports an invalid target without printing credentials or trying defaults', () => {
  const script = fileURLToPath(new URL('./query-airgoods-neon.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', env: { TASK_DB: 'postgresql://test:fake-secret@localhost/stack' } });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /I RAN INTO AN ISSUE:/);
  assert.doesNotMatch(result.stdout + result.stderr, /fake-secret|postgresql:\/\//);
});


test('rollback failure still releases the connection', async () => {
  let released = false;
  const pool = {
    connect: async () => ({
      async query(sql) {
        if (sql === 'ROLLBACK') throw new Error('cleanup failed');
        if (sql.includes('current_database()')) return { rows: [{ database: 'stack', read_only: 'on' }] };
        return { rows: [{ id: 'supplier-test' }] };
      },
      release() { released = true; },
    }),
  };
  await assert.rejects(queryReadOnly(pool, { database: 'stack', sql: 'select id from supplier limit 1' }), /cleanup failed/);
  assert.equal(released, true);
});
