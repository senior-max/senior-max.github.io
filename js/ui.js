/**
 * ui.js
 * High-level UI screens for "License To Bill".
 * Handles project selection, game completion, and the Hall of Shame.
 * Depends on: engine.js (window.Engine), main.js (window.startProject)
 */

/** @type {Object[]} All project manifests loaded from story files. */
let allProjects = [];

const ALL_PROJECT_IDS = [
  'projekt_dieter',
  'projekt_sap_zombies',
  'projekt_shadow_it',
];

// ── DOM helpers ───────────────────────────────────────────

/**
 * Creates a full-screen overlay and appends it to #app.
 * Removes any existing overlay with the same id first.
 * @param {string} id
 * @returns {HTMLElement}
 */
function createScreen(id) {
  document.getElementById(id)?.remove();
  const el = document.createElement('div');
  el.id = id;
  el.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:1600',
    'background:var(--color-bg)', 'overflow-y:auto',
    'display:flex', 'flex-direction:column', 'align-items:center',
    'padding:var(--space-xl) var(--space-lg)',
    'gap:var(--space-lg)',
    'font-family:var(--font-mono)',
  ].join(';');
  document.getElementById('app').appendChild(el);
  return el;
}

/**
 * Loads all project JSON files in parallel and returns their data.
 * @returns {Promise<Object[]>}
 */
async function loadAllProjects() {
  if (allProjects.length > 0) return allProjects;
  const results = await Promise.allSettled(
    ALL_PROJECT_IDS.map(id => fetch(`/data/stories/${id}.json`).then(r => r.json())),
  );
  allProjects = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);
  return allProjects;
}

// ── Subtitle by level ─────────────────────────────────────

/**
 * Returns a career-level-appropriate subtitle for the project selection screen.
 * @param {number} level
 * @returns {string}
 */
function getSelectionSubtitle(level) {
  if (level <= 2) return 'Dr. Müller-Brandt schaut dich erwartungsvoll an.';
  if (level <= 4) return 'Sie dürfen diesmal selbst wählen. Fast.';
  return 'Ihr Assistent legt Ihnen die Akten vor.';
}

// ── Difficulty / comedy indicators ───────────────────────

/**
 * Renders colored difficulty dots for a project card.
 * @param {'easy'|'medium'|'hard'} difficulty
 * @returns {string} HTML string
 */
function difficultyDots(difficulty) {
  const map = { easy: 1, medium: 2, hard: 3 };
  const count = map[difficulty] ?? 2;
  const colors = ['var(--color-accent-green)', 'var(--color-accent-amber)', 'var(--color-accent-red)'];
  return Array.from({ length: 3 }, (_, i) => {
    const filled = i < count;
    const col = filled ? colors[Math.min(count - 1, 2)] : 'var(--color-border)';
    return `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${col};margin-right:3px;"></span>`;
  }).join('');
}

/**
 * Renders comedy level as 🤣 icons.
 * @param {number} level - 1-5
 * @returns {string}
 */
function comedyIcons(level) {
  return '🤣'.repeat(Math.max(0, Math.min(5, level || 0)));
}

// ── Project card builders ─────────────────────────────────

/**
 * Builds a project card for an available (not yet completed) project.
 * @param {Object} project
 * @returns {HTMLElement}
 */
function buildAvailableCard(project) {
  const card = document.createElement('div');
  card.style.cssText = [
    'background:var(--color-surface-elevated)',
    'border:1px solid var(--color-border)',
    'border-radius:var(--radius-lg)',
    'padding:var(--space-lg)',
    'display:flex', 'flex-direction:column', 'gap:var(--space-sm)',
    'max-width:480px', 'width:100%',
    'transition:border-color 0.2s',
  ].join(';');

  card.innerHTML = `
    <div style="font-size:var(--font-size-lg);color:var(--color-text-primary);">${project.title}</div>
    <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);font-style:italic;">${project.subtitle ?? ''}</div>
    <div style="display:flex;gap:var(--space-md);font-size:var(--font-size-sm);align-items:center;flex-wrap:wrap;">
      <span>Schwierigkeit: ${difficultyDots(project.difficulty)}</span>
      <span>Comedy: ${comedyIcons(project.comedyLevel)}</span>
      <span style="color:var(--color-accent-green);">+${project.xpReward ?? '?'} XP</span>
    </div>
  `;

  const btn = document.createElement('button');
  btn.className = 'choice-btn';
  btn.textContent = 'Auftrag annehmen';
  btn.style.marginTop = 'var(--space-sm)';
  btn.addEventListener('click', () => {
    document.getElementById('project-select-overlay')?.remove();
    window.startProject(project.id);
  });

  card.appendChild(btn);
  card.addEventListener('mouseenter', () => { card.style.borderColor = 'var(--color-accent-cyan)'; });
  card.addEventListener('mouseleave', () => { card.style.borderColor = 'var(--color-border)'; });
  return card;
}

/**
 * Builds a faded card for an already-completed project.
 * @param {Object} project
 * @returns {HTMLElement}
 */
function buildCompletedCard(project) {
  const card = document.createElement('div');
  card.style.cssText = [
    'background:var(--color-surface)',
    'border:1px solid var(--color-border)',
    'border-radius:var(--radius-lg)',
    'padding:var(--space-lg)',
    'display:flex', 'flex-direction:column', 'gap:var(--space-sm)',
    'max-width:480px', 'width:100%',
    'opacity:0.5',
  ].join(';');

  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div style="font-size:var(--font-size-base);">${project.title}</div>
      <div style="font-size:var(--font-size-sm);color:var(--color-accent-green);">✓ Abgeschlossen</div>
    </div>
    <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);">${project.subtitle ?? ''}</div>
  `;
  return card;
}

// ── Project selection screen ──────────────────────────────

/**
 * Renders the full-screen project selection overlay.
 * Shows available and completed projects; triggers ending if all done.
 * @returns {Promise<void>}
 */
async function renderProjectSelection() {
  const projects = await loadAllProjects();
  const state     = window.Engine?.GameState;
  const completed = state?.projectsCompleted ?? [];
  const level     = state?.career?.level ?? 1;

  const playable = projects.filter(p =>
    (p.requiredLevel ?? 1) <= level && p.id !== 'test',
  );

  const available  = playable.filter(p => !completed.includes(p.id));
  const done       = playable.filter(p =>  completed.includes(p.id));

  if (available.length === 0 && done.length > 0) {
    renderGameComplete();
    return;
  }

  const screen = createScreen('project-select-overlay');

  screen.innerHTML = `
    <div style="font-size:var(--font-size-xl);text-align:center;">📂 Neuer Auftrag eingegangen</div>
    <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);text-align:center;">
      ${getSelectionSubtitle(level)}
    </div>
  `;

  const grid = document.createElement('div');
  grid.style.cssText = 'display:flex;flex-direction:column;gap:var(--space-md);align-items:center;width:100%;';

  available.forEach(p => grid.appendChild(buildAvailableCard(p)));
  done.forEach(p => grid.appendChild(buildCompletedCard(p)));

  screen.appendChild(grid);
}

// ── Stat summary helpers ──────────────────────────────────

/**
 * Builds a single stat summary row for the game complete screen.
 * @param {string} label
 * @param {number} value
 * @param {string} color
 * @returns {HTMLElement}
 */
function buildStatRow(label, value, color) {
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;justify-content:space-between;font-size:var(--font-size-sm);padding:var(--space-xs) 0;border-bottom:1px solid var(--color-border);';
  row.innerHTML = `<span style="color:var(--color-text-secondary);">${label}</span><span style="color:${color};font-weight:bold;">${value}</span>`;
  return row;
}

/**
 * Builds the stats summary block for the ending screen.
 * @param {Object} state - Engine.GameState
 * @returns {HTMLElement}
 */
function buildStatsSummary(state) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'width:100%;max-width:400px;display:flex;flex-direction:column;gap:2px;';

  const statMap = [
    ['🧠 Kompetenz',  state.stats.kompetenz,   'var(--color-accent-cyan)'],
    ['💬 Bullshit',   state.stats.bullshit,    'var(--color-accent-amber)'],
    ['🤝 Kundenlove', state.stats.kundenliebe, 'var(--color-accent-green)'],
    ['🔥 Burnout',    state.stats.burnout,     'var(--color-accent-red)'],
    ['🏆 Prestige',   state.stats.prestige,    'var(--color-accent-purple)'],
  ];

  statMap.forEach(([label, value, color]) => wrap.appendChild(buildStatRow(label, value, color)));
  return wrap;
}

// ── Game complete screen ──────────────────────────────────

/**
 * Renders the full-screen game completion summary.
 * Shows final stats, XP, career title, achievements, and a replay button.
 */
function renderGameComplete() {
  const state       = window.Engine?.GameState;
  const career      = state?.career ?? { title: 'Partner', level: 6, xp: 0 };
  const achievements = state?.achievements ?? [];
  const disasters   = achievements.filter(id => id.startsWith('hall_'));

  const screen = createScreen('game-complete-overlay');

  screen.innerHTML = `
    <div style="font-size:48px;text-align:center;">🎖️</div>
    <div style="font-size:var(--font-size-xl);text-align:center;color:var(--color-accent-cyan);">MVP ABGESCHLOSSEN</div>
    <div style="font-size:var(--font-size-base);color:var(--color-text-secondary);text-align:center;">
      Du hast alle Projekte abgeschlossen. Dr. Müller-Brandt ist zufrieden.<br>Das ist selten.
    </div>
    <div style="font-size:var(--font-size-lg);color:var(--color-accent-amber);text-align:center;">
      ${career.title}
      <span style="font-size:var(--font-size-sm);color:var(--color-text-secondary);margin-left:var(--space-sm);">Level ${career.level}</span>
    </div>
  `;

  const xpNote = document.createElement('div');
  xpNote.style.cssText = 'font-size:var(--font-size-sm);color:var(--color-text-secondary);text-align:center;';
  xpNote.textContent = `Gesamt-XP: ${career.xp} · Achievements: ${achievements.length} von 15`;

  screen.appendChild(buildStatsSummary(state));
  screen.appendChild(xpNote);

  if (disasters.length > 0) {
    screen.appendChild(buildHallOfShameSection(disasters));
  }

  screen.appendChild(buildReplayButton());
}

/**
 * Builds the Hall of Shame section embedded in the game complete screen.
 * @param {string[]} disasterIds - Achievement ids starting with "hall_"
 * @returns {HTMLElement}
 */
function buildHallOfShameSection(disasterIds) {
  const section = document.createElement('div');
  section.style.cssText = [
    'width:100%;max-width:480px',
    'border:1px solid var(--color-accent-red)',
    'border-radius:var(--radius-lg)',
    'padding:var(--space-lg)',
    'display:flex', 'flex-direction:column', 'gap:var(--space-md)',
  ].join(';');

  section.innerHTML = `<div style="font-size:var(--font-size-lg);color:var(--color-accent-red);">💥 Hall of Shame</div>`;

  disasterIds.forEach(id => {
    section.appendChild(buildShameEntry(id));
  });

  return section;
}

/**
 * Builds a single Hall of Shame trophy card.
 * @param {string} achievementId
 * @returns {HTMLElement}
 */
function buildShameEntry(achievementId) {
  const EPITAPHS = {
    hall_1: { title: 'Operation Dieter', emoji: '💥', epitaph: 'Hier ruht Operation Dieter. €47.000. RIP.' },
    hall_2: { title: 'SAP-Zombie-Apokalypse', emoji: '🧟‍♂️', epitaph: 'Sie sind gegangen. Die Lizenzen nicht. Auch die Karriere fast.' },
    hall_3: { title: 'Keller-Chaos', emoji: '🏚️', epitaph: 'Der Minecraft-Server läuft noch. Alles andere nicht.' },
  };

  const data = EPITAPHS[achievementId] ?? { title: achievementId, emoji: '💀', epitaph: 'Details sind dem Betroffenen unangenehm.' };

  const entry = document.createElement('div');
  entry.style.cssText = [
    'background:rgba(248,81,73,0.06)',
    'border:1px solid rgba(248,81,73,0.3)',
    'border-radius:var(--radius-md)',
    'padding:var(--space-md)',
    'display:flex', 'gap:var(--space-md)', 'align-items:flex-start',
  ].join(';');

  entry.innerHTML = `
    <div style="font-size:var(--font-size-xl);">${data.emoji}</div>
    <div>
      <div style="font-size:var(--font-size-sm);color:var(--color-text-primary);">${data.title}</div>
      <div style="font-size:10px;color:var(--color-text-secondary);font-style:italic;margin-top:4px;">${data.epitaph}</div>
    </div>
  `;
  return entry;
}

/**
 * Builds the "Nochmal spielen" button with a confirm dialog.
 * @returns {HTMLElement}
 */
function buildReplayButton() {
  const btn = document.createElement('button');
  btn.className = 'choice-btn';
  btn.textContent = '🔄 Nochmal spielen';
  btn.style.cssText = 'width:240px;margin-top:var(--space-md);';
  btn.addEventListener('click', () => {
    const confirmed = window.confirm('Spielstand zurücksetzen und neu beginnen?');
    if (!confirmed) return;
    window.Storage?.clearSave();
    document.getElementById('game-complete-overlay')?.remove();
    window.Engine?.initGame();
    window.startProject?.('projekt_dieter');
  });
  return btn;
}

// ── Standalone Hall of Shame ──────────────────────────────

/**
 * Renders the Hall of Shame as a standalone full-screen overlay.
 * Accessible from a menu or debug trigger.
 */
function renderHallOfShame() {
  const achievements = window.Engine?.GameState?.achievements ?? [];
  const disasters    = achievements.filter(id => id.startsWith('hall_'));

  const screen = createScreen('hall-of-shame-overlay');

  screen.innerHTML = `
    <div style="font-size:var(--font-size-xl);color:var(--color-accent-red);text-align:center;">💥 Hall of Shame</div>
    <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);text-align:center;">
      Die Projekte, bei denen es nicht ganz so lief wie geplant.
    </div>
  `;

  const list = document.createElement('div');
  list.style.cssText = 'display:flex;flex-direction:column;gap:var(--space-md);width:100%;max-width:480px;';

  if (disasters.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'color:var(--color-text-secondary);font-style:italic;text-align:center;padding:var(--space-xl);';
    empty.textContent = 'Noch keine Katastrophen. Beeindruckend. Oder du hast noch nicht genug gespielt.';
    list.appendChild(empty);
  } else {
    disasters.forEach(id => list.appendChild(buildShameEntry(id)));
  }

  const backBtn = document.createElement('button');
  backBtn.className = 'choice-btn';
  backBtn.textContent = '← Zurück';
  backBtn.style.cssText = 'width:160px;margin-top:var(--space-md);';
  backBtn.addEventListener('click', () => screen.remove());

  screen.appendChild(list);
  screen.appendChild(backBtn);
}

// ── Public API ────────────────────────────────────────────

window.UI = {
  renderProjectSelection,
  renderGameComplete,
  renderHallOfShame,
};
