import { t } from './i18n.mjs';
export function initializePwa({ beforeReload }) {
  const $ = id => document.getElementById(id);
  let promptEvent = null;
  let registration = null;
  let state = 'preparing';
  let requestedUpdate = false;
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const statusText = () => {
    if (registration?.waiting) return t('Доступно обновление приложения. Перед обновлением хранилище будет заблокировано.');
    if (state === 'ready') return t('Офлайн-режим готов. Приложение можно открывать без сети.');
    if (state === 'failed') return t('Автономный запуск недоступен. Проверьте соединение и настройки браузера.');
    return t('Подготавливаем автономный запуск…');
  };
  function refresh() {
    $('install-button').hidden = standalone();
    $('pwa-status').textContent = standalone() ? `${t('Приложение уже установлено.')} ${statusText()}` : statusText();
    $('install-confirm').hidden = !promptEvent || standalone();
    $('pwa-update').hidden = !registration?.waiting;
  }
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); promptEvent = event; refresh(); });
  window.addEventListener('appinstalled', () => { promptEvent = null; refresh(); });
  $('install-button').addEventListener('click', () => { refresh(); $('install-dialog').showModal(); });
  $('install-confirm').addEventListener('click', async () => {
    const current = promptEvent;
    if (!current) return;
    promptEvent = null; refresh();
    try { await current.prompt(); await current.userChoice; } catch { /* Browser cancellation leaves the web app usable. */ }
    refresh();
  });
  $('pwa-update').addEventListener('click', () => {
    if (!registration?.waiting) return;
    beforeReload(); requestedUpdate = true;
    registration.waiting.postMessage({ type: 'ACTIVATE_UPDATE' });
  });
  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      state = 'ready'; refresh();
      if (requestedUpdate) location.reload();
    });
    navigator.serviceWorker.register(new URL('./sw.js', import.meta.url), { updateViaCache: 'none' })
      .then(value => {
        registration = value;
        function trackWorker() {
          const worker = registration.installing;
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'redundant' && !registration.active) state = 'failed';
            refresh();
          });
        }
        trackWorker(); registration.addEventListener('updatefound', trackWorker);
        if (registration.active) state = 'ready';
        refresh();
        navigator.serviceWorker.ready.then(ready => {
          if (ready.active) state = 'ready';
          refresh();
        });
      }).catch(() => { state = 'failed'; refresh(); });
  } else { state = 'failed'; }
  refresh();
  return { refresh };
}
