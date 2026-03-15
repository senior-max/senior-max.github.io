/**
 * debug.js
 * Developer DEBUG mode for "License To Bill".
 * Activated by typing "greysuit" anywhere (not in an input field).
 * Never intrudes on normal gameplay — all UI only appears after activation.
 * Depends on: engine.js (window.Engine), career.js (window.Career)
 */

// ── State ─────────────────────────────────────────────────

/** Whether DEBUG mode is currently on. */
let debugActive = false;

/** Rolling buffer of the last N keypresses for activation sequence detection. */
let keyBuffer = '';
const ACTIVATION_SEQUENCE = 'greysuit';
const DIETER_SEQUENCE     = 'dieter';

// ── Activation detection ──────────────────────────────────

/**
 * Listens to document keydown events and checks whether the last N characters
 * spell out the activation sequence. Ignores events when focus is in an input.
 * @param {KeyboardEvent} e
 */
function onKeyDown(e) {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.length !== 1) return;

  const maxLen = Math.max(ACTIVATION_SEQUENCE.length, DIETER_SEQUENCE.length);
  keyBuffer = (keyBuffer + e.key.toLowerCase()).slice(-maxLen);

  if (keyBuffer.endsWith(ACTIVATION_SEQUENCE)) {
    keyBuffer = '';
    toggleDebug();
  }

  if (keyBuffer.endsWith(DIETER_SEQUENCE)) {
    keyBuffer = '';
    injectDieterEmail();
  }
}

function toggleDebug() {
  debugActive = !debugActive;
  if (debugActive) {
    showDebugBanner();
    showDebugPanel();
  } else {
    hideDebugUI();
  }
}

// ── Corner banner ─────────────────────────────────────────

function showDebugBanner() {
  if (document.getElementById('debug-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'debug-banner';
  banner.setAttribute('aria-hidden', 'true');
  banner.style.cssText = [
    'position:fixed', 'top:0', 'right:0', 'z-index:9999',
    'background:var(--color-accent-red)',
    'color:#fff',
    'font-family:var(--font-mono)',
    'font-size:10px',
    'font-weight:bold',
    'letter-spacing:2px',
    'padding:3px 10px',
    'border-bottom-left-radius:var(--radius-sm)',
    'pointer-events:none',
    'user-select:none',
  ].join(';');
  banner.textContent = 'DEBUG';
  document.body.appendChild(banner);
}

function hideDebugUI() {
  document.getElementById('debug-banner')?.remove();
  document.getElementById('debug-panel')?.remove();
}

// ── Panel ─────────────────────────────────────────────────

/** Builds and shows the full debug overlay panel. */
function showDebugPanel() {
  document.getElementById('debug-panel')?.remove();

  const panel = document.createElement('div');
  panel.id = 'debug-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Debug Panel');
  panel.style.cssText = [
    'position:fixed', 'bottom:0', 'right:0',
    'width:360px', 'max-height:80vh',
    'z-index:9998',
    'background:rgba(13,17,23,0.97)',
    'border:1px solid var(--color-accent-red)',
    'border-radius:var(--radius-lg) 0 0 0',
    'font-family:var(--font-mono)',
    'font-size:12px',
    'color:var(--color-text-primary)',
    'display:flex', 'flex-direction:column',
    'overflow:hidden',
  ].join(';');

  panel.appendChild(buildPanelHeader());
  panel.appendChild(buildPanelBody());
  document.body.appendChild(panel);
}

function buildPanelHeader() {
  const header = document.createElement('div');
  header.style.cssText = [
    'display:flex', 'align-items:center', 'justify-content:space-between',
    'background:var(--color-accent-red)', 'color:#fff',
    'padding:6px 12px', 'font-weight:bold', 'letter-spacing:1px',
    'flex-shrink:0',
  ].join(';');

  const title = document.createElement('span');
  title.textContent = '🔧 DEBUG — GREYSUIT & PARTNER';
  header.appendChild(title);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = [
    'background:none', 'border:none', 'color:#fff',
    'cursor:pointer', 'font-size:14px', 'line-height:1',
    'padding:0 4px',
  ].join(';');
  closeBtn.addEventListener('click', () => {
    document.getElementById('debug-panel')?.remove();
  });
  header.appendChild(closeBtn);
  return header;
}

function buildPanelBody() {
  const body = document.createElement('div');
  body.style.cssText = [
    'overflow-y:auto', 'flex:1',
    'padding:var(--space-sm)',
    'display:flex', 'flex-direction:column',
    'gap:var(--space-sm)',
  ].join(';');

  body.appendChild(buildStatControls());
  body.appendChild(buildSceneJumper());
  body.appendChild(buildPresetButtons());
  body.appendChild(buildStateViewer());
  return body;
}

// ── Stat controls ─────────────────────────────────────────

function buildStatControls() {
  const section = createSection('Statistiken');

  const STATS = ['kompetenz', 'bullshit', 'kundenliebe', 'burnout', 'prestige'];
  STATS.forEach((stat) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:4px;';

    const label = document.createElement('label');
    label.style.cssText = 'width:90px;color:var(--color-text-secondary);';
    label.textContent = stat;

    const input = document.createElement('input');
    input.type = 'range';
    input.min = '0';
    input.max = '100';
    input.step = '1';
    input.value = String(window.Engine?.GameState?.stats?.[stat] ?? 0);
    input.style.cssText = 'flex:1;accent-color:var(--color-accent-cyan);cursor:pointer;';
    input.id = `debug-stat-${stat}`;

    const valDisplay = document.createElement('span');
    valDisplay.style.cssText = 'width:26px;text-align:right;color:var(--color-accent-cyan);';
    valDisplay.textContent = input.value;

    input.addEventListener('input', () => {
      valDisplay.textContent = input.value;
      if (window.Engine?.GameState?.stats) {
        window.Engine.GameState.stats[stat] = parseInt(input.value, 10);
        window.Stats?.updateStatBars?.();
      }
    });

    label.htmlFor = input.id;
    row.appendChild(label);
    row.appendChild(input);
    row.appendChild(valDisplay);
    section.appendChild(row);
  });

  // Refresh button
  const refresh = document.createElement('button');
  refresh.textContent = '↻ Werte aus GameState laden';
  refresh.className = 'choice-btn';
  refresh.style.cssText = 'font-size:10px;padding:4px 8px;margin-top:4px;';
  refresh.addEventListener('click', () => refreshStatSliders());
  section.appendChild(refresh);

  return section;
}

/** Syncs slider values from the live GameState. */
function refreshStatSliders() {
  const stats = window.Engine?.GameState?.stats ?? {};
  Object.keys(stats).forEach((stat) => {
    const input = document.getElementById(`debug-stat-${stat}`);
    if (input) input.value = String(stats[stat]);
    const display = input?.nextElementSibling;
    if (display) display.textContent = String(stats[stat]);
  });
}

// ── Scene jumper ──────────────────────────────────────────

function buildSceneJumper() {
  const section = createSection('Szene überspringen');

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:6px;';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Szenen-ID, z.B. d_03';
  input.id = 'debug-scene-input';
  input.style.cssText = [
    'flex:1', 'background:var(--color-surface-elevated)',
    'border:1px solid var(--color-border)',
    'border-radius:var(--radius-sm)',
    'color:var(--color-text-primary)',
    'font-family:var(--font-mono)', 'font-size:12px',
    'padding:4px 8px',
  ].join(';');

  const jumpBtn = document.createElement('button');
  jumpBtn.textContent = '→ Go';
  jumpBtn.className = 'choice-btn';
  jumpBtn.style.cssText = 'font-size:10px;padding:4px 10px;';
  jumpBtn.addEventListener('click', () => {
    const id = input.value.trim();
    if (!id) return;
    document.getElementById('debug-panel')?.remove();
    window.Engine?.debugJumpToScene?.(id);
  });

  // Allow Enter inside the input
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') jumpBtn.click();
    e.stopPropagation();
  });

  row.appendChild(input);
  row.appendChild(jumpBtn);
  section.appendChild(row);

  // Scene list from current project
  const projectData = window.Engine?.getProjectData?.();
  if (projectData?.scenes?.length) {
    const hint = document.createElement('div');
    hint.style.cssText = 'color:var(--color-text-secondary);font-size:10px;margin-top:4px;line-height:1.6;';
    const ids = projectData.scenes.map(s => s.id);
    const endingIds = Object.keys(projectData.endings ?? {});
    hint.textContent = `Szenen: ${[...ids, ...endingIds].join(' · ')}`;
    section.appendChild(hint);
  }

  return section;
}

// ── Preset buttons ────────────────────────────────────────

function buildPresetButtons() {
  const section = createSection('Presets');
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;';

  const PRESETS = [
    {
      label: 'Max Stats',
      action: () => setAllStats({ kompetenz: 100, bullshit: 100, kundenliebe: 100, burnout: 0, prestige: 100 }),
    },
    {
      label: 'Mid Stats',
      action: () => setAllStats({ kompetenz: 60, bullshit: 40, kundenliebe: 55, burnout: 30, prestige: 40 }),
    },
    {
      label: 'Reset',
      action: () => setAllStats({ kompetenz: 40, bullshit: 20, kundenliebe: 50, burnout: 10, prestige: 15 }),
    },
    {
      label: 'Burnout!',
      action: () => setAllStats({ burnout: 99 }),
    },
    {
      label: '+50 XP',
      action: () => window.Engine?.addXP?.(50),
    },
  ];

  PRESETS.forEach(({ label, action }) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = label;
    btn.style.cssText = 'font-size:10px;padding:4px 8px;';
    btn.addEventListener('click', () => {
      action();
      refreshStatSliders();
    });
    row.appendChild(btn);
  });

  section.appendChild(row);
  return section;
}

/**
 * Overwrites specific stats in GameState and refreshes bars.
 * @param {Object.<string,number>} values
 */
function setAllStats(values) {
  const stats = window.Engine?.GameState?.stats;
  if (!stats) return;
  Object.keys(values).forEach((k) => {
    if (k in stats) stats[k] = values[k];
  });
  window.Stats?.updateStatBars?.();
  window.Career?.renderCareerHUD?.();
}

// ── State viewer (JSON) ───────────────────────────────────

function buildStateViewer() {
  const section = createSection('GameState JSON');

  const pre = document.createElement('pre');
  pre.id = 'debug-state-json';
  pre.style.cssText = [
    'background:var(--color-surface)',
    'border:1px solid var(--color-border)',
    'border-radius:var(--radius-sm)',
    'padding:var(--space-sm)',
    'font-size:10px',
    'max-height:180px',
    'overflow:auto',
    'white-space:pre-wrap',
    'word-break:break-all',
    'color:var(--color-text-secondary)',
    'margin:0',
  ].join(';');

  const refreshBtn = document.createElement('button');
  refreshBtn.className = 'choice-btn';
  refreshBtn.textContent = '↻ Aktualisieren';
  refreshBtn.style.cssText = 'font-size:10px;padding:4px 8px;margin-bottom:4px;';
  refreshBtn.addEventListener('click', () => {
    pre.textContent = JSON.stringify(window.Engine?.GameState ?? {}, null, 2);
  });

  pre.textContent = JSON.stringify(window.Engine?.GameState ?? {}, null, 2);
  section.appendChild(refreshBtn);
  section.appendChild(pre);
  return section;
}

// ── DOM helper ────────────────────────────────────────────

/**
 * Creates a labelled section container for the debug panel.
 * @param {string} title
 * @returns {HTMLElement}
 */
function createSection(title) {
  const wrap = document.createElement('div');
  wrap.style.cssText = [
    'background:var(--color-surface)',
    'border:1px solid var(--color-border)',
    'border-radius:var(--radius-sm)',
    'padding:var(--space-sm)',
    'display:flex', 'flex-direction:column', 'gap:4px',
  ].join(';');

  const heading = document.createElement('div');
  heading.style.cssText = [
    'font-size:10px', 'text-transform:uppercase', 'letter-spacing:1.5px',
    'color:var(--color-accent-red)', 'margin-bottom:4px', 'font-weight:bold',
  ].join(';');
  heading.textContent = title;
  wrap.appendChild(heading);
  return wrap;
}

// ── Dieter easter egg ─────────────────────────────────────

const DIETER_EMAILS = [
  { subject: 'Re: Re: Re: Re: Excel', body: 'Ich hab die Excel nochmal angepasst. Die neue Version ist im Anhang. Sie heißt final_v3_JETZT_WIRKLICH_final_neu2.xlsx.\n\nSchöne Grüße\nDieter' },
  { subject: 'Kurze Frage', body: 'Hallo,\n\nkurze Frage: Ist das normal, dass unser SAP seit gestern nicht mehr startet? Ich hab nichts gemacht.\n\nDieter' },
  { subject: 'Fwd: Fwd: Fwd: wichtig!!!', body: 'Weiterleitung von Klaus (der ist jetzt weg).\nWeiterleitung von Günter (auch weg).\nWeiterleitung von Helga (Rente).\n\n[INHALT NICHT MEHR LESBAR]' },
  { subject: 'Noch ein Kaffee?', body: 'Ich mach gleich Kaffee. Willst du auch einen?\n\nDieter\n\nP.S. Ich hab noch eine Excel. Sie ist etwas historisch.' },
  { subject: 'Dringlich!!!', body: 'Ich glaube wir haben ein Problem.\nKann aber auch sein, dass es kein Problem ist.\nIch schau nochmal.\n\nDieter' },
];

/**
 * Injects a surprise Dieter email into the open inbox (or shows a toast if inbox is closed).
 */
function injectDieterEmail() {
  const email = DIETER_EMAILS[Math.floor(Math.random() * DIETER_EMAILS.length)];

  const inboxEl = document.querySelector('#email-overlay .email-list, #email-list');
  if (!inboxEl) {
    window.KeyboardController?.showToast('📧 Dieter hat eine E-Mail geschickt. Zu einem ungünstigen Zeitpunkt.', 'var(--color-accent-amber)');
    return;
  }

  const row = document.createElement('div');
  row.className = 'email-row';
  row.style.cssText = [
    'display:flex', 'flex-direction:column', 'gap:2px',
    'padding:var(--space-sm) var(--space-md)',
    'border-bottom:1px solid var(--color-border)',
    'cursor:pointer',
    'animation:fadeInUp 0.3s ease both',
    'border-left:3px solid var(--color-accent-amber)',
  ].join(';');
  row.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:var(--space-sm);">
      <span style="color:var(--color-accent-amber);font-size:var(--font-size-sm);">📧 Dieter Bauer</span>
      <span style="color:var(--color-text-secondary);font-size:10px;">gerade eben</span>
    </div>
    <div style="color:var(--color-text-primary);font-size:var(--font-size-sm);">${email.subject}</div>
    <div style="color:var(--color-text-secondary);font-size:11px;font-style:italic;">${email.body.slice(0, 80)}…</div>
  `;
  row.addEventListener('click', () => {
    row.style.borderLeftColor = 'var(--color-border)';
    window.KeyboardController?.showToast(`📧 ${email.body.split('\n')[0]}`, 'var(--color-accent-amber)');
  });
  inboxEl.prepend(row);
  window.KeyboardController?.showToast('📧 Neue E-Mail von Dieter (natürlich)', 'var(--color-accent-amber)');
}

// ── Init ──────────────────────────────────────────────────

document.addEventListener('keydown', onKeyDown);

window.Debug = { toggleDebug };
