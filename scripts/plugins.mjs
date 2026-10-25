import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const command = process.argv[2];
if (!['ci', 'build', 'check', 'test'].includes(command)) {
  throw new Error('Expected ci, build, check, or test.');
}
for (const plugin of ['search', 'session-edit', 'session-delete', 'web-fetch-fake-ip']) {
  console.log(`\nDSH Plus · ${plugin} · ${command}`);
  const args = command === 'ci' ? ['ci'] : ['run', command, ...(command === 'build' ? ['--if-present'] : [])];
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, {
    cwd: fileURLToPath(new URL(`../plugins/${plugin}/`, import.meta.url)),
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
