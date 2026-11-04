import { DriveClient, DRIVE_SCOPE, DRIVE_CONFIG_KEY, validClientId } from './drive.mjs';
import { GOOGLE_CLIENT_ID } from './config.mjs';
import { t, getLocale } from './i18n.mjs';
let identityPromise;
function loadIdentity() {
  if (globalThis.google?.accounts?.oauth2) return Promise.resolve(globalThis.google.accounts.oauth2);
  if (!identityPromise) identityPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client'; script.async = true; script.referrerPolicy = 'strict-origin-when-cross-origin';
    const timer = setTimeout(() => { script.remove(); reject(new Error('Не удалось загрузить вход Google. Проверьте интернет и блокировщики.')); }, 20_000);
    script.onload = () => { clearTimeout(timer); if (globalThis.google?.accounts?.oauth2) resolve(globalThis.google.accounts.oauth2); else reject(new Error('Не удалось загрузить вход Google. Проверьте интернет и блокировщики.')); };
    script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error('Не удалось загрузить вход Google. Проверьте интернет и блокировщики.')); };
    document.head.append(script);
  }).catch(error => { identityPromise = undefined; throw error; });
  return identityPromise;
}
export function initializeDrive({ store, toast, beforeConnect }) {
  const $ = id => document.getElementById(id);
  const drive = new DriveClient();
  let identity; let controller; let busy = false; let status = ''; let generation = 0; let lastFiles = [];
  let clientId = GOOGLE_CLIENT_ID;
  try { clientId = localStorage.getItem(DRIVE_CONFIG_KEY) || clientId; } catch { /* Public client configuration can be session-only. */ }
  const button = document.createElement('button'); button.id = 'drive-button'; button.className = 'nav-button'; button.textContent = t('Google Drive');
  $('import-button').after(button);
  function setStatus(value) { status = value; $('drive-status').textContent = t(value); }
  function refresh() {
    button.textContent = t('Google Drive');
    $('drive-status').textContent = t(status || (validClientId(clientId) ? 'Можно подключить Google Drive.' : 'Сначала сохраните Google OAuth Client ID в настройках ниже.'));
    $('google-client-id').value = clientId;
    $('drive-connect').disabled = busy || !identity || !validClientId(clientId) || drive.connected;
    $('drive-backup').disabled = busy || !drive.connected || !store.unlocked;
    $('drive-refresh').disabled = busy || !drive.connected;
    $('drive-disconnect').hidden = !drive.connected;
    $('drive-save-config').disabled = busy;
    $('drive-setup').open = !validClientId(clientId);
    renderFiles();
  }
  function renderFiles() {
    $('drive-files').replaceChildren();
    for (const file of lastFiles) {
      const row = document.createElement('li'); const link = document.createElement('a'); const date = document.createElement('small');
      link.href = `https://drive.google.com/file/d/${encodeURIComponent(file.id)}/view`; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = file.name; link.setAttribute('aria-label', `${t('Открыть в Google Drive')}: ${file.name}`);
      const timestamp = Date.parse(file.modifiedTime);
      date.textContent = Number.isFinite(timestamp) ? new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp) : '';
      row.append(link, date); $('drive-files').append(row);
    }
    $('drive-backup-reminder').hidden = !lastFiles.length;
  }
  async function prepare() {
    if (!validClientId(clientId)) { refresh(); return; }
    if (!navigator.onLine) { setStatus('Для Google Drive нужно подключение к интернету.'); refresh(); return; }
    setStatus('Загружаем вход Google…');
    try { identity = await loadIdentity(); setStatus(drive.connected ? 'Google Drive подключён. Можно сохранить зашифрованную копию.' : 'Можно подключить Google Drive.'); }
    catch (error) { $('drive-error').textContent = t(error.message); }
    refresh();
  }
  async function run(work) {
    if (busy) return;
    busy = true; const epoch = generation; controller = new AbortController(); $('drive-error').textContent = ''; refresh();
    try { await work(controller.signal, epoch); }
    catch (error) { if (epoch === generation) $('drive-error').textContent = t(error.message); }
    finally { busy = false; controller = null; if (epoch === generation) refresh(); }
  }
  button.addEventListener('click', () => {
    if (!store.unlocked) { toast(t('Google Drive доступен после разблокировки хранилища.')); return; }
    $('drive-error').textContent = ''; refresh(); $('drive-dialog').showModal(); prepare();
  });
  $('drive-save-config').addEventListener('click', () => {
    const next = $('google-client-id').value.trim();
    if (!validClientId(next)) { $('drive-error').textContent = t('Укажите корректный Google OAuth Client ID.'); return; }
    generation++; controller?.abort(); drive.clear(); lastFiles = []; clientId = next;
    try { localStorage.setItem(DRIVE_CONFIG_KEY, clientId); } catch { /* This public setting will last until the page is closed. */ }
    $('drive-error').textContent = ''; setStatus('Настройка сохранена. Подключите Google Drive.'); refresh(); prepare();
  });
  $('drive-connect').addEventListener('click', () => {
    if (!identity || !validClientId(clientId) || busy) return;
    if (!navigator.onLine) { $('drive-error').textContent = t('Для Google Drive нужно подключение к интернету.'); return; }
    beforeConnect(); busy = true; setStatus('Подключение к Google Drive…'); refresh();
    const expectedClient = clientId;
    // Trigger the OAuth popup synchronously from this click, after GIS has loaded.
    const tokenClient = identity.initTokenClient({ client_id: clientId, scope: DRIVE_SCOPE, include_granted_scopes: false,
      callback: response => {
        busy = false;
        if (clientId !== expectedClient) return;
        try { if (response.error) throw new Error('Вход Google отменён или заблокирован браузером.'); drive.authorizeToken(response.access_token, response.expires_in, response.scope); setStatus('Google Drive подключён. Можно сохранить зашифрованную копию.'); }
        catch (error) { $('drive-error').textContent = t(error.message); }
        refresh();
      },
      error_callback: () => { busy = false; $('drive-error').textContent = t('Вход Google отменён или заблокирован браузером.'); refresh(); },
    });
    try { tokenClient.requestAccessToken({ prompt: 'consent' }); }
    catch { busy = false; $('drive-error').textContent = t('Вход Google отменён или заблокирован браузером.'); refresh(); }
  });
  $('drive-backup').addEventListener('click', () => run(async (signal, epoch) => {
    if (!store.unlocked) throw new Error('Перед сохранением в Google Drive разблокируйте хранилище.');
    const raw = store.export(); setStatus('Сохраняем зашифрованную копию…');
    await drive.backup(raw, { signal });
    if (epoch !== generation) return;
    setStatus('Зашифрованная копия сохранена в Google Drive.'); toast(t('Зашифрованная копия сохранена в Google Drive.'));
    const result = await drive.listBackups({ signal }); if (epoch === generation) { lastFiles = result.files; renderFiles(); }
  }));
  $('drive-refresh').addEventListener('click', () => run(async (signal, epoch) => {
    setStatus('Загружаем список копий…'); const result = await drive.listBackups({ signal });
    if (epoch !== generation) return;
    lastFiles = result.files; setStatus(result.hasMore ? 'Слишком много файлов резервных копий. Откройте Google Drive для просмотра всех копий.' : lastFiles.length ? 'Google Drive подключён. Можно сохранить зашифрованную копию.' : 'Резервные копии этого приложения пока не найдены.'); renderFiles();
  }));
  $('drive-disconnect').addEventListener('click', () => run(async () => {
    try {
      await drive.disconnect(token => new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Не удалось отключить доступ Google. Удалите разрешение в настройках Google-аккаунта.')), 10_000);
        identity.revoke(token, result => { clearTimeout(timer); if (result?.error) reject(new Error('Не удалось отключить доступ Google. Удалите разрешение в настройках Google-аккаунта.')); else resolve(); });
      }));
      setStatus('Google Drive отключён.');
    } finally { lastFiles = []; refresh(); }
  }));
  document.addEventListener('vault-locked', () => { generation++; controller?.abort(); lastFiles = []; renderFiles(); });
  document.addEventListener('vault-unlocked', refresh);
  $('drive-dialog').addEventListener('close', () => { generation++; controller?.abort(); lastFiles = []; });
  window.addEventListener('pagehide', () => { generation++; controller?.abort(); drive.clear(); });
  window.addEventListener('offline', () => { setStatus('Для Google Drive нужно подключение к интернету.'); refresh(); });
  return { refresh };
}
