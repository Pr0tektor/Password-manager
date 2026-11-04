import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, parseChromeCsv } from '../csv.mjs';
import { VaultStore, STORAGE_KEY } from '../vault.mjs';

const example = 'name,url,username,password,note\r\n"Почта, личная",https://example.test/,demo@example.test," p,a""ss ","Строка 1\r\nСтрока 2"\r\n';
test('Chrome CSV supports BOM, CRLF, commas, escaped quotes, Unicode and multiline notes', () => {
  const parsed = parseChromeCsv('\uFEFF' + example);
  assert.equal(parsed.entries.length, 1); assert.equal(parsed.skipped, 0);
  assert.equal(parsed.entries[0].title, 'Почта, личная');
  assert.equal(parsed.entries[0].password, ' p,a"ss ');
  assert.equal(parsed.entries[0].notes, 'Строка 1\r\nСтрока 2');
});
test('CSV column order is flexible; optional name/notes and empty usernames are handled', () => {
  const { entries, skipped } = parseChromeCsv('password,username,url,notes\nsecret,,https://example.test/,memo\n,user,https://empty.test/,\n');
  assert.equal(entries[0].title, 'example.test'); assert.equal(entries[0].username, ''); assert.equal(entries[0].notes, 'memo'); assert.equal(skipped, 1);
  assert.equal(parseChromeCsv('url,username,password\nandroid://hash@com.example.app/,me,secret').entries[0].password, 'secret');
});
test('CSV preserves formula-like text as inert strings and significant password whitespace', () => {
  const parsed = parseChromeCsv('name,url,username,password\n=HYPERLINK(),https://example.test/,=username,  secret  ');
  assert.equal(parsed.entries[0].title, '=HYPERLINK()'); assert.equal(parsed.entries[0].username, '=username'); assert.equal(parsed.entries[0].password, '  secret  ');
});
test('malformed quotes, missing/duplicate headers and row width errors fail before import', () => {
  for (const csv of ['', 'name,password\nx,secret', 'url,username,password,password\nx,u,p,p', 'url,username,password\nx,u', 'url,username,password\nx,u,"unclosed', 'url,username,password\nx,u,p"oops', 'url,username,password\nx,u,"secret"junk', 'url,username,password\nx,u,\n']) assert.throws(() => parseChromeCsv(csv));
  assert.deepEqual(parseCsv('a,b\n"",x\n\n'), [['a', 'b'], ['', 'x']]);
});
test('CSV rejects oversized files, excessive records and overflowing fields without leaking values', () => {
  assert.throws(() => parseChromeCsv('x'.repeat(4_000_001)), /4 МБ/);
  assert.throws(() => parseChromeCsv('url,username,password\n' + 'x,u,p\n'.repeat(2001)), /2000/);
  const secret = 'test-secret-not-in-errors';
  try { parseChromeCsv(`name,url,username,password\n${'x'.repeat(201)},https://example.test/,me,${secret}`); assert.fail('Expected validation error'); }
  catch (error) { assert.equal(error.message.includes(secret), false); assert.match(error.message, /Импорт не выполнен/); }
});
test('CSV import is encrypted, deduplicated and survives reload with destination master password', async () => {
  const values = new Map(); const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const store = new VaultStore(storage); const master = 'destination test phrase 2026';
  await store.create(master);
  const { entries } = parseChromeCsv(example);
  assert.equal(await store.importEntries(entries), 1);
  assert.equal(await store.importEntries(parseChromeCsv(example).entries), 0);
  const raw = storage.getItem(STORAGE_KEY);
  assert.equal(raw.includes('demo@example.test'), false); assert.equal(raw.includes('Строка 1'), false); assert.equal(raw.includes(master), false);
  store.lock(); await store.unlock(master);
  assert.equal(store.entries[0].password, ' p,a"ss '); assert.equal(store.entries.length, 1);
});
test('CSV import into a locked vault is refused', async () => {
  const store = new VaultStore({ getItem: () => null });
  await assert.rejects(store.importEntries(parseChromeCsv(example).entries), /разблокируйте/);
});
