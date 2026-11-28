const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

const html = fs.readFileSync(require.resolve('../game/index.html'), 'utf8');
const cloud = html.slice(html.indexOf('const CLOUD='), html.indexOf('async function openSettings', html.indexOf('const CLOUD=')));
const reply = (j, status = 200) => ({ ok: status === 200, status, json: async () => j });

function client(fetch, modal = async () => 'here') {
  class Storage {
    data = new Map();
    setItem(k, v) { this.data.set(k, String(v)); }
    removeItem(k) { this.data.delete(k); }
    getItem(k) { return this.data.get(k) ?? null; }
  }
  const localStorage = new Storage();
  localStorage.setItem('ls_cloud', JSON.stringify({ tok: 'test', t: 1, dirty: 1 }));
  const events = {};
  const context = vm.createContext({
    window: {}, toast() {}, Storage, localStorage, NET_URL: 'https://example.test', fetch, modal, h() {},
    setTimeout() {}, clearTimeout() {}, document: { hidden: true },
    addEventListener: (name, cb) => { events[name] = cb; },
    location: { reload() { throw new Error('unexpected reload'); } },
    skeyN: (slot, name) => name + slot,
  });
  vm.runInContext(cloud, context);
  return { sync: context.window.__CLOUD.sync, storage: localStorage, hide: () => events.visibilitychange() };
}

test('a write during PUT remains dirty until uploaded using the acknowledged revision', async () => {
  let finishFirst, begin;
  const started = new Promise(resolve => { begin = resolve; });
  const bodies = [];
  const { sync, storage, hide } = client(async (_, options) => {
    if (!options.method) return reply({ t: 1 });
    const body = JSON.parse(options.body);
    bodies.push(body);
    if (bodies.length === 1) return new Promise(resolve => { finishFirst = resolve; begin(); });
    return reply({ t: 3 });
  });
  storage.setItem('lastseed_run1', 'old');
  const pending = sync();
  await started;
  storage.setItem('lastseed_run1', 'new');
  hide();
  assert.equal(bodies.length, 1);
  finishFirst(reply({ t: 2 }));
  await pending;
  assert.deepEqual(bodies.map(b => [b.base, b.data.lastseed_run1]), [[1, 'old'], [2, 'new']]);
  assert.equal(JSON.parse(storage.getItem('ls_cloud')).dirty, 0);
});

test('a stale cloud choice cannot overwrite edits made while the conflict dialog is open', async () => {
  let finishDialog, begin;
  const shown = new Promise(resolve => { begin = resolve; });
  const { sync, storage } = client(async () => reply({ t: 2, data: { lastseed_run1: 'remote' } }),
    () => new Promise(resolve => { finishDialog = resolve; begin(); }));
  const pending = sync();
  await shown;
  storage.setItem('lastseed_run1', 'new local');
  finishDialog('cloud');
  await pending;
  assert.equal(storage.getItem('lastseed_run1'), 'new local');
  assert.equal(JSON.parse(storage.getItem('ls_cloud')).dirty, 1);
});

test('keeping device progress uploads edits made during the conflict using the reviewed server revision', async () => {
  let finishDialog, begin;
  const shown = new Promise(resolve => { begin = resolve; });
  const sent = [];
  const { sync, storage } = client(async (_, options) => {
    if (!options.method) return reply({ t: 5 });
    sent.push(JSON.parse(options.body));
    return reply({ t: 6 });
  }, () => new Promise(resolve => { finishDialog = resolve; begin(); }));
  const pending = sync();
  await shown;
  storage.removeItem('lastseed_run1');
  storage.setItem('lastseed_man1', 'new manual save');
  finishDialog('here');
  assert.equal(await pending, 'Saved to the cloud');
  assert.deepEqual(sent, [{ base: 5, data: { lastseed_man1: 'new manual save' } }]);
});
