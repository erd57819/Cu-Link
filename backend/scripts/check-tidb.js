const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { getDbOptions } = require('../config/db-options');
const db = require('../config/db');
const createSessionStore = require('../config/session-store');

async function main() {
  let conn;
  let store;
  try {
    const options = getDbOptions();
    assert(options.ssl, 'DB_SSL=true is required for this TLS check');
    conn = await db.promise().getConnection();
    const [result] = await conn.query('SELECT 1 AS ok, DATABASE() AS db');
    // TiDB can return this value as BIGINT; bigNumberStrings preserves it as text.
    assert.equal(String(result[0].ok), '1');
    assert.equal(result[0].db, options.database);
    const [status] = await conn.query("SHOW STATUS LIKE 'Ssl_cipher'");
    assert(status[0]?.Value, 'The connection did not negotiate TLS');
    console.log('[OK] Express: SELECT 1 / database / TLS cipher');

    const required = ['Users', 'Cr_Articles', 'Reports', 'UserArticles', 'ArticleReports', 'sessions'];
    const [tables] = await conn.query('SHOW TABLES');
    const names = tables.map((row) => Object.values(row)[0]);
    const missing = required.filter((name) => !names.includes(name));
    assert.equal(missing.length, 0, `Missing tables: ${missing.join(', ')}`);
    console.log('[OK] Tables: all six required tables are present');
    conn.release();
    conn = undefined;

    store = createSessionStore(db);
    store.clearExpirationInterval();
    await store.onReady();
    store.clearExpirationInterval();
    // Read-only check through the exact session store factory used by server.js.
    await store.get(`culink-connection-check-${randomUUID()}`);
    console.log('[OK] Session store: existing sessions table can be read over the same TLS pool');
    console.log('Connection check complete. No records were inserted or updated.');
  } catch (error) {
    console.error('[FAIL]', error.code || error.name);
    console.error('Check DB_* values, TiDB network rules, trusted CA certificates and the six tables.');
    process.exitCode = 1;
  } finally {
    if (conn) conn.release();
    if (store) {
      store.clearExpirationInterval();
      await store.close().catch(() => {});
    }
    await db.promise().end();
  }
}

main().catch((error) => {
  console.error('[FAIL]', error.code || error.name);
  process.exitCode = 1;
});
