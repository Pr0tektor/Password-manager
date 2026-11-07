import { t } from './i18n.mjs';
import { MAX_API_KEYS } from './crypto.mjs';

export function appendCopyIcon(document, button) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none'); svg.setAttribute('aria-hidden', 'true');
  for (const d of ['M9 5V3h11v13h-2', 'M4 7h11v14H4z']) {
    const path = document.createElementNS(svg.namespaceURI, 'path'); path.setAttribute('d', d); svg.append(path);
  }
  button.append(svg);
}

export function createApiKeyEditor({ document, container, addButton, onCopy, setTimer = setTimeout, clearTimer = clearTimeout }) {
  const rows = [];
  let sequence = 0;
  function concealRow(row) {
    clearTimer(row.timer); row.timer = undefined; row.value.type = 'password';
    row.reveal.textContent = t('Показать'); row.reveal.setAttribute('aria-pressed', 'false');
    row.reveal.setAttribute('aria-label', t('Показать API-ключ'));
  }
  function refresh() {
    addButton.textContent = t('Добавить API-ключ'); addButton.disabled = rows.length >= MAX_API_KEYS;
    rows.forEach((row, index) => {
      row.element.setAttribute('aria-label', t('API-ключ {number}', { number: index + 1 }));
      row.labelText.textContent = t('Название ключа'); row.label.placeholder = t('Например, основной или тестовый');
      row.valueText.textContent = t('Значение API-ключа');
      row.copy.title = t('Копировать API-ключ'); row.copy.setAttribute('aria-label', row.copy.title);
      row.remove.title = t('Удалить API-ключ'); row.remove.setAttribute('aria-label', row.remove.title);
      row.reveal.textContent = row.value.type === 'password' ? t('Показать') : t('Скрыть');
      row.reveal.setAttribute('aria-label', row.value.type === 'password' ? t('Показать API-ключ') : t('Скрыть API-ключ'));
    });
  }
  function add(initial = { label: '', value: '' }, focus = false) {
    if (rows.length >= MAX_API_KEYS) return;
    const row = {};
    const id = `api-key-${++sequence}`;
    row.element = document.createElement('div'); row.element.className = 'api-key-row'; row.element.setAttribute('role', 'group');
    row.labelText = document.createElement('label'); row.labelText.htmlFor = `${id}-label`;
    row.label = document.createElement('input'); row.label.id = `${id}-label`; row.label.maxLength = 100; row.label.autocomplete = 'off'; row.label.value = initial.label;
    row.valueText = document.createElement('label'); row.valueText.htmlFor = `${id}-value`;
    row.value = document.createElement('input'); row.value.id = `${id}-value`; row.value.type = 'password'; row.value.maxLength = 10000;
    row.value.autocomplete = 'off'; row.value.spellcheck = false; row.value.setAttribute('autocapitalize', 'off'); row.value.setAttribute('data-api-secret', ''); row.value.value = initial.value;
    const actions = document.createElement('div'); actions.className = 'api-key-value input-action has-copy';
    row.reveal = document.createElement('button'); row.reveal.type = 'button'; row.reveal.className = 'text-button reveal'; row.reveal.setAttribute('aria-pressed', 'false');
    row.reveal.addEventListener('click', () => {
      if (row.value.type === 'text') concealRow(row);
      else { row.value.type = 'text'; row.reveal.setAttribute('aria-pressed', 'true'); row.timer = setTimer(() => { concealRow(row); }, 15_000); refresh(); }
    });
    row.copy = document.createElement('button'); row.copy.type = 'button'; row.copy.className = 'icon-button field-copy'; appendCopyIcon(document, row.copy);
    row.copy.addEventListener('click', () => { if (row.value.value) onCopy(row.value.value, row.label.value); });
    row.remove = document.createElement('button'); row.remove.type = 'button'; row.remove.className = 'icon-button api-key-remove'; row.remove.textContent = '×';
    row.remove.addEventListener('click', () => {
      const index = rows.indexOf(row); concealRow(row); row.label.value = ''; row.value.value = '';
      rows.splice(index, 1); row.element.remove(); refresh();
      (rows[index]?.label || rows[index - 1]?.label || addButton).focus();
    });
    actions.append(row.value, row.copy, row.reveal);
    row.element.append(row.labelText, row.label, row.valueText, actions, row.remove); rows.push(row); container.append(row.element); refresh();
    if (focus) row.label.focus();
  }
  function conceal() { rows.forEach(concealRow); }
  function clear() {
    conceal(); rows.forEach(row => { row.label.value = ''; row.value.value = ''; });
    rows.length = 0; container.replaceChildren(); refresh();
  }
  function setKeys(keys = []) { clear(); keys.forEach(key => add(key)); }
  function readKeys() {
    return rows.flatMap(row => {
      const label = row.label.value.trim(); const value = row.value.value;
      if (!label && !value.trim()) return [];
      if (!label || !value.trim()) throw new Error(t('Заполните название и значение каждого API-ключа или удалите пустое поле.'));
      return [{ label, value }];
    });
  }
  addButton.addEventListener('click', () => add(undefined, true)); refresh();
  return { setKeys, readKeys, clear, conceal, refresh };
}
