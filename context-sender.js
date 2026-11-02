const { normalizeResources } = require('./resource-utils');

// Serialize batches so a second drop cannot interleave with the first one.
function createContextSender({ ensureReady, send, onResult, onError, onUnsupported }) {
  let pending = Promise.resolve();
  return (resources = []) => {
    const input = [...resources];
    const run = async () => {
      const local = normalizeResources(input);
      const unsupported = input.filter((uri) => uri && uri.scheme !== 'file').length;
      if (unsupported) onUnsupported(unsupported);
      if (!local.length) return;
      let sent = 0;
      try {
        await ensureReady();
        for (const uri of local) {
          await send(uri);
          sent += 1;
        }
        onResult(sent);
      } catch (error) {
        onError(error, sent, local.length);
      }
    };
    pending = pending.then(run, run);
    return pending;
  };
}

module.exports = { createContextSender };
