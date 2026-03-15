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
  'projekt_cloud',
  'projekt_ki',
  'projekt_board',
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
 * Builds a faded card for an already-completed project, showing its ending type.
 * @param {Object} project
 * @returns {HTMLElement}
 */
function buildCompletedCard(project) {
  const endingType = window.Engine?.GameState?.projectEndings?.[project.id] ?? 'neutral';
  const endingLabel = endingType === 'disaster'
    ? '<span style="color:var(--color-accent-red);">💥 Desaster</span>'
    : '<span style="color:var(--color-accent-green);">✅ Erfolg</span>';

  const card = document.createElement('div');
  card.style.cssText = [
    'background:var(--color-surface)',
    'border:1px solid var(--color-border)',
    'border-radius:var(--radius-lg)',
    'padding:var(--space-lg)',
    'display:flex', 'flex-direction:column', 'gap:var(--space-sm)',
    'max-width:480px', 'width:100%',
    'opacity:0.6',
  ].join(';');

  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:var(--space-sm);">
      <div style="font-size:var(--font-size-base);">${project.title}</div>
      <div style="font-size:var(--font-size-sm);white-space:nowrap;">✓ Abgeschlossen</div>
    </div>
    <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);">${project.subtitle ?? ''}</div>
    <div style="font-size:var(--font-size-sm);">${endingLabel}</div>
  `;
  return card;
}

/**
 * Builds a locked card for a project the player hasn't reached the level for yet.
 * @param {Object} project
 * @returns {HTMLElement}
 */
function buildLockedCard(project) {
  const CAREER_TITLES = [
    'Junior Consultant', 'Consultant', 'Senior Consultant',
    'Manager', 'Principal', 'Partner',
  ];
  const requiredTitle = CAREER_TITLES[(project.requiredLevel ?? 1) - 1] ?? 'Senior Consultant';

  const card = document.createElement('div');
  card.style.cssText = [
    'background:var(--color-surface)',
    'border:1px solid var(--color-border)',
    'border-radius:var(--radius-lg)',
    'padding:var(--space-lg)',
    'display:flex', 'flex-direction:column', 'gap:var(--space-sm)',
    'max-width:480px', 'width:100%',
    'opacity:0.4',
  ].join(';');

  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:var(--space-sm);">
      <div style="font-size:var(--font-size-base);color:var(--color-text-secondary);">${project.title}</div>
      <div style="font-size:var(--font-size-sm);white-space:nowrap;">🔒 Gesperrt</div>
    </div>
    <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);">${project.subtitle ?? ''}</div>
    <div style="font-size:10px;color:var(--color-text-secondary);">Verfügbar ab: ${requiredTitle}</div>
  `;
  return card;
}

// ── Project selection screen ──────────────────────────────

/**
 * Renders the full-screen project selection overlay.
 * Shows all 6 projects with available/completed/locked states.
 * Triggers renderFullGameComplete() when all 6 are done.
 * @returns {Promise<void>}
 */
async function renderProjectSelection() {
  const projects  = await loadAllProjects();
  const state     = window.Engine?.GameState;
  const completed = state?.projectsCompleted ?? [];
  const level     = state?.career?.level ?? 1;

  const sortedProjects = ALL_PROJECT_IDS
    .map(id => projects.find(p => p.id === id))
    .filter(Boolean);

  if (completed.length >= 6 && sortedProjects.every(p => completed.includes(p.id))) {
    renderFullGameComplete();
    return;
  }

  const screen = createScreen('project-select-overlay');

  const projectsDone = sortedProjects.filter(p => completed.includes(p.id)).length;

  screen.innerHTML = `
    <div style="font-size:var(--font-size-xl);text-align:center;">📂 Neuer Auftrag</div>
    <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);text-align:center;">
      ${getSelectionSubtitle(level)}
    </div>
    <div style="font-size:var(--font-size-sm);color:var(--color-accent-cyan);text-align:center;">
      Projekte: ${projectsDone} / 6 abgeschlossen
      &nbsp;·&nbsp;
      Karrierestufe: ${state?.career?.title ?? 'Junior Consultant'}
    </div>
  `;

  const grid = document.createElement('div');
  grid.style.cssText = 'display:flex;flex-direction:column;gap:var(--space-md);align-items:center;width:100%;';

  sortedProjects.forEach(p => {
    if (completed.includes(p.id)) {
      grid.appendChild(buildCompletedCard(p));
    } else if ((p.requiredLevel ?? 1) <= level) {
      grid.appendChild(buildAvailableCard(p));
    } else {
      grid.appendChild(buildLockedCard(p));
    }
  });

  screen.appendChild(grid);
}

/**
 * Renders project selection for starting a new game from the main menu.
 * All projects are selectable. On pick: clears save, resets state, starts selected project.
 * @param {{ onSelect?: (projectId: string) => void }} [opts] - Callback when a project is selected.
 */
async function renderProjectSelectionForNewGame(opts = {}) {
  const projects = await loadAllProjects();
  const onSelect = opts.onSelect;

  document.getElementById('project-select-overlay')?.remove();

  const screen = createScreen('project-select-overlay');

  screen.innerHTML = `
    <div style="font-size:var(--font-size-xl);text-align:center;">📂 Projekt auswählen</div>
    <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);text-align:center;">
      Wähle ein Projekt für einen Neustart. Alle Fortschritte werden gelöscht.
    </div>
  `;

  const grid = document.createElement('div');
  grid.style.cssText = 'display:flex;flex-direction:column;gap:var(--space-md);align-items:center;width:100%;';

  const sorted = ALL_PROJECT_IDS
    .map(id => projects.find(p => p.id === id))
    .filter(Boolean);

  sorted.forEach(p => {
    const card = document.createElement('div');
    card.style.cssText = [
      'background:var(--color-surface-elevated)',
      'border:1px solid var(--color-border)',
      'border-radius:var(--radius-lg)',
      'padding:var(--space-lg)',
      'display:flex', 'flex-direction:column', 'gap:var(--space-sm)',
      'max-width:480px', 'width:100%',
      'cursor:pointer', 'transition:border-color 0.2s',
    ].join(';');

    card.innerHTML = `
      <div style="font-size:var(--font-size-lg);color:var(--color-text-primary);">${p.title}</div>
      <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);font-style:italic;">${p.subtitle ?? ''}</div>
      <div style="display:flex;gap:var(--space-md);font-size:var(--font-size-sm);align-items:center;flex-wrap:wrap;">
        <span>Schwierigkeit: ${difficultyDots(p.difficulty)}</span>
        <span>Comedy: ${comedyIcons(p.comedyLevel)}</span>
        <span style="color:var(--color-accent-green);">+${p.xpReward ?? '?'} XP</span>
      </div>
    `;

    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = 'Starten';
    btn.style.marginTop = 'var(--space-sm)';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof onSelect === 'function') onSelect(p.id);
    });
    card.appendChild(btn);

    card.addEventListener('mouseenter', () => { card.style.borderColor = 'var(--color-accent-cyan)'; });
    card.addEventListener('mouseleave', () => { card.style.borderColor = 'var(--color-border)'; });
    grid.appendChild(card);
  });

  const backBtn = document.createElement('button');
  backBtn.className = 'choice-btn';
  backBtn.textContent = '← Zurück';
  backBtn.style.cssText = 'width:160px;margin-top:var(--space-md);';
  backBtn.addEventListener('click', () => {
    screen.remove();
    window.Menu?.renderMainMenu?.();
  });

  screen.appendChild(grid);
  screen.appendChild(backBtn);
}

// ── Full game complete screen ─────────────────────────────

/**
 * Renders an ASCII bar for a stat value (0-100) using 10 block characters.
 * @param {number} value
 * @returns {string}
 */
function asciBar(value) {
  const filled = Math.round(Math.min(100, Math.max(0, value)) / 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

/**
 * Renders the full-screen completion summary shown when all 6 projects are done.
 * @returns {Promise<void>}
 */
async function renderFullGameComplete() {
  const state    = window.Engine?.GameState ?? {};
  const career   = state.career ?? { title: 'Partner', level: 6, xp: 0 };
  const stats    = state.stats ?? {};
  const unlocked = state.achievements ?? [];
  const session  = state.sessionCount ?? 1;
  const disCount = state.disasterCount ?? 0;

  let allAchievements = [];
  try {
    const res = await fetch('/data/achievements.json');
    allAchievements = await res.json();
  } catch (_) { /* graceful fallback */ }

  const screen = createScreen('game-complete-overlay');

  screen.innerHTML = `
    <div style="font-size:48px;text-align:center;animation:levelUpEmoji 0.5s ease both;">🎖️</div>
    <div style="font-size:var(--font-size-xl);text-align:center;color:var(--color-accent-cyan);">VOLLSTÄNDIG ABGESCHLOSSEN</div>
    <div id="complete-flavor" style="font-size:var(--font-size-sm);color:var(--color-text-secondary);text-align:center;min-height:4em;line-height:1.8;"></div>
  `;

  const FLAVOR_LINES = [
    'Sie haben alle 6 Projekte abgeschlossen.',
    'Greysuit & Partner ist stolz auf Sie.',
    'Dr. Müller-Brandt hat das auf LinkedIn gepostet.',
    'Er hat sich selbst in der Überschrift erwähnt.',
    'Kevin hat eine App darüber gebaut. Die Daten sind diesmal echt.',
  ];
  let lineIdx = 0;
  const flavorEl = screen.querySelector('#complete-flavor');
  function typeNextLine() {
    if (lineIdx >= FLAVOR_LINES.length) return;
    const line = FLAVOR_LINES[lineIdx++];
    let i = 0;
    const interval = setInterval(() => {
      flavorEl.textContent += line[i++] ?? '';
      if (i >= line.length) {
        clearInterval(interval);
        flavorEl.textContent += '\n';
        setTimeout(typeNextLine, 300);
      }
    }, 28);
  }
  typeNextLine();

  const statDefs = [
    ['🧠 Kompetenz', stats.kompetenz ?? 0, 'var(--color-accent-cyan)'],
    ['💬 Bullshit',  stats.bullshit  ?? 0, 'var(--color-accent-amber)'],
    ['🤝 Kundenliebe', stats.kundenliebe ?? 0, 'var(--color-accent-green)'],
    ['🔥 Burnout',   stats.burnout   ?? 0, 'var(--color-accent-red)'],
    ['🏆 Prestige',  stats.prestige  ?? 0, 'var(--color-accent-purple)'],
  ];
  const barsWrap = document.createElement('div');
  barsWrap.style.cssText = [
    'width:100%;max-width:460px',
    'background:var(--color-surface-elevated)',
    'border:1px solid var(--color-border)',
    'border-radius:var(--radius-lg)',
    'padding:var(--space-lg)',
    'display:flex', 'flex-direction:column', 'gap:var(--space-sm)',
  ].join(';');
  barsWrap.innerHTML = `<div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);margin-bottom:var(--space-xs);">FINAL STATS</div>`;
  statDefs.forEach(([label, val, color]) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:var(--space-sm);font-size:12px;font-family:var(--font-mono);';
    row.innerHTML = `
      <span style="width:130px;color:var(--color-text-secondary);">${label}</span>
      <span style="color:${color};letter-spacing:1px;">${asciBar(val)}</span>
      <span style="color:${color};min-width:28px;text-align:right;">${val}</span>
    `;
    barsWrap.appendChild(row);
  });
  screen.appendChild(barsWrap);

  const summaryWrap = document.createElement('div');
  summaryWrap.style.cssText = [
    'width:100%;max-width:460px',
    'background:var(--color-surface-elevated)',
    'border:1px solid var(--color-border)',
    'border-radius:var(--radius-lg)',
    'padding:var(--space-lg)',
    'display:flex', 'flex-direction:column', 'gap:var(--space-sm)',
    'font-size:var(--font-size-sm)',
  ].join(';');
  const totalXP = state.career?.xp ?? 0;
  const totalXPEver = [0, 150, 200, 200, 250, 300].slice(0, career.level - 1).reduce((a, b) => a + b, 0) + totalXP;
  summaryWrap.innerHTML = `
    <div style="color:var(--color-text-secondary);">KARRIERE-ZUSAMMENFASSUNG</div>
    <div>Endtitel: <span style="color:var(--color-accent-amber);">${career.title}</span></div>
    <div>Karrierestufe: <span style="color:var(--color-accent-cyan);">${career.level} von 6</span></div>
    <div>Geschätzte Spielzeit: ~${session * 15} Minuten
      <span style="color:var(--color-text-secondary);font-size:10px;">(nicht mitgezählt: die Zeit die Dieter Sie am Telefon hatte)</span>
    </div>
  `;
  screen.appendChild(summaryWrap);

  if (allAchievements.length > 0) {
    const achWrap = document.createElement('div');
    achWrap.style.cssText = [
      'width:100%;max-width:460px',
      'background:var(--color-surface-elevated)',
      'border:1px solid var(--color-border)',
      'border-radius:var(--radius-lg)',
      'padding:var(--space-lg)',
      'display:flex', 'flex-direction:column', 'gap:var(--space-sm)',
    ].join(';');
    achWrap.innerHTML = `<div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);">ACHIEVEMENTS: ${unlocked.length} von ${allAchievements.length} freigeschaltet</div>`;
    const grid = document.createElement('div');
    grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:var(--space-xs);';
    allAchievements.forEach(a => {
      const el = document.createElement('span');
      el.style.cssText = `font-size:22px;${unlocked.includes(a.id) ? '' : 'filter:grayscale(1);opacity:0.25;'}`;
      el.title = unlocked.includes(a.id) ? `${a.name}: ${a.description}` : '???';
      el.textContent = unlocked.includes(a.id) ? a.emoji : '⬜';
      grid.appendChild(el);
    });
    achWrap.appendChild(grid);
    screen.appendChild(achWrap);
  }

  if (disCount > 0) {
    const disasters = Object.entries(state.projectEndings ?? {})
      .filter(([, t]) => t === 'disaster')
      .map(([id]) => id);

    if (disasters.length > 0) {
      const shameWrap = document.createElement('div');
      shameWrap.style.cssText = [
        'width:100%;max-width:460px',
        'border:1px solid var(--color-accent-red)',
        'border-radius:var(--radius-lg)',
        'padding:var(--space-lg)',
        'display:flex', 'flex-direction:column', 'gap:var(--space-sm)',
      ].join(';');
      shameWrap.innerHTML = `<div style="font-size:var(--font-size-lg);color:var(--color-accent-red);">🏚️ Hall of Shame</div>`;
      const EPITAPHS = {
        projekt_dieter:      { emoji: '💥', epitaph: 'Operation Dieter. €47.000. Steinbach notiert alles. RIP.' },
        projekt_sap_zombies: { emoji: '🧟', epitaph: 'Die Lizenzen sind weg. Der CFO ist nicht amüsiert. Niemals.' },
        projekt_shadow_it:   { emoji: '🏚️', epitaph: 'Der Minecraft-Server läuft noch. Alles andere nicht.' },
        projekt_cloud:       { emoji: '☁️', epitaph: 'BUCHHALTUNG 2006 war 3 Tage offline. Kevin war beteiligt.' },
        projekt_ki:          { emoji: '🤖', epitaph: 'Vendor A hat geliefert. Dr. Sasse hat das Unternehmen verlassen.' },
        projekt_board:       { emoji: '😶', epitaph: 'Wolfgang Reinhold: "Wir gehen in eine andere Richtung." Ende.' },
      };
      disasters.forEach(pid => {
        const data = EPITAPHS[pid] ?? { emoji: '💀', epitaph: 'Details sind dem Betroffenen unangenehm.' };
        const entry = document.createElement('div');
        entry.style.cssText = 'display:flex;gap:var(--space-md);align-items:flex-start;font-size:var(--font-size-sm);';
        entry.innerHTML = `<span style="font-size:20px;">${data.emoji}</span><span style="color:var(--color-text-secondary);font-style:italic;">${data.epitaph}</span>`;
        shameWrap.appendChild(entry);
      });
      screen.appendChild(shameWrap);
    }
  }

  if (disCount >= 6) {
    window.Achievements?.checkTrigger('all_disasters_complete');
    const chaosEl = document.createElement('div');
    chaosEl.style.cssText = [
      'width:100%;max-width:460px',
      'background:rgba(248,81,73,0.1)',
      'border:1px solid var(--color-accent-red)',
      'border-radius:var(--radius-lg)',
      'padding:var(--space-lg)',
      'text-align:center',
      'font-size:var(--font-size-sm)',
    ].join(';');
    chaosEl.innerHTML = `
      <div style="font-size:32px;margin-bottom:var(--space-sm);">🌪️</div>
      <div style="color:var(--color-accent-red);margin-bottom:var(--space-sm);">Vollständiges Chaos — Achievement freigeschaltet</div>
      <div style="color:var(--color-text-secondary);line-height:1.8;">
        Sie haben alle 6 Projekte mit Desaster beendet.<br>
        Das ist statistisch fast unmöglich.<br>
        Dieter weint. Dr. Sasse hat das Unternehmen verlassen.<br>
        Kevin hat trotzdem eine App gebaut.
      </div>
    `;
    screen.appendChild(chaosEl);
  }

  const btnWrap = document.createElement('div');
  btnWrap.style.cssText = 'display:flex;gap:var(--space-md);flex-wrap:wrap;justify-content:center;margin-top:var(--space-md);';

  const replayBtn = document.createElement('button');
  replayBtn.className = 'choice-btn';
  replayBtn.textContent = '🔄 Nochmal spielen';
  replayBtn.style.cssText = 'width:220px;';
  replayBtn.addEventListener('click', () => {
    const confirmed = window.confirm('Spielstand löschen und neu beginnen?');
    if (!confirmed) return;
    window.Storage?.clearSave();
    document.getElementById('game-complete-overlay')?.remove();
    window.Engine?.initGame();
    window.startProject?.('projekt_dieter');
  });

  const achBtn = document.createElement('button');
  achBtn.className = 'choice-btn';
  achBtn.textContent = '🏅 Alle Achievements';
  achBtn.style.cssText = 'width:220px;background:var(--color-surface-elevated);';
  achBtn.addEventListener('click', () => window.Achievements?.renderAchievementsScreen?.());

  btnWrap.appendChild(replayBtn);
  btnWrap.appendChild(achBtn);
  screen.appendChild(btnWrap);
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
  const totalAch = window._LTB_CONFIG?.totalAchievements ?? 37;
  xpNote.textContent = `Gesamt-XP: ${career.xp} · Achievements: ${achievements.length} von ${totalAch}`;

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

// ── HUD ────────────────────────────────────────────────────

/**
 * Ensures the dashboard button exists in the HUD.
 * Called when game starts so the 📊 button is available.
 */
function renderHUD() {
  if (document.getElementById('dashboard-btn')) return;
  const hud = document.getElementById('hud');
  const achBtn = document.getElementById('hud-achievements-btn');
  if (!hud || !achBtn) return;
  const btn = document.createElement('button');
  btn.id = 'dashboard-btn';
  btn.setAttribute('aria-label', 'Performance Dashboard öffnen');
  btn.textContent = '📊';
  btn.onclick = () => window.Dashboard?.open();
  hud.insertBefore(btn, achBtn);
}

// ── Public API ────────────────────────────────────────────

window.UI = {
  renderProjectSelection,
  renderProjectSelectionForNewGame,
  renderFullGameComplete,
  renderGameComplete,
  renderHallOfShame,
  renderHUD,
};
