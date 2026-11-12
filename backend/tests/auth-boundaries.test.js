const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
function load(file, db, extra = {}) {
  const context = { exports: {}, require: () => db, console: { log() {}, error() {} }, process: { env: {} }, ...extra };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../controller', file), 'utf8'), context);
  return context.exports;
}
function response() {
  return { statusCode: 200, status(code) { this.statusCode = code; return this; },
    json(data) { this.data = data; return this; }, send(data) { this.data = data; return this; },
    set() {}, clearCookie(name) { this.cleared = name; } };
}
test('login fails if saving its new server session fails', () => {
  const api = load('loginController.js', { query(sql, args, done) { done(null, [{ user_id: 'owner' }]); } });
  const session = { regenerate(done) { done(); }, save(done) { done(new Error('offline')); }, destroy(done) { done(); } };
  const res = response(); api.login({ body: { id: 'owner', pw: 'fixture' }, session }, res);
  assert.equal(res.statusCode, 503); assert.equal(res.data.result, 'fail');
});
test('blank signup and login fields are rejected without querying', () => {
  const api = load('loginController.js', { query() { assert.fail('Must not query'); } });
  for (const method of ['register', 'login', 'resetPassword']) {
    const res = response(); api[method]({ body: {} }, res); assert.equal(res.statusCode, 400);
  }
});
test('logout destroys the session before expiring its cookie', () => {
  const api = load('loginController.js', {}); let destroyed = false; const res = response();
  api.logout({ session: { destroy(done) { destroyed = true; done(); } } }, res);
  assert.equal(destroyed, true); assert.equal(res.cleared, 'session_cookie_name'); assert.equal(res.data.result, 'success');
});
test('report article lookup always scopes the report to the server account', () => {
  const api = load('reportController.js', { query(sql, values, done) {
    assert.match(sql, /R.user_id = \?/); assert.deepEqual(Array.from(values), ['123', 'owner']); done(null, []);
  } });
  const res = response(); api.getReportArticles({ params: { rep_id: '123' }, session: { userId: 'owner' } }, res);
  assert.equal(res.statusCode, 200); assert.equal(res.data.length, 0);
});
test('another account cannot delete a report or its linked articles', async () => {
  const queries = []; let rolledBack = false;
  const connection = { async beginTransaction() {}, async query(sql, values) { queries.push({ sql, values }); return [[]]; },
    async rollback() { rolledBack = true; }, release() {} };
  const api = load('reportController.js', { promise: () => ({ getConnection: async () => connection }) });
  const res = response(); await api.deleteReport({ params: { rep_id: 'other-report' }, session: { userId: 'owner' } }, res);
  assert.equal(res.statusCode, 404); assert.equal(rolledBack, true); assert.equal(queries.length, 1);
  assert.match(queries[0].sql, /user_id = \?/); assert.deepEqual(Array.from(queries[0].values), ['other-report', 'owner']);
});
test('a verified report delete commits both removals on one connection', async () => {
  const operations = [];
  const connection = { async beginTransaction() { operations.push('begin'); }, async query(sql) { operations.push(sql); return [[{ rep_id: '123' }]]; },
    async commit() { operations.push('commit'); }, async rollback() { assert.fail('Must commit'); }, release() { operations.push('release'); } };
  const api = load('reportController.js', { promise: () => ({ getConnection: async () => connection }) });
  const res = response(); await api.deleteReport({ params: { rep_id: '123' }, session: { userId: 'owner' } }, res);
  assert.equal(res.statusCode, 200); assert.equal(operations.length, 6); assert.equal(operations[4], 'commit');
});
test('report save proxy replaces a submitted account with the server account', async () => {
  const api = load('privateApiProxy.js', {}, { AbortSignal, fetch: async (url, options) => {
    assert.equal(JSON.parse(options.body).user_id, 'owner'); assert.equal(options.headers.Cookie, 'session_cookie_name=signed-cookie');
    return { status: 200, json: async () => ({ message: 'saved' }) };
  } });
  const res = response(); await api.saveReport({ session: { userId: 'owner' }, headers: { cookie: 'session_cookie_name=signed-cookie' }, body: { user_id: 'forged-user' } }, res);
  assert.equal(res.statusCode, 200);
});
