/**
 * main.js
 * Entry point for "License To Bill".
 * Bootstraps all data modules, then hands control to Menu.checkSaveAndStart().
 */

// ── Console branding ──────────────────────────────────────

console.log(
  '%c LICENSE TO BILL v0.1-MVP ',
  'background:#161b22;color:#58a6ff;font-family:monospace;font-size:14px;padding:8px;border:1px solid #58a6ff',
);
console.log(
  '%c Greysuit & Partner Consulting — Delivering Value Since Heute ',
  'color:#8b949e;font-family:monospace',
);

// ── Environment checks ────────────────────────────────────

/**
 * Returns true when localStorage is readable and writable.
 * May return false in private-browsing modes or when storage is full.
 * @returns {boolean}
 */
function isLocalStorageAvailable() {
  try {
    const key = '__ltb_test__';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

if (!isLocalStorageAvailable()) {
  console.warn(
    '[LicenseToBill] localStorage ist nicht verfügbar. ' +
    'Spielstände werden nicht gespeichert (privater Modus?).',
  );
}

if (typeof fetch !== 'function') {
  document.addEventListener('DOMContentLoaded', () => {
    document.body.innerHTML = [
      '<div style="',
      'display:flex;align-items:center;justify-content:center;',
      'min-height:100vh;background:#0d1117;font-family:monospace;',
      'color:#f85149;font-size:16px;text-align:center;padding:32px;">',
      '⚠ Dein Browser ist leider zu alt für dieses Spiel.<br><br>',
      'Bitte verwende einen aktuellen Browser (Chrome, Firefox, Safari, Edge).',
      '</div>',
    ].join('');
  });
}

// ── Loading screen ────────────────────────────────────────

/**
 * Fades out and removes the loading screen that is rendered inline in index.html.
 * Called once the boot sequence has finished successfully.
 */
function dismissLoadingScreen() {
  const screen = document.getElementById('loading-screen');
  if (!screen) return;
  screen.classList.add('fade-out');
  screen.addEventListener('transitionend', () => screen.remove(), { once: true });
}

// ── Global error handler ──────────────────────────────────

/**
 * Displays a friendly error message in #story-text as a last resort.
 * @param {string} message - Human-readable description of what went wrong.
 * @param {Error} [error] - Optional original error for console output.
 */
function showFatalError(message, error) {
  if (error) console.error('[LicenseToBill]', error);

  const storyEl = document.getElementById('story-text');
  if (!storyEl) return;

  storyEl.innerHTML = `
    <span style="color:var(--color-accent-red);">⚠ Fehler</span><br><br>
    ${message}<br><br>
    <span style="color:var(--color-text-secondary);font-size:var(--font-size-sm);">
      Öffne die Browser-Konsole für Details.
    </span>
  `;
}

window.addEventListener('error', (event) => {
  showFatalError(
    'Ein unerwarteter Fehler ist aufgetreten. Das Spiel konnte nicht fortgesetzt werden.',
    event.error,
  );
});

window.addEventListener('unhandledrejection', (event) => {
  showFatalError(
    'Eine Ressource konnte nicht geladen werden. Stelle sicher, dass du die Datei direkt im Browser öffnest.',
    event.reason,
  );
});

// ── Project loader ────────────────────────────────────────

/**
 * Fetches a project JSON file and starts the game at the specified scene.
 * When no sceneId is given, the project's first scene is used (new game behaviour).
 * Exposed on window so Menu and other modules can call it after boot.
 *
 * @param {string} projectId - Must match a filename in /data/stories/.
 * @param {string|null} [startSceneId] - Optional scene to resume at.
 * @returns {Promise<void>}
 */
async function startProject(projectId, startSceneId = null) {
  const response = await fetch(`/data/stories/${projectId}.json`);

  if (!response.ok) {
    throw new Error(`Projekt "${projectId}" nicht gefunden (HTTP ${response.status})`);
  }

  const projectData = await response.json();

  if (!projectData.scenes || projectData.scenes.length === 0) {
    throw new Error(`Projekt "${projectId}" enthält keine Szenen.`);
  }

  const sceneId = startSceneId ?? projectData.scenes[0].id;

  window.Engine.GameState.currentProject = projectData.id;
  window.Engine.loadScene(sceneId, projectData);
}

window.startProject = startProject;

// ── Bootstrap ─────────────────────────────────────────────

/**
 * Main bootstrap sequence. Runs after the DOM is ready.
 * Loads all static data in parallel, then hands control to the main menu.
 * Engine initialisation and stat bars are set up by menu.js when the
 * player actually starts or continues a game.
 */
async function boot() {
  try {
    const [configResponse] = await Promise.all([
      fetch('/data/config.json'),
      NPCs.loadNPCs(),
      Achievements.init(),
    ]);

    if (!configResponse.ok) {
      throw new Error(`config.json nicht geladen (HTTP ${configResponse.status})`);
    }

    const config = await configResponse.json();
    window._LTB_CONFIG = config;

    KeyboardController.init();
    Sound.init();
    dismissLoadingScreen();
    Menu.checkSaveAndStart(config);
  } catch (err) {
    dismissLoadingScreen();
    showFatalError(
      `Das Spiel konnte nicht gestartet werden: ${err.message}`,
      err,
    );
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const domReadyMs = Math.round(performance.now());
  const domNodes   = document.querySelectorAll('*').length;
  console.log(
    `%c [LTB Perf] DOM ready in ${domReadyMs}ms · ${domNodes} nodes on start screen`,
    'color:#3fb950;font-family:monospace;font-size:11px;',
  );
  boot();
});
