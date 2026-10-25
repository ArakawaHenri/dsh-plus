import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, rm, copyFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'node_modules');
const check = process.argv.includes('--check');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const expected = [];
const dependencies = {};
const manifestPath = join(root, 'package.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

for (const plugin of ['search', 'session-edit', 'session-delete', 'web-fetch-fake-ip']) {
  const source = join(root, 'plugins', plugin);
  const [packed] = JSON.parse(execFileSync(npm, ['pack', '--dry-run', '--ignore-scripts', '--json'], {
    cwd: source, encoding: 'utf8',
  }));
  dependencies[packed.name] = packed.version;
  if (!check) await rm(join(output, packed.name), { recursive: true, force: true });
  for (const { path } of packed.files) {
    const target = join(output, packed.name, path);
    expected.push(join(packed.name, path));
    if (check) {
      assert.ok((await readFile(target)).equals(await readFile(join(source, path))), `${plugin}/${path} is stale; run npm run build`);
    } else {
      await mkdir(dirname(target), { recursive: true });
      await copyFile(join(source, path), target);
    }
  }
}
if (check) {
  const actual = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else actual.push(relative(output, path));
    }
  }
  for (const name of Object.keys(dependencies)) await walk(join(output, name));
  assert.deepEqual(actual.sort(), expected.sort(), 'Bundle file list is stale; run npm run build');
  assert.deepEqual(manifest.dependencies, dependencies, 'Bundled versions are stale; run npm run build');
  assert.deepEqual(manifest.bundleDependencies, Object.keys(dependencies));
} else {
  manifest.dependencies = dependencies;
  manifest.bundleDependencies = Object.keys(dependencies);
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}
console.log(`${check ? 'Checked' : 'Bundled'} ${expected.length} component release files.`);
