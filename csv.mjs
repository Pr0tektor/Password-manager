import { MAX_BACKUP_BYTES, MAX_ENTRIES, validateEntries } from './crypto.mjs';

// RFC-style quoted CSV: commas, embedded newlines, escaped double quotes and UTF-8 BOM.
// The parser never evaluates cell contents or includes credential values in errors.
export function parseCsv(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) throw new Error('CSV слишком большой. Максимум 4 МБ.');
  text = text.replace(/^\uFEFF/, '');
  if (text.includes('\0')) throw new Error('Неверная кодировка CSV. Экспортируйте файл из Chrome заново.');
  const rows = []; let row = []; let field = ''; let quoted = false; let closedQuote = false;
  function pushField() { row.push(field); field = ''; closedQuote = false; }
  function pushRow() {
    pushField();
    if (row.some(value => value !== '')) rows.push(row);
    if (rows.length > MAX_ENTRIES + 1) throw new Error(`В одном файле поддерживается до ${MAX_ENTRIES} записей.`);
    row = [];
  }
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { quoted = false; closedQuote = true; }
      } else field += char;
      continue;
    }
    if (char === ',') { pushField(); continue; }
    if (char === '\r' || char === '\n') { pushRow(); if (char === '\r' && text[i + 1] === '\n') i++; continue; }
    if (closedQuote) throw new Error(`Неверный CSV около записи ${rows.length + 1}: лишние символы после кавычек.`);
    if (char === '"') {
      if (field) throw new Error(`Неверный CSV около записи ${rows.length + 1}: неожиданная кавычка.`);
      quoted = true;
    } else field += char;
  }
  if (quoted) throw new Error('В CSV не закрыта кавычка. Экспортируйте файл из Chrome заново.');
  if (field !== '' || row.length || closedQuote) pushRow();
  return rows;
}

export function parseChromeCsv(text) {
  const rows = parseCsv(text);
  if (!rows.length) throw new Error('CSV пуст. Выберите файл экспорта паролей Chrome.');
  const header = rows.shift().map(value => value.trim().toLowerCase());
  if (new Set(header).size !== header.length) throw new Error('В CSV повторяются заголовки колонок.');
  for (const name of ['url', 'username', 'password']) if (!header.includes(name)) throw new Error('Нужны колонки url, username и password. Выберите экспорт паролей из Chrome.');
  const column = name => header.indexOf(name);
  const now = new Date().toISOString(); const entries = []; let skipped = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.length !== header.length) throw new Error(`Запись ${i + 1}: количество полей не совпадает с заголовком. Импорт не выполнен.`);
    const get = name => column(name) === -1 ? '' : row[column(name)];
    if (!get('password')) { skipped++; continue; }
    const url = get('url').trim();
    let fallback = 'Импорт из Chrome';
    try { fallback = new URL(url).hostname || fallback; } catch { /* Keep an editable title for an app or unknown URL. */ }
    const entry = { id: crypto.randomUUID(), title: get('name').trim() || fallback, username: get('username'), password: get('password'), url, notes: get('note') || get('notes'), createdAt: now, updatedAt: now };
    try { validateEntries([entry]); } catch { throw new Error(`Запись ${i + 1}: слишком длинные или неверные поля. Импорт не выполнен.`); }
    entries.push(entry);
  }
  if (!entries.length) throw new Error('В CSV нет записей с паролями. Ничего не импортировано.');
  return { entries, skipped };
}
