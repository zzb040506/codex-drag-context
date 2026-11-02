const test = require('node:test');
const assert = require('node:assert/strict');
const { createContextSender } = require('../context-sender');
const uri = (path, scheme = 'file') => ({ scheme, toString: () => `${scheme}://${path}` });
function setup(overrides = {}) {
  const calls = [], results = [], errors = [], skipped = [];
  const sender = createContextSender({
    ensureReady: async () => {}, send: async (value) => calls.push(value.toString()),
    onResult: (count) => results.push(count),
    onError: (...args) => errors.push(args), onUnsupported: (count) => skipped.push(count),
    ...overrides,
  });
  return { sender, calls, results, errors, skipped };
}
test('deduplicates local references and reports remote paths', async () => {
  const s = setup();
  await s.sender([uri('/a'), uri('/a'), uri('/remote', 'vscode-remote'), uri('/b')]);
  assert.deepEqual(s.calls, ['file:///a', 'file:///b']);
  assert.deepEqual(s.results, [2]);
  assert.deepEqual(s.skipped, [1]);
});
test('concurrent batches remain ordered', async () => {
  const calls = [];
  const s = setup({ send: async (value) => { await Promise.resolve(); calls.push(value.toString()); } });
  await Promise.all([s.sender([uri('/a'), uri('/b')]), s.sender([uri('/c')])]);
  assert.deepEqual(calls, ['file:///a', 'file:///b', 'file:///c']);
});
test('partial failure reports count and a later batch still works', async () => {
  const s = setup({ send: async (value) => { if (value.toString().endsWith('/b')) throw new Error('failed'); } });
  await s.sender([uri('/a'), uri('/b'), uri('/c')]);
  assert.equal(s.errors[0][1], 1);
  assert.equal(s.errors[0][2], 3);
  await s.sender([uri('/d')]);
  assert.deepEqual(s.results, [1]);
});
test('activation failure dispatches nothing', async () => {
  const s = setup({ ensureReady: async () => { throw new Error('unavailable'); } });
  await s.sender([uri('/a')]);
  assert.equal(s.calls.length, 0);
  assert.equal(s.errors[0][1], 0);
});
test('empty selection does not activate dependency', async () => {
  let activated = false;
  const s = setup({ ensureReady: async () => { activated = true; } });
  await s.sender();
  assert.equal(activated, false);
});
