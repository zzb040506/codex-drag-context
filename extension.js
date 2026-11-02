const vscode = require('vscode');
const { parseUriList } = require('./resource-utils');
const { createContextSender } = require('./context-sender');

const CODEX_EXTENSION_ID = 'openai.chatgpt';
const CODEX_ADD_FILE_COMMAND = 'chatgpt.addFileToThread';

class DropTargetProvider {
  constructor() {
    this.message = 'Drop files or folders here';
    this.detail = 'Send references to your Codex chat';
    this.changeEmitter = new vscode.EventEmitter();
    this.onDidChangeTreeData = this.changeEmitter.event;
  }

  getTreeItem() {
    const item = new vscode.TreeItem(this.message, vscode.TreeItemCollapsibleState.None);
    item.description = this.detail;
    item.iconPath = new vscode.ThemeIcon('files');
    item.tooltip = 'Drag files or folders from the Explorer and drop them here.';
    item.contextValue = 'codexDropTarget';
    return item;
  }

  getChildren(element) {
    return element ? [] : [this];
  }

  setStatus(count) {
    this.message = count === 1 ? 'Sent 1 reference to Codex' : `Sent ${count} references to Codex`;
    this.detail = 'Drop more files or folders here';
    this.changeEmitter.fire();
  }

  dispose() {
    this.changeEmitter.dispose();
  }
}

class DropController {
  constructor(addResources) {
    this.addResources = addResources;
    this.dropMimeTypes = ['text/uri-list'];
    this.dragMimeTypes = [];
  }

  async handleDrop(_target, dataTransfer) {
    const item = dataTransfer.get('text/uri-list');
    if (!item) {
      return;
    }

    try {
      const uris = parseUriList(await item.asString()).map((value) => vscode.Uri.parse(value, true));
      await this.addResources(uris);
    } catch (error) {
      void vscode.window.showErrorMessage(`Codex Drag Context: Could not read dropped paths. ${error.message ?? error}`);
    }
  }
}

async function ensureCodexCommand() {
  const extension = vscode.extensions.getExtension(CODEX_EXTENSION_ID);
  if (!extension) {
    throw new Error('The OpenAI Codex extension (openai.chatgpt) is not installed.');
  }

  if (!extension.isActive) {
    await extension.activate();
  }

  const commands = await vscode.commands.getCommands(true);
  if (!commands.includes(CODEX_ADD_FILE_COMMAND)) {
    throw new Error(
      `This Codex version does not expose ${CODEX_ADD_FILE_COMMAND}. Update the OpenAI Codex extension.`,
    );
  }
}

function collectCommandResources(resource, selectedResources) {
  if (Array.isArray(selectedResources) && selectedResources.length > 0) {
    return selectedResources;
  }
  return resource ? [resource] : [];
}

function activate(context) {
  const provider = new DropTargetProvider();

  const addResources = createContextSender({
    ensureReady: ensureCodexCommand,
    send: (resource) => vscode.commands.executeCommand(CODEX_ADD_FILE_COMMAND, resource),
    onResult: (count) => provider.setStatus(count),
    onUnsupported: (count) => {
      void vscode.window.showWarningMessage(
        `Codex Drag Context: Skipped ${count} unsupported reference(s). Only local file paths are supported.`,
      );
    },
    onError: (error, sent, total) => {
      if (sent) provider.setStatus(sent);
      const message = error instanceof Error ? error.message : String(error);
      void vscode.window.showErrorMessage(
        `Codex Drag Context: Sent ${sent} of ${total} references. ${message}`,
      );
    },
  });

  const treeView = vscode.window.createTreeView('codexDragContext.dropView', {
    treeDataProvider: provider,
    dragAndDropController: new DropController(addResources),
    showCollapseAll: false,
  });

  const addCommand = vscode.commands.registerCommand(
    'codexDragContext.addToCodex',
    async (resource, selectedResources) => {
      await addResources(collectCommandResources(resource, selectedResources));
    },
  );

  const pickCommand = vscode.commands.registerCommand('codexDragContext.pickAndAdd', async () => {
    const resources = await vscode.window.showOpenDialog({
      title: 'Add files or folders to Codex chat',
      canSelectFiles: true,
      canSelectFolders: true,
      canSelectMany: true,
      openLabel: 'Add to Codex',
    });
    await addResources(resources ?? []);
  });

  context.subscriptions.push(provider, treeView, addCommand, pickCommand);
}

function deactivate() {}

module.exports = { activate, deactivate };
