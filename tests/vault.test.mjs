import test from 'node:test';
import assert from 'node:assert/strict';
import { createVault, encryptVault, openVault, parseEnvelope, generatePassword, mergeEntries, validateEntries, ITERATIONS } from '../crypto.mjs';
import { VaultStore, STORAGE_KEY } from '../vault.mjs';
const master = 'test-only master phrase 2026';
const entry = (changes = {}) => ({ id: 'entry-one', title: 'Тестовая почта', username: 'demo@example.test', password: 'dummy-password!42', url: 'https://example.test/', notes: 'Заметка 🔐', createdAt: '2026-11-04T10:00:00.000Z', updatedAt: '2026-11-04T10:00:00.000Z', ...changes });
class MemoryStorage {
  values = new Map(); rejectWrites = false;
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { if (this.rejectWrites) throw new Error('quota'); this.values.set(key, value); }
  removeItem(key) { this.values.delete(key); }
}

test('encrypted Unicode roundtrip; no plaintext, nonextractable key, fresh IV per save', async () => {
  const vault = await createVault(master);
  assert.equal(vault.key.extractable, false);
  await assert.rejects(crypto.subtle.exportKey('raw', vault.key));
  const first = await encryptVault([entry()], vault.key, vault.salt);
  const second = await encryptVault([entry()], vault.key, vault.salt);
  assert.notEqual(first.iv, second.iv); assert.notEqual(first.ciphertext, second.ciphertext);
  const raw = JSON.stringify(first);
  for (const secret of [master, entry().title, entry().username, entry().password, entry().notes]) assert.equal(raw.includes(secret), false);
  assert.deepEqual((await openVault(raw, master)).entries, [entry()]);
});
test('wrong password and one-bit ciphertext tampering fail authentication', async () => {
  const vault = await createVault(master);
  await assert.rejects(openVault(JSON.stringify(vault.envelope), 'wrong password'), /Неверный мастер-пароль/);
  const modified = { ...vault.envelope };
  const bytes = Buffer.from(modified.ciphertext, 'base64'); bytes[0] ^= 1; modified.ciphertext = bytes.toString('base64');
  await assert.rejects(openVault(JSON.stringify(modified), master), /Неверный мастер-пароль/);
});
test('malformed envelopes, unbounded KDF work, bad IV and oversized imports are rejected', async () => {
  const { envelope } = await createVault(master);
  for (const changes of [{ iterations: 1 }, { iterations: ITERATIONS * 100 }, { version: 3 }, { iv: 'AAAA' }, { salt: 'invalid!' }, { ciphertext: 'AA==' }, { cipher: 'AES-CBC' }]) assert.throws(() => parseEnvelope(JSON.stringify({ ...envelope, ...changes })));
  assert.throws(() => parseEnvelope('{'));
  assert.throws(() => parseEnvelope(' '.repeat(4_000_001)));
});
test('creation rejects short/blank master passwords and fresh vaults get different salts', async () => {
  await assert.rejects(createVault('too-short'));
  await assert.rejects(createVault(' '.repeat(20)));
  const a = await createVault(master); const b = await createVault(master);
  assert.notEqual(a.envelope.salt, b.envelope.salt);
});
test('generator honors lengths and selected groups; invalid options fail', () => {
  for (const length of [12, 20, 64]) {
    for (let i = 0; i < 40; i++) {
      const value = generatePassword(length); assert.equal(value.length, length);
      for (const pattern of [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/]) assert.match(value, pattern);
    }
  }
  assert.match(generatePassword(32, { digits: true }), /^\d{32}$/);
  assert.throws(() => generatePassword(11)); assert.throws(() => generatePassword(65)); assert.throws(() => generatePassword(12, {}));
});
test('entry schema rejects duplicate IDs, invalid dates and field overflows', () => {
  assert.throws(() => validateEntries([entry(), entry()]));
  assert.throws(() => validateEntries([entry({ password: '' })]));
  assert.throws(() => validateEntries([entry({ createdAt: 'invalid' })]));
  assert.throws(() => validateEntries([entry({ title: 'x'.repeat(201) })]));
});
test('merge skips exact duplicates and preserves changed records with colliding IDs', () => {
  const merged = mergeEntries([entry()], [entry({ id: 'different-id' }), entry({ password: 'changed-secret' })]);
  assert.equal(merged.length, 2); assert.equal(merged[0].password, entry().password); assert.equal(merged[1].password, 'changed-secret'); assert.notEqual(merged[0].id, merged[1].id);
});
test('CRUD persists only ciphertext, survives lock and requires reauthentication', async () => {
  const storage = new MemoryStorage(); const store = new VaultStore(storage);
  await store.create(master); await store.save([entry()]);
  const snapshot = storage.getItem(STORAGE_KEY);
  assert.equal(snapshot.includes(entry().password), false);
  store.lock(); assert.equal(store.unlocked, false); assert.deepEqual(store.entries, []);
  await assert.rejects(store.save([])); await assert.rejects(store.unlock('wrong-password'));
  await store.unlock(master); assert.deepEqual(store.entries, [entry()]);
  await store.save([entry({ username: 'changed@example.test' })]);
  store.lock(); await store.unlock(master); assert.equal(store.entries[0].username, 'changed@example.test');
  await store.save([]); store.lock(); await store.unlock(master); assert.deepEqual(store.entries, []);
});
test('encrypted export restores fresh storage; merge keeps destination master password', async () => {
  const source = new VaultStore(new MemoryStorage()); await source.create(master); await source.save([entry()]);
  const backup = source.export(); const destination = new VaultStore(new MemoryStorage());
  assert.equal(await destination.import(backup, master), 1);
  assert.deepEqual(destination.entries, [entry()]);
  const otherMaster = 'different master phrase 2026'; const other = new VaultStore(new MemoryStorage());
  await other.create(otherMaster); await other.save([entry({ id: 'other', title: 'Другой аккаунт' })]);
  assert.equal(await other.import(backup, master), 1); assert.equal(await other.import(backup, master), 0);
  other.lock(); await other.unlock(otherMaster); assert.equal(other.entries.length, 2);
  other.lock(); await assert.rejects(other.import(backup, master), /сначала разблокируйте/);
});
test('failed storage writes preserve the previous vault and in-memory entries', async () => {
  const storage = new MemoryStorage(); const store = new VaultStore(storage);
  await store.create(master); await store.save([entry()]); const previous = store.export();
  storage.rejectWrites = true;
  await assert.rejects(store.save([]), /Не удалось сохранить/);
  assert.equal(store.export(), previous); assert.deepEqual(store.entries, [entry()]);
});
test('stale tab cannot overwrite newer records', async () => {
  const storage = new MemoryStorage(); const first = new VaultStore(storage); const second = new VaultStore(storage);
  await first.create(master); await second.unlock(master);
  await first.save([entry()]); const previous = storage.getItem(STORAGE_KEY);
  await assert.rejects(second.save([]), /другой вкладке/);
  assert.equal(second.unlocked, false); assert.equal(storage.getItem(STORAGE_KEY), previous);
});
test('locking during creation, unlock and save cancels asynchronous completion', async () => {
  const storage = new MemoryStorage(); const store = new VaultStore(storage);
  const creating = store.create(master); store.lock(); await assert.rejects(creating, /отменена/); assert.equal(store.exists, false);
  await store.create(master); await store.save([entry()]); const previous = store.export();
  const saving = store.save([]); store.lock(); await assert.rejects(saving, /отменена/);
  assert.equal(storage.getItem(STORAGE_KEY), previous); assert.equal(store.unlocked, false);
  const unlocking = store.unlock(master); store.lock(); await assert.rejects(unlocking, /отменена/); assert.deepEqual(store.entries, []);
});
test('wrong backup password leaves the destination unchanged', async () => {
  const store = new VaultStore(new MemoryStorage()); await store.create(master); await store.save([entry()]); const previous = store.export();
  await assert.rejects(store.import(previous, 'incorrect'), /Неверный мастер-пароль/);
  assert.equal(store.export(), previous); assert.deepEqual(store.entries, [entry()]);
});
test('reset requires the exact confirmation, deletes only the vault and forgets the session', async () => {
  const storage = new MemoryStorage(); storage.setItem('unrelated-key', 'keep');
  const store = new VaultStore(storage); await store.create(master); await store.save([entry()]);
  await assert.rejects(store.reset(''), /УДАЛИТЬ/); assert.equal(store.exists, true);
  await store.reset('УДАЛИТЬ'); assert.equal(store.exists, false); assert.equal(store.unlocked, false); assert.deepEqual(store.entries, []);
  assert.equal(storage.getItem('unrelated-key'), 'keep');
});
