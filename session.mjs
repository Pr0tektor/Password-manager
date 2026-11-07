// A system file picker hides a mobile PWA without ending its session.
// Check elapsed time on return: background timers may have been suspended.
export function initializeSession({
  document, window, isUnlocked, lock, onHidden = () => {},
  now = () => Date.now(), setTimer = setTimeout, clearTimer = clearTimeout,
  timeoutMs = 5 * 60 * 1000,
}) {
  let lastActivity = null;
  let timer;
  function stop() { clearTimer(timer); timer = undefined; lastActivity = null; }
  function check() {
    if (!isUnlocked() || lastActivity === null) return true;
    const elapsed = now() - lastActivity;
    if (elapsed < 0 || elapsed >= timeoutMs) {
      stop(); lock('idle'); return false;
    }
    return true;
  }
  function schedule() {
    clearTimer(timer);
    if (isUnlocked() && lastActivity !== null) {
      timer = setTimer(() => { if (check()) schedule(); }, Math.max(1, timeoutMs - (now() - lastActivity)));
    }
  }
  function start() { lastActivity = now(); schedule(); }
  function activity(event) {
    // A file's change event can precede visibilitychange on mobile browsers.
    // Never revive an expired session by treating its first event as activity.
    if (!check()) {
      event?.preventDefault(); event?.stopImmediatePropagation(); return false;
    }
    if (isUnlocked() && !document.hidden) { lastActivity = now(); schedule(); }
    return true;
  }
  for (const type of ['pointerdown', 'keydown', 'input', 'wheel', 'change', 'click', 'submit']) {
    document.addEventListener(type, activity, { capture: true, passive: false });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) onHidden();
    if (check()) schedule();
  });
  window.addEventListener('focus', () => { if (check()) schedule(); });
  // Navigation/closing and restoring a navigated page still end the session.
  window.addEventListener('pagehide', () => { stop(); lock('navigation'); });
  window.addEventListener('pageshow', event => {
    if (event.persisted) { stop(); lock('navigation'); }
    else if (check()) schedule();
  });
  return { start, stop, check, activity };
}
