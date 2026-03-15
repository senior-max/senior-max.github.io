/**
 * stats.js
 * Manages the HUD stat bars for "License To Bill".
 * Reads from and writes to #hud-stats in index.html.
 * Depends on: renderer.js (window.Renderer)
 */

/** @type {Object.<string, {label: string, icon: string, color: string, fillId: string}>} */
const STAT_CONFIG = {
  kompetenz:   { label: 'Kompetenz',  icon: '🧠', color: 'var(--color-accent-cyan)',   fillId: 'bar-kompetenz' },
  bullshit:    { label: 'Bullshit',   icon: '💬', color: 'var(--color-accent-amber)',  fillId: 'bar-bullshit' },
  kundenliebe: { label: 'Kundenlove', icon: '🤝', color: 'var(--color-accent-green)',  fillId: 'bar-kundenliebe' },
  burnout:     { label: 'Burnout',    icon: '🔥', color: 'var(--color-accent-red)',    fillId: 'bar-burnout' },
  prestige:    { label: 'Prestige',   icon: '🏆', color: 'var(--color-accent-purple)', fillId: 'bar-prestige' },
};

// ── DOM builders ──────────────────────────────────────────

/**
 * Builds the HTML for a single stat bar wrapper and appends it to the container.
 * @param {string} key - Stat key matching a STAT_CONFIG entry.
 * @param {HTMLElement} container - The #hud-stats element.
 */
function buildStatBar(key, container) {
  const cfg = STAT_CONFIG[key];

  const wrapper = document.createElement('div');
  wrapper.className = 'stat-bar-wrapper';
  wrapper.dataset.stat = key;

  const labelRow = document.createElement('div');
  labelRow.className = 'stat-label';
  labelRow.textContent = `${cfg.icon} ${cfg.label}`;

  const track = document.createElement('div');
  track.className = 'stat-bar-track';

  const fill = document.createElement('div');
  fill.id = cfg.fillId;
  fill.className = `stat-bar-fill stat-bar-fill--${key}`;
  fill.style.width = '0%';
  fill.style.backgroundColor = cfg.color;

  track.appendChild(fill);
  wrapper.appendChild(labelRow);
  wrapper.appendChild(track);
  container.appendChild(wrapper);
}

// ── Public functions ──────────────────────────────────────

/**
 * Creates all five stat bar elements inside #hud-stats.
 * Safe to call multiple times — clears existing bars first.
 */
function initStatBars() {
  const container = document.getElementById('hud-stats');
  if (!container) return;

  container.innerHTML = '';
  Object.keys(STAT_CONFIG).forEach((key) => buildStatBar(key, container));
}

/**
 * Updates every stat bar fill width to match the current stats values.
 * Briefly applies a pulse animation to bars that have changed.
 * Also delegates burnout threshold checks.
 * @param {Object.<string, number>} [stats] - Stats snapshot; falls back to Engine.GameState.stats.
 */
function updateStatBars(stats) {
  const currentStats = stats || (window.Engine && window.Engine.GameState.stats) || {};

  Object.keys(STAT_CONFIG).forEach((key) => {
    const fill = document.getElementById(STAT_CONFIG[key].fillId);
    if (!fill) return;

    const value = currentStats[key] ?? 0;
    const clamped = Math.max(0, Math.min(100, value));

    fill.style.width = `${clamped}%`;

    fill.classList.remove('animate-stat-pulse');
    void fill.offsetWidth; // force reflow to re-trigger animation
    fill.classList.add('animate-stat-pulse');

    fill.addEventListener('animationend', () => {
      fill.classList.remove('animate-stat-pulse');
    }, { once: true });
  });

  checkBurnout(currentStats);
}

/**
 * Applies the burnout flicker animation when burnout is high,
 * and triggers the game-over screen when it maxes out.
 * @param {Object.<string, number>} stats
 */
function checkBurnout(stats) {
  const burnoutFill = document.getElementById(STAT_CONFIG.burnout.fillId);
  if (!burnoutFill) return;

  const value = stats.burnout ?? 0;

  if (value >= 100) {
    burnoutFill.classList.add('animate-burnout-flicker');
    if (window.Renderer) {
      window.Renderer.showBurnoutScreen();
    }
    return;
  }

  if (value >= 80) {
    burnoutFill.classList.add('animate-burnout-flicker');
  } else {
    burnoutFill.classList.remove('animate-burnout-flicker');
  }
}

/**
 * Returns a semantic color based on a stat value.
 * Useful for dynamic feedback coloring outside the HUD.
 * @param {number} value - A stat value between 0 and 100.
 * @returns {string} A CSS color value.
 */
function getStatColor(value) {
  if (value > 60) return 'var(--color-accent-green)';
  if (value >= 30) return 'var(--color-accent-amber)';
  return 'var(--color-accent-red)';
}

// ── Public API ────────────────────────────────────────────

window.Stats = {
  STAT_CONFIG,
  initStatBars,
  updateStatBars,
  checkBurnout,
  getStatColor,
};
