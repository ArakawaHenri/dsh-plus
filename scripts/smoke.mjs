import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const root = fileURLToPath(new URL('../', import.meta.url));
const temp = await mkdtemp(join(tmpdir(), 'dshplus-smoke-'));
const cli = process.env.DSH_CLI || 'dsh';
const scriptCli = /\.[cm]?js$/.test(cli);
const executable = scriptCli ? process.env.DSH_NODE || process.execPath : cli;
const prefix = scriptCli ? [cli] : [];
const reportPath = join(temp, 'report.json');
const env = { ...process.env, DSH_HOME: join(temp, 'home'), DSH_PLUS_SMOKE_REPORT: reportPath };
let host;
let hostExited;
let hostOutput = '';

async function run(command, args) {
  let output = '';
  const child = spawn(command, args, { cwd: root, env, timeout: 180000 });
  child.stdout.on('data', data => { output += data; });
  child.stderr.on('data', data => { output += data; });
  await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`${command} failed (${code})\n${output}`)));
  });
  return output;
}
const dsh = args => run(executable, [...prefix, ...args]);

try {
  console.log('Creating an isolated Web profile.');
  await dsh(['--profile', 'smoke', '--from-default-profile', 'web', '--dump-config']);
  let spec = process.env.DSH_BUNDLE_SPEC;
  if (!spec) {
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const [packed] = JSON.parse(await run(npm, ['pack', '--ignore-scripts', '--pack-destination', temp, '--json']));
    spec = `file:${join(temp, packed.filename)}`;
  }
  console.log('Installing only the DSH Plus bundle.');
  await dsh(['plugin', '--profile', 'smoke', 'add', spec]);
  const profile = JSON.parse(await readFile(join(env.DSH_HOME, 'profiles/smoke/package.json'), 'utf8'));
  assert.deepEqual(Object.keys(profile.dependencies), ['@dshplus/bundle']);
  assert.deepEqual(profile.dsh.profile.bundles, [
    '@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', '@dshplus/bundle',
  ]);

  const patch = join(temp, 'probe.patch.yml');
  const probe = fileURLToPath(new URL('./smoke-probe.mjs', import.meta.url));
  await writeFile(patch, `- insert:\n    - id: dshplus-install-probe\n      name: ${JSON.stringify(probe)}\n`);
  console.log('Booting DSH and checking providers, RPC services, and browser modules.');
  host = spawn(executable, [
    ...prefix, '--profile', 'smoke', '--patch', patch,
    '--host', '127.0.0.1', '--port', '0', '--no-open',
  ], { cwd: temp, env });
  host.stdout.on('data', data => { hostOutput += data; });
  host.stderr.on('data', data => { hostOutput += data; });
  hostExited = new Promise(resolve => host.on('close', resolve));
  let startupError;
  host.on('error', error => { startupError = error; });
  let report;
  for (let attempt = 0; attempt < 240; attempt++) {
    if (startupError) throw startupError;
    try { report = JSON.parse(await readFile(reportPath, 'utf8')); break; }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (host.exitCode !== null) throw new Error(`DSH exited before the probe completed.\n${hostOutput}`);
    await delay(250);
  }
  assert.ok(report, `DSH startup timed out.\n${hostOutput}`);
  assert.equal(report.error, undefined, report.error);
  console.log(JSON.stringify(report, null, 2));
  console.log('Passed: one installed bundle, four active plugins, two loadable browser modules.');
} finally {
  if (host && host.exitCode === null) {
    host.kill('SIGTERM');
    const force = setTimeout(() => host.kill('SIGKILL'), 5000);
    await hostExited;
    clearTimeout(force);
  }
  await rm(temp, { recursive: true, force: true });
}
