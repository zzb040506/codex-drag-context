// Maintainer helper: publish this project after `gh auth login`.
const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { homedir } = require('node:os');
const { join } = require('node:path');
const repo = 'zzb040506/codex-drag-context';
const version = require('../package.json').version;
const localGh = join(homedir(), '.local', 'bin', 'gh');
const gh = existsSync(localGh) ? localGh : 'gh';
function run(command, args, { capture = false, allowFailure = false } = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0 && !allowFailure) throw new Error(`${command} ${args[0]} failed; resolve the error above and retry.`);
  return { ok: result.status === 0, output: (result.stdout || '').trim() };
}
try {
  run(gh, ['auth', 'status']);
  const account = run(gh, ['api', 'user', '--jq', '.login'], { capture: true }).output;
  if (account !== 'zzb040506') throw new Error(`Expected maintainer zzb040506, got ${account}. Switch GitHub accounts first.`);
  if (run('git', ['status', '--porcelain'], { capture: true }).output) throw new Error('Commit your project changes before publishing.');
  run('npm', ['run', 'check']);
  run('npm', ['run', 'package']);
  const existing = run(gh, ['repo', 'view', repo, '--json', 'nameWithOwner'], { capture: true, allowFailure: true });
  if (!existing.ok) run(gh, ['repo', 'create', repo, '--public', '--description', 'Less path copying. More coding. Drag local file references from VS Code Explorer to Codex.', '--source', '.', '--remote', 'origin']);
  const remote = run('git', ['remote', 'get-url', 'origin'], { capture: true, allowFailure: true });
  if (!remote.ok) run('git', ['remote', 'add', 'origin', `https://github.com/${repo}.git`]);
  else if (!['https://github.com/' + repo + '.git', 'https://github.com/' + repo, 'git@github.com:' + repo + '.git'].includes(remote.output)) throw new Error('origin points to a different repository; refusing to publish.');
  run(gh, ['auth', 'setup-git']);
  run('git', ['push', '-u', 'origin', 'main']);
  const tag = `v${version}`;
  if (!run('git', ['rev-parse', '--verify', `refs/tags/${tag}`], { capture: true, allowFailure: true }).ok) run('git', ['tag', '-a', tag, '-m', `Codex Drag Context ${tag}`]);
  run('git', ['push', 'origin', tag]);
  console.log(`Repository pushed: https://github.com/${repo}`);
  console.log('The Release workflow will build and publish the VSIX. Check GitHub Actions for its result.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
