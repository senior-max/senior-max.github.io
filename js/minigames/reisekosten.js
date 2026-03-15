/**
 * minigames/reisekosten.js
 * Expense report minigame for "License To Bill".
 * Player assigns 8 receipts to 4 categories within 90 seconds.
 * Depends on: engine.js (window.Engine), achievements.js (window.Achievements)
 */

// ── Data ──────────────────────────────────────────────────

/** @type {Array<{name:string, amount:string, readable:boolean, correct:string, hint?:string, isEasterEgg?:boolean}>} */
const RECEIPTS = [
  { name: 'DB Fernverkehr Frankfurt→Köln', amount: '€87,40',  readable: true,  correct: 'fahrt' },
  { name: 'Hotel Ibis Köln Messe',         amount: '€94,00',  readable: true,  correct: 'hotel' },
  { name: 'Taxi Hauptbahnhof→Kunde',       amount: '€23,50',  readable: true,  correct: 'fahrt' },
  { name: '???',                            amount: '€12,??',  readable: false, correct: 'verpflegung', hint: 'Sieht nach Kaffee aus. Oder Wein.' },
  { name: 'Mittagessen Gasthof Zur Post',  amount: '€18,90',  readable: true,  correct: 'verpflegung' },
  { name: '[UNLESERLICH]',                 amount: '€???,??', readable: false, correct: 'sonstiges',   hint: 'Großer Betrag. Sehr großer Betrag. Du erinnerst dich nicht.' },
  { name: 'Pizza Bella Italia',            amount: '€31,20',  readable: true,  correct: 'verpflegung', isEasterEgg: true },
  { name: 'Parkplatz Flughafen 3 Tage',   amount: '€45,00',  readable: true,  correct: 'fahrt' },
];

/** @type {Array<{id:string, label:string, emoji:string}>} */
const CATEGORIES = [
  { id: 'fahrt',       label: 'Fahrtkosten',  emoji: '🚗' },
  { id: 'hotel',       label: 'Übernachtung', emoji: '🏨' },
  { id: 'verpflegung', label: 'Verpflegung',  emoji: '🍽️' },
  { id: 'sonstiges',   label: 'Sonstiges',    emoji: '📎' },
];

// ── Module state ──────────────────────────────────────────

/** @type {(string|null)[]} Assigned category id per receipt index, null = unassigned. */
let assignments = [];
/** @type {number|null} Currently selected receipt index, or null. */
let selectedIndex = null;
let reisekostenTimerInterval = null;
let timeLeft = 90;
/** @type {Function|null} */
let onCompleteCallback = null;
/** @type {HTMLElement|null} */
let overlayEl = null;

// ── DOM builders ──────────────────────────────────────────

/**
 * Creates the full overlay shell with title, timer, and two-column layout.
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
    'border:2px solid var(--color-accent-amber)',
  ].join(';');

  overlay.innerHTML = `
    <div style="font-size:var(--font-size-xl);text-align:center;">🧾 Reisekostenabrechnung</div>
    <div style="color:var(--color-text-secondary);font-size:var(--font-size-sm);text-align:center;">
      Ordne jeden Beleg der richtigen Kategorie zu. Du hast 90 Sekunden. Finance schaut zu.
    </div>
    <div id="rk-timer-wrapper" style="width:100%;max-width:860px;">
      <div style="display:flex;justify-content:space-between;font-size:var(--font-size-sm);margin-bottom:var(--space-xs);">
        <span>⏱ Zeit</span><span id="rk-timer-label">90s</span>
      </div>
      <div style="height:8px;background:var(--color-border);border-radius:var(--radius-sm);overflow:hidden;">
        <div id="rk-timer-bar" style="height:100%;width:100%;background:var(--color-accent-amber);border-radius:var(--radius-sm);transition:width 1s linear,background 0.3s;"></div>
      </div>
    </div>
    <div style="display:flex;gap:var(--space-lg);width:100%;max-width:860px;align-items:flex-start;flex-wrap:wrap;">
      <div id="rk-receipts" style="flex:1;min-width:260px;display:flex;flex-direction:column;gap:var(--space-sm);">
        <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:1px;margin-bottom:var(--space-xs);">Belege</div>
      </div>
      <div id="rk-categories" style="flex:1;min-width:260px;display:flex;flex-direction:column;gap:var(--space-sm);">
        <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:1px;margin-bottom:var(--space-xs);">Kategorien</div>
      </div>
    </div>
    <div id="rk-status" style="font-size:var(--font-size-sm);color:var(--color-accent-amber);min-height:24px;text-align:center;font-style:italic;"></div>
  `;
  return overlay;
}

/**
 * Builds a single receipt card element.
 * @param {typeof RECEIPTS[0]} receipt
 * @param {number} index
 * @returns {HTMLElement}
 */
function buildReceiptCard(receipt, index) {
  const card = document.createElement('div');
  card.id = `rk-receipt-${index}`;
  card.style.cssText = [
    'background:var(--color-surface-elevated)',
    'border:1px solid var(--color-border)',
    'border-radius:var(--radius-md)',
    'padding:var(--space-sm) var(--space-md)',
    'cursor:pointer',
    'transition:border-color 0.2s,opacity 0.2s',
    'display:flex',
    'justify-content:space-between',
    'align-items:center',
    'gap:var(--space-sm)',
  ].join(';');

  const nameEl = document.createElement('div');
  nameEl.style.cssText = receipt.readable
    ? 'font-size:var(--font-size-sm);color:var(--color-text-primary);'
    : 'font-size:var(--font-size-sm);color:var(--color-text-secondary);filter:blur(1.5px);user-select:none;';
  nameEl.textContent = receipt.name;

  const amountEl = document.createElement('div');
  amountEl.style.cssText = 'font-size:var(--font-size-sm);color:var(--color-accent-amber);white-space:nowrap;';
  amountEl.textContent = receipt.amount;

  card.appendChild(nameEl);
  card.appendChild(amountEl);

  if (receipt.hint) {
    const hintEl = document.createElement('div');
    hintEl.style.cssText = 'font-size:10px;color:var(--color-text-secondary);font-style:italic;margin-top:2px;width:100%;';
    hintEl.textContent = receipt.hint;
    card.style.flexWrap = 'wrap';
    card.appendChild(hintEl);
  }

  card.addEventListener('click', () => onReceiptClick(index));
  return card;
}

/**
 * Builds a single category drop-zone element.
 * @param {typeof CATEGORIES[0]} cat
 * @returns {HTMLElement}
 */
function buildCategoryZone(cat) {
  const zone = document.createElement('div');
  zone.id = `rk-cat-${cat.id}`;
  zone.style.cssText = [
    'background:var(--color-surface-elevated)',
    'border:1px solid var(--color-border)',
    'border-radius:var(--radius-md)',
    'padding:var(--space-md)',
    'cursor:pointer',
    'transition:border-color 0.2s,background 0.2s',
    'min-height:64px',
  ].join(';');

  const header = document.createElement('div');
  header.style.cssText = 'font-size:var(--font-size-sm);margin-bottom:var(--space-xs);display:flex;justify-content:space-between;align-items:center;';
  header.innerHTML = `<span>${cat.emoji} ${cat.label}</span><span id="rk-cat-count-${cat.id}" style="color:var(--color-text-secondary);font-size:10px;"></span>`;

  const items = document.createElement('div');
  items.id = `rk-cat-items-${cat.id}`;
  items.style.cssText = 'display:flex;flex-direction:column;gap:4px;margin-top:var(--space-xs);';

  zone.appendChild(header);
  zone.appendChild(items);
  zone.addEventListener('click', () => onCategoryClick(cat.id));
  return zone;
}

// ── Interaction ───────────────────────────────────────────

/**
 * Handles a receipt card click — selects or deselects it.
 * @param {number} index
 */
function onReceiptClick(index) {
  if (assignments[index] !== null) return;

  if (selectedIndex === index) {
    selectedIndex = null;
    updateReceiptStyles();
    setStatus('');
    return;
  }

  selectedIndex = index;
  updateReceiptStyles();
  setStatus(`"${RECEIPTS[index].name}" ausgewählt — wähle jetzt eine Kategorie.`);
}

/**
 * Handles a category zone click — assigns the selected receipt.
 * @param {string} categoryId
 */
function onCategoryClick(categoryId) {
  if (selectedIndex === null) {
    setStatus('Wähle zuerst einen Beleg aus.');
    return;
  }

  const receipt = RECEIPTS[selectedIndex];
  checkEasterEgg(selectedIndex, categoryId);

  assignments[selectedIndex] = categoryId;
  renderAssignedItem(selectedIndex, categoryId);

  const card = overlayEl.querySelector(`#rk-receipt-${selectedIndex}`);
  if (card) {
    card.style.opacity = '0.35';
    card.style.cursor = 'default';
    card.style.borderColor = 'var(--color-accent-green)';
  }

  updateCategoryCount(categoryId);
  selectedIndex = null;
  updateReceiptStyles();
  setStatus(`"${receipt.name}" → ${CATEGORIES.find(c => c.id === categoryId).label} ✓`);

  if (assignments.every(a => a !== null)) finish();
}

/**
 * Checks and fires the pizza easter egg if applicable.
 * @param {number} index
 * @param {string} categoryId
 */
function checkEasterEgg(index, categoryId) {
  if (RECEIPTS[index].isEasterEgg && categoryId === 'sonstiges') {
    window.Achievements?.checkTrigger('minigame_pizza_submitted');
  }
}

/**
 * Adds a small label for an assigned receipt inside the category zone.
 * @param {number} receiptIndex
 * @param {string} categoryId
 */
function renderAssignedItem(receiptIndex, categoryId) {
  const container = overlayEl.querySelector(`#rk-cat-items-${categoryId}`);
  if (!container) return;

  const tag = document.createElement('div');
  tag.style.cssText = 'font-size:10px;color:var(--color-text-secondary);padding:2px var(--space-xs);background:var(--color-border);border-radius:var(--radius-sm);display:flex;justify-content:space-between;';
  tag.innerHTML = `<span>${RECEIPTS[receiptIndex].name}</span><span style="color:var(--color-accent-green);">✓</span>`;
  container.appendChild(tag);
}

/**
 * Updates the item count badge on a category zone.
 * @param {string} categoryId
 */
function updateCategoryCount(categoryId) {
  const count = assignments.filter(a => a === categoryId).length;
  const el = overlayEl.querySelector(`#rk-cat-count-${categoryId}`);
  if (el) el.textContent = count > 0 ? `${count} Beleg${count > 1 ? 'e' : ''}` : '';
}

/**
 * Updates receipt card highlight based on current selectedIndex.
 */
function updateReceiptStyles() {
  RECEIPTS.forEach((_, i) => {
    const card = overlayEl?.querySelector(`#rk-receipt-${i}`);
    if (!card || assignments[i] !== null) return;
    card.style.borderColor = i === selectedIndex
      ? 'var(--color-accent-amber)'
      : 'var(--color-border)';
  });

  CATEGORIES.forEach(cat => {
    const zone = overlayEl?.querySelector(`#rk-cat-${cat.id}`);
    if (!zone) return;
    zone.style.borderColor = selectedIndex !== null
      ? 'var(--color-accent-cyan)'
      : 'var(--color-border)';
    zone.style.background = selectedIndex !== null
      ? 'rgba(88,166,255,0.06)'
      : 'var(--color-surface-elevated)';
  });
}

/**
 * Sets the status hint line below the layout.
 * @param {string} text
 */
function setStatus(text) {
  const el = overlayEl?.querySelector('#rk-status');
  if (el) el.textContent = text;
}

// ── Timer ─────────────────────────────────────────────────

/** Starts the 90-second countdown. */
function startTimer() {
  timeLeft = 90;
  reisekostenTimerInterval = setInterval(() => {
    timeLeft -= 1;
    updateTimerBar(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(reisekostenTimerInterval);
      finish();
    }
  }, 1000);
}

/**
 * Updates the visual timer bar. Turns red at ≤20s.
 * @param {number} seconds
 */
function updateTimerBar(seconds) {
  const bar   = overlayEl?.querySelector('#rk-timer-bar');
  const label = overlayEl?.querySelector('#rk-timer-label');
  if (!bar || !label) return;

  bar.style.width = `${(seconds / 90) * 100}%`;
  label.textContent = `${seconds}s`;

  if (seconds <= 20) {
    bar.style.background = 'var(--color-accent-red)';
    label.style.color    = 'var(--color-accent-red)';
  }
}

// ── Scoring ───────────────────────────────────────────────

/**
 * Calculates the percentage of correctly categorised receipts.
 * Unassigned receipts count as wrong.
 * @returns {number} Integer 0-100.
 */
function calculateScore() {
  const correct = RECEIPTS.reduce((n, receipt, i) => {
    return assignments[i] === receipt.correct ? n + 1 : n;
  }, 0);
  return Math.round((correct / RECEIPTS.length) * 100);
}

/**
 * Returns the result message and stat effects for a given score.
 * @param {number} score
 * @returns {{ message: string, effects: Object }}
 */
function getScoreResult(score) {
  if (score === 100) {
    return {
      message: 'Perfektion. Finance wird das trotzdem ablehnen.',
      effects: { kompetenz: 3, prestige: 2 },
    };
  }
  if (score >= 75) {
    return {
      message: 'Solide. 1–2 Belege werden "zur Klärung" zurückgehalten.',
      effects: { kompetenz: 1 },
    };
  }
  return {
    message: 'Finance ruft an. Es ist kein nettes Gespräch.',
    effects: { burnout: 8 },
  };
}

// ── Result screen ─────────────────────────────────────────

/**
 * Replaces the game layout with the result summary and a continue button.
 * @param {number} score
 */
function showResult(score) {
  const { message, effects } = getScoreResult(score);
  window.Engine?.applyEffects(effects);

  const color = score === 100
    ? 'var(--color-accent-green)'
    : score >= 75
      ? 'var(--color-accent-amber)'
      : 'var(--color-accent-red)';

  const receiptsEl   = overlayEl.querySelector('#rk-receipts');
  const categoriesEl = overlayEl.querySelector('#rk-categories');
  const statusEl     = overlayEl.querySelector('#rk-status');
  if (receiptsEl)   receiptsEl.remove();
  if (categoriesEl) categoriesEl.remove();
  if (statusEl)     statusEl.remove();

  const result = document.createElement('div');
  result.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:var(--space-lg);padding:var(--space-xl) 0;text-align:center;';
  result.innerHTML = `
    <div style="font-size:var(--font-size-xl);color:${color};">${score}%</div>
    <div style="font-size:var(--font-size-lg);">
      ${score === 100 ? '🏆 Tadellos' : score >= 75 ? '📋 Akzeptabel' : '📞 Finance wartet'}
    </div>
    <div style="color:var(--color-text-secondary);font-size:var(--font-size-sm);max-width:480px;line-height:1.7;font-style:italic;">
      ${message}
    </div>
  `;

  const btn = document.createElement('button');
  btn.className = 'choice-btn';
  btn.textContent = 'Abrechnung einreichen';
  btn.style.cssText = 'width:240px;margin-top:var(--space-md);';
  btn.addEventListener('click', () => cleanup(score));
  result.appendChild(btn);

  overlayEl.appendChild(result);
}

// ── Lifecycle ─────────────────────────────────────────────

/**
 * Stops the timer, calculates the score, and shows the result screen.
 */
function finish() {
  clearInterval(reisekostenTimerInterval);
  const score = calculateScore();
  showResult(score);
}

/**
 * Removes the overlay and calls the completion callback.
 * @param {number} score
 */
function cleanup(score) {
  overlayEl?.remove();
  overlayEl      = null;
  reisekostenTimerInterval  = null;
  selectedIndex  = null;
  assignments    = [];

  if (typeof onCompleteCallback === 'function') {
    onCompleteCallback(score);
  }
}

// ── Public API ────────────────────────────────────────────

/**
 * Renders the expense report minigame overlay and starts the countdown.
 * @param {function(number): void} onComplete - Called with final score (0-100) when done.
 */
function start(onComplete) {
  onCompleteCallback = onComplete;
  assignments = new Array(RECEIPTS.length).fill(null);
  selectedIndex = null;

  overlayEl = buildShell();
  document.getElementById('app').appendChild(overlayEl);

  const receiptsContainer   = overlayEl.querySelector('#rk-receipts');
  const categoriesContainer = overlayEl.querySelector('#rk-categories');

  RECEIPTS.forEach((r, i) => receiptsContainer.appendChild(buildReceiptCard(r, i)));
  CATEGORIES.forEach(cat => categoriesContainer.appendChild(buildCategoryZone(cat)));

  startTimer();
}

window.ReisekostenMinigame = { start };
