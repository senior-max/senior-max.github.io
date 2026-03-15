/**
 * career.js
 * Career progression helpers for "License To Bill".
 * Reads career data from Engine.GameState and config from window._LTB_CONFIG.
 * Depends on: engine.js (window.Engine), renderer.js (window.Renderer)
 */

/** @type {string[]} Fallback titles if config is not yet loaded. */
const DEFAULT_TITLES = [
  'Junior Consultant',
  'Consultant',
  'Senior Consultant',
  'Manager',
  'Principal',
  'Partner',
];

/** @type {number[]} Fallback XP thresholds if config is not yet loaded. */
const DEFAULT_THRESHOLDS = [100, 250, 450, 700, 1000];

/**
 * Passive stat bonuses granted at each career level.
 * Index 0 = Level 1, index 5 = Level 6.
 * @type {Array<Object.<string, number>>}
 */
const CAREER_BONUSES = [
  {},
  { bullshit: 5 },
  { kompetenz: 5, bullshit: 5 },
  { prestige: 10 },
  { bullshit: 10, prestige: 10 },
  { prestige: 20, kompetenz: -5 },
];

// ── Internal helpers ──────────────────────────────────────

/**
 * Returns the titles array from config or the built-in fallback.
 * @returns {string[]}
 */
function titles() {
  return window._LTB_CONFIG?.careerTitles ?? DEFAULT_TITLES;
}

/**
 * Returns the XP thresholds array from config or the built-in fallback.
 * @returns {number[]}
 */
function thresholds() {
  return window._LTB_CONFIG?.xpThresholds ?? DEFAULT_THRESHOLDS;
}

// ── Public functions ──────────────────────────────────────

/**
 * Returns the career title string for a given level (1-based).
 * Clamps silently to the valid range.
 * @param {number} level - Career level between 1 and 6.
 * @returns {string}
 */
function getTitle(level) {
  const list = titles();
  const index = Math.max(0, Math.min(level - 1, list.length - 1));
  return list[index];
}

/**
 * Returns the XP required to reach the next level from the given level.
 * Returns 0 when already at max level.
 * @param {number} level - Current career level (1-based).
 * @returns {number}
 */
function getXPToNext(level) {
  const list = thresholds();
  return list[level - 1] ?? 0;
}

/**
 * Formats the player's current XP progress as a readable string.
 * @returns {string} e.g. "75 / 100 XP"
 */
function formatXPBar() {
  const career = window.Engine?.GameState?.career ?? { xp: 0, xpToNext: 100 };
  return `${career.xp} / ${career.xpToNext} XP`;
}

/**
 * Updates #hud-title with the player's current title and level-dot indicator.
 * Filled dots (●) represent earned levels; empty dots (○) represent remaining.
 */
function renderCareerHUD() {
  const el = document.getElementById('hud-title');
  if (!el) return;

  const career = window.Engine?.GameState?.career ?? { level: 1, title: DEFAULT_TITLES[0] };
  const maxLevel = titles().length;

  const dots = Array.from({ length: maxLevel }, (_, i) =>
    i < career.level ? '●' : '○',
  ).join('');

  el.textContent = `${career.title}  ${dots}`;

  if (career.level >= 6) {
    el.classList.add('hud-title--partner');
  } else {
    el.classList.remove('hud-title--partner');
  }
}

/**
 * Triggers the level-up overlay via Renderer.
 * @param {string} oldTitle - The player's previous career title.
 * @param {string} newTitle - The player's new career title.
 */
function showLevelUpAnimation(oldTitle, newTitle) {
  if (window.Renderer && typeof window.Renderer.showLevelUp === 'function') {
    const level = window.Engine?.GameState?.career?.level;
    window.Renderer.showLevelUp(newTitle, level);
  }
}

/**
 * Returns the passive stat modifier object for a given career level.
 * These bonuses are informational; applyEffects() should be called separately.
 * @param {number} level - Career level between 1 and 6.
 * @returns {Object.<string, number>}
 */
function getCareerBonus(level) {
  const index = Math.max(0, Math.min(level - 1, CAREER_BONUSES.length - 1));
  return { ...CAREER_BONUSES[index] };
}

// ── Public API ────────────────────────────────────────────

window.Career = {
  getTitle,
  getXPToNext,
  formatXPBar,
  renderCareerHUD,
  showLevelUpAnimation,
  getCareerBonus,
};
