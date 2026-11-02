const assert = require('node:assert/strict');
const test = require('node:test');
const { normalizeResources, parseUriList } = require('../resource-utils');

test('parseUriList ignores comments and blank lines', () => {
  assert.deepEqual(
    parseUriList('# dragged resources\r\nfile:///tmp/a.js\r\n\r\nfile:///tmp/folder'),
    ['file:///tmp/a.js', 'file:///tmp/folder'],
  );
});

test('normalizeResources keeps unique file resources', () => {
  const file = { scheme: 'file', toString: () => 'file:///tmp/a.js' };
  const remote = { scheme: 'vscode-remote', toString: () => 'vscode-remote:///tmp/b.js' };
  assert.deepEqual(normalizeResources([file, remote, file]), [file]);
});
