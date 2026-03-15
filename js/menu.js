/**
 * menu.js
 * Main menu system for "License To Bill".
 * Depends on: storage.js, engine.js, stats.js, career.js, achievements.js, ui.js
 * Exposes: window.Menu
 */

// ── Internal state ────────────────────────────────────────

/** @type {AbortController|null} Manages keyboard shortcut listener lifetime. */
let _kbController = null;

/** @type {Object|null} Config from config.json, stored once checkSaveAndStart runs. */
let _config = null;

// ── Overlay factory ───────────────────────────────────────

/**
 * Creates a full-screen menu overlay on top of everything and appends it to #app.
 * Removes any existing overlay with the same id first.
 * @param {string} id
 * @param {{ center?: boolean }} [opts]
 * @returns {HTMLElement}
 */
function createMenuScreen(id, { center = true } = {}) {
  document.getElementById(id)?.remove();
  const el = document.createElement('div');
  el.id = id;

  const base = [
    'position:fixed', 'inset:0', 'z-index:2000',
    'background:var(--color-bg)',
    'font-family:var(--font-mono)',
    'overflow-y:auto',
  ];

  if (center) {
    base.push(
      'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center',
    );
  } else {
    base.push(
      'display:flex', 'flex-direction:column', 'align-items:center',
      'padding:var(--space-xl) var(--space-lg)',
    );
  }

  el.style.cssText = base.join(';');
  document.getElementById('app').appendChild(el);
  return el;
}

// ── Typewriter helper ─────────────────────────────────────

/**
 * Types text character-by-character into a DOM element.
 * Appends a blinking cursor during typing.
 * @param {HTMLElement} el
 * @param {string} text
 * @param {number} [speed=36]
 * @returns {Promise<void>}
 */
function typeInto(el, text, speed = 36) {
  return new Promise((resolve) => {
    el.textContent = '';
    const cursor = document.createElement('span');
    cursor.className = 'animate-typing-cursor';
    el.appendChild(cursor);

    let i = 0;
    const iv = setInterval(() => {
      if (i >= text.length) {
        clearInterval(iv);
        cursor.remove();
        resolve();
        return;
      }
      el.insertBefore(document.createTextNode(text[i]), cursor);
      i += 1;
    }, speed);
  });
}

// ── Keyboard shortcuts ────────────────────────────────────

/**
 * Attaches keyboard shortcuts 1-N to the provided button elements.
 * Enter always triggers the first button.
 * ESC re-renders the main menu.
 * Any previous listener set is cleanly removed first.
 * @param {HTMLButtonElement[]} buttons - Ordered list of active menu buttons.
 */
function attachMenuKeys(buttons) {
  detachMenuKeys();
  _kbController = new AbortController();

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      renderMainMenu();
      return;
    }
    if (e.key === 'Enter') {
      buttons[0]?.click();
      return;
    }
    const idx = parseInt(e.key, 10) - 1;
    if (!isNaN(idx) && idx >= 0 && idx < buttons.length) {
      buttons[idx].click();
    }
  }, { signal: _kbController.signal });
}

/** Removes the current keyboard shortcut listener. */
function detachMenuKeys() {
  if (_kbController) {
    _kbController.abort();
    _kbController = null;
  }
}

// ── Save state banner ─────────────────────────────────────

/**
 * Builds a small informational banner summarising the saved game state.
 * @param {Object} save - Raw saved GameState from Storage.
 * @returns {HTMLElement}
 */
function buildSaveBanner(save) {
  const title = save.career?.title ?? 'Junior Consultant';
  const count = save.projectsCompleted?.length ?? 0;

  const el = document.createElement('div');
  el.style.cssText = [
    'font-size:11px',
    'color:var(--color-accent-amber)',
    'border:1px solid var(--color-accent-amber)',
    'border-radius:var(--radius-sm)',
    'padding:4px 12px',
    'opacity:0.9',
    'letter-spacing:0.5px',
    'text-align:center',
  ].join(';');
  const total = _config?.totalProjects ?? 6;
  el.textContent = `💾 Gespeicherter Stand: ${title} — Projekt ${count}/${total}`;
  return el;
}

// ── Internal game-start helpers ───────────────────────────

/**
 * Initialises engine + HUD. Called before every game start, new or continued.
 */
function _initGameSystems() {
  window.Engine?.initGame();
  window.Stats?.initStatBars();
  window.UI?.renderHUD?.();
  window.Career?.renderCareerHUD();
}

/**
 * Tears down the menu overlay, clears any keyboard listeners, and starts a
 * fresh game from the beginning.
 * @param {HTMLElement} menuEl - The menu overlay to remove.
 */
function startNewGame(menuEl) {
  detachMenuKeys();
  menuEl?.remove();
  window.Storage?.clearSave();
  _initGameSystems();
  const projectId = _config?.startProject ?? 'projekt_dieter';
  window.startProject(projectId);
}

/**
 * Tears down the menu overlay and resumes a previously saved game.
 * Falls back to a fresh start when no save is present.
 * @param {HTMLElement} menuEl - The menu overlay to remove.
 * @param {Object|null} save - The raw save data (may be null).
 */
async function continueGame(menuEl, save) {
  if (!save) {
    showNoSaveToast();
    return;
  }
  detachMenuKeys();
  menuEl?.remove();
  _initGameSystems();
  const projectId = save.currentProject ?? _config?.startProject ?? 'projekt_dieter';
  const sceneId   = save.currentScene   ?? null;
  await window.startProject(projectId, sceneId);
}

/**
 * Shows project selection for starting a new game. Clears save and starts selected project.
 * @param {HTMLElement} menuEl - The menu overlay to remove.
 */
async function showProjectSelectionForNewGame(menuEl) {
  detachMenuKeys();
  menuEl?.remove();

  await window.UI?.renderProjectSelectionForNewGame?.({
    onSelect: (projectId) => {
      window.Storage?.clearAll?.();
      window.Engine?.initGame?.();
      window.Achievements?.loadAchievements?.();
      _initGameSystems();
      document.getElementById('project-select-overlay')?.remove();
      window.startProject?.(projectId);
    },
  });
}

/**
 * Shows confirmation dialog for full reset. On confirm: clears all data, returns to main menu.
 */
function confirmResetAll() {
  const overlay = document.createElement('div');
  overlay.id = 'reset-confirm-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Alles zurücksetzen?');
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:3000',
    'display:flex', 'align-items:center', 'justify-content:center',
    'background:rgba(13,17,23,0.85)',
    'backdrop-filter:blur(4px)',
    '-webkit-backdrop-filter:blur(4px)',
    'animation:fadeIn 0.2s ease both',
  ].join(';');

  const card = document.createElement('div');
  card.style.cssText = [
    'background:var(--color-surface)',
    'border:1px solid var(--color-border)',
    'border-radius:var(--radius-lg)',
    'padding:var(--space-xl)',
    'max-width:360px', 'width:90vw',
    'display:flex', 'flex-direction:column',
    'align-items:center', 'gap:var(--space-md)',
    'text-align:center',
    'animation:levelUpCard 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
  ].join(';');

  card.innerHTML = `
    <div style="font-size:2rem;">🔄</div>
    <div style="font-size:var(--font-size-lg);color:var(--color-text-primary);">Alles zurücksetzen?</div>
    <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);line-height:1.6;">
      Speicherstand und Achievements werden gelöscht.<br>Dies kann nicht rückgängig gemacht werden.
    </div>
  `;

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:var(--space-sm);width:100%;';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'choice-btn';
  cancelBtn.textContent = 'Abbrechen';
  cancelBtn.style.flex = '1';
  cancelBtn.addEventListener('click', () => overlay.remove());

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'choice-btn';
  confirmBtn.textContent = 'Ja, zurücksetzen';
  confirmBtn.style.cssText = [
    'flex:1',
    'border-color:var(--color-accent-red)',
    'color:var(--color-accent-red)',
  ].join(';');
  confirmBtn.addEventListener('click', () => {
    overlay.remove();
    window.Storage?.clearAll?.();
    window.Engine?.initGame?.();
    window.Achievements?.loadAchievements?.();
    window.Stats?.initStatBars?.();
    window.Career?.renderCareerHUD?.();
    renderMainMenu();
  });

  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(confirmBtn);
  card.appendChild(btnRow);
  overlay.appendChild(card);
  document.getElementById('app').appendChild(overlay);

  const esc = new AbortController();
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { overlay.remove(); esc.abort(); }
  }, { signal: esc.signal });

  setTimeout(() => cancelBtn.focus(), 50);
}

/**
 * Shows a short toast when the player tries to load but no save exists.
 */
function showNoSaveToast() {
  const existing = document.getElementById('no-save-toast');
  if (existing) return;

  const toast = document.createElement('div');
  toast.id = 'no-save-toast';
  toast.style.cssText = [
    'position:fixed', 'bottom:var(--space-lg)', 'left:50%', 'transform:translateX(-50%)',
    'z-index:2100', 'background:var(--color-surface-elevated)',
    'border:1px solid var(--color-accent-red)',
    'border-radius:var(--radius-md)', 'padding:var(--space-sm) var(--space-md)',
    'font-family:var(--font-mono)', 'font-size:var(--font-size-sm)',
    'color:var(--color-accent-red)', 'white-space:nowrap',
  ].join(';');
  toast.textContent = '⚠ Kein Speicherstand gefunden.';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// ── Welcome-back screen ───────────────────────────────────

/**
 * Displays a welcome-back prompt when a save file is detected on boot.
 * Player can continue or start fresh.
 * @param {Object} save - Raw saved GameState.
 */
function showWelcomeBack(save) {
  const title = save.career?.title ?? 'Junior Consultant';
  const screen = createMenuScreen('menu-welcome');

  const inner = document.createElement('div');
  inner.style.cssText = [
    'display:flex', 'flex-direction:column', 'align-items:center',
    'gap:var(--space-md)', 'max-width:420px', 'width:100%',
    'padding:var(--space-lg)', 'text-align:center',
  ].join(';');
  screen.appendChild(inner);

  const emoji = document.createElement('div');
  emoji.style.cssText = 'font-size:3rem;animation:fadeInUp 0.5s ease both;';
  emoji.textContent = '💼';
  inner.appendChild(emoji);

  const heading = document.createElement('div');
  heading.style.cssText = [
    'color:var(--color-text-primary)', 'font-size:var(--font-size-lg)',
    'letter-spacing:2px', 'animation:fadeInUp 0.5s 0.1s ease both;',
  ].join(';');
  heading.textContent = `Willkommen zurück, ${title}!`;
  inner.appendChild(heading);

  const sub = document.createElement('div');
  sub.style.cssText = 'color:var(--color-text-secondary);font-size:var(--font-size-sm);';
  sub.textContent = 'Weiterspielen oder neu beginnen?';
  inner.appendChild(sub);

  const btnRow = document.createElement('div');
  btnRow.style.cssText = [
    'display:flex', 'gap:var(--space-md)', 'margin-top:var(--space-sm)',
    'width:100%', 'max-width:300px',
  ].join(';');
  inner.appendChild(btnRow);

  const yesBtn = document.createElement('button');
  yesBtn.className = 'choice-btn animate-fadeInUp';
  yesBtn.style.cssText += ';flex:1;animation-delay:0.3s;';
  yesBtn.textContent = '▶ Weiterspielen';
  yesBtn.addEventListener('click', () => continueGame(screen, save));

  const noBtn = document.createElement('button');
  noBtn.className = 'choice-btn animate-fadeInUp';
  noBtn.style.cssText += ';flex:1;animation-delay:0.4s;opacity:0.7;';
  noBtn.textContent = '✕ Neues Spiel';
  noBtn.addEventListener('click', () => {
    screen.remove();
    renderMainMenu();
  });

  btnRow.appendChild(yesBtn);
  btnRow.appendChild(noBtn);

  attachMenuKeys([yesBtn, noBtn]);
}

// ── Main Menu ─────────────────────────────────────────────

/** Renders the full main menu screen. */
function renderMainMenu() {
  detachMenuKeys();
  const screen = createMenuScreen('menu-overlay');

  const inner = document.createElement('div');
  inner.style.cssText = [
    'display:flex', 'flex-direction:column', 'align-items:center',
    'gap:var(--space-md)', 'max-width:640px', 'width:100%',
    'padding:var(--space-lg)',
  ].join(';');
  screen.appendChild(inner);

  // ── ASCII Logo ──
  const logo = document.createElement('pre');
  logo.setAttribute('aria-label', 'L T B');
  logo.style.cssText = [
    'color:var(--color-accent-cyan)',
    'font-size:clamp(9px,1.6vw,15px)',
    'line-height:1.3', 'margin:0',
    'text-align:center',
    'animation:fadeInUp 0.6s ease both',
    'white-space:pre',
  ].join(';');
  logo.textContent = [
    '██╗     ████████╗██████╗ ',
    '██║        ██╔══╝██╔══██╗',
    '██║        ██║   ██████╔╝',
    '██║        ██║   ██╔══██╗',
    '███████╗   ██║   ██████╔╝',
    '╚══════╝   ╚═╝   ╚═════╝ ',
  ].join('\n');
  inner.appendChild(logo);

  // ── Title ──
  const titleEl = document.createElement('div');
  titleEl.style.cssText = [
    'color:var(--color-text-primary)',
    'font-size:var(--font-size-lg)',
    'letter-spacing:6px',
    'text-transform:uppercase',
    'animation:fadeInUp 0.6s 0.1s ease both',
  ].join(';');
  titleEl.textContent = 'LICENSE TO BILL';
  inner.appendChild(titleEl);

  // ── Subtext (typewriter) ──
  const sub = document.createElement('div');
  sub.style.cssText = [
    'color:var(--color-text-secondary)',
    'font-size:var(--font-size-sm)',
    'min-height:1.4em',
    'margin-bottom:var(--space-xs)',
  ].join(';');
  inner.appendChild(sub);
  setTimeout(() => typeInto(sub, 'Das IT Asset Management Berater-Abenteuer', 38), 700);

  // ── Separator ──
  const sep = document.createElement('div');
  sep.style.cssText = 'width:100%;max-width:320px;border-top:1px solid var(--color-border);';
  inner.appendChild(sep);

  // ── Save banner (conditional) ──
  const save = window.Storage?.loadGame();
  if (save) {
    inner.appendChild(buildSaveBanner(save));
  }

  // ── Menu buttons ──
  const BUTTON_DEFS = [
    {
      label:   '▶  Neues Spiel',
      key:     '1',
      action:  () => startNewGame(screen),
    },
    {
      label:   '📂 Spiel laden',
      key:     '2',
      disabled: !save,
      action:  () => continueGame(screen, save),
    },
    {
      label:   '🏅 Achievements',
      key:     '3',
      action:  () => { detachMenuKeys(); window.Achievements?.renderAchievementsScreen(); },
    },
    {
      label:   '🏆 Hall of Shame',
      key:     '4',
      action:  () => { detachMenuKeys(); window.UI?.renderHallOfShame(); },
    },
    {
      label:   'ℹ️  Credits',
      key:     '5',
      action:  () => renderCredits(),
    },
    {
      label:   '🔄 Alles zurücksetzen',
      key:     '6',
      action:  () => confirmResetAll(),
    },
  ];

  const btnWrap = document.createElement('div');
  btnWrap.style.cssText = [
    'display:flex', 'flex-direction:column', 'gap:var(--space-sm)',
    'width:100%', 'max-width:320px',
  ].join(';');
  inner.appendChild(btnWrap);

  const allButtons = [];

  BUTTON_DEFS.forEach((def, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn animate-fadeInUp';
    btn.style.animationDelay = `${380 + i * 80}ms`;
    btn.style.textAlign = 'left';
    btn.style.paddingLeft = 'var(--space-md)';
    btn.style.position = 'relative';

    // Key hint badge (right-aligned, absolute)
    const hint = document.createElement('span');
    hint.textContent = def.key;
    hint.setAttribute('aria-hidden', 'true');
    hint.style.cssText = [
      'position:absolute', 'right:var(--space-sm)', 'top:50%',
      'transform:translateY(-50%)',
      'font-size:10px', 'color:var(--color-text-secondary)',
      'border:1px solid var(--color-border)', 'border-radius:2px',
      'padding:1px 5px', 'line-height:1.4',
    ].join(';');
    btn.appendChild(hint);
    btn.appendChild(document.createTextNode(def.label));

    if (def.disabled) {
      btn.disabled = true;
      btn.style.opacity = '0.35';
      btn.style.cursor = 'not-allowed';
    } else {
      btn.addEventListener('click', def.action);
    }
    allButtons.push(btn);
    btnWrap.appendChild(btn);
  });

  // ── Keyboard shortcuts hint ──
  const kbHint = document.createElement('div');
  kbHint.style.cssText = [
    'color:var(--color-text-secondary)', 'font-size:10px',
    'border-top:1px solid var(--color-border)', 'padding-top:var(--space-sm)',
    'text-align:center', 'width:100%', 'max-width:320px',
    'letter-spacing:0.5px',
  ].join(';');
  kbHint.textContent = '1–7: Option wählen  |  Enter: Neues Spiel  |  ESC: Menü';
  inner.appendChild(kbHint);

  // ── Version badge (bottom-right corner) ──
  const ver = document.createElement('div');
  ver.style.cssText = [
    'position:absolute', 'bottom:var(--space-md)', 'right:var(--space-md)',
    'color:var(--color-text-secondary)', 'font-size:10px',
  ].join(';');
  ver.textContent = 'v0.1-MVP';
  screen.appendChild(ver);

  attachMenuKeys(allButtons);
}

// ── Credits screen ────────────────────────────────────────

/** Renders a full-screen credits overlay with a slow scrolling text effect. */
function renderCredits() {
  detachMenuKeys();

  const screen = createMenuScreen('menu-credits', { center: false });
  screen.style.overflow = 'hidden';
  screen.style.justifyContent = 'flex-end';

  const CREDITS_LINES = [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    'CREDITS',
    'Greysuit & Partner Consulting GmbH',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    'Ein Spiel über die Menschen, die jeden Tag in',
    'Excel-Dateien aus dem Jahr 2009 wühlen.',
    '',
    'Entwickelt mit: Vanilla JS,',
    'einem Hauch Wahnsinn,',
    'und zu viel Kaffee.',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    'BESONDERER DANK',
    '',
    '— Allen Dieters dieser Welt',
    '— Kevin (es war nicht so gemeint)',
    '— HAL 9000 (Toner wurde nie nachgekauft)',
    '— Microsoft (ohne euch wären Audits',
    '  nur halb so spannend)',
    '— Ralf Steinbach (Ihr Protokoll war',
    '  sehr vollständig)',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    'EASTER EGG:',
    'Wenn du diese Credits liest,',
    'hast du zu viel Zeit.',
    '',
    'Dieter hat übrigens gerade wieder',
    'eine E-Mail geschickt.',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '[ GREYSUIT & PARTNER CONSULTING ]',
    '[ DELIVERING VALUE SINCE HEUTE ]',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '',
    '',
  ];

  // Scrolling text container
  const scroller = document.createElement('div');
  scroller.className = 'credits-scroller';
  scroller.style.cssText = [
    'display:flex', 'flex-direction:column', 'align-items:center',
    'gap:2px', 'width:100%', 'max-width:560px',
    'animation:creditsScroll 35s linear both',
    'padding-top:100vh',
    'padding-bottom:var(--space-xl)',
  ].join(';');

  CREDITS_LINES.forEach((line) => {
    const p = document.createElement('p');
    p.style.cssText = [
      'margin:0', 'padding:2px 0',
      'text-align:center', 'white-space:pre',
      line.startsWith('━') ? 'color:var(--color-border);' : '',
      line === 'CREDITS' || line === 'BESONDERER DANK' || line === 'EASTER EGG:'
        ? 'color:var(--color-accent-cyan);letter-spacing:4px;font-size:var(--font-size-sm);'
        : 'color:var(--color-text-secondary);font-size:var(--font-size-sm);',
      line.startsWith('[ GREYSUIT')
        ? 'color:var(--color-accent-amber);letter-spacing:2px;'
        : '',
    ].join('');

    if (line === '— Kevin (es war nicht so gemeint)') {
      p.innerHTML = '— <span id="credits-kevin" style="color:var(--color-accent-cyan);cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px;" title="Klick mich">Kevin</span> (es war nicht so gemeint)';
      setTimeout(() => {
        const kevinEl = document.getElementById('credits-kevin');
        if (kevinEl) {
          kevinEl.addEventListener('click', () => {
            const line = window.NPCs?.getRandomCatchphrase('kevin') ?? 'Kann ich das auch mit einer API lösen?';
            window.KeyboardController?.showToast(`💬 Kevin: "${line}"`, 'var(--color-accent-cyan)');
          });
        }
      }, 100);
    } else {
      p.textContent = line || '\u00A0';
    }

    scroller.appendChild(p);
  });

  screen.appendChild(scroller);

  // Close button (fixed, top-right)
  const closeBtn = document.createElement('button');
  closeBtn.className = 'choice-btn';
  closeBtn.textContent = '✕ Schließen';
  closeBtn.style.cssText = [
    'position:fixed', 'top:var(--space-md)', 'right:var(--space-md)',
    'z-index:2010', 'width:auto', 'padding:4px 14px', 'font-size:12px',
  ].join(';');
  closeBtn.addEventListener('click', () => {
    screen.remove();
    renderMainMenu();
  });
  screen.appendChild(closeBtn);

  // ESC also closes
  const esc = new AbortController();
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      screen.remove();
      esc.abort();
      renderMainMenu();
    }
  }, { signal: esc.signal });
}

// ── Boot hook ─────────────────────────────────────────────

/**
 * Called from main.js after all data has loaded.
 * Checks for an existing save and shows the appropriate entry screen.
 * @param {Object} config - Parsed config.json.
 */
function checkSaveAndStart(config) {
  _config = config;
  const save = window.Storage?.loadGame();
  if (save && save.currentProject) {
    showWelcomeBack(save);
  } else {
    renderMainMenu();
  }
}

// ── Exit confirmation ──────────────────────────────────────

/**
 * Shows a small confirmation dialog before returning to the main menu.
 * The current game state is saved first so the player can continue later.
 */
function confirmExitToMenu() {
  if (document.getElementById('exit-confirm-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'exit-confirm-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Spiel verlassen?');
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:3000',
    'display:flex', 'align-items:center', 'justify-content:center',
    'background:rgba(13,17,23,0.85)',
    'backdrop-filter:blur(4px)',
    '-webkit-backdrop-filter:blur(4px)',
    'animation:fadeIn 0.2s ease both',
  ].join(';');

  const card = document.createElement('div');
  card.style.cssText = [
    'background:var(--color-surface)',
    'border:1px solid var(--color-border)',
    'border-radius:var(--radius-lg)',
    'padding:var(--space-xl)',
    'max-width:360px', 'width:90vw',
    'display:flex', 'flex-direction:column',
    'align-items:center', 'gap:var(--space-md)',
    'text-align:center',
    'animation:levelUpCard 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
  ].join(';');

  card.innerHTML = `
    <div style="font-size:2rem;">🚪</div>
    <div style="font-size:var(--font-size-lg);color:var(--color-text-primary);">Zurück zum Menü?</div>
    <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);line-height:1.6;">
      Dein Fortschritt wird gespeichert.<br>Du kannst jederzeit weitermachen.
    </div>
  `;

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:var(--space-sm);width:100%;';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'choice-btn';
  cancelBtn.textContent = 'Weiterspielen';
  cancelBtn.style.flex = '1';
  cancelBtn.addEventListener('click', () => overlay.remove());

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'choice-btn';
  confirmBtn.textContent = '← Zum Menü';
  confirmBtn.style.cssText = [
    'flex:1',
    'border-color:var(--color-accent-red)',
    'color:var(--color-accent-red)',
  ].join(';');
  confirmBtn.addEventListener('click', () => {
    window.Storage?.saveGame(window.Engine?.GameState);
    overlay.remove();

    // Remove any open overlays from gameplay
    ['burnout-overlay', 'levelup-overlay', 'project-complete-overlay',
      'email-overlay', 'minigame-overlay', 'achievement-overlay'].forEach((id) => {
      document.getElementById(id)?.remove();
    });

    renderMainMenu();
  });

  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(confirmBtn);
  card.appendChild(btnRow);
  overlay.appendChild(card);
  document.getElementById('app').appendChild(overlay);

  // ESC = cancel
  const esc = new AbortController();
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { overlay.remove(); esc.abort(); }
  }, { signal: esc.signal });

  setTimeout(() => cancelBtn.focus(), 50);
}

// ── Public API ────────────────────────────────────────────

window.Menu = {
  renderMainMenu,
  renderCredits,
  checkSaveAndStart,
  confirmExitToMenu,
};
