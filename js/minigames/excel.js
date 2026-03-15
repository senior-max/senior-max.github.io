/**
 * minigames/excel.js
 * Excel audit minigame for scene d_03 of "Projekt Dieter".
 * Player classifies 20 software items in 60 seconds.
 * Depends on: engine.js (window.Engine), achievements.js (window.Achievements)
 */

// ── Software data ─────────────────────────────────────────

/**
 * @typedef {Object} SoftwareItem
 * @property {string} name
 * @property {string} vendor
 * @property {string} version
 * @property {string} hint       - Shown on the card as context.
 * @property {string} correct    - Expected answer: 'compliant'|'non-compliant'|'egal'
 */

/** @type {SoftwareItem[]} */
const SOFTWARE_ITEMS = [
  { name: 'Microsoft Office 2019',    vendor: 'Microsoft',  version: '2019',    hint: 'Lizenz vorhanden ✓',                        correct: 'compliant' },
  { name: 'Microsoft Office 2021',    vendor: 'Microsoft',  version: '2021',    hint: 'Anzahl unbekannt',                          correct: 'non-compliant' },
  { name: 'Windows 10 Pro',           vendor: 'Microsoft',  version: '10',      hint: 'x340 Installationen',                       correct: 'compliant' },
  { name: 'Windows 11',               vendor: 'Microsoft',  version: '11',      hint: 'x12, warum auch immer',                     correct: 'non-compliant' },
  { name: 'Adobe Acrobat',            vendor: 'Adobe',      version: '??',      hint: 'Keine Lizenz gefunden',                     correct: 'non-compliant' },
  { name: 'Zoom Pro',                 vendor: 'Zoom',       version: '??',      hint: 'x3 Accounts, ~40 Nutzer',                   correct: 'non-compliant' },
  { name: 'AutoCAD 2015',             vendor: 'Autodesk',   version: '2015',    hint: 'Trial? Vielleicht?',                        correct: 'non-compliant' },
  { name: 'Slack Premium',            vendor: 'Slack',      version: '??',      hint: 'x2 bezahlt, Rest kostenlos',                correct: 'non-compliant' },
  { name: 'Notepad++',                vendor: 'Open Source','version': '8.x',   hint: 'GPL lizenziert ✓',                          correct: 'egal' },
  { name: 'VLC Media Player',         vendor: 'VideoLAN',   version: '3.x',     hint: 'Open Source ✓',                             correct: 'egal' },
  { name: 'WinRAR',                   vendor: 'RARLAB',     version: '6.x',     hint: 'Jeder hat\'s, keiner hat\'s gekauft',       correct: 'non-compliant' },
  { name: '7-Zip',                    vendor: 'Open Source','version': '22.x',  hint: 'LGPL lizenziert ✓',                         correct: 'egal' },
  { name: 'Dropbox Business',         vendor: 'Dropbox',    version: '??',      hint: 'x5 Business, Rest privat?',                 correct: 'non-compliant' },
  { name: 'ProShield 2017',           vendor: 'ProShield',  version: '2017',    hint: 'Abgelaufen seit 2019',                      correct: 'non-compliant' },
  { name: 'SAP GUI',                  vendor: 'SAP',        version: '??',      hint: 'Keine Ahnung. Literally.',                  correct: 'non-compliant' },
  { name: 'Oracle Java SE',           vendor: 'Oracle',     version: '11',      hint: 'Achtung: kostenpflichtig seit 2019!',        correct: 'non-compliant' },
  { name: 'TeamViewer',               vendor: 'TeamViewer', version: '15',      hint: 'Lizenz x2 PCs, genutzt auf x15',            correct: 'non-compliant' },
  { name: 'Google Chrome',            vendor: 'Google',     version: '??',      hint: 'Kostenlos zur Nutzung',                     correct: 'egal' },
  { name: 'FileZilla',                vendor: 'Open Source','version': '3.x',   hint: 'GPL lizenziert ✓',                          correct: 'egal' },
  { name: 'Unbekannte Software v3.2.1', vendor: '???',      version: '3.2.1',   hint: 'Kein Vendor, kein Name, kein Plan',         correct: 'non-compliant' },
];

// ── Module state ──────────────────────────────────────────

/** @type {(string|null)[]} Player answers indexed by SOFTWARE_ITEMS position. */
let answers = [];
let excelTimerInterval = null;
let timeLeft = 60;
/** @type {Function|null} */
let onCompleteCallback = null;
/** @type {HTMLElement|null} */
let overlayEl = null;

// ── DOM builders ──────────────────────────────────────────

/**
 * Creates the outer overlay shell with title, subtitle, and timer bar.
 * @returns {HTMLElement}
 */
function buildShell() {
  const overlay = document.createElement('div');
  overlay.className = 'minigame-overlay';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:2000',
    'background:var(--color-surface)', 'overflow-y:auto',
    'display:flex', 'flex-direction:column', 'align-items:center',
    'padding:var(--space-lg)', 'gap:var(--space-md)',
    'border:2px solid var(--color-accent-cyan)',
  ].join(';');

  overlay.innerHTML = `
    <div style="font-size:var(--font-size-xl);text-align:center;">📊 Software-Inventur — Acme Corp</div>
    <div style="color:var(--color-text-secondary);font-size:var(--font-size-sm);text-align:center;">
      Klassifiziere jede Software. Du hast 60 Sekunden. Dieter schaut zu.
    </div>
    <div id="mg-timer-wrapper" style="width:100%;max-width:720px;">
      <div style="display:flex;justify-content:space-between;font-size:var(--font-size-sm);margin-bottom:var(--space-xs);">
        <span>⏱ Zeit</span>
        <span id="mg-timer-label">60s</span>
      </div>
      <div style="height:8px;background:var(--color-border);border-radius:var(--radius-sm);overflow:hidden;">
        <div id="mg-timer-bar" style="height:100%;width:100%;background:var(--color-accent-cyan);border-radius:var(--radius-sm);transition:width 1s linear,background 0.3s;"></div>
      </div>
    </div>
    <div id="mg-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:var(--space-sm);width:100%;max-width:960px;"></div>
  `;
  return overlay;
}

/**
 * Builds a single software classification card.
 * @param {SoftwareItem} item
 * @param {number} index
 * @returns {HTMLElement}
 */
function buildCard(item, index) {
  const card = document.createElement('div');
  card.id = `mg-card-${index}`;
  card.style.cssText = [
    'background:var(--color-surface-elevated)', 'border:1px solid var(--color-border)',
    'border-radius:var(--radius-md)', 'padding:var(--space-md)',
    'display:flex', 'flex-direction:column', 'gap:var(--space-xs)',
  ].join(';');

  const header = document.createElement('div');
  header.style.cssText = 'font-size:var(--font-size-sm);font-weight:bold;color:var(--color-text-primary);';
  header.textContent = item.name;

  const meta = document.createElement('div');
  meta.style.cssText = 'font-size:10px;color:var(--color-text-secondary);';
  meta.textContent = `${item.vendor} · v${item.version}`;

  const hint = document.createElement('div');
  hint.style.cssText = 'font-size:10px;color:var(--color-accent-amber);font-style:italic;';
  hint.textContent = item.hint;

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:var(--space-xs);margin-top:var(--space-xs);';

  [
    { label: '✅ Compliant',     value: 'compliant',     active: 'var(--color-accent-green)' },
    { label: '❌ Non-Compliant', value: 'non-compliant', active: 'var(--color-accent-red)' },
    { label: '🤷 Egal',         value: 'egal',           active: 'var(--color-accent-amber)' },
  ].forEach(({ label, value, active }) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = label;
    btn.style.cssText = 'flex:1;padding:var(--space-xs);font-size:10px;';
    btn.addEventListener('click', () => {
      selectAnswer(index, value, active, card, btnRow);
    });
    btnRow.appendChild(btn);
  });

  card.appendChild(header);
  card.appendChild(meta);
  card.appendChild(hint);
  card.appendChild(btnRow);
  return card;
}

/**
 * Populates #mg-grid with all 20 software cards.
 */
function buildGrid() {
  const grid = overlayEl.querySelector('#mg-grid');
  SOFTWARE_ITEMS.forEach((item, index) => {
    grid.appendChild(buildCard(item, index));
  });
}

// ── Interaction ───────────────────────────────────────────

/**
 * Highlights the selected button, dims others, and records the answer.
 * @param {number}      index  - SOFTWARE_ITEMS index.
 * @param {string}      value  - Answer value.
 * @param {string}      color  - Active highlight color (CSS value).
 * @param {HTMLElement} card
 * @param {HTMLElement} btnRow
 */
function selectAnswer(index, value, color, card, btnRow) {
  answers[index] = value;
  card.style.borderColor = color;

  btnRow.querySelectorAll('button').forEach((btn) => {
    const isActive = btn.textContent.includes(
      value === 'compliant' ? '✅' : value === 'non-compliant' ? '❌' : '🤷',
    );
    btn.style.opacity = isActive ? '1' : '0.35';
    btn.style.borderColor = isActive ? color : '';
  });

  if (answers.filter(Boolean).length === SOFTWARE_ITEMS.length) {
    finish();
  }
}

// ── Timer ─────────────────────────────────────────────────

/**
 * Starts the 60-second countdown and updates the timer bar each second.
 */
function startTimer() {
  timeLeft = 60;
  excelTimerInterval = setInterval(() => {
    timeLeft -= 1;
    updateTimerBar(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(excelTimerInterval);
      finish();
    }
  }, 1000);
}

/**
 * Updates the visual timer bar and label.
 * Turns red when 15 or fewer seconds remain.
 * @param {number} seconds
 */
function updateTimerBar(seconds) {
  const bar   = overlayEl.querySelector('#mg-timer-bar');
  const label = overlayEl.querySelector('#mg-timer-label');
  if (!bar || !label) return;

  bar.style.width = `${(seconds / 60) * 100}%`;
  label.textContent = `${seconds}s`;

  if (seconds <= 15) {
    bar.style.background = 'var(--color-accent-red)';
    label.style.color = 'var(--color-accent-red)';
  }
}

// ── Scoring ───────────────────────────────────────────────

/**
 * Calculates the percentage of correct classifications.
 * Unanswered items count as wrong.
 * @returns {number} Integer 0-100.
 */
function calculateScore() {
  const correct = SOFTWARE_ITEMS.reduce((count, item, i) => {
    return answers[i] === item.correct ? count + 1 : count;
  }, 0);
  return Math.round((correct / SOFTWARE_ITEMS.length) * 100);
}

/**
 * Returns a witty result comment based on the player's score.
 * @param {number} score
 * @returns {string}
 */
function getResultComment(score) {
  if (score >= 80) return 'Steinbach ist fast beeindruckt. Er zeigt es nicht, aber man ahnt es.';
  if (score >= 60) return 'Solide. Du hast mehr gewusst als Dieter. Die Latte war niedrig, aber du hast sie übersprungen.';
  if (score >= 50) return 'Knapp bestanden. Das Excel-Dokument aus 2009 hätte es auch so gut gemacht.';
  return 'Dieter sieht dich mit großen Augen an. Er hatte mehr erwartet. Das ist traurig, denn Dieter erwartet nie viel.';
}

// ── Result screen ─────────────────────────────────────────

/**
 * Replaces the grid with a result summary and "Weiter" button.
 * Applies stat effects and unlocks achievements.
 * @param {number} score - Integer 0-100.
 */
function showResult(score) {
  const isGood   = score >= 80;
  const isMedium = score >= 50 && score < 80;
  const color    = isGood ? 'var(--color-accent-green)' : isMedium ? 'var(--color-accent-amber)' : 'var(--color-accent-red)';

  if (isGood) {
    window.Engine?.applyEffects({ kompetenz: 5 });
    window.Achievements?.checkTrigger('minigame_excel_score_80');
  } else if (isMedium) {
    window.Engine?.applyEffects({ kompetenz: 2 });
  } else {
    window.Engine?.applyEffects({ kompetenz: -2, burnout: 5 });
  }

  const grid = overlayEl.querySelector('#mg-grid');
  grid.innerHTML = `
    <div style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center;gap:var(--space-lg);padding:var(--space-xl) 0;text-align:center;">
      <div style="font-size:var(--font-size-xl);color:${color};">${score}%</div>
      <div style="font-size:var(--font-size-lg);color:var(--color-text-primary);">
        ${isGood ? '📊 Excel-Krieger' : isMedium ? '📋 Ausreichend' : '😬 Verbesserungswürdig'}
      </div>
      <div style="color:var(--color-text-secondary);font-size:var(--font-size-sm);max-width:480px;line-height:1.7;font-style:italic;">
        ${getResultComment(score)}
      </div>
    </div>
  `;

  const btn = document.createElement('button');
  btn.className = 'choice-btn';
  btn.textContent = 'Weiter';
  btn.style.cssText = 'width:200px;margin-top:var(--space-md);';
  btn.addEventListener('click', () => cleanup(score));
  grid.firstElementChild.appendChild(btn);
}

// ── Lifecycle ─────────────────────────────────────────────

/**
 * Removes the overlay and invokes the completion callback.
 * @param {number} score
 */
function cleanup(score) {
  clearInterval(excelTimerInterval);
  overlayEl?.remove();
  overlayEl = null;
  excelTimerInterval = null;
  answers = [];

  if (typeof onCompleteCallback === 'function') {
    onCompleteCallback(score);
  }
}

/**
 * Stops the timer, calculates the score, and shows the result screen.
 */
function finish() {
  clearInterval(excelTimerInterval);
  const score = calculateScore();
  showResult(score);
}

// ── Public API ────────────────────────────────────────────

/**
 * Renders the minigame overlay and starts the countdown.
 * @param {function(number): void} onComplete - Called with the final score (0-100) on exit.
 */
function start(onComplete) {
  onCompleteCallback = onComplete;
  answers = new Array(SOFTWARE_ITEMS.length).fill(null);

  overlayEl = buildShell();
  document.getElementById('app').appendChild(overlayEl);
  buildGrid();
  startTimer();
}

/**
 * Records an answer for a given item index.
 * Intended for programmatic use; UI clicks call selectAnswer() directly.
 * @param {number} itemIndex
 * @param {'compliant'|'non-compliant'|'egal'} answer
 */
function submitAnswer(itemIndex, answer) {
  if (itemIndex < 0 || itemIndex >= SOFTWARE_ITEMS.length) return;
  answers[itemIndex] = answer;
  if (answers.filter(Boolean).length === SOFTWARE_ITEMS.length) finish();
}

window.ExcelMinigame = { start, submitAnswer, finish };
