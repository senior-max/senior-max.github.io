/**
 * keyboard.js
 * Keyboard navigation, accessibility helpers, and focus management
 * for "License To Bill".
 * Depends on: engine.js, storage.js (optional — graceful no-ops when absent)
 * Exposes: window.KeyboardController
 */

// ── Constants ─────────────────────────────────────────────

/**
 * Overlay IDs that ESC is allowed to close, ordered lowest → highest priority.
 * The rightmost existing overlay in this list wins.
 */
const CLOSEABLE_OVERLAYS = [
  'levelup-overlay',
  'project-complete-overlay',
  'burnout-overlay',
  'project-select-overlay',
  'email-overlay',
  'minigame-overlay',
  'achievements-overlay',
  'framework-overlay',
  'menu-credits',
];

/** Selector covering every element that participates in tab order. */
const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

// ── Focus trap ────────────────────────────────────────────

/**
 * Traps keyboard Tab focus inside `overlay`.
 * - Tab cycles forward through all focusable children.
 * - Shift+Tab cycles backwards.
 * - Immediately moves focus to the first focusable child.
 *
 * @param {HTMLElement} overlay
 * @returns {() => void} Cleanup function that removes the listener.
 */
function trapFocus(overlay) {
  if (!overlay) return () => {};

  /** @returns {HTMLElement[]} */
  function focusable() {
    return Array.from(overlay.querySelectorAll(FOCUSABLE_SELECTOR));
  }

  function onKeyDown(e) {
    if (e.key !== 'Tab') return;

    const elements = focusable();
    if (elements.length === 0) return;

    const first = elements[0];
    const last  = elements[elements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first || !overlay.contains(document.activeElement)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last || !overlay.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  overlay.addEventListener('keydown', onKeyDown);

  const firstEl = focusable()[0];
  if (firstEl) firstEl.focus();

  return () => overlay.removeEventListener('keydown', onKeyDown);
}

// ── Key hints below choice buttons ────────────────────────

/**
 * Injects small `[1]` … `[N]` keyboard shortcut badges directly below
 * `#choices-container`. Clears any existing hints first.
 * Hidden on narrow viewports (≤ 768 px) and for screen readers.
 */
function showKeyHints() {
  document.getElementById('key-hints')?.remove();

  if (window.innerWidth <= 768) return;

  const container = document.getElementById('choices-container');
  if (!container) return;

  const buttons = Array.from(
    container.querySelectorAll('.choice-btn:not([disabled])'),
  ).slice(0, 4);

  if (buttons.length === 0) return;

  const wrap = document.createElement('div');
  wrap.id = 'key-hints';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.style.cssText = [
    'display:flex', 'gap:var(--space-sm)',
    'margin-top:var(--space-xs)', 'opacity:0.5',
  ].join(';');

  buttons.forEach((_, i) => {
    const kbd = document.createElement('kbd');
    kbd.className = 'key-hint';
    kbd.textContent = String(i + 1);
    wrap.appendChild(kbd);
  });

  container.insertAdjacentElement('afterend', wrap);
}

// ── Toast notifications ───────────────────────────────────

/**
 * Shows a brief centered toast at the bottom of the screen.
 * @param {string} text
 * @param {string} [color] - CSS color value (defaults to accent-green).
 */
function showToast(text, color = 'var(--color-accent-green)') {
  const id = 'kb-toast';
  document.getElementById(id)?.remove();

  const toast = document.createElement('div');
  toast.id = id;
  toast.setAttribute('aria-live', 'polite');
  toast.setAttribute('aria-atomic', 'true');
  toast.style.cssText = [
    'position:fixed', 'bottom:var(--space-lg)', 'left:50%',
    'transform:translateX(-50%)',
    'z-index:3000', 'background:var(--color-surface-elevated)',
    `border:1px solid ${color}`,
    'border-radius:var(--radius-md)',
    'padding:var(--space-sm) var(--space-md)',
    'font-family:var(--font-mono)', 'font-size:var(--font-size-sm)',
    `color:${color}`, 'white-space:nowrap',
    'pointer-events:none',
  ].join(';');
  toast.textContent = text;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

// ── Overlay ESC handling ──────────────────────────────────

/**
 * Finds and removes the highest-priority open overlay from `CLOSEABLE_OVERLAYS`.
 * @returns {boolean} `true` when an overlay was closed.
 */
function closeTopOverlay() {
  for (let i = CLOSEABLE_OVERLAYS.length - 1; i >= 0; i--) {
    const el = document.getElementById(CLOSEABLE_OVERLAYS[i]);
    if (el) {
      el.remove();
      return true;
    }
  }
  return false;
}

// ── Email inbox arrow navigation ──────────────────────────

/**
 * Moves keyboard focus to the next or previous email item in the inbox overlay.
 * Wraps around at the boundaries.
 * @param {'ArrowUp'|'ArrowDown'} direction
 */
function navigateEmailList(direction) {
  const inbox = document.getElementById('email-overlay');
  if (!inbox) return;

  const items = Array.from(inbox.querySelectorAll('[data-email-id]'));
  if (items.length === 0) return;

  const activeEl = document.activeElement;
  const currentIndex = items.findIndex(
    (el) => el === activeEl || el.contains(activeEl),
  );

  let nextIndex;
  if (direction === 'ArrowDown') {
    nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
  } else {
    nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
  }

  const target = items[nextIndex];
  const focusTarget =
    target.querySelector('button:not([disabled]), [tabindex]') ?? target;
  focusTarget.focus();
}

// ── Main key handler ──────────────────────────────────────

/**
 * Routes a `keydown` event to the correct game action.
 * Ignored when focus is inside a text input field.
 * @param {KeyboardEvent} event
 */
function handleKey(event) {
  const active = document.activeElement;
  if (active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) return;

  const { key, ctrlKey, metaKey } = event;

  // ── Ctrl/Cmd + S — save ──
  if ((ctrlKey || metaKey) && key.toLowerCase() === 's') {
    event.preventDefault();
    if (window.Engine && window.Storage) {
      window.Storage.saveGame(window.Engine.GameState);
    }
    showToast('💾 Gespeichert');
    return;
  }

  // ── 1–4 — choice buttons ──
  if (['1', '2', '3', '4'].includes(key) && !ctrlKey && !metaKey) {
    const idx = parseInt(key, 10) - 1;
    const container = document.getElementById('choices-container');
    const btns = container
      ? Array.from(container.querySelectorAll('.choice-btn:not([disabled])'))
      : [];
    btns[idx]?.click();
    return;
  }

  // ── Enter — activate focused element ──
  if (key === 'Enter') {
    if (active && active !== document.body && active.tagName !== 'BUTTON') {
      active.click();
    }
    return;
  }

  // ── Escape — close topmost overlay ──
  if (key === 'Escape') {
    closeTopOverlay();
    return;
  }

  // ── Arrow Up / Down — email list navigation ──
  if (key === 'ArrowUp' || key === 'ArrowDown') {
    navigateEmailList(key);
    return;
  }

  // ── M — sound toggle (reserved for future implementation) ──
  // if (key === 'm' || key === 'M') { /* toggle sound */ }
}

// ── Init ──────────────────────────────────────────────────

/**
 * Attaches the global keydown listener.
 * Safe to call multiple times — removes any previous listener first.
 */
function init() {
  document.removeEventListener('keydown', handleKey);
  document.addEventListener('keydown', handleKey);
}

// ── Public API ────────────────────────────────────────────

window.KeyboardController = {
  init,
  handleKey,
  showKeyHints,
  trapFocus,
  showToast,
};
