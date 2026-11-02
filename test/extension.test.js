const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

function activateFake({ missing = false } = {}) {
  const registered = new Map(), calls = [], errors = [], warnings = [];
  let viewOptions;
  let activations = 0;
  const fake = {
    EventEmitter: class { constructor() { this.event = () => {}; } fire() {} dispose() {} },
    TreeItem: class { constructor(label) { this.label = label; } },
    TreeItemCollapsibleState: { None: 0 }, ThemeIcon: class {},
    Uri: { parse(value) {
      const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(value)?.[1];
      if (!scheme) throw new Error('Invalid URI');
      return { scheme, toString: () => value };
    } },
    extensions: { getExtension: () => missing ? undefined : {
      isActive: false, activate: async () => { activations++; },
    } },
    commands: {
      getCommands: async () => ['chatgpt.addFileToThread'],
      executeCommand: async (...args) => calls.push(args),
      registerCommand: (name, handler) => { registered.set(name, handler); return { dispose() {} }; },
    },
    window: {
      createTreeView: (_id, options) => { viewOptions = options; return { dispose() {} }; },
      showErrorMessage: (message) => errors.push(message),
      showWarningMessage: (message) => warnings.push(message),
      showOpenDialog: async () => undefined,
    },
  };
  const originalLoad = Module._load;
  const target = require.resolve('../extension');
  delete require.cache[target];
  try {
    Module._load = function (id, ...rest) { return id === 'vscode' ? fake : originalLoad.call(this, id, ...rest); };
    require('../extension').activate({ subscriptions: [] });
  } finally {
    Module._load = originalLoad;
    delete require.cache[target];
  }
  return { fake, registered, calls, errors, warnings, viewOptions, activations: () => activations };
}

test('Explorer multi-selection is dispatched to Codex instead of only the clicked item', async () => {
  const s = activateFake();
  const a = s.fake.Uri.parse('file:///a'), b = s.fake.Uri.parse('file:///b');
  await s.registered.get('codexDragContext.addToCodex')(a, [a, b]);
  assert.deepEqual(s.calls.map(([command, uri]) => [command, uri.toString()]), [
    ['chatgpt.addFileToThread', 'file:///a'], ['chatgpt.addFileToThread', 'file:///b'],
  ]);
  assert.equal(s.viewOptions.treeDataProvider.getTreeItem().label, 'Sent 2 references to Codex');
});
test('drop handles Explorer URI lists and reports unsupported resources', async () => {
  const s = activateFake();
  await s.viewOptions.dragAndDropController.handleDrop(undefined, new Map([
    ['text/uri-list', { asString: async () => '# comment\r\nfile:///a\r\nfile:///a\nvscode-remote:///b' }],
  ]));
  assert.equal(s.calls.length, 1);
  assert.equal(s.warnings.length, 1);
});
test('malformed drop produces an error without rejecting or dispatching', async () => {
  const s = activateFake();
  await s.viewOptions.dragAndDropController.handleDrop(undefined, new Map([
    ['text/uri-list', { asString: async () => 'invalid-path' }],
  ]));
  assert.equal(s.errors.length, 1);
  assert.equal(s.calls.length, 0);
});
test('missing Codex extension produces an actionable error', async () => {
  const s = activateFake({ missing: true });
  await s.registered.get('codexDragContext.addToCodex')(s.fake.Uri.parse('file:///a'));
  assert.match(s.errors[0], /openai.chatgpt/);
  assert.equal(s.calls.length, 0);
});
test('cancelled picker does not activate Codex', async () => {
  const s = activateFake();
  await s.registered.get('codexDragContext.pickAndAdd')();
  assert.equal(s.activations(), 0);
});
