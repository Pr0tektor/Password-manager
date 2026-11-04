import { createVault, openVault, encryptVault, mergeEntries, validateEntries } from './crypto.mjs';
export const STORAGE_KEY = 'password-manager.v1';
export class VaultStore {
  #storage; #key = null; #salt = null; #entries = []; #raw = null; #epoch = 0; #busy = false;
  constructor(storage) { this.#storage = storage; }
  get unlocked() { return this.#key !== null; }
  get entries() { return structuredClone(this.#entries); }
  #read() {
    try { return this.#storage.getItem(STORAGE_KEY); }
    catch { throw new Error('Браузер запретил доступ к хранилищу. Разрешите сохранение данных для этого сайта.'); }
  }
  get exists() { return this.#read() !== null; }
  lock() { this.#epoch++; this.#key = null; this.#salt = null; this.#entries = []; this.#raw = null; }
  #check(epoch) { if (this.#epoch !== epoch) throw new Error('Операция отменена: хранилище заблокировано.'); }
  #checkRaw(expected) {
    if (this.#read() !== expected) { this.lock(); throw new Error('Хранилище изменилось в другой вкладке. Откройте его заново.'); }
  }
  async #run(action) {
    if (this.#busy) throw new Error('Дождитесь завершения текущей операции.');
    this.#busy = true;
    try { return await action(this.#epoch); } finally { this.#busy = false; }
  }
  async #write(raw, expected, epoch) {
    const persist = () => {
      this.#check(epoch); this.#checkRaw(expected);
      try { this.#storage.setItem(STORAGE_KEY, raw); }
      catch { throw new Error('Не удалось сохранить данные. Память браузера заполнена или сохранение запрещено. Скачайте резервную копию.'); }
    };
    // Serialize writes across same-origin tabs; recheck inside the browser lock.
    if (globalThis.navigator?.locks) await navigator.locks.request(STORAGE_KEY, async () => persist());
    else persist();
    this.#check(epoch); this.#checkRaw(raw);
  }
  #adopt(opened, raw) { this.#key = opened.key; this.#salt = opened.salt; this.#entries = opened.entries; this.#raw = raw; }
  async create(password) {
    return this.#run(async epoch => {
      if (this.exists) throw new Error('Хранилище уже существует. Разблокируйте его.');
      const opened = await createVault(password);
      const raw = JSON.stringify(opened.envelope);
      await this.#write(raw, null, epoch); this.#adopt(opened, raw);
    });
  }
  async unlock(password) {
    return this.#run(async epoch => {
      const raw = this.#read();
      if (raw === null) throw new Error('Хранилище не найдено. Создайте новое или восстановите копию.');
      const opened = await openVault(raw, password);
      this.#check(epoch); this.#checkRaw(raw); this.#adopt(opened, raw);
    });
  }
  async #commit(entries, epoch) {
    if (!this.unlocked) throw new Error('Сначала разблокируйте хранилище.');
    const clean = validateEntries(entries);
    const rawBefore = this.#raw;
    const envelope = await encryptVault(clean, this.#key, this.#salt);
    const raw = JSON.stringify(envelope);
    await this.#write(raw, rawBefore, epoch);
    this.#entries = clean; this.#raw = raw;
  }
  async save(entries) { return this.#run(epoch => this.#commit(entries, epoch)); }
  async importEntries(entries) {
    return this.#run(async epoch => {
      if (!this.unlocked) throw new Error('Сначала разблокируйте хранилище.');
      const merged = mergeEntries(this.#entries, entries);
      const added = merged.length - this.#entries.length;
      if (added) await this.#commit(merged, epoch);
      return added;
    });
  }
  export() {
    if (!this.unlocked) throw new Error('Сначала разблокируйте хранилище.');
    this.#checkRaw(this.#raw); return this.#raw;
  }
  async reset(confirmation) {
    if (confirmation !== 'УДАЛИТЬ') throw new Error('Для сброса введите УДАЛИТЬ.');
    return this.#run(async epoch => {
      const expected = this.#read();
      const remove = () => {
        this.#check(epoch); this.#checkRaw(expected);
        try { this.#storage.removeItem(STORAGE_KEY); }
        catch { throw new Error('Браузер запретил удаление хранилища.'); }
      };
      if (globalThis.navigator?.locks) await navigator.locks.request(STORAGE_KEY, async () => remove());
      else remove();
      this.lock();
    });
  }
  async import(text, password) {
    return this.#run(async epoch => {
      const expected = this.#read();
      if (!this.unlocked && expected !== null) throw new Error('Для импорта сначала разблокируйте текущее хранилище.');
      const opened = await openVault(text, password);
      this.#check(epoch); this.#checkRaw(expected);
      if (this.unlocked) {
        const merged = mergeEntries(this.#entries, opened.entries);
        const added = merged.length - this.#entries.length;
        await this.#commit(merged, epoch); return added;
      }
      const raw = JSON.stringify(opened.envelope);
      await this.#write(raw, null, epoch); this.#adopt(opened, raw); return opened.entries.length;
    });
  }
}
