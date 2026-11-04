// Versioned, authenticated vault format. No plaintext is persisted by this module.
export const FORMAT = 'local-password-vault';
export const ITERATIONS = 600_000;
export const MAX_BACKUP_BYTES = 4_000_000;
export const MAX_ENTRIES = 2000;
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const aad = encoder.encode(`${FORMAT}:1`);

function fail(message = 'Неверный формат резервной копии.') { throw new Error(message); }
function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}
function base64ToBytes(value, expectedLength) {
  if (typeof value !== 'string' || value.length > MAX_BACKUP_BYTES || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) fail();
  const bytes = Uint8Array.from(atob(value), c => c.charCodeAt(0));
  if (expectedLength !== undefined && bytes.length !== expectedLength) fail();
  return bytes;
}

export function validateEntries(entries) {
  if (!Array.isArray(entries) || entries.length > MAX_ENTRIES) fail('Слишком много записей или неверный формат данных.');
  const ids = new Set();
  const fields = { id: 100, title: 200, username: 500, password: 2000, url: 2000, notes: 10000, createdAt: 40, updatedAt: 40 };
  return entries.map(entry => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) fail();
    const clean = {};
    for (const [field, max] of Object.entries(fields)) {
      if (typeof entry[field] !== 'string' || entry[field].length > max) fail();
      clean[field] = entry[field];
    }
    if (!clean.id || ids.has(clean.id) || !clean.title.trim() || !clean.password || !Number.isFinite(Date.parse(clean.createdAt)) || !Number.isFinite(Date.parse(clean.updatedAt))) fail();
    ids.add(clean.id);
    return clean;
  });
}

export function parseEnvelope(text) {
  if (typeof text !== 'string' || encoder.encode(text).length > MAX_BACKUP_BYTES) fail('Файл слишком большой. Максимум 4 МБ.');
  let value;
  try { value = JSON.parse(text); } catch { fail(); }
  if (!value || value.format !== FORMAT || value.version !== 1 || value.cipher !== 'AES-256-GCM' || value.kdf !== 'PBKDF2-SHA256' || value.iterations !== ITERATIONS) fail('Неподдерживаемый формат или параметры шифрования.');
  const salt = base64ToBytes(value.salt, 16);
  const iv = base64ToBytes(value.iv, 12);
  const ciphertext = base64ToBytes(value.ciphertext);
  if (ciphertext.length < 16) fail();
  // Only recognized fields survive an import.
  const envelope = { format: FORMAT, version: 1, cipher: 'AES-256-GCM', kdf: 'PBKDF2-SHA256', iterations: ITERATIONS, salt: value.salt, iv: value.iv, ciphertext: value.ciphertext };
  return { envelope, salt, iv, ciphertext };
}

export async function deriveKey(password, salt) {
  if (typeof password !== 'string' || !password.length || password.length > 1024) fail('Введите мастер-пароль (до 1024 символов).');
  const passwordBytes = encoder.encode(password);
  try {
    const material = await crypto.subtle.importKey('raw', passwordBytes, 'PBKDF2', false, ['deriveKey']);
    return await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  } finally { passwordBytes.fill(0); }
}

export async function encryptVault(entries, key, salt) {
  const clean = validateEntries(entries);
  const plaintext = encoder.encode(JSON.stringify({ version: 1, entries: clean }));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  try {
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad, tagLength: 128 }, key, plaintext);
    const envelope = { format: FORMAT, version: 1, cipher: 'AES-256-GCM', kdf: 'PBKDF2-SHA256', iterations: ITERATIONS, salt: bytesToBase64(salt), iv: bytesToBase64(iv), ciphertext: bytesToBase64(new Uint8Array(ciphertext)) };
    if (JSON.stringify(envelope).length > MAX_BACKUP_BYTES) fail('Хранилище заполнено. Уменьшите объём заметок.');
    return envelope;
  } finally { plaintext.fill(0); }
}

export async function createVault(password) {
  if (typeof password !== 'string' || [...password].length < 12 || !password.trim()) fail('Мастер-пароль должен содержать не менее 12 символов.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);
  const envelope = await encryptVault([], key, salt);
  return { key, salt, envelope, entries: [] };
}

export async function openVault(text, password) {
  const { envelope, salt, iv, ciphertext } = parseEnvelope(text);
  const key = await deriveKey(password, salt);
  let plaintext;
  try { plaintext = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: aad, tagLength: 128 }, key, ciphertext)); }
  catch { fail('Неверный мастер-пароль или повреждённая копия.'); }
  try {
    const payload = JSON.parse(decoder.decode(plaintext));
    if (payload.version !== 1) fail();
    return { key, salt, envelope, entries: validateEntries(payload.entries) };
  } finally { plaintext.fill(0); }
}

const GROUPS = { lower: 'abcdefghijklmnopqrstuvwxyz', upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', digits: '0123456789', symbols: '!@#$%^&*()-_=+[]{}:;,.?' };
function randomIndex(size) {
  const limit = Math.floor(256 / size) * size;
  const byte = new Uint8Array(1);
  do { crypto.getRandomValues(byte); } while (byte[0] >= limit);
  return byte[0] % size;
}
export function generatePassword(length = 20, options = { lower: true, upper: true, digits: true, symbols: true }) {
  if (!Number.isInteger(length) || length < 12 || length > 64) fail('Длина пароля: от 12 до 64 символов.');
  const groups = Object.keys(GROUPS).filter(key => options[key]).map(key => GROUPS[key]);
  if (!groups.length) fail('Выберите хотя бы один набор символов.');
  const pool = groups.join('');
  // Rejection sampling keeps the output uniform among passwords satisfying the selected groups.
  let result;
  do { result = Array.from({ length }, () => pool[randomIndex(pool.length)]); }
  while (!groups.every(group => result.some(char => group.includes(char))));
  return result.join('');
}

export function mergeEntries(current, incoming) {
  const result = validateEntries(current);
  const fingerprint = e => JSON.stringify([e.title, e.username, e.password, e.url, e.notes]);
  const seen = new Set(result.map(fingerprint));
  const ids = new Set(result.map(e => e.id));
  for (const entry of validateEntries(incoming)) {
    const mark = fingerprint(entry);
    if (seen.has(mark)) continue;
    const copy = { ...entry };
    if (ids.has(copy.id)) copy.id = crypto.randomUUID();
    result.push(copy); ids.add(copy.id); seen.add(mark);
  }
  return validateEntries(result);
}
