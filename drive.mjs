import { parseEnvelope } from './crypto.mjs';
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
export const DRIVE_CONFIG_KEY = 'password-manager.google-client-id';
const API = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const APP = 'local-password-manager';
export const validClientId = value => typeof value === 'string' && /^\d+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(value);

export class DriveClient {
  #token = ''; #expiresAt = 0; #fetch; #now;
  constructor({ fetchImpl = globalThis.fetch, now = Date.now } = {}) { this.#fetch = fetchImpl; this.#now = now; }
  get connected() { return Boolean(this.#token) && this.#now() < this.#expiresAt; }
  authorizeToken(token, expiresIn, scope) {
    if (typeof token !== 'string' || !token || /\s/.test(token) || token.length > 4096 || !Number.isFinite(Number(expiresIn)) || Number(expiresIn) <= 60 || !String(scope).split(' ').includes(DRIVE_SCOPE)) throw new Error('Google не предоставил доступ к файлам приложения.');
    this.#token = token; this.#expiresAt = this.#now() + Math.min(Number(expiresIn), 3600) * 1000 - 60_000;
  }
  clear() { this.#token = ''; this.#expiresAt = 0; }
  async disconnect(revoke) {
    const token = this.#token; this.clear();
    if (token && revoke) await revoke(token);
  }
  async #request(url, { signal, method = 'GET', body, contentType } = {}) {
    if (!this.connected) { this.clear(); throw new Error('Срок подключения Google истёк. Подключите аккаунт снова.'); }
    const headers = { Authorization: `Bearer ${this.#token}` };
    if (contentType) headers['Content-Type'] = contentType;
    let response;
    try { response = await this.#fetch(url, { method, headers, body, signal, credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' }); }
    catch (error) { if (error.name === 'AbortError') throw new Error('Операция Google Drive отменена.'); throw new Error('Не удалось выполнить запрос к Google Drive.'); }
    if (response.status === 401) { this.clear(); throw new Error('Срок подключения Google истёк. Подключите аккаунт снова.'); }
    if (response.status === 403) throw new Error('В Google Drive недостаточно места или доступ запрещён.');
    if (!response.ok) throw new Error('Не удалось выполнить запрос к Google Drive.');
    try { return await response.json(); } catch { throw new Error('Не удалось выполнить запрос к Google Drive.'); }
  }
  async #folder(signal) {
    const query = new URLSearchParams({ q: `trashed = false and mimeType = 'application/vnd.google-apps.folder' and appProperties has { key='app' and value='${APP}' } and appProperties has { key='kind' and value='backup-folder' }`, fields: 'files(id)', pageSize: '1' });
    const found = await this.#request(`${API}?${query}`, { signal });
    if (found.files?.[0]?.id && /^[a-zA-Z0-9_-]+$/.test(found.files[0].id)) return found.files[0].id;
    const created = await this.#request(API, { signal, method: 'POST', contentType: 'application/json', body: JSON.stringify({ name: 'Password Manager Backups', mimeType: 'application/vnd.google-apps.folder', appProperties: { app: APP, kind: 'backup-folder' } }) });
    if (!created.id || !/^[a-zA-Z0-9_-]+$/.test(created.id)) throw new Error('Не удалось подтвердить сохранение копии в Google Drive.');
    return created.id;
  }
  async backup(encryptedJson, { signal, date = new Date() } = {}) {
    // Reconstruct a verified ciphertext-only envelope before any network request.
    let envelope;
    try { envelope = parseEnvelope(encryptedJson).envelope; } catch { throw new Error('Файл резервной копии не прошёл проверку.'); }
    const folder = await this.#folder(signal);
    const name = `password-vault-${date.toISOString().replaceAll(':', '-')}.json`;
    const metadata = { name, mimeType: 'application/json', parents: [folder], appProperties: { app: APP, kind: 'encrypted-vault' } };
    const boundary = `vault_${crypto.randomUUID().replaceAll('-', '')}`;
    const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(envelope)}\r\n--${boundary}--\r\n`;
    const result = await this.#request(`${UPLOAD}?uploadType=multipart&fields=id,name,modifiedTime,size`, { signal, method: 'POST', contentType: `multipart/related; boundary=${boundary}`, body });
    if (!result.id || !/^[a-zA-Z0-9_-]+$/.test(result.id)) throw new Error('Не удалось подтвердить сохранение копии в Google Drive.');
    return result;
  }
  async listBackups({ signal } = {}) {
    const query = new URLSearchParams({ q: `trashed = false and appProperties has { key='app' and value='${APP}' } and appProperties has { key='kind' and value='encrypted-vault' }`, fields: 'files(id,name,modifiedTime,size),nextPageToken', orderBy: 'modifiedTime desc', pageSize: '50' });
    const result = await this.#request(`${API}?${query}`, { signal });
    return { files: (Array.isArray(result.files) ? result.files : []).filter(file => typeof file.id === 'string' && /^[a-zA-Z0-9_-]+$/.test(file.id) && typeof file.name === 'string'), hasMore: Boolean(result.nextPageToken) };
  }
}
