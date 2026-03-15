/**
 * email.js
 * E-mail inbox system for "License To Bill".
 * Renders a full-screen inbox phase between story projects.
 * Depends on: engine.js (window.Engine), achievements.js (window.Achievements),
 *             storage.js (window.Storage)
 */

const MAX_ANSWERS = 3;

// ── Module state ──────────────────────────────────────────

/** @type {Object[]} All email definitions fetched from emails.json. */
let allEmails = [];

/** @type {Object[]} Emails selected for the current inbox session. */
let currentInbox = [];

/** @type {number} Emails answered this session. */
let answeredCount = 0;

/** @type {number} Emails ignored this session. */
let ignoredCount = 0;

/** @type {Set<string>} Ids of emails interacted with this session. */
const interactedIds = new Set();

// ── Data loading ──────────────────────────────────────────

/**
 * Fetches email definitions from /data/emails.json.
 * Idempotent — skips the fetch if data is already loaded.
 * @returns {Promise<void>}
 */
async function loadEmails() {
  if (allEmails.length > 0) return;
  try {
    const res = await fetch('/data/emails.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allEmails = await res.json();
  } catch (e) {
    console.warn('[Email] Failed to load emails.json:', e);
    allEmails = [];
  }
}

// ── Inbox generation ──────────────────────────────────────

/**
 * Shuffles an array in place using Fisher-Yates.
 * @template T
 * @param {T[]} arr
 * @returns {T[]}
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Selects 12 emails for the inbox session.
 * Always includes e02 (Müller-Brandt mandatory) and e01 or e13 for Dieter projects.
 * @param {string} projectId
 * @returns {Object[]}
 */
function generateInbox(projectId) {
  answeredCount = 0;
  ignoredCount = 0;
  interactedIds.clear();

  const mandatory = allEmails.filter(e => e.id === 'e02');
  const isDieter  = projectId === 'projekt_dieter';
  const dieterEmail = allEmails.find(e => e.id === (isDieter ? 'e13' : 'e01'));
  if (dieterEmail) mandatory.push(dieterEmail);

  const mandatoryIds = new Set(mandatory.map(e => e.id));
  const pool = shuffle(allEmails.filter(e => !mandatoryIds.has(e.id)));
  const filler = pool.slice(0, 12 - mandatory.length);

  currentInbox = shuffle([...mandatory, ...filler]);
  return currentInbox;
}

// ── Overlay root ──────────────────────────────────────────

/**
 * Returns the email overlay element, creating it if needed.
 * @returns {HTMLElement}
 */
function getOverlay() {
  let el = document.getElementById('email-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'email-overlay';
    el.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:1500',
      'background:var(--color-bg)', 'overflow-y:auto',
      'display:flex', 'flex-direction:column',
      'padding:var(--space-lg)', 'gap:var(--space-md)',
      'font-family:var(--font-mono)',
    ].join(';');
    document.getElementById('app').appendChild(el);
  }
  return el;
}

// ── Header ────────────────────────────────────────────────

/**
 * Builds the inbox header bar with title, counter, and close button.
 * @returns {HTMLElement}
 */
function buildHeader() {
  const bar = document.createElement('div');
  bar.style.cssText = [
    'display:flex', 'justify-content:space-between', 'align-items:center',
    'border-bottom:1px solid var(--color-border)', 'padding-bottom:var(--space-md)',
    'flex-wrap:wrap', 'gap:var(--space-sm)',
  ].join(';');

  const left = document.createElement('div');
  left.innerHTML = `
    <div style="font-size:var(--font-size-lg);">📬 Posteingang</div>
    <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);">
      Du hast ${MAX_ANSWERS} Antworten. Wähle weise.
    </div>
  `;

  const right = document.createElement('div');
  right.style.cssText = 'display:flex;align-items:center;gap:var(--space-md);';

  const counter = document.createElement('div');
  counter.id = 'email-answer-counter';
  counter.style.cssText = `font-size:var(--font-size-sm);color:var(--color-accent-amber);`;
  counter.textContent = `Beantwortet: 0 / ${MAX_ANSWERS}`;

  const closeBtn = document.createElement('button');
  closeBtn.id = 'email-close-btn';
  closeBtn.className = 'choice-btn';
  closeBtn.textContent = 'Posteingang schließen';
  closeBtn.disabled = true;
  closeBtn.style.opacity = '0.4';
  closeBtn.addEventListener('click', closeInbox);

  right.appendChild(counter);
  right.appendChild(closeBtn);
  bar.appendChild(left);
  bar.appendChild(right);
  return bar;
}

// ── Email list ────────────────────────────────────────────

/**
 * Builds a collapsed email row for the inbox list.
 * Clicking expands it to show the full body and action buttons.
 * @param {Object} email
 * @returns {HTMLElement}
 */
function buildEmailRow(email) {
  const wrap = document.createElement('div');
  wrap.id = `email-wrap-${email.id}`;

  const preview = email.body.slice(0, 60).replace(/\n/g, ' ') + (email.body.length > 60 ? '…' : '');

  const typeAccent = {
    internal_mandatory: 'var(--color-accent-red)',
    hr_mandatory:       'var(--color-accent-amber)',
    client:             'var(--color-accent-cyan)',
    spam:               'var(--color-text-secondary)',
    finance:            'var(--color-accent-amber)',
  };
  const dot = typeAccent[email.type] ?? 'var(--color-accent-green)';

  const row = document.createElement('div');
  row.style.cssText = [
    'display:grid', 'grid-template-columns:10px 1fr',
    'gap:var(--space-sm)', 'align-items:start',
    'padding:var(--space-md)',
    'border:1px solid var(--color-border)',
    'border-radius:var(--radius-md)',
    'cursor:pointer',
    'background:var(--color-surface-elevated)',
    'transition:border-color 0.2s',
  ].join(';');

  row.innerHTML = `
    <div style="width:8px;height:8px;border-radius:50%;background:${dot};margin-top:5px;flex-shrink:0;"></div>
    <div>
      <div style="display:flex;justify-content:space-between;gap:var(--space-sm);">
        <span style="font-size:var(--font-size-sm);color:var(--color-text-primary);">${email.emoji} ${email.from}</span>
        <span id="email-status-${email.id}" style="font-size:10px;color:var(--color-text-secondary);white-space:nowrap;"></span>
      </div>
      <div style="font-size:var(--font-size-sm);margin-top:2px;">${email.subject}</div>
      <div style="font-size:10px;color:var(--color-text-secondary);margin-top:2px;">${preview}</div>
    </div>
  `;

  row.addEventListener('mouseenter', () => { row.style.borderColor = 'var(--color-accent-cyan)'; });
  row.addEventListener('mouseleave', () => { row.style.borderColor = 'var(--color-border)'; });
  row.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      openMobileEmailDetail(email);
    } else {
      toggleEmailDetail(email, wrap, row);
    }
  });

  wrap.appendChild(row);
  return wrap;
}

/**
 * Expands or collapses the detail panel for an email row.
 * @param {Object}      email
 * @param {HTMLElement} wrap  - The wrapper that owns both row and detail panel.
 * @param {HTMLElement} row   - The clickable summary row.
 */
function toggleEmailDetail(email, wrap, row) {
  const existing = wrap.querySelector('.email-detail');
  if (existing) { existing.remove(); row.style.borderBottomLeftRadius = ''; row.style.borderBottomRightRadius = ''; return; }

  row.style.borderBottomLeftRadius = '0';
  row.style.borderBottomRightRadius = '0';
  row.style.borderBottom = 'none';
  wrap.appendChild(buildDetailPanel(email));
}

/**
 * Builds the expanded detail panel with full body and action buttons.
 * @param {Object} email
 * @returns {HTMLElement}
 */
function buildDetailPanel(email) {
  const panel = document.createElement('div');
  panel.className = 'email-detail';
  panel.style.cssText = [
    'border:1px solid var(--color-border)',
    'border-top:none',
    'border-radius:0 0 var(--radius-md) var(--radius-md)',
    'padding:var(--space-md)',
    'background:var(--color-surface)',
    'display:flex',
    'flex-direction:column',
    'gap:var(--space-md)',
  ].join(';');

  const body = document.createElement('pre');
  body.style.cssText = [
    'font-family:var(--font-mono)', 'font-size:var(--font-size-sm)',
    'color:var(--color-text-primary)', 'line-height:1.7',
    'white-space:pre-wrap', 'word-break:break-word', 'margin:0',
  ].join(';');
  body.textContent = email.body;
  panel.appendChild(body);

  const alreadyDone = interactedIds.has(email.id);

  if (email.isReadOnly || alreadyDone) {
    panel.appendChild(buildReadOnlyNote(alreadyDone));
    return panel;
  }

  panel.appendChild(buildActionButtons(email));
  return panel;
}

/**
 * Builds the "Antworten" and "Ignorieren" buttons for an email.
 * @param {Object} email
 * @returns {HTMLElement}
 */
function buildActionButtons(email) {
  const row = document.createElement('div');
  row.id = `email-actions-${email.id}`;
  row.style.cssText = 'display:flex;gap:var(--space-sm);flex-wrap:wrap;';

  if (email.answerText) {
    const ansBtn = document.createElement('button');
    ansBtn.className = 'choice-btn';
    ansBtn.id = `email-answer-btn-${email.id}`;
    ansBtn.innerHTML = `↩ ${email.answerText}`;
    ansBtn.style.color = 'var(--color-accent-green)';
    ansBtn.style.borderColor = 'var(--color-accent-green)';
    if (answeredCount >= MAX_ANSWERS) { ansBtn.disabled = true; ansBtn.style.opacity = '0.4'; }
    ansBtn.addEventListener('click', (e) => { e.stopPropagation(); answerEmail(email.id); });
    row.appendChild(ansBtn);
  }

  const ignBtn = document.createElement('button');
  ignBtn.className = 'choice-btn';
  ignBtn.innerHTML = '🗑 Ignorieren';
  ignBtn.style.color = 'var(--color-accent-red)';
  ignBtn.style.borderColor = 'var(--color-accent-red)';
  ignBtn.addEventListener('click', (e) => { e.stopPropagation(); ignoreEmail(email.id); });
  row.appendChild(ignBtn);

  return row;
}

/**
 * Returns a small status note for read-only or already-interacted emails.
 * @param {boolean} wasDone - True if the user already answered/ignored this email.
 * @returns {HTMLElement}
 */
function buildReadOnlyNote(wasDone) {
  const note = document.createElement('div');
  note.style.cssText = `font-size:var(--font-size-sm);color:var(--color-text-secondary);font-style:italic;`;
  note.textContent = wasDone ? '✓ Bereits bearbeitet.' : '📖 Gelesen.';
  return note;
}

// ── Mobile full-screen email detail ──────────────────────

/**
 * Opens a full-screen email detail panel for mobile viewports.
 * Slides in from the right and supports swipe-right to dismiss.
 * @param {Object} email
 */
function openMobileEmailDetail(email) {
  // Reuse any existing panel so rapid taps don't stack layers.
  closeMobileEmailDetail(false);

  const panel = document.createElement('div');
  panel.id = 'email-detail-mobile';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', email.subject);

  // ── Header ──────────────────────────────────────────
  const header = document.createElement('div');
  header.className = 'edm-header';

  const backBtn = document.createElement('button');
  backBtn.textContent = '← Zurück';
  backBtn.setAttribute('aria-label', 'Zurück zur Posteingang-Liste');
  backBtn.addEventListener('click', () => closeMobileEmailDetail(true));
  header.appendChild(backBtn);

  const subjectEl = document.createElement('span');
  subjectEl.style.cssText = [
    'flex:1', 'font-size:var(--font-size-sm)',
    'color:var(--color-text-primary)',
    'overflow:hidden', 'text-overflow:ellipsis', 'white-space:nowrap',
  ].join(';');
  subjectEl.textContent = email.subject;
  header.appendChild(subjectEl);

  panel.appendChild(header);

  // ── Scrollable body ──────────────────────────────────
  const body = document.createElement('div');
  body.className = 'edm-body';

  const meta = document.createElement('div');
  meta.style.cssText = [
    'display:flex', 'flex-direction:column', 'gap:4px',
    'padding-bottom:var(--space-md)',
    'border-bottom:1px solid var(--color-border)',
  ].join(';');
  meta.innerHTML = `
    <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);">Von:</div>
    <div style="color:var(--color-text-primary);">${email.emoji} ${email.from}</div>
    <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);margin-top:4px;">Betreff:</div>
    <div style="color:var(--color-text-primary);">${email.subject}</div>
  `;
  body.appendChild(meta);

  const bodyText = document.createElement('pre');
  bodyText.style.cssText = [
    'font-family:var(--font-mono)', 'font-size:var(--font-size-sm)',
    'color:var(--color-text-primary)', 'line-height:1.7',
    'white-space:pre-wrap', 'word-break:break-word', 'margin:0',
  ].join(';');
  bodyText.textContent = email.body;
  body.appendChild(bodyText);

  panel.appendChild(body);

  // ── Fixed footer with action buttons ─────────────────
  const footer = document.createElement('div');
  footer.id = `edm-footer-${email.id}`;
  footer.className = 'edm-footer';

  const alreadyDone = interactedIds.has(email.id);

  if (email.isReadOnly || alreadyDone) {
    const note = document.createElement('div');
    note.style.cssText = 'flex:1;text-align:center;font-size:var(--font-size-sm);color:var(--color-text-secondary);font-style:italic;padding:var(--space-sm);';
    note.textContent = alreadyDone ? '✓ Bereits bearbeitet.' : '📖 Gelesen.';
    footer.appendChild(note);
  } else {
    if (email.answerText) {
      const ansBtn = document.createElement('button');
      ansBtn.className = 'choice-btn';
      ansBtn.innerHTML = `↩ ${email.answerText}`;
      ansBtn.style.color = 'var(--color-accent-green)';
      ansBtn.style.borderColor = 'var(--color-accent-green)';
      if (answeredCount >= MAX_ANSWERS) { ansBtn.disabled = true; ansBtn.style.opacity = '0.4'; }
      ansBtn.addEventListener('click', () => {
        answerEmail(email.id);
        closeMobileEmailDetail(true);
      });
      footer.appendChild(ansBtn);
    }

    const ignBtn = document.createElement('button');
    ignBtn.className = 'choice-btn';
    ignBtn.innerHTML = '🗑 Ignorieren';
    ignBtn.style.color = 'var(--color-accent-red)';
    ignBtn.style.borderColor = 'var(--color-accent-red)';
    ignBtn.addEventListener('click', () => {
      ignoreEmail(email.id);
      closeMobileEmailDetail(true);
    });
    footer.appendChild(ignBtn);
  }

  panel.appendChild(footer);
  document.body.appendChild(panel);

  // Trigger CSS slide-in on next frame.
  requestAnimationFrame(() => panel.classList.add('is-open'));

  // ── Swipe-right to dismiss ───────────────────────────
  let touchStartX = 0;
  let touchStartY = 0;

  panel.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  panel.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
    // Only register as a horizontal swipe (dx > 80px, vertical movement < 60px).
    if (dx > 80 && dy < 60) {
      closeMobileEmailDetail(true);
    }
  }, { passive: true });
}

/**
 * Closes the mobile email detail panel.
 * @param {boolean} animate - Whether to slide out before removing.
 */
function closeMobileEmailDetail(animate) {
  const panel = document.getElementById('email-detail-mobile');
  if (!panel) return;

  if (animate) {
    panel.classList.remove('is-open');
    // Wait for the CSS transition to finish before removing from DOM.
    panel.addEventListener('transitionend', () => panel.remove(), { once: true });
  } else {
    panel.remove();
  }
}

// ── Core rendering ────────────────────────────────────────

/**
 * Renders the full inbox overlay.
 * Clears any existing content and rebuilds from currentInbox.
 */
function renderInbox() {
  const overlay = getOverlay();
  overlay.innerHTML = '';
  overlay.appendChild(buildHeader());

  const list = document.createElement('div');
  list.id = 'email-list';
  list.style.cssText = 'display:flex;flex-direction:column;gap:var(--space-sm);max-width:720px;width:100%;margin:0 auto;';

  currentInbox.forEach(email => list.appendChild(buildEmailRow(email)));

  if (answeredCount >= MAX_ANSWERS) {
    list.appendChild(buildAnswerLimitNote());
  }

  overlay.appendChild(list);
}

/**
 * Builds the "no more answers" notice shown at the bottom of the list.
 * @returns {HTMLElement}
 */
function buildAnswerLimitNote() {
  const note = document.createElement('div');
  note.id = 'email-limit-note';
  note.style.cssText = [
    'padding:var(--space-sm) var(--space-md)',
    'border:1px solid var(--color-accent-amber)',
    'border-radius:var(--radius-md)',
    'color:var(--color-accent-amber)',
    'font-size:var(--font-size-sm)',
    'font-style:italic',
    'text-align:center',
  ].join(';');
  note.textContent = 'Keine Zeit mehr für weitere Antworten.';
  return note;
}

// ── Counter and state updates ─────────────────────────────

/**
 * Updates the answer counter label in the header.
 */
function updateAnswerCounter() {
  const el = document.getElementById('email-answer-counter');
  if (el) el.textContent = `Beantwortet: ${answeredCount} / ${MAX_ANSWERS}`;
}

/**
 * Enables the close button once at least one email has been interacted with.
 */
function updateCloseButton() {
  const btn = document.getElementById('email-close-btn');
  if (!btn) return;
  const canClose = answeredCount >= 1 || ignoredCount >= 1;
  btn.disabled = !canClose;
  btn.style.opacity = canClose ? '1' : '0.4';
}

/**
 * Sets the visual status badge on an email row.
 * @param {string} emailId
 * @param {'beantwortet'|'ignoriert'} state
 */
function markEmailRow(emailId, state) {
  const statusEl = document.getElementById(`email-status-${emailId}`);
  if (!statusEl) return;
  statusEl.textContent = state === 'beantwortet' ? '✓ beantwortet' : '— ignoriert';
  statusEl.style.color = state === 'beantwortet'
    ? 'var(--color-accent-green)'
    : 'var(--color-text-secondary)';

  if (state === 'ignoriert') {
    const wrap = document.getElementById(`email-wrap-${emailId}`);
    if (wrap) { wrap.style.opacity = '0.5'; wrap.style.textDecoration = 'line-through'; }
  }

  const actionsEl = document.getElementById(`email-actions-${emailId}`);
  if (actionsEl) actionsEl.replaceWith(buildReadOnlyNote(true));
}

/**
 * Disables all remaining "Antworten" buttons after MAX_ANSWERS reached.
 */
function disableRemainingAnswerButtons() {
  currentInbox.forEach(e => {
    if (interactedIds.has(e.id)) return;
    const btn = document.getElementById(`email-answer-btn-${e.id}`);
    if (btn) { btn.disabled = true; btn.style.opacity = '0.4'; }
  });

  const list = document.getElementById('email-list');
  if (list && !document.getElementById('email-limit-note')) {
    list.appendChild(buildAnswerLimitNote());
  }
}

// ── Achievement trigger ───────────────────────────────────

/**
 * Checks counter-based achievements after every email interaction.
 */
function checkCounterAchievements() {
  const counters = window.Engine?.GameState?.counters ?? {};
  if ((counters.emails_ignored ?? 0) >= 5) {
    window.Achievements?.checkTrigger('emails_ignored_5');
  }
  if ((counters.lunch_ignored ?? 0) >= 5) {
    window.Achievements?.checkTrigger('lunch_ignored_5');
  }
}

// ── Answer / Ignore ───────────────────────────────────────

/**
 * Records an answer for an email, applies positive stat effects.
 * @param {string} emailId
 */
function answerEmail(emailId) {
  if (interactedIds.has(emailId) || answeredCount >= MAX_ANSWERS) return;
  const email = currentInbox.find(e => e.id === emailId);
  if (!email) return;

  interactedIds.add(emailId);
  answeredCount += 1;

  if (email.effects_answer && Object.keys(email.effects_answer).length) {
    window.Engine?.applyEffects(email.effects_answer);
  }

  // Award 5 XP per answered email (max 15 XP per inbox phase via MAX_ANSWERS cap).
  window.Engine?.addXP(5);

  const state = window.Engine?.GameState;
  if (state && !state.emailsAnswered.includes(emailId)) {
    state.emailsAnswered.push(emailId);
  }

  markEmailRow(emailId, 'beantwortet');
  updateAnswerCounter();
  updateCloseButton();
  if (answeredCount >= MAX_ANSWERS) disableRemainingAnswerButtons();
  window.Storage?.saveGame(window.Engine?.GameState);
}

/**
 * Records an email as ignored, applies negative stat effects and increments counters.
 * @param {string} emailId
 */
function ignoreEmail(emailId) {
  if (interactedIds.has(emailId)) return;
  const email = currentInbox.find(e => e.id === emailId);
  if (!email) return;

  interactedIds.add(emailId);
  ignoredCount += 1;

  if (email.effects_ignore && Object.keys(email.effects_ignore).length) {
    window.Engine?.applyEffects(email.effects_ignore);
  }

  const counters = window.Engine?.GameState?.counters;
  if (counters && email.ignoreCounter && email.ignoreCounter in counters) {
    counters[email.ignoreCounter] += 1;
  }

  markEmailRow(emailId, 'ignoriert');
  updateCloseButton();
  checkCounterAchievements();
  window.Storage?.saveGame(window.Engine?.GameState);
}

// ── Close ─────────────────────────────────────────────────

/**
 * Removes the inbox overlay and starts the next project selection.
 */
function closeInbox() {
  const overlay = document.getElementById('email-overlay');
  if (overlay) overlay.remove();

  if (typeof window.Engine?.startCalendarPhase === 'function') {
    window.Engine.startCalendarPhase();
  } else if (typeof window.Engine?.startNextProjectSelection === 'function') {
    window.Engine.startNextProjectSelection();
  }
}

// ── Public entry point ────────────────────────────────────

/**
 * Loads emails, generates inbox for the given project, and renders it.
 * @param {string} projectId - The project that just completed.
 * @returns {Promise<void>}
 */
async function startInboxPhase(projectId) {
  await loadEmails();
  generateInbox(projectId);
  renderInbox();
}

// ── Public API ────────────────────────────────────────────

window.Email = {
  get allEmails()    { return allEmails; },
  get currentInbox() { return currentInbox; },
  get answeredCount(){ return answeredCount; },
  get ignoredCount() { return ignoredCount; },
  MAX_ANSWERS,
  loadEmails,
  generateInbox,
  renderInbox,
  answerEmail,
  ignoreEmail,
  closeInbox,
  startInboxPhase,
};
