import { generatePassword, MAX_BACKUP_BYTES, mergeEntries } from './crypto.mjs';
import { parseChromeCsv } from './csv.mjs';
import { VaultStore, STORAGE_KEY } from './vault.mjs';
const $ = id => document.getElementById(id);
let store;
let editingId = null;
let deletingId = null;
let busy = false;
let uiEpoch = 0;
let idleTimer;
let toastTimer;
let pendingCsvEntries = [];
let csvReadEpoch = 0;
const revealTimers = new Map();
const IDLE_MS = 5 * 60 * 1000;

function toast(message, error = false) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').classList.toggle('error', error);
  $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; $('toast').textContent = ''; }, 5000);
}
function hidePassword(input) {
  clearTimeout(revealTimers.get(input.id)); revealTimers.delete(input.id);
  input.type = 'password';
  const button = document.querySelector(`[data-toggle="${input.id}"]`);
  if (button) { button.textContent = 'Показать'; button.setAttribute('aria-pressed', 'false'); button.setAttribute('aria-label', input.id === 'master-password' ? 'Показать мастер-пароль' : 'Показать пароль'); }
}
function clearDialog(dialog) {
  dialog.querySelector('form')?.reset();
  dialog.querySelectorAll('input,textarea').forEach(input => {
    if (!['range', 'checkbox'].includes(input.type)) input.value = '';
    if (input.hasAttribute('data-secret') || input.id === 'entry-password') hidePassword(input);
  });
  dialog.querySelectorAll('.form-error').forEach(error => { error.textContent = ''; });
  if (dialog.id === 'entry-dialog') editingId = null;
  if (dialog.id === 'delete-dialog') { deletingId = null; $('delete-description').textContent = ''; }
  if (dialog.id === 'chrome-dialog') {
    pendingCsvEntries = []; csvReadEpoch++;
    $('chrome-submit').disabled = true;
    $('chrome-preview').textContent = 'Выберите файл, чтобы проверить записи перед импортом.';
  }
}
function closeDialog(dialog) { if (dialog.open) dialog.close(); clearDialog(dialog); }
function syncAuth() {
  const exists = store.exists;
  $('auth-heading').textContent = exists ? 'С возвращением' : 'Создайте хранилище';
  $('auth-description').textContent = exists ? 'Введите мастер-пароль, чтобы открыть ваши записи.' : 'Придумайте длинную фразу, которую сможете запомнить.';
  $('confirm-group').hidden = exists; $('confirm-password').required = !exists;
  $('master-password').autocomplete = exists ? 'current-password' : 'new-password';
  $('master-password').minLength = exists ? 1 : 12;
  $('master-help').textContent = exists ? 'Доступ восстановится только с правильным мастер-паролем.' : 'Не менее 12 символов. Лучше несколько случайных слов.';
  $('auth-submit').textContent = exists ? 'Открыть хранилище' : 'Создать хранилище';
  $('auth-import').hidden = exists;
  $('reset-button').hidden = !exists;
}
function resetIdle() {
  clearTimeout(idleTimer);
  if (store?.unlocked) idleTimer = setTimeout(() => lock('Хранилище заблокировано после 5 минут бездействия.'), IDLE_MS);
}
function lock(message) {
  uiEpoch++; store.lock(); clearTimeout(idleTimer);
  document.querySelectorAll('dialog').forEach(closeDialog);
  $('auth-form').reset(); hidePassword($('master-password'));
  $('search').value = ''; $('entry-list').replaceChildren(); $('entry-count').textContent = '0'; $('result-count').textContent = '';
  $('vault-view').hidden = true; $('auth-view').hidden = false; $('lock-button').hidden = true; $('local-label').hidden = false;
  $('auth-error').textContent = ''; syncAuth();
  if (!document.hidden) $('master-password').focus();
  if (message) toast(message);
}
function showVault() {
  if (!store.unlocked) return;
  if (document.hidden) { lock(); return; }
  $('auth-form').reset(); hidePassword($('master-password'));
  $('auth-error').textContent = ''; $('search').value = '';
  $('auth-view').hidden = true; $('vault-view').hidden = false; $('lock-button').hidden = false; $('local-label').hidden = true;
  renderEntries(); resetIdle(); $('search').focus();
}
async function action(errorId, work) {
  if (busy) return;
  const epoch = uiEpoch;
  busy = true;
  const controls = [...document.querySelectorAll('button,input[type=file]')].filter(button => button.id !== 'lock-button' && !button.disabled);
  controls.forEach(button => { button.disabled = true; });
  if (errorId) $(errorId).textContent = '';
  const submit = errorId && { 'auth-error': 'auth-submit', 'entry-error': 'entry-submit', 'import-error': 'import-submit', 'delete-error': 'confirm-delete', 'reset-error': 'reset-submit', 'chrome-error': 'chrome-submit' }[errorId];
  const previous = submit && $(submit).textContent;
  if (submit) { $(submit).textContent = 'Подождите…'; $(submit).setAttribute('aria-busy', 'true'); }
  try { await work(); }
  catch (error) {
    if (epoch !== uiEpoch) return;
    if (!store.unlocked && !$('vault-view').hidden) lock();
    if (errorId && !$(errorId).closest('[hidden]') && (!$(errorId).closest('dialog') || $(errorId).closest('dialog').open)) $(errorId).textContent = error.message;
    else toast(error.message || 'Не удалось выполнить операцию.', true);
  } finally {
    controls.forEach(button => { button.disabled = false; });
    if (submit) { $(submit).textContent = previous; $(submit).removeAttribute('aria-busy'); }
    if (!$('chrome-dialog').open || !pendingCsvEntries.length) $('chrome-submit').disabled = true;
    busy = false;
    if (!store.unlocked) syncAuth();
  }
}
const paths = {
  copy: ['M9 5V3h11v13h-2', 'M4 7h11v14H4z'],
  user: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8', 'M17 8h5M19.5 5.5v5'],
  edit: ['m16 3 5 5-12 12-6 1 1-6L16 3Z', 'm13 6 5 5'],
  delete: ['M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7'],
};
function iconButton(kind, name, callback) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = `icon-button ${kind}`; button.setAttribute('aria-label', name); button.title = name;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none'); svg.setAttribute('aria-hidden', 'true');
  paths[kind].forEach(d => { const path = document.createElementNS(svg.namespaceURI, 'path'); path.setAttribute('d', d); svg.append(path); });
  button.append(svg); button.addEventListener('click', callback); return button;
}
async function copy(value, label) {
  if (!store.unlocked || !value) return;
  try { await navigator.clipboard.writeText(value); if (store.unlocked) toast(`${label} скопирован. Буфер обмена не очищается автоматически.`); }
  catch { toast('Браузер запретил копирование. Откройте запись и скопируйте вручную.', true); }
}
function renderEntries() {
  const entries = store.entries;
  const query = $('search').value.trim().toLocaleLowerCase('ru');
  const filtered = entries.filter(entry => [entry.title, entry.username, entry.url].some(value => value.toLocaleLowerCase('ru').includes(query))).sort((a, b) => a.title.localeCompare(b.title, 'ru'));
  $('entry-count').textContent = String(entries.length); $('result-count').textContent = `${filtered.length} / ${entries.length}`;
  $('empty-state').hidden = filtered.length > 0;
  $('empty-title').textContent = entries.length ? 'Ничего не найдено' : 'Здесь начнётся порядок';
  $('empty-description').textContent = entries.length ? 'Попробуйте другое название, логин или адрес сайта.' : 'Добавьте первый аккаунт — остальное запомним за вас.';
  $('empty-add').hidden = entries.length > 0;
  const fragment = document.createDocumentFragment();
  for (const entry of filtered) {
    const row = document.createElement('li'); row.className = 'entry-row';
    const avatar = document.createElement('span'); avatar.className = 'entry-avatar'; avatar.textContent = [...entry.title][0].toLocaleUpperCase('ru'); avatar.setAttribute('aria-hidden', 'true');
    const info = document.createElement('div'); info.className = 'entry-info';
    const name = document.createElement('h2'); name.className = 'entry-name'; name.textContent = entry.title;
    const user = document.createElement('p'); user.className = 'entry-user'; user.textContent = entry.username || entry.url || 'Без логина';
    info.append(name, user);
    const actions = document.createElement('div'); actions.className = 'entry-actions';
    // Closures retain only IDs. Plaintext is looked up at the moment of use.
    const id = entry.id;
    const lookup = () => store.entries.find(item => item.id === id);
    if (entry.username) actions.append(iconButton('user', `Копировать логин: ${entry.title}`, () => copy(lookup()?.username, 'Логин')));
    actions.append(iconButton('copy', `Копировать пароль: ${entry.title}`, () => copy(lookup()?.password, 'Пароль')), iconButton('edit', `Открыть запись: ${entry.title}`, () => openEntry(id)), iconButton('delete', `Удалить: ${entry.title}`, () => openDelete(id)));
    row.append(avatar, info, actions); fragment.append(row);
  }
  $('entry-list').replaceChildren(fragment);
}
function openEntry(id = null) {
  if (!store.unlocked || busy) return;
  clearDialog($('entry-dialog')); editingId = id;
  const entry = id && store.entries.find(item => item.id === id);
  if (id && !entry) return;
  $('entry-heading').textContent = entry ? 'Ваша запись' : 'Новая запись';
  for (const field of ['title', 'username', 'password', 'url', 'notes']) $(`entry-${field}`).value = entry?.[field] || '';
  $('entry-dialog').showModal(); $('entry-title').focus();
}
function openDelete(id) {
  if (!store.unlocked || busy) return;
  const entry = store.entries.find(item => item.id === id);
  if (!entry) return;
  deletingId = id; $('delete-description').textContent = `Запись «${entry.title}» будет удалена из этого хранилища.`;
  $('delete-dialog').showModal(); $('delete-dialog').querySelector('[data-close]').focus();
}
function openImport() {
  if (busy) return;
  clearDialog($('import-dialog'));
  $('import-description').textContent = store.unlocked ? 'Записи добавятся к существующим. Точные дубликаты пропустим, разные версии сохраним отдельно.' : 'Восстановите хранилище из зашифрованной копии. Мастер-пароль останется тем же, что у копии.';
  $('import-dialog').showModal();
}
function refreshGenerator() {
  $('length-value').textContent = $('password-length').value;
  try {
    $('generated-password').value = generatePassword(Number($('password-length').value), Object.fromEntries(['lower', 'upper', 'digits', 'symbols'].map(key => [key, $(`gen-${key}`).checked])));
    $('generator-error').textContent = ''; $('copy-generated').disabled = false;
  } catch (error) { $('generated-password').value = ''; $('generator-error').textContent = error.message; $('copy-generated').disabled = true; }
}

function initialize() {
  if (!window.isSecureContext || !crypto.subtle) throw new Error('Для шифрования откройте приложение через localhost или HTTPS. Запустите файл «Запустить.cmd» из папки проекта.');
  store = new VaultStore(localStorage); syncAuth();
  $('auth-form').addEventListener('submit', event => {
    event.preventDefault();
    action('auth-error', async () => {
      let password = $('master-password').value;
      const exists = store.exists;
      if (!exists && password !== $('confirm-password').value) throw new Error('Мастер-пароли не совпадают.');
      // Clear both fields before the expensive key derivation.
      $('master-password').value = ''; $('confirm-password').value = '';
      try { if (exists) await store.unlock(password); else await store.create(password); }
      finally { password = ''; }
      showVault();
    });
  });
  $('lock-button').addEventListener('click', () => lock('Хранилище заблокировано.'));
  $('add-button').addEventListener('click', () => openEntry()); $('empty-add').addEventListener('click', () => openEntry());
  $('search').addEventListener('input', renderEntries);
  $('entry-form').addEventListener('submit', event => {
    event.preventDefault();
    action('entry-error', async () => {
      const title = $('entry-title').value.trim();
      if (!title) throw new Error('Введите название записи.');
      let url = $('entry-url').value.trim();
      if (url) {
        try { const parsed = new URL(url.includes('://') ? url : `https://${url}`); if (!['https:', 'http:', 'android:'].includes(parsed.protocol) || !parsed.hostname) throw new Error(); url = parsed.href; }
        catch { throw new Error('Укажите адрес сайта, например https://example.com.'); }
      }
      const entries = store.entries; const existing = entries.find(entry => entry.id === editingId); const now = new Date().toISOString();
      const entry = { id: existing?.id || crypto.randomUUID(), title, username: $('entry-username').value.trim(), password: $('entry-password').value, url, notes: $('entry-notes').value, createdAt: existing?.createdAt || now, updatedAt: now };
      await store.save(existing ? entries.map(item => item.id === existing.id ? entry : item) : [...entries, entry]);
      closeDialog($('entry-dialog')); renderEntries(); toast('Запись сохранена.');
    });
  });
  $('entry-generate').addEventListener('click', () => { $('entry-password').value = generatePassword(); toast('Создан случайный пароль из 20 символов.'); });
  $('confirm-delete').addEventListener('click', () => action('delete-error', async () => {
    await store.save(store.entries.filter(entry => entry.id !== deletingId));
    closeDialog($('delete-dialog')); renderEntries(); toast('Запись удалена.');
  }));
  $('generator-button').addEventListener('click', () => { refreshGenerator(); $('generator-dialog').showModal(); });
  $('password-length').addEventListener('input', refreshGenerator);
  ['lower', 'upper', 'digits', 'symbols'].forEach(key => $(`gen-${key}`).addEventListener('change', refreshGenerator));
  $('regenerate').addEventListener('click', refreshGenerator); $('copy-generated').addEventListener('click', () => copy($('generated-password').value, 'Пароль'));
  $('export-button').addEventListener('click', () => action(null, async () => {
    const raw = store.export();
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `password-vault-${new Date().toISOString().slice(0, 10)}.json`; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    toast('Копия подготовлена. Сохраните файл в надёжном месте.');
  }));
  $('auth-import').addEventListener('click', openImport); $('import-button').addEventListener('click', openImport);
  const chromeButton = document.createElement('button');
  chromeButton.id = 'chrome-button'; chromeButton.className = 'nav-button'; chromeButton.textContent = 'Импорт из Chrome';
  $('import-button').after(chromeButton);
  chromeButton.addEventListener('click', () => { clearDialog($('chrome-dialog')); $('chrome-dialog').showModal(); });
  $('chrome-file').addEventListener('change', async () => {
    const epoch = ++csvReadEpoch; const uiBefore = uiEpoch;
    pendingCsvEntries = []; $('chrome-submit').disabled = true; $('chrome-error').textContent = '';
    const file = $('chrome-file').files[0];
    if (!file) { $('chrome-preview').textContent = 'Выберите файл, чтобы проверить записи перед импортом.'; return; }
    $('chrome-preview').textContent = 'Проверяем CSV…';
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error('CSV слишком большой. Максимум 4 МБ.');
      const text = await file.text();
      if (epoch !== csvReadEpoch || uiBefore !== uiEpoch || !store.unlocked || !$('chrome-dialog').open) return;
      const parsed = parseChromeCsv(text);
      const before = store.entries; const merged = mergeEntries(before, parsed.entries);
      const added = merged.length - before.length;
      pendingCsvEntries = parsed.entries;
      $('chrome-preview').textContent = `Найдено записей: ${parsed.entries.length}. Новых: ${added}. Дубликатов: ${parsed.entries.length - added}. Без пароля пропущено: ${parsed.skipped}.`;
      $('chrome-submit').disabled = added === 0;
    } catch (error) {
      if (epoch !== csvReadEpoch || uiBefore !== uiEpoch) return;
      pendingCsvEntries = []; $('chrome-preview').textContent = 'Импорт не выполнен.'; $('chrome-error').textContent = error.message;
    }
  });
  $('chrome-form').addEventListener('submit', event => {
    event.preventDefault();
    action('chrome-error', async () => {
      if (!pendingCsvEntries.length) throw new Error('Сначала выберите корректный CSV-файл.');
      const count = await store.importEntries(pendingCsvEntries);
      closeDialog($('chrome-dialog')); renderEntries(); toast(`Импорт из Chrome завершён. Добавлено: ${count}. Удалите незашифрованный CSV после проверки.`);
    });
  });
  $('reset-button').addEventListener('click', () => { clearDialog($('reset-dialog')); $('reset-dialog').showModal(); $('reset-dialog').querySelector('[data-close]').focus(); });
  $('reset-form').addEventListener('submit', event => {
    event.preventDefault();
    action('reset-error', async () => { await store.reset($('reset-confirmation').value); closeDialog($('reset-dialog')); lock('Локальное хранилище удалено. Можно создать новое или восстановить копию.'); });
  });
  $('import-form').addEventListener('submit', event => {
    event.preventDefault();
    action('import-error', async () => {
      const file = $('backup-file').files[0];
      if (!file || file.size > MAX_BACKUP_BYTES) throw new Error('Выберите файл резервной копии размером до 4 МБ.');
      const epoch = uiEpoch; const text = await file.text();
      if (epoch !== uiEpoch) return;
      let password = $('backup-password').value; $('backup-password').value = '';
      let count;
      try { count = await store.import(text, password); } finally { password = ''; }
      closeDialog($('import-dialog')); showVault(); toast(`Импорт завершён. Добавлено записей: ${count}.`);
    });
  });
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => closeDialog($(button.dataset.close))));
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); else clearDialog(dialog); });
    dialog.addEventListener('close', () => clearDialog(dialog));
  });
  document.querySelectorAll('[data-toggle]').forEach(button => button.addEventListener('click', () => {
    const input = $(button.dataset.toggle);
    if (input.type === 'text') { hidePassword(input); return; }
    input.type = 'text'; button.textContent = 'Скрыть'; button.setAttribute('aria-pressed', 'true'); button.setAttribute('aria-label', input.id === 'master-password' ? 'Скрыть мастер-пароль' : 'Скрыть пароль');
    revealTimers.set(input.id, setTimeout(() => hidePassword(input), 15_000));
  }));
  for (const type of ['pointerdown', 'keydown', 'input', 'wheel']) document.addEventListener(type, resetIdle, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) lock(); });
  window.addEventListener('pagehide', () => lock());
  window.addEventListener('pageshow', event => { if (event.persisted) lock(); });
  window.addEventListener('storage', event => { if (event.key === STORAGE_KEY || event.key === null) lock('Данные изменились в другой вкладке. Откройте хранилище заново.'); });
}
try { initialize(); }
catch (error) { $('fatal-error').textContent = error.message; $('fatal-error').hidden = false; $('auth-view').hidden = true; }
