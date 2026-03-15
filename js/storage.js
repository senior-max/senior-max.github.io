/**
 * storage.js
 * Handles all localStorage persistence for "License To Bill".
 * All keys are prefixed with "ltb_" per project conventions.
 */

const SAVE_KEY         = 'ltb_save';
const ACHIEVEMENTS_KEY = 'ltb_achievements';
const SETTING_PREFIX   = 'ltb_setting_';

// ── Internal helpers ──────────────────────────────────────

/**
 * Safely reads and JSON-parses a localStorage value.
 * Returns null if the key is absent or the value is unparseable.
 * @param {string} key
 * @returns {*}
 */
function readItem(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn(`[Storage] Failed to read key "${key}":`, e);
    return null;
  }
}

/**
 * Safely JSON-stringifies and writes a value to localStorage.
 * @param {string} key
 * @param {*} value
 */
function writeItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[Storage] Failed to write key "${key}":`, e);
  }
}

// ── Public functions ──────────────────────────────────────

/**
 * Persists the full game state object to localStorage.
 * @param {Object} gameState - The current Engine.GameState snapshot.
 */
function saveGame(gameState) {
  writeItem(SAVE_KEY, gameState);
}

/**
 * Loads and returns the saved game state, or null if none exists.
 * @returns {Object|null}
 */
function loadGame() {
  return readItem(SAVE_KEY);
}

/**
 * Removes the saved game state from localStorage.
 */
function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

/**
 * Persists the player's unlocked achievements array.
 * @param {string[]} achievements - Array of achievement id strings.
 */
function saveAchievements(achievements) {
  writeItem(ACHIEVEMENTS_KEY, achievements);
}

/**
 * Loads the saved achievements array, or returns an empty array.
 * @returns {string[]}
 */
function loadAchievements() {
  return readItem(ACHIEVEMENTS_KEY) ?? [];
}

/**
 * Persists a single named setting value.
 * @param {string} key - Setting name (will be prefixed with "ltb_setting_").
 * @param {*} value - Any JSON-serialisable value.
 */
function saveSetting(key, value) {
  writeItem(SETTING_PREFIX + key, value);
}

/**
 * Loads a single named setting value.
 * @param {string} key - Setting name (will be prefixed with "ltb_setting_").
 * @param {*} defaultValue - Returned when the setting has not been saved yet.
 * @returns {*}
 */
function loadSetting(key, defaultValue) {
  const result = readItem(SETTING_PREFIX + key);
  return result !== null ? result : defaultValue;
}

// ── Public API ────────────────────────────────────────────

window.Storage = {
  saveGame,
  loadGame,
  clearSave,
  saveAchievements,
  loadAchievements,
  saveSetting,
  loadSetting,
};
