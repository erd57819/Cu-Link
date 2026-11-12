const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function controller(query) {
  const context = { exports: {}, require: () => ({ query }), console: { log() {}, error() {} } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../controller/reportController.js'), 'utf8'), context);
  return context.exports;
}
function response() {
  return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } };
}
test('missing login returns 401 without querying or exposing reports', () => {
  const api = controller(() => assert.fail('No query should be made'));
  const res = response();
  api.getReport({ session: {} }, res);
  assert.equal(res.statusCode, 401);
});
test('only the session user is queried, newest reports first, with exact string IDs', () => {
  const rows = [{ rep_id: '3043337986403649736', rep_title: 'fixture' }];
  const api = controller((sql, values, done) => {
    assert.deepEqual(Array.from(values), ['test-user']);
    assert.match(sql, /WHERE user_id = \?/);
    assert.match(sql, /ORDER BY rep_date DESC/);
    done(null, rows);
  });
  const res = response();
  api.getReport({ session: { userId: 'test-user' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.data, rows);
});
test('a database failure returns 500 instead of a misleading empty list', () => {
  const api = controller((sql, values, done) => done(new Error('offline fixture')));
  const res = response();
  api.getReport({ session: { userId: 'test-user' } }, res);
  assert.equal(res.statusCode, 500);
});
