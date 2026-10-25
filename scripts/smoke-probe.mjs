import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { setImmediate } from 'node:timers/promises';
import { runInNewContext } from 'node:vm';

export const name = 'dshplus-install-probe';
export const inject = ['loader', 'web', 'sessionEdit', 'sessionDelete', 'clientModules', 'pluginManager'];

export async function apply(ctx) {
  try {
    await verify(ctx);
  } catch (error) {
    await writeFile(process.env.DSH_PLUS_SMOKE_REPORT, JSON.stringify({ error: error.stack }));
    throw error;
  }
}

async function verify(ctx) {
  await setImmediate();
  const names = [
    'dshplus-native-search', 'dshplus-session-edit',
    'dshplus-session-delete', 'dshplus-fake-ip',
  ];
  const entries = [...ctx.loader.entries()];
  for (const name of names) {
    const matches = entries.filter(entry => entry.options.id === name);
    assert.equal(matches.length, 1, `${name} must be mounted exactly once`);
    assert.equal(matches[0].fiber?.state, 2, `${name} must be active`);
  }

  const web = entries.find(entry => entry.options.id === 'web');
  assert.equal(web.options.config.searchProvider, 'native-preferring');
  assert.equal(web.options.config.fetchProvider, 'http');
  assert.equal(ctx.web.searchProviders.get('native-preferring')?.constructor.name, 'NativePreferringSearchProvider');
  const fetch = ctx.web.fetchProviders.get('http');
  assert.equal(fetch?.constructor.name, 'FakeIpHttpFetchProvider');
  assert.deepEqual(await fetch.resolveAddresses('198.18.1.61'), [{ address: '198.18.1.61', family: 4 }]);
  assert.equal(typeof ctx.sessionEdit.inspect, 'function');
  assert.equal(typeof ctx.sessionEdit.execute, 'function');
  assert.equal(typeof ctx.sessionDelete.deleteArchived, 'function');

  const bundle = (await ctx.pluginManager.listBundles()).find(bundle => bundle.name === '@dshplus/bundle');
  assert.equal(bundle.meta?.title?.zh, 'DSH Plus');
  assert.ok(bundle.meta?.icon?.startsWith('data:image/svg+xml;base64,'));
  for (const id of names) {
    const row = bundle.rows.find(row => row.rowId === id);
    assert.ok(row?.meta?.title?.zh?.startsWith('DSH Plus · '), `${id} must expose its display name`);
    assert.ok(row.meta.icon?.startsWith('data:image/svg+xml;base64,'), `${id} must expose its icon`);
    assert.equal(row.meta.error, undefined);
  }

  const clients = ['@dshplus/session-edit', '@dshplus/session-delete'];
  for (const id of clients) {
    const entry = ctx.clientModules.graph().entries.find(entry => entry.id === id);
    assert.ok(entry, `${id} must be present in the browser boot graph`);
    const response = await ctx.clientModules.fetchBundle(new Request(new URL(entry.url, 'http://localhost/')));
    assert.equal(response.status, 200);
    const registrations = [];
    runInNewContext(await response.text(), {
      window: { __ModuleLoader__: { load: entry => registrations.push(entry) } },
    });
    assert.equal(registrations.length, 1);
    assert.equal(registrations[0].id, id);
    assert.equal(typeof registrations[0].factory, 'function');
  }
  await writeFile(process.env.DSH_PLUS_SMOKE_REPORT, JSON.stringify({
    hostVersion: ctx.clientModules.graph().release.version,
    plugins: names,
    clients,
  }, null, 2));
}
