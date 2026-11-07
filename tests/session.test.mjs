import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeSession } from '../session.mjs';
import { VaultStore } from '../vault.mjs';
import { parseChromeCsv } from '../csv.mjs';

const FIVE_MINUTES = 300_000;
function setup({ unlocked = true, onLock = () => {} } = {}) {
  const document = new EventTarget(); document.hidden = false;
  const window = new EventTarget(); const timers = new Map();
  let time = 10_000; let nextId = 0; let locks = 0; let hidden = 0;
  const session = initializeSession({
    document, window, isUnlocked: () => unlocked,
    lock: () => { locks++; unlocked = false; onLock(); },
    onHidden: () => { hidden++; }, now: () => time,
    setTimer: (fn, delay) => { const id = ++nextId; timers.set(id, { fn, at: time + delay }); return id; },
    clearTimer: id => timers.delete(id),
  });
  return {
    document, window, session,
    get unlocked() { return unlocked; }, get locks() { return locks; }, get hidden() { return hidden; },
    advance(ms) { time += ms; },
    visibility(value) { document.hidden = value; document.dispatchEvent(new Event('visibilitychange')); },
    activity(type = 'change') { const event = new Event(type, { cancelable: true }); document.dispatchEvent(event); return event; },
    runTimers() { for (const [id, timer] of [...timers]) if (timer.at <= time) { timers.delete(id); timer.fn(); } },
  };
}
const memory = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
};

test('choosing or cancelling a file within five minutes preserves the unlocked session', () => {
  const h = setup(); h.session.start();
  h.visibility(true); h.advance(90_000); h.visibility(false); h.activity('change');
  assert.equal(h.unlocked, true); assert.equal(h.locks, 0); assert.equal(h.hidden, 1);
  h.visibility(true); h.advance(90_000); h.visibility(false); h.activity('cancel');
  assert.equal(h.unlocked, true); assert.equal(h.locks, 0);
});

test('restoring into an empty/locked app survives file picker visibility events', () => {
  const h = setup({ unlocked: false });
  h.visibility(true); h.advance(30_000); h.activity(); h.visibility(false);
  assert.equal(h.locks, 0); // A lock callback would clear the restore dialog and file input.
});

test('return after five minutes locks even when background timers never ran', () => {
  const h = setup(); h.session.start(); h.visibility(true); h.advance(FIVE_MINUTES);
  h.visibility(false);
  assert.equal(h.unlocked, false); assert.equal(h.locks, 1);
});

test('a file change before visibility resumes cannot revive an expired session', () => {
  const h = setup(); h.session.start(); h.visibility(true); h.advance(FIVE_MINUTES + 1);
  const event = h.activity();
  assert.equal(event.defaultPrevented, true); assert.equal(h.unlocked, false); assert.equal(h.locks, 1);
  h.visibility(false); assert.equal(h.locks, 1);
});

test('returning from the picker does not restart the inactivity deadline', () => {
  const h = setup(); h.session.start(); h.visibility(true); h.advance(FIVE_MINUTES - 1);
  h.visibility(false); assert.equal(h.unlocked, true);
  h.advance(1); h.runTimers(); assert.equal(h.unlocked, false);
});

test('visible interaction renews the session, background events do not', () => {
  const h = setup(); h.session.start(); h.advance(200_000); h.activity('input');
  h.advance(100_000); h.runTimers(); assert.equal(h.unlocked, true);
  h.visibility(true); h.advance(190_000); h.activity('input');
  h.advance(10_000); h.runTimers(); assert.equal(h.unlocked, false);
});

test('first click after a suspended deadline locks before the action runs', () => {
  const h = setup(); h.session.start(); h.advance(FIVE_MINUTES);
  assert.equal(h.activity('click').defaultPrevented, true); assert.equal(h.locks, 1);
});

test('page navigation and history restoration still end the session immediately', () => {
  for (const type of ['pagehide', 'pageshow']) {
    const h = setup(); h.session.start();
    const event = new Event(type); Object.defineProperty(event, 'persisted', { value: true });
    h.window.dispatchEvent(event); assert.equal(h.unlocked, false); assert.equal(h.locks, 1);
  }
});

test('manual lock cancels pending timer; a new unlock gets a new deadline', () => {
  const h = setup(); h.session.start(); h.advance(299_000); h.session.stop();
  h.advance(2_000); h.runTimers(); assert.equal(h.locks, 0);
  h.session.start(); h.advance(299_999); assert.equal(h.session.check(), true);
  h.advance(1); assert.equal(h.session.check(), false);
});

test('clock moving backwards cannot prolong the unlocked session', () => {
  const h = setup(); h.session.start(); h.advance(-1);
  assert.equal(h.session.check(), false); assert.equal(h.locks, 1);
});

test('encrypted backup and Chrome CSV import succeed after a simulated mobile file picker', async () => {
  const source = new VaultStore(memory());
  const password = 'Dummy backup password 123!';
  await source.create(password);
  const parsed = parseChromeCsv('name,url,username,password\nDemo,https://example.com,demo@example.com,dummy-password\n');
  await source.importEntries(parsed.entries);
  const raw = source.export();
  const destination = new VaultStore(memory()); await destination.create(password);
  const h = setup({ onLock: () => destination.lock() }); h.session.start();
  h.visibility(true); h.advance(20_000); h.visibility(false); h.activity();
  assert.equal(await destination.import(raw, password), 1);
  assert.equal(destination.entries[0].username, 'demo@example.com');
  h.visibility(true); h.advance(20_000); h.activity(); h.visibility(false);
  assert.equal(await destination.importEntries(parsed.entries), 0);
  assert.equal(destination.entries.length, 1); assert.equal(h.locks, 0);
  h.visibility(true); h.advance(FIVE_MINUTES); h.visibility(false);
  assert.equal(destination.unlocked, false);
});
