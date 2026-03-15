/**
 * engine.js
 * Central game state machine for "License To Bill".
 * All game logic flows through the Engine object exposed on window.
 */

/** @type {string[]} Career titles indexed by level - 1. */
const CAREER_TITLES = [
  'Junior Consultant',
  'Consultant',
  'Senior Consultant',
  'Manager',
  'Principal',
  'Partner',
];

/**
 * XP required to advance from level N to N+1, indexed by current level - 1.
 * Tuned so that completing all three MVP projects on the success path reaches level 4:
 *   Dieter  (150 XP) → level 2  (threshold 100, leftover  50)
 *   SAP     (180 XP) → level 3  (threshold 220, leftover  10)
 *   Shadow  (190 XP) → level 4  (threshold 200, leftover   0)
 */
const XP_THRESHOLDS = [100, 220, 200, 400, 700];

/**
 * The single source of truth for all runtime game data.
 * Never mutate this directly from outside engine.js — use Engine functions.
 * @type {Object}
 */
const GameState = {
  currentScene: null,
  currentProject: null,
  stats: {
    kompetenz: 40,
    bullshit: 20,
    kundenliebe: 50,
    burnout: 10,
    prestige: 15,
  },
  career: {
    level: 1,
    title: 'Junior Consultant',
    xp: 0,
    xpToNext: 100,
  },
  flags: {},
  achievements: [],
  projectsCompleted: [],
  emailsAnswered: [],
  meetingsAttended: 0,
  meetingsAvoided: 0,
  counters: {
    emails_ignored: 0,
    client_ignored: 0,
    lunch_ignored: 0,
  },
};

/** Holds the full data object of the active project for cross-function access. */
let currentProjectData = null;

/** Snapshot of GameState.stats taken when a new project begins. Used for delta display. */
let statsAtProjectStart = null;

// ── Helpers ──────────────────────────────────────────────

/**
 * Returns a fresh copy of the default GameState values.
 * @returns {Object}
 */
function buildDefaultState() {
  return {
    currentScene: null,
    currentProject: null,
    stats: {
      kompetenz: 40,
      bullshit: 20,
      kundenliebe: 50,
      burnout: 10,
      prestige: 15,
    },
    career: {
      level: 1,
      title: 'Junior Consultant',
      xp: 0,
      xpToNext: 100,
    },
    flags: {},
    achievements: [],
    projectsCompleted: [],
    emailsAnswered: [],
    meetingsAttended: 0,
    meetingsAvoided: 0,
    counters: {
      emails_ignored: 0,
      client_ignored: 0,
      lunch_ignored: 0,
    },
  };
}

/**
 * Clamps a numeric value between a minimum and maximum.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Copies all top-level and nested properties from source into target.
 * Used to hydrate GameState without replacing the object reference.
 * @param {Object} target
 * @param {Object} source
 */
function mergeState(target, source) {
  Object.keys(source).forEach((key) => {
    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
      Object.assign(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  });
}

// ── Core engine functions ─────────────────────────────────

/**
 * Initialises the game. Attempts to restore a saved state from storage;
 * falls back to default values if nothing is saved or storage is unavailable.
 */
function initGame() {
  const defaults = buildDefaultState();
  mergeState(GameState, defaults);

  const saved = (window.Storage && typeof window.Storage.loadGame === 'function')
    ? window.Storage.loadGame()
    : null;
  if (saved) {
    mergeState(GameState, saved);
  }
}

/**
 * Applies a set of stat deltas to GameState.stats.
 * Each value is clamped to [0, 100] after application.
 * After any change:
 *   - A passive career bonus (10 % of the level bonus) is also applied.
 *   - Stat bars and the HUD are refreshed.
 *   - Achievement triggers are checked.
 *   - If burnout reaches 100, showBurnoutScreen is called (once per hit).
 * @param {{ [stat: string]: number }} effects - e.g. { kompetenz: 3, burnout: -5 }
 */
function applyEffects(effects) {
  if (!effects || typeof effects !== 'object') return;

  // Snapshot stats before applying to detect critical drops for sound feedback.
  const before = { ...GameState.stats };

  Object.keys(effects).forEach((stat) => {
    if (stat in GameState.stats) {
      GameState.stats[stat] = clamp(
        GameState.stats[stat] + effects[stat],
        0,
        100,
      );
    }
  });

  // Error sound if any non-burnout stat just crossed below the critical threshold.
  const wentCritical = Object.keys(GameState.stats).some(
    (s) => s !== 'burnout' && before[s] >= 10 && GameState.stats[s] < 10,
  );
  if (wentCritical) window.Sound?.play('error');

  // Passive career bonus: 10% of the level-specific bonus applied each turn.
  applyPassiveCareerBonus();

  if (typeof Stats !== 'undefined') {
    Stats.updateStatBars();
  }

  window.Career?.renderCareerHUD?.();

  checkStatAchievements();

  // Burnout ceiling — show recovery screen if not already visible.
  if (GameState.stats.burnout >= 100 && !document.getElementById('burnout-overlay')) {
    setTimeout(() => window.Renderer?.showBurnoutScreen?.(), 0);
  }

  if (window.Storage && typeof window.Storage.saveGame === 'function') {
    window.Storage.saveGame(GameState);
  }
}

/**
 * Applies Career level bonuses at 10% strength as a passive trickle effect.
 * Rounds deltas to the nearest integer; skips when the delta would be 0.
 * Only runs from level 2 onwards to avoid noise at the start.
 */
function applyPassiveCareerBonus() {
  if (GameState.career.level < 2) return;
  if (!window.Career?.getCareerBonus) return;

  const bonus = window.Career.getCareerBonus(GameState.career.level);
  Object.keys(bonus).forEach((stat) => {
    if (!(stat in GameState.stats) || bonus[stat] === 0) return;
    const delta = Math.round(bonus[stat] * 0.1);
    if (delta === 0) return;
    GameState.stats[stat] = clamp(GameState.stats[stat] + delta, 0, 100);
  });
}

/**
 * Fires stat-based achievement triggers after any stat change.
 * Checks burnout ceiling and bullshit high-water mark.
 */
function checkStatAchievements() {
  if (!window.Achievements) return;
  const s = GameState.stats;
  if (s.burnout >= 100) window.Achievements.checkTrigger('burnout_100');
  if (s.bullshit >= 90) window.Achievements.checkTrigger('stat_bullshit_90', s.bullshit);
}

/**
 * Adds XP to the player's career and triggers a level-up check.
 * @param {number} amount - XP points to add (must be positive).
 */
function addXP(amount) {
  if (amount <= 0) return;
  GameState.career.xp += amount;
  checkLevelUp();

  if (window.Storage && typeof window.Storage.saveGame === 'function') {
    window.Storage.saveGame(GameState);
  }
}

/**
 * Checks whether the player has accumulated enough XP to advance a level.
 * Handles XP overflow so surplus carries over into the next level.
 */
function checkLevelUp() {
  const maxLevel = CAREER_TITLES.length;
  if (GameState.career.level >= maxLevel) return;

  while (
    GameState.career.xp >= GameState.career.xpToNext &&
    GameState.career.level < maxLevel
  ) {
    GameState.career.xp -= GameState.career.xpToNext;
    GameState.career.level += 1;
    GameState.career.title = CAREER_TITLES[GameState.career.level - 1];
    GameState.career.xpToNext = XP_THRESHOLDS[GameState.career.level - 1] || 0;

    window.Sound?.play('level_up');

    if (typeof Renderer !== 'undefined') {
      Renderer.showLevelUp(GameState.career.title, GameState.career.level);
    }

    window.Achievements?.checkTrigger(`career_level_${GameState.career.level}`);
  }
}

/**
 * Sets a named story flag to the given value.
 * @param {string} key - Flag name, e.g. "met_dieter".
 * @param {*} value - Any truthy or falsy value.
 */
function setFlag(key, value) {
  GameState.flags[key] = value;
  if (value) {
    window.Achievements?.checkTrigger(`flag_${key}`);
  }
}

/**
 * Returns the value of a story flag, or false if it was never set.
 * @param {string} key
 * @returns {*}
 */
function hasFlag(key) {
  return GameState.flags[key] || false;
}

/**
 * Finds a scene by id within the active project data and hands it to the renderer.
 * @param {string} sceneId - The scene id to navigate to.
 * @param {Object} projectData - The full project data object containing all scenes.
 */
function loadScene(sceneId, projectData) {
  if (projectData) {
    currentProjectData = projectData;
    GameState.currentProject = projectData.id || null;
    statsAtProjectStart = { ...GameState.stats };
    resetMeetingRoulette();
    window.NPCs?.resetNPCModifierGuard();
  }

  // ── Ending resolution ──────────────────────────────────
  const ending = currentProjectData?.endings?.[sceneId];
  if (ending) {
    GameState.currentScene = sceneId;

    // Detour ending: redirect to another scene without completing the project.
    if (ending.next) {
      setTimeout(() => loadScene(ending.next, null), 0);
      return;
    }

    const xpEarned = ending.xp ?? 0;
    completeProject(GameState.currentProject, ending.type ?? 'neutral', xpEarned);

    if (typeof Renderer !== 'undefined') {
      Renderer.showProjectComplete(
        ending.title ?? GameState.currentProject,
        ending.type ?? 'neutral',
        ending.text ?? '',
        { xpEarned, statsBefore: statsAtProjectStart },
      );
    }
    return;
  }

  // ── Regular scene ──────────────────────────────────────
  const scene = currentProjectData?.scenes?.find((s) => s.id === sceneId) || null;

  if (!scene) {
    console.error(`[Engine] Scene "${sceneId}" not found in project data.`);
    showSceneError(sceneId);
    return;
  }

  GameState.currentScene = sceneId;

  if (typeof Renderer !== 'undefined') {
    Renderer.renderScene(scene);
  }
}

/**
 * Processes a player's choice: applies its effects and flags, shows feedback,
 * then navigates to the next scene after a short delay.
 * @param {{ effects?: Object, flags?: Object, feedback?: string, next: string }} choice
 */
function makeChoice(choice) {
  if (!choice) return;

  if (choice.effects) {
    applyEffects(choice.effects);
  }

  if (choice.flags && typeof choice.flags === 'object') {
    Object.keys(choice.flags).forEach((key) => {
      setFlag(key, choice.flags[key]);
    });
  }

  if (typeof Renderer !== 'undefined' && choice.feedback) {
    Renderer.showFeedback(choice.feedback);
  }

  if (isGameOver()) {
    if (typeof Renderer !== 'undefined') {
      Renderer.showBurnoutScreen();
    }
    return;
  }

  triggerMeetingRoulette();

  setTimeout(() => {
    loadScene(choice.next, null);
  }, 5000);
}

/**
 * Marks a project as completed, awards XP, and runs achievement checks.
 * @param {string} projectId - The id of the completed project.
 * @param {string} endingType - e.g. "success", "failure", "neutral".
 * @param {number} xpReward - XP points to award on completion.
 */
function completeProject(projectId, endingType, xpReward) {
  if (!GameState.projectsCompleted.includes(projectId)) {
    GameState.projectsCompleted.push(projectId);
  }

  addXP(xpReward);

  if (window.Achievements) {
    window.Achievements.checkTrigger(`project_complete_${projectId}`);
    window.Achievements.checkTrigger(`ending_${endingType}_${projectId}`);

    const MVP_PROJECTS = ['projekt_dieter', 'projekt_sap_zombies', 'projekt_shadow_it'];
    const allDone = MVP_PROJECTS.every(id => GameState.projectsCompleted.includes(id));
    if (allDone) window.Achievements.checkTrigger('all_projects_complete');
  }

  if (window.Storage && typeof window.Storage.saveGame === 'function') {
    window.Storage.saveGame(GameState);
  }
}

/**
 * Returns true when the player's burnout stat has reached its maximum.
 * @returns {boolean}
 */
function isGameOver() {
  return GameState.stats.burnout >= 100;
}

/**
 * Triggers a named minigame and resumes the scene flow when it completes.
 * Minigame modules must expose a start(onComplete) function on window.
 * @param {string}   id         - Minigame id, e.g. 'excel'.
 * @param {function} onComplete - Called with the minigame result value when done.
 */
function triggerMinigame(id, onComplete) {
  const registry = {
    excel:       window.ExcelMinigame,
    reisekosten: window.ReisekostenMinigame,
  };

  const game = registry[id];
  if (!game || typeof game.start !== 'function') {
    console.warn(`[Engine] Minigame "${id}" not found or missing start().`);
    if (typeof onComplete === 'function') onComplete(null);
    return;
  }

  game.start(onComplete);
}

/**
 * Starts the email inbox phase after a project completes.
 * Delegates to Email.startInboxPhase; skips gracefully if unavailable.
 * Called by renderer.js showProjectComplete() "Weiter" button.
 */
function startEmailPhase() {
  const projectId = GameState.currentProject ?? 'unknown';
  if (window.Email && typeof window.Email.startInboxPhase === 'function') {
    window.Email.startInboxPhase(projectId);
  }
}

/**
 * Called by Email.closeInbox() after the player dismisses the inbox.
 * Fires meeting roulette then shows the project selection screen.
 */
function startNextProjectSelection() {
  rollMeetingRoulette();

  if (window.UI && typeof window.UI.renderProjectSelection === 'function') {
    window.UI.renderProjectSelection();
  }
}

// ── Meeting roulette ──────────────────────────────────────

/** Prevents more than one meeting per project run. */
let meetingFiredThisProject = false;

/**
 * Five meeting scenarios randomly selected for the modal.
 * @type {Array<{text: string}>}
 */
const MEETING_SCENARIOS = [
  { text: 'Björn aus dem 3. OG möchte "kurz was abstimmen". Dauer: unbekannt.' },
  { text: 'All-Hands Meeting: "wichtige Ankündigung". Die Ankündigung: neues Kaffeemaschinen-Modell.' },
  { text: 'Retro-Meeting zum letzten Retro-Meeting. Es gibt Handlungsbedarf.' },
  { text: 'Ihr Kalender wurde von Dr. Müller-Brandt für einen "kurzen Sync" blockiert. Es ist Freitag 16:55.' },
  { text: 'Town Hall. Alle müssen. Hybrid. Die Technik funktioniert für niemanden.' },
];

/**
 * Triggers an interactive meeting modal with a 30% probability on scene transitions.
 * Fires at most once per project. Skips if game over.
 */
function triggerMeetingRoulette() {
  if (isGameOver() || meetingFiredThisProject) return;
  if (Math.random() > 0.30) return;

  meetingFiredThisProject = true;
  const scenario = MEETING_SCENARIOS[Math.floor(Math.random() * MEETING_SCENARIOS.length)];
  showMeetingModal(scenario.text);
}

/**
 * Resets the per-project meeting guard. Call at the start of each project.
 */
function resetMeetingRoulette() {
  meetingFiredThisProject = false;
}

/**
 * Builds and shows the meeting modal with three player choices.
 * Blocks the game until the player picks an option.
 * @param {string} scenarioText
 */
function showMeetingModal(scenarioText) {
  const backdrop = document.createElement('div');
  backdrop.id = 'meeting-modal-backdrop';
  backdrop.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:1800',
    'background:rgba(0,0,0,0.65)',
    'display:flex', 'align-items:center', 'justify-content:center',
    'padding:var(--space-lg)',
  ].join(';');

  const modal = buildMeetingModalContent(scenarioText, backdrop);
  backdrop.appendChild(modal);
  document.getElementById('app').appendChild(backdrop);
}

/**
 * Builds the modal card DOM with title, scenario text, and three choice buttons.
 * @param {string}      scenarioText
 * @param {HTMLElement} backdrop - Removed on any choice.
 * @returns {HTMLElement}
 */
function buildMeetingModalContent(scenarioText, backdrop) {
  const modal = document.createElement('div');
  modal.style.cssText = [
    'background:var(--color-surface)',
    'border:1px solid var(--color-accent-amber)',
    'border-radius:var(--radius-lg)',
    'padding:var(--space-xl)',
    'max-width:520px', 'width:100%',
    'display:flex', 'flex-direction:column', 'gap:var(--space-md)',
    'animation:fadeInUp 0.3s ease both',
  ].join(';');

  modal.innerHTML = `
    <div style="font-size:var(--font-size-lg);color:var(--color-accent-amber);">📅 Spontan-Meeting!</div>
    <div style="font-size:var(--font-size-base);color:var(--color-text-primary);line-height:1.6;">${scenarioText}</div>
  `;

  const choices = buildMeetingChoices(backdrop);
  modal.appendChild(choices);
  return modal;
}

/**
 * Builds the three meeting choice buttons.
 * @param {HTMLElement} backdrop
 * @returns {HTMLElement}
 */
function buildMeetingChoices(backdrop) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:var(--space-sm);margin-top:var(--space-sm);';

  const options = [
    {
      label: 'Teilnehmen',
      sub: 'Pflicht ist Pflicht.',
      onPick: () => {
        applyEffects({ burnout: 8, prestige: 2 });
        GameState.meetingsAttended += 1;
        backdrop.remove();
        window.Renderer?.showFeedback('Das Meeting dauerte 90 Minuten. Niemand weiß warum.');
      },
    },
    {
      label: '"Hab schon was"',
      sub: 'Ein Konflikt im Kalender. Echt oder erfunden.',
      onPick: () => {
        applyEffects({ prestige: -2, burnout: -3 });
        GameState.meetingsAvoided += 1;
        backdrop.remove();
        window.Renderer?.showFeedback('Du wirst nicht gefragt, was du stattdessen hattest.');
      },
    },
    {
      label: '"Schickt mir das Protokoll"',
      sub: 'Klassiker. Funktioniert meistens.',
      onPick: () => {
        applyEffects({ bullshit: 3, burnout: -5 });
        GameState.meetingsAvoided += 1;
        backdrop.remove();
        window.Renderer?.showFeedback('Das Protokoll kommt nie. Das Meeting auch nicht mehr.');
      },
    },
  ];

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.style.cssText = 'text-align:left;display:flex;flex-direction:column;gap:2px;';
    btn.innerHTML = `<span>${opt.label}</span><span style="font-size:10px;color:var(--color-text-secondary);font-style:italic;">${opt.sub}</span>`;
    btn.addEventListener('click', () => {
      wrap.querySelectorAll('button').forEach(b => { b.disabled = true; });
      opt.onPick();
    });
    wrap.appendChild(btn);
  });

  return wrap;
}

/**
 * Between-project meeting roll: 30% chance, no per-project guard.
 * Used from startNextProjectSelection after the inbox phase.
 */
function rollMeetingRoulette() {
  if (isGameOver()) return;
  if (Math.random() > 0.30) return;

  const scenario = MEETING_SCENARIOS[Math.floor(Math.random() * MEETING_SCENARIOS.length)];
  showMeetingModal(scenario.text);
}

// ── Error / debug helpers ─────────────────────────────────

/**
 * Renders a friendly inline error when a scene cannot be found.
 * Offers a button to restart the current project.
 * @param {string} sceneId - The id that was not found.
 */
function showSceneError(sceneId) {
  const storyEl = document.getElementById('story-text');
  const choicesEl = document.getElementById('choices-container');

  if (storyEl) {
    storyEl.innerHTML = [
      '<span style="color:var(--color-accent-amber);">⚠ Szene nicht gefunden.</span>',
      '<br><br>',
      'Das sollte nicht passieren.',
      '<br>Kevin war wahrscheinlich beteiligt.',
      `<br><br><span style="color:var(--color-text-secondary);font-size:11px;">[Szene: "${sceneId}"]</span>`,
    ].join('');
  }

  if (choicesEl) {
    choicesEl.innerHTML = '';
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = '↩ Projekt neu starten';
    btn.addEventListener('click', () => {
      if (currentProjectData) {
        window.startProject?.(currentProjectData.id);
      } else {
        window.Menu?.renderMainMenu?.();
      }
    });
    choicesEl.appendChild(btn);
  }
}

/**
 * Debug-only: jumps directly to a scene by id within the current project.
 * No-op when no project is loaded.
 * @param {string} sceneId
 */
function debugJumpToScene(sceneId) {
  if (!currentProjectData) {
    console.warn('[Engine.debugJumpToScene] No project loaded.');
    return;
  }
  loadScene(sceneId, null);
}

/**
 * Returns the currently active project data object (debug use only).
 * @returns {Object|null}
 */
function getProjectData() {
  return currentProjectData;
}

// ── Public API ────────────────────────────────────────────

window.Engine = {
  GameState,
  initGame,
  applyEffects,
  addXP,
  loadScene,
  makeChoice,
  setFlag,
  hasFlag,
  completeProject,
  isGameOver,
  triggerMinigame,
  startEmailPhase,
  startNextProjectSelection,
  triggerMeetingRoulette,
  rollMeetingRoulette,
  resetMeetingRoulette,
  // Debug helpers
  debugJumpToScene,
  getProjectData,
};
