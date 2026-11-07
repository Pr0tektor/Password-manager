import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { english, t, setLocale, getLocale } from '../i18n.mjs';
test('English translations cover every static label and literal UI message', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const sources = new Set([...html.matchAll(/data-i18n(?:-(?:aria-label|placeholder))?="([^"]+)"/g)].map(match => match[1].replaceAll('&quot;', '"').replaceAll('&amp;', '&')));
  for (const file of ['app.mjs','api-keys.mjs','pwa.mjs','drive-ui.mjs','drive.mjs','crypto.mjs','vault.mjs','csv.mjs']) {
    const text = await readFile(new URL('../' + file, import.meta.url), 'utf8');
    for (const match of text.matchAll(/'((?:\\.|[^'\\])*)'/g)) if (/[А-Яа-яЁё]/.test(match[1])) sources.add(match[1]);
  }
  for (const source of sources) assert.ok(english[source], `Missing translation: ${source}`);
  for (const [key, value] of Object.entries(english)) assert.equal(typeof value, 'string', `Invalid translation: ${key}`);
});
test('locale changes are reversible and template values are inserted once', () => {
  setLocale('en'); assert.equal(getLocale(),'en'); assert.equal(t('Мастер-пароль'),'Master password');
  assert.equal(t('Запись «{title}» будет удалена из этого хранилища.',{title:'{count}<img>'}), 'The entry “{count}<img>” will be deleted from this vault.');
  assert.equal(t('УДАЛИТЬ'),'DELETE'); assert.match(t('Запись 3: количество полей не совпадает с заголовком. Импорт не выполнен.'), /^Entry 3:/);
  assert.match(t('В одном файле поддерживается до 2000 записей.'), /2?000 entries/);
  setLocale('ru'); assert.equal(t('Мастер-пароль'),'Мастер-пароль'); assert.equal(t('УДАЛИТЬ'),'УДАЛИТЬ');
  assert.throws(()=>setLocale('xx'));
});
