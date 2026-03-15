/**
 * achievements.js
 * Achievement system for "License To Bill".
 * Depends on: engine.js (window.Engine), storage.js (window.Storage),
 *             renderer.js (window.Renderer)
 */

/** @type {Object[]} Master list loaded from achievements.json at boot. */
let achievementDefinitions = [];

/** Timestamps of unlock events, keyed by achievement id. */
const unlockTimestamps = {};

// ── Trigger matching ──────────────────────────────────────

/**
 * Returns true if the achievement's trigger string matches the fired event.
 *
 * Supported trigger patterns:
 *   project_complete_<projectId>    — project completed (any ending)
 *   ending_<type>_<projectId>       — project completed with specific ending
 *   flag_<flagName>                 — story flag set to truthy value
 *   burnout_100                     — burnout stat hit exactly 100
 *   stat_<statName>_<n>             — stat reached or exceeded threshold n
 *   career_level_<n>                — career level reached n
 *   emails_ignored_<n>              — n emails ignored (cumulative)
 *   lunch_ignored_<n>               — n lunch events ignored
 *   minigame_<id>                   — specific minigame trigger fired
 *   all_projects_complete           — all MVP projects done
 *
 * @param {string} trigger  - The achievement's trigger string.
 * @param {string} event    - The event name fired by the game.
 * @param {*}      [value]  - Optional payload (e.g. a count or stat value).
 * @returns {boolean}
 */
function triggerMatches(trigger, event, value) {
  if (trigger === event) return true;
  if (matchesStat(trigger, event, value)) return true;
  if (matchesCareerLevel(trigger, event, value)) return true;
  if (matchesCounter(trigger, event, value, 'emails_ignored_', 'emails_ignored')) return true;
  if (matchesCounter(trigger, event, value, 'lunch_ignored_', 'lunch_ignored')) return true;
  return false;
}

/**
 * @param {string} trigger @param {string} event @param {*} value
 * @returns {boolean}
 */
function matchesStat(trigger, event, value) {
  if (!trigger.startsWith('stat_')) return false;
  const parts     = trigger.split('_');
  const threshold = Number(parts.pop());
  const statName  = parts.slice(1).join('_');
  return event === `stat_${statName}_${threshold}` && Number(value) >= threshold;
}

/**
 * @param {string} trigger @param {string} event @param {*} value
 * @returns {boolean}
 */
function matchesCareerLevel(trigger, event, value) {
  if (!trigger.startsWith('career_level_')) return false;
  const required = Number(trigger.replace('career_level_', ''));
  if (event === `career_level_${required}`) return true;
  return event === 'career_level' && Number(value) >= required;
}

/**
 * Generic counter pattern matcher.
 * @param {string} trigger @param {string} event @param {*} value
 * @param {string} triggerPrefix @param {string} eventName
 * @returns {boolean}
 */
function matchesCounter(trigger, event, value, triggerPrefix, eventName) {
  if (!trigger.startsWith(triggerPrefix)) return false;
  const required = Number(trigger.replace(triggerPrefix, ''));
  return event === eventName && Number(value) >= required;
}

// ── Core functions ────────────────────────────────────────

/**
 * Loads previously unlocked achievement ids from Storage into GameState.
 * Must be called after achievementDefinitions is populated.
 */
function loadAchievements() {
  const savedIds = window.Storage?.loadAchievements() ?? [];
  if (window.Engine?.GameState) {
    window.Engine.GameState.achievements = savedIds;
  }
}

/**
 * Unlocks a single achievement by id.
 * No-ops if already unlocked or id is unknown.
 * Saves the new state and shows a toast notification.
 * @param {string} achievementId
 */
function unlock(achievementId) {
  const state = window.Engine?.GameState;
  if (!state) return;
  if (state.achievements.includes(achievementId)) return;

  const def = achievementDefinitions.find(a => a.id === achievementId);
  if (!def) {
    console.warn(`[Achievements] Unknown id: "${achievementId}"`);
    return;
  }

  state.achievements.push(achievementId);
  unlockTimestamps[achievementId] = new Date().toISOString();
  window.Storage?.saveAchievements(state.achievements);

  window.Sound?.play('achievement');

  if (typeof window.Renderer?.showAchievement === 'function') {
    window.Renderer.showAchievement(def);
  }
}

/**
 * Fires a trigger event and unlocks every achievement whose trigger matches.
 * @param {string} triggerEvent - Event key, e.g. "project_complete_projekt_dieter".
 * @param {*}      [value]      - Optional numeric or string payload.
 */
function checkTrigger(triggerEvent, value) {
  achievementDefinitions.forEach(achievement => {
    if (triggerMatches(achievement.trigger, triggerEvent, value)) {
      unlock(achievement.id);
    }
  });
}

/**
 * Returns all achievement objects the player has currently unlocked.
 * @returns {Object[]}
 */
function getUnlocked() {
  const ids = window.Engine?.GameState?.achievements ?? [];
  return achievementDefinitions.filter(a => ids.includes(a.id));
}

/**
 * Returns true if the given achievement id has been unlocked.
 * @param {string} id
 * @returns {boolean}
 */
function isUnlocked(id) {
  return window.Engine?.GameState?.achievements?.includes(id) ?? false;
}

/**
 * Fetches achievement definitions and hydrates GameState from Storage.
 * Must be awaited during the boot sequence.
 * @returns {Promise<void>}
 */
async function init() {
  try {
    const res = await fetch('/data/achievements.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    achievementDefinitions = await res.json();
    loadAchievements();
  } catch (e) {
    console.warn('[Achievements] achievements.json nicht geladen:', e);
  }
}

// ── Achievements screen ───────────────────────────────────

/**
 * Builds a single achievement card for the grid.
 * Unlocked cards show full color; locked cards are greyscale with redacted info.
 * @param {Object}  achievement
 * @param {boolean} unlocked
 * @returns {HTMLElement}
 */
function buildAchievementCard(achievement, unlocked) {
  const card = document.createElement('div');
  card.style.cssText = [
    'background:var(--color-surface-elevated)',
    'border:1px solid ' + (unlocked ? 'var(--color-accent-green)' : 'var(--color-border)'),
    'border-radius:var(--radius-md)',
    'padding:var(--space-md)',
    'display:flex', 'flex-direction:column', 'gap:var(--space-xs)',
    'min-height:120px',
    unlocked ? '' : 'filter:grayscale(0.8);opacity:0.55;',
  ].join(';');

  const ts = unlockTimestamps[achievement.id]
    ? new Date(unlockTimestamps[achievement.id]).toLocaleDateString('de-DE')
    : null;

  card.innerHTML = `
    <div style="font-size:var(--font-size-lg);">${unlocked ? achievement.emoji : '🔒'}</div>
    <div style="font-size:var(--font-size-sm);color:${unlocked ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'};">
      ${unlocked ? achievement.name : '???'}
    </div>
    <div style="font-size:10px;color:var(--color-text-secondary);line-height:1.5;flex:1;">
      ${unlocked ? achievement.description : 'Noch nicht freigeschaltet'}
    </div>
    ${unlocked && ts ? `<div style="font-size:9px;color:var(--color-text-secondary);margin-top:auto;">${ts}</div>` : ''}
  `;

  return card;
}

/**
 * Renders the full achievements screen as a fixed overlay.
 * Shows all 15 cards in a responsive grid with unlock count in the header.
 */
function renderAchievementsScreen() {
  document.getElementById('achievements-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'achievements-overlay';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:1700',
    'background:var(--color-bg)', 'overflow-y:auto',
    'display:flex', 'flex-direction:column', 'align-items:center',
    'padding:var(--space-xl) var(--space-lg)',
    'gap:var(--space-lg)',
    'font-family:var(--font-mono)',
  ].join(';');

  const unlockedIds = window.Engine?.GameState?.achievements ?? [];
  const total       = achievementDefinitions.length;
  const count       = unlockedIds.length;

  const header = document.createElement('div');
  header.style.cssText = 'text-align:center;display:flex;flex-direction:column;gap:var(--space-sm);width:100%;max-width:720px;';
  header.innerHTML = `
    <div style="font-size:var(--font-size-xl);">🏅 Achievements</div>
    <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);">
      ${count} / ${total} freigeschaltet
    </div>
    <div style="height:6px;background:var(--color-border);border-radius:var(--radius-sm);overflow:hidden;">
      <div style="height:100%;width:${Math.round((count / Math.max(total, 1)) * 100)}%;background:var(--color-accent-green);border-radius:var(--radius-sm);transition:width 0.5s ease;"></div>
    </div>
  `;

  const grid = document.createElement('div');
  grid.style.cssText = [
    'display:grid',
    'grid-template-columns:repeat(auto-fill,minmax(180px,1fr))',
    'gap:var(--space-sm)',
    'width:100%', 'max-width:720px',
  ].join(';');

  achievementDefinitions.forEach(ach => {
    grid.appendChild(buildAchievementCard(ach, unlockedIds.includes(ach.id)));
  });

  const backBtn = document.createElement('button');
  backBtn.className = 'choice-btn';
  backBtn.textContent = '← Zurück';
  backBtn.style.cssText = 'width:160px;';
  backBtn.addEventListener('click', () => overlay.remove());

  overlay.appendChild(header);
  overlay.appendChild(grid);
  overlay.appendChild(backBtn);
  document.getElementById('app').appendChild(overlay);
}

// ── Public API ────────────────────────────────────────────

window.Achievements = {
  init,
  loadAchievements,
  unlock,
  checkTrigger,
  getUnlocked,
  isUnlocked,
  renderAchievementsScreen,
};
