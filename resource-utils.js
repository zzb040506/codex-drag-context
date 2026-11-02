function parseUriList(value) {
  return value
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

function normalizeResources(resources) {
  const unique = new Map();
  for (const resource of resources ?? []) {
    if (!resource || resource.scheme !== 'file') {
      continue;
    }
    unique.set(resource.toString(), resource);
  }
  return [...unique.values()];
}

module.exports = { normalizeResources, parseUriList };
