import test from 'node:test';
import assert from 'node:assert/strict';
import { createVault, encryptVault, openVault, validateEntries, mergeEntries, MAX_API_KEYS } from '../crypto.mjs';
import { VaultStore } from '../vault.mjs';
import { createApiKeyEditor } from '../api-keys.mjs';
import { setLocale } from '../i18n.mjs';

const master = 'dummy API key vault phrase 123!';
const entry = overrides => ({ id: 'demo', title: 'Demo service', username: '', password: '', url: 'https://example.test/', notes: '', createdAt: '2026-11-07T10:00:00.000Z', updatedAt: '2026-11-07T10:00:00.000Z', apiKeys: [{ label: 'Production', value: 'dummy-production-key' }, { label: 'Test', value: ' dummy-test-key ' }], ...overrides });
const memory = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
};

test('API-only entries with multiple named keys encrypt, reload, export and restore intact', async () => {
  const store = new VaultStore(memory()); await store.create(master); await store.save([entry()]);
  const raw = store.export(); assert.equal(JSON.parse(raw).version, 2);
  for (const key of entry().apiKeys) { assert.equal(raw.includes(key.label), false); assert.equal(raw.includes(key.value), false); }
  const snapshot = store.entries; snapshot[0].apiKeys[0].value = 'changed outside store';
  assert.equal(store.entries[0].apiKeys[0].value, 'dummy-production-key');
  store.lock(); assert.deepEqual(store.entries, []); await store.unlock(master); assert.deepEqual(store.entries, [entry()]);
  const restored = new VaultStore(memory()); assert.equal(await restored.import(raw, master), 1); assert.deepEqual(restored.entries, [entry()]);
  const changed = entry({ apiKeys: [{ label: 'Rotated', value: 'dummy-new-key' }] }); await restored.save([changed]);
  restored.lock(); await restored.unlock(master); assert.deepEqual(restored.entries, [changed]);
});

test('legacy password backups stay version 1, while format downgrades of API backups fail authentication', async () => {
  const opened = await createVault(master);
  const legacy = entry({ password: 'dummy-password', apiKeys: undefined }); delete legacy.apiKeys;
  const envelope = await encryptVault([legacy], opened.key, opened.salt);
  assert.equal(envelope.version, 1); assert.deepEqual((await openVault(JSON.stringify(envelope), master)).entries, [legacy]);
  const modern = await encryptVault([entry()], opened.key, opened.salt); assert.equal(modern.version, 2);
  await assert.rejects(openVault(JSON.stringify({ ...modern, version: 1 }), master), /Неверный мастер-пароль/);
});

test('merge compares all API keys and preserves changed versions instead of dropping them as duplicates', () => {
  const original = entry();
  assert.equal(mergeEntries([original], [entry({ id: 'other' })]).length, 1);
  for (const apiKeys of [[{ label: 'Other name', value: 'dummy-production-key' }], [{ label: 'Production', value: 'dummy-rotated-key' }]]) {
    const merged = mergeEntries([original], [entry({ apiKeys })]);
    assert.equal(merged.length, 2); assert.deepEqual(merged[0].apiKeys, original.apiKeys); assert.deepEqual(merged[1].apiKeys, apiKeys);
    assert.notEqual(merged[0].id, merged[1].id);
  }
  const legacy = entry({ password: 'dummy-password', apiKeys: undefined }); delete legacy.apiKeys;
  assert.equal(mergeEntries([legacy], [{ ...legacy, id: 'second', apiKeys: [] }]).length, 1);
});

test('nested key schema rejects malformed, excessive and incomplete keys before saving', () => {
  for (const apiKeys of [null, {}, [null], [{ label: '', value: 'key' }], [{ label: 'Name', value: '' }], [{ label: 1, value: 'key' }], [{ label: 'Name', value: ' '.repeat(5) }], [{ label: 'x'.repeat(101), value: 'key' }], [{ label: 'Name', value: 'x'.repeat(10001) }], Array.from({ length: MAX_API_KEYS + 1 }, () => ({ label: 'Name', value: 'key' }))]) {
    assert.throws(() => validateEntries([entry({ apiKeys })]));
  }
  assert.throws(() => validateEntries([entry({ apiKeys: [], password: '' })]));
  const keys = Array.from({ length: MAX_API_KEYS }, (_, i) => ({ label: String(i), value: 'key', unknown: 'discard' }));
  const clean = validateEntries([entry({ apiKeys: keys })]); assert.equal(clean[0].apiKeys.length, MAX_API_KEYS); assert.equal('unknown' in clean[0].apiKeys[0], false);
});

class Element extends EventTarget {
  constructor(tag) { super(); this.tag = tag; this.children = []; this.attributes = {}; this.value = ''; this.textContent = ''; this.type = ''; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  append(...nodes) { nodes.forEach(node => { node.parent = this; this.children.push(node); }); }
  replaceChildren() { this.children.forEach(node => { node.parent = null; }); this.children = []; }
  remove() { this.parent.children = this.parent.children.filter(node => node !== this); this.parent = null; }
  focus() { this.focused = true; }
  click() { if (!this.disabled) this.dispatchEvent(new Event('click')); }
}
function editor() {
  const document = { createElement: tag => new Element(tag), createElementNS: (ns, tag) => new Element(tag) };
  const container = new Element('div'); const addButton = new Element('button'); const copies = []; const timers = new Map(); let next = 0;
  const api = createApiKeyEditor({ document, container, addButton, onCopy: (...values) => copies.push(values), setTimer: fn => { timers.set(++next, fn); return next; }, clearTimer: id => timers.delete(id) });
  const row = (index = 0) => {
    const element = container.children[index]; const [labelText, label, valueText, actions, remove] = element.children;
    const [value, copy, reveal] = actions.children;
    return { element, labelText, label, valueText, value, copy, reveal, remove };
  };
  return { api, container, addButton, copies, timers, row };
}

test('API editor has icon-only copy controls, preserves exact secret values and treats markup as text', () => {
  const h = editor(); h.api.setKeys([{ label: '<img src=x>', value: ' <script>dummy</script> ' }]);
  const row = h.row(); assert.equal(row.value.type, 'password'); assert.equal(row.copy.textContent, '');
  assert.equal(row.copy.children[0].tag, 'svg'); assert.equal(row.copy.attributes['aria-label'], 'Копировать API-ключ');
  row.copy.click(); assert.deepEqual(h.copies, [[' <script>dummy</script> ', '<img src=x>']]);
  assert.deepEqual(h.api.readKeys(), [{ label: '<img src=x>', value: ' <script>dummy</script> ' }]);
});

test('revealed API keys conceal on timeout/background; clearing and removing erase fields and timers', () => {
  const h = editor(); h.api.setKeys(entry().apiKeys); const row = h.row();
  row.reveal.click(); assert.equal(row.value.type, 'text'); [...h.timers.values()][0](); assert.equal(row.value.type, 'password');
  row.reveal.click(); h.api.conceal(); assert.equal(row.value.type, 'password'); assert.equal(h.timers.size, 0);
  row.reveal.click(); row.remove.click(); assert.equal(row.value.value, ''); assert.equal(row.label.value, ''); assert.equal(h.timers.size, 0);
  assert.deepEqual(h.api.readKeys(), [entry().apiKeys[1]]);
  const remaining = h.row(); remaining.reveal.click(); h.api.clear();
  assert.equal(remaining.value.value, ''); assert.equal(h.timers.size, 0); assert.equal(h.container.children.length, 0);
});

test('API editor validates partial rows and reenables adding after a row is removed', () => {
  const h = editor(); h.addButton.click(); assert.deepEqual(h.api.readKeys(), []);
  h.row().label.value = 'Partial'; assert.throws(() => h.api.readKeys());
  h.api.setKeys(Array.from({ length: MAX_API_KEYS }, () => ({ label: 'Name', value: 'dummy' })));
  assert.equal(h.addButton.disabled, true); h.addButton.click(); assert.equal(h.container.children.length, MAX_API_KEYS);
  h.row().remove.click(); assert.equal(h.addButton.disabled, false); h.addButton.click(); assert.equal(h.container.children.length, MAX_API_KEYS);
});

test('language switching keeps unsaved keys while translating controls', () => {
  const h = editor(); h.api.setKeys(entry().apiKeys);
  try {
    setLocale('en'); h.api.refresh(); assert.equal(h.row().copy.attributes['aria-label'], 'Copy API key'); assert.equal(h.row().labelText.textContent, 'Key name');
    assert.deepEqual(h.api.readKeys(), entry().apiKeys);
    setLocale('ru'); h.api.refresh(); assert.equal(h.row().copy.attributes['aria-label'], 'Копировать API-ключ'); assert.deepEqual(h.api.readKeys(), entry().apiKeys);
  } finally { setLocale('ru'); }
});
