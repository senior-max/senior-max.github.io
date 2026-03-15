/**
 * sound.js
 * Programmatic sound effects for "License To Bill" using the Web Audio API.
 * No external audio files needed — every sound is synthesised at runtime.
 *
 * Usage:
 *   window.Sound.init()       — call once during boot
 *   window.Sound.play('click')
 *   window.Sound.toggle()
 */

// ── Module state ──────────────────────────────────────────

/** @type {AudioContext|null} Lazily created on the first user interaction. */
let ctx = null;

/** @type {boolean} When true no sound is produced. */
let muted = false;

const STORAGE_KEY = 'ltb_muted';

// ── AudioContext lifecycle ────────────────────────────────

/**
 * Returns the shared AudioContext, resuming it if it has been suspended by
 * the browser's autoplay policy. Returns null if not yet created.
 * @returns {AudioContext|null}
 */
function getCtx() {
  if (!ctx) return null;
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/**
 * Creates the AudioContext on the first user interaction.
 * Safe to attach as a listener multiple times — only creates ctx once.
 */
function createCtxOnInteraction() {
  if (ctx) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    console.warn('[Sound] AudioContext not available:', e);
  }
}

// ── Helpers ───────────────────────────────────────────────

/**
 * Builds a distortion curve for a WaveShaper node.
 * @param {number} amount - Higher = more distortion.
 * @returns {Float32Array}
 */
function makeDistortionCurve(amount) {
  const n = 256;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

/**
 * Plays a single tone and schedules its automatic cleanup.
 * @param {number} freq        - Frequency in Hz.
 * @param {OscillatorType} type - Web Audio oscillator type.
 * @param {number} gain        - Peak gain (0–1).
 * @param {number} startTime   - AudioContext time to start.
 * @param {number} duration    - Duration in seconds.
 * @param {number} [endFreq]   - If set, frequency ramps to this value.
 */
function playTone(freq, type, gain, startTime, duration, endFreq) {
  const ac = getCtx();
  if (!ac) return;

  const osc = ac.createOscillator();
  const gainNode = ac.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  if (endFreq != null) {
    osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);
  }

  gainNode.gain.setValueAtTime(gain, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gainNode);
  gainNode.connect(ac.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

// ── Sound definitions ─────────────────────────────────────

const SOUNDS = {

  /** Subtle UI tap — used for generic button interactions. */
  click() {
    const ac = getCtx();
    if (!ac) return;
    const now = ac.currentTime;
    playTone(800, 'sine', 0.18, now, 0.08);
  },

  /** Soft two-tone confirmation when a story choice is committed. */
  choice_made() {
    const ac = getCtx();
    if (!ac) return;
    const now = ac.currentTime;
    playTone(440, 'sine', 0.22, now,        0.06);
    playTone(554, 'sine', 0.22, now + 0.07, 0.06);
  },

  /** Three ascending tones — cheerful achievement fanfare. */
  achievement() {
    const ac = getCtx();
    if (!ac) return;
    const now = ac.currentTime;
    [523, 659, 784].forEach((freq, i) => {
      playTone(freq, 'triangle', 0.28, now + i * 0.14, 0.12);
    });
  },

  /** Ascending arpeggio — C5 E5 G5 C6. Triumphant but small. */
  level_up() {
    const ac = getCtx();
    if (!ac) return;
    const now = ac.currentTime;
    [523, 659, 784, 1047].forEach((freq, i) => {
      playTone(freq, 'triangle', 0.32, now + i * 0.16, 0.14);
    });
  },

  /** Descending ominous drone with light WaveShaper distortion. */
  burnout() {
    const ac = getCtx();
    if (!ac) return;
    const now = ac.currentTime;

    const osc     = ac.createOscillator();
    const shaper  = ac.createWaveShaper();
    const gainNode = ac.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.6);

    shaper.curve = makeDistortionCurve(12);
    shaper.oversample = '2x';

    gainNode.gain.setValueAtTime(0.35, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    osc.connect(shaper);
    shaper.connect(gainNode);
    gainNode.connect(ac.destination);

    osc.start(now);
    osc.stop(now + 0.65);
  },

  /**
   * Tiny square-wave click — typewriter feel.
   * Intentionally very quiet; called every 3 characters.
   */
  typing() {
    const ac = getCtx();
    if (!ac) return;
    const now = ac.currentTime;
    playTone(220, 'square', 0.04, now, 0.015);
  },

  /** Low sawtooth buzz — invalid action or critical stat warning. */
  error() {
    const ac = getCtx();
    if (!ac) return;
    const now = ac.currentTime;
    playTone(120, 'sawtooth', 0.22, now,       0.10);
    playTone(100, 'sawtooth', 0.18, now + 0.11, 0.10);
  },
};

// ── HUD button ────────────────────────────────────────────

/**
 * Injects the 🔊/🔇 toggle button into the HUD next to the achievements button.
 * Idempotent — skips if the button already exists.
 */
function injectHudButton() {
  if (document.getElementById('hud-sound-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'hud-sound-btn';
  btn.setAttribute('aria-label', muted ? 'Ton einschalten' : 'Ton ausschalten');
  btn.style.cssText = [
    'background:none',
    'border:1px solid var(--color-border)',
    'color:var(--color-text-secondary)',
    'border-radius:var(--radius-sm)',
    'padding:2px 8px',
    'cursor:pointer',
    'font-family:var(--font-mono)',
    'font-size:12px',
    'white-space:nowrap',
    'transition:border-color 0.2s,color 0.2s',
    'touch-action:manipulation',
    '-webkit-tap-highlight-color:transparent',
  ].join(';');
  btn.textContent = muted ? '🔇' : '🔊';

  btn.addEventListener('mouseenter', () => {
    btn.style.borderColor = 'var(--color-accent-cyan)';
    btn.style.color = 'var(--color-accent-cyan)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.borderColor = 'var(--color-border)';
    btn.style.color = 'var(--color-text-secondary)';
  });
  btn.addEventListener('click', () => toggle());

  const hud = document.getElementById('hud');
  const achBtn = document.getElementById('hud-achievements-btn');
  if (hud && achBtn) {
    hud.insertBefore(btn, achBtn);
  } else if (hud) {
    hud.appendChild(btn);
  }
}

/**
 * Syncs the HUD button label and aria-label to the current muted state.
 */
function syncHudButton() {
  const btn = document.getElementById('hud-sound-btn');
  if (!btn) return;
  btn.textContent = muted ? '🔇' : '🔊';
  btn.setAttribute('aria-label', muted ? 'Ton einschalten' : 'Ton ausschalten');
}

// ── Public API ────────────────────────────────────────────

/**
 * Initialises the sound system.
 * Reads the persisted muted preference, injects the HUD button, and registers
 * a one-shot listener that creates the AudioContext on the first user gesture.
 * Safe to call before or after DOMContentLoaded.
 */
function init() {
  muted = localStorage.getItem(STORAGE_KEY) === 'true';

  // AudioContext must be created inside a user gesture handler.
  document.addEventListener('click',    createCtxOnInteraction, { passive: true });
  document.addEventListener('touchend', createCtxOnInteraction, { passive: true });

  // Inject button once DOM is ready.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHudButton);
  } else {
    injectHudButton();
  }
}

/**
 * Toggles the muted state, persists the preference, and shows a toast.
 */
function toggle() {
  muted = !muted;
  localStorage.setItem(STORAGE_KEY, String(muted));
  syncHudButton();
  window.KeyboardController?.showToast(muted ? '🔇 Stumm' : '🔊 Ton an');
}

/**
 * Plays a named sound effect.
 * Silent when muted, AudioContext unavailable, or the id is unknown.
 * @param {string} soundId - One of the keys in SOUNDS.
 */
function play(soundId) {
  if (muted) return;
  if (!ctx) return;          // not yet created — user hasn't interacted
  const fn = SOUNDS[soundId];
  if (!fn) {
    console.warn(`[Sound] Unknown sound: "${soundId}"`);
    return;
  }
  try {
    fn();
  } catch (e) {
    console.warn(`[Sound] Error playing "${soundId}":`, e);
  }
}

window.Sound = { init, toggle, play };
