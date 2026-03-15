/**
 * calendar.js
 * Calendar week planner for "License To Bill".
 * Appears between projects, after the email phase.
 * Player decides which meetings to protect, sacrifice, or decline.
 */

const DAY_ORDER = { Montag: 0, Dienstag: 1, Mittwoch: 2, Donnerstag: 3, Freitag: 4 };
const DAY_SHORT = { Montag: 'Mo', Dienstag: 'Di', Mittwoch: 'Mi', Donnerstag: 'Do', Freitag: 'Fr' };

const TYPE_BADGES = {
  internal_mandatory: { label: 'Pflicht', color: 'var(--color-accent-red)' },
  hr_mandatory:       { label: 'HR',     color: 'var(--color-accent-amber)' },
  company_mandatory:  { label: 'Pflicht', color: 'var(--color-accent-red)' },
  client:             { label: 'Kunde',  color: 'var(--color-accent-green)' },
  work_block:         { label: 'Arbeitsblock', color: 'var(--color-accent-cyan)' },
  conflict:           { label: 'KONFLIKT', color: 'var(--color-accent-purple)' },
  internal:           { label: 'Intern', color: 'var(--color-text-secondary)' },
  social:             { label: 'Optional', color: 'var(--color-accent-amber)' },
  mystery:            { label: '???',    color: 'var(--color-text-secondary)' },
};

window.Calendar = (function () {

  let allEvents = [];
  let currentWeek = [];
  let workBlocksRemaining = 3;
  let decisionsLeft = 3;
  /** @type {Object.<string, string>} eventId -> 'attended'|'declined'|'protected'|'conflict_a'|'conflict_b'|'conflict_c' */
  let eventDecisions = {};
  let overlayEl = null;
  let summaryBarEl = null;

  // ── Parse time for overlap detection ─────────────────────

  function parseTimeRange(timeStr) {
    const m = (timeStr || '').match(/(\d{1,2}):(\d{2})\s*[–\-]\s*(\d{1,2}):(\d{2})/);
    if (!m) return { start: 0, end: 24 };
    const start = parseInt(m[1], 10) + parseInt(m[2], 10) / 60;
    const end   = parseInt(m[3], 10) + parseInt(m[4], 10) / 60;
    return { start, end };
  }

  function overlaps(a, b) {
    if (a.day !== b.day) return false;
    const ra = parseTimeRange(a.time);
    const rb = parseTimeRange(b.time);
    return ra.start < rb.end && rb.start < ra.end;
  }

  // ── Data loading ─────────────────────────────────────────

  async function loadEvents() {
    if (allEvents.length > 0) return;
    try {
      const res = await fetch('/data/calendar_events.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      allEvents = await res.json();
    } catch (e) {
      console.warn('[Calendar] Failed to load calendar_events.json:', e);
      allEvents = [];
    }
  }

  // ── Week generation ──────────────────────────────────────

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function generateWeek() {
    eventDecisions = {};
    decisionsLeft = 3;
    workBlocksRemaining = 3;

    const conflict   = allEvents.find(e => e.isConflict);
    const hrMandatory = allEvents.filter(e => e.type === 'hr_mandatory');
    const muellerMandatory = allEvents.filter(e =>
      e.type === 'internal_mandatory' && e.organizer && e.organizer.includes('Müller-Brandt')
    );
    const workBlocks = allEvents.filter(e => e.isWorkBlock);
    const rest = allEvents.filter(e =>
      !e.isWorkBlock && !e.isConflict &&
      e.type !== 'hr_mandatory' &&
      !(e.type === 'internal_mandatory' && e.organizer && e.organizer.includes('Müller-Brandt'))
    );

    const week = [];

    if (conflict) week.push({ ...conflict });
    if (hrMandatory.length) week.push({ ...hrMandatory[Math.floor(Math.random() * hrMandatory.length)] });
    if (muellerMandatory.length) week.push({ ...muellerMandatory[Math.floor(Math.random() * muellerMandatory.length)] });

    const shuffledRest = shuffle(rest);
    let needed = 8 - week.length;
    for (let i = 0; i < shuffledRest.length && needed > 0; i++) {
      const e = shuffledRest[i];
      if (!week.some(w => w.id === e.id)) {
        week.push({ ...e });
        needed--;
      }
    }

    const shuffledBlocks = shuffle(workBlocks);
    for (let i = 0; i < 3 && i < shuffledBlocks.length; i++) {
      week.push({ ...shuffledBlocks[i] });
    }

    week.sort((a, b) => {
      const da = DAY_ORDER[a.day] ?? 99;
      const db = DAY_ORDER[b.day] ?? 99;
      if (da !== db) return da - db;
      const ta = parseTimeRange(a.time);
      const tb = parseTimeRange(b.time);
      return ta.start - tb.start;
    });

    currentWeek = week;
  }

  // ── Summary calculation ──────────────────────────────────

  function getProjectedEffects() {
    const totals = { kompetenz: 0, bullshit: 0, kundenliebe: 0, burnout: 0, prestige: 0 };
    currentWeek.forEach(ev => {
      const dec = eventDecisions[ev.id];
      if (ev.isConflict && ev.conflictOptions) {
        const opt = dec === 'conflict_a' ? ev.conflictOptions.option_a
          : dec === 'conflict_b' ? ev.conflictOptions.option_b
          : dec === 'conflict_c' ? ev.conflictOptions.option_c
          : null;
        if (opt && opt.effects) {
          Object.entries(opt.effects).forEach(([k, v]) => { if (totals[k] !== undefined) totals[k] += v; });
        }
      } else if (dec === 'declined' && ev.declineConsequence && Object.keys(ev.declineConsequence || {}).length > 0) {
        Object.entries(ev.declineConsequence).forEach(([k, v]) => { if (totals[k] !== undefined) totals[k] += v; });
      } else if (dec === 'protected' && ev.attendConsequence) {
        Object.entries(ev.attendConsequence).forEach(([k, v]) => { if (totals[k] !== undefined) totals[k] += v; });
      } else if (ev.isWorkBlock && isWorkBlockOverlapped(ev) && dec !== 'protected') {
        // Overwritten work block: no effect
      } else if (dec !== 'declined' && dec !== 'protected' && ev.attendConsequence) {
        Object.entries(ev.attendConsequence).forEach(([k, v]) => { if (totals[k] !== undefined) totals[k] += v; });
      }
    });
    return totals;
  }

  function getWeekSummary() {
    const e = getProjectedEffects();
    const parts = [];
    if (e.burnout !== 0) parts.push(`🔥 ${e.burnout > 0 ? '+' : ''}${e.burnout} Burnout`);
    if (e.kompetenz !== 0) parts.push(`🧠 ${e.kompetenz > 0 ? '+' : ''}${e.kompetenz} Kompetenz`);
    if (e.prestige !== 0) parts.push(`🏆 ${e.prestige > 0 ? '+' : ''}${e.prestige} Prestige`);
    if (e.kundenliebe !== 0) parts.push(`🤝 ${e.kundenliebe > 0 ? '+' : ''}${e.kundenliebe} Kundenliebe`);
    if (e.bullshit !== 0) parts.push(`💬 ${e.bullshit > 0 ? '+' : ''}${e.bullshit} Bullshit`);
    return parts.length ? parts.join('  ·  ') : 'Keine Änderungen';
  }

  // ── Apply consequences ───────────────────────────────────

  function applyWeekConsequences() {
    const totals = getProjectedEffects();
    if (window.Engine?.applyEffects) {
      window.Engine.applyEffects(totals);
    }
    if (window.Storage?.saveGame && window.Engine?.GameState) {
      window.Storage.saveGame(window.Engine.GameState);
    }
  }

  // ── Overlap detection for work blocks ────────────────────

  function isWorkBlockOverlapped(workBlock) {
    const meetings = currentWeek.filter(e => !e.isWorkBlock);
    return meetings.some(m => overlaps(workBlock, m));
  }

  // ── UI: Build event card ─────────────────────────────────

  function buildEventCard(ev, dayCol) {
    const card = document.createElement('div');
    const badge = TYPE_BADGES[ev.type] ?? { label: ev.type, color: 'var(--color-text-secondary)' };
    const title = (ev.title || '').length > 30 ? (ev.title || '').slice(0, 27) + '…' : (ev.title || '');
    const isOverlapped = ev.isWorkBlock && isWorkBlockOverlapped(ev);
    const isProtected = eventDecisions[ev.id] === 'protected';
    const isDeclined = eventDecisions[ev.id] === 'declined';

    card.style.cssText = [
      'background:var(--color-surface-elevated)',
      'border:1px solid var(--color-border)',
      'border-radius:var(--radius-md)',
      'padding:var(--space-sm)',
      'display:flex',
      'flex-direction:column',
      'gap:4px',
      'font-size:var(--font-size-sm)',
      isOverlapped && !isProtected ? 'border-color:var(--color-accent-red);' : '',
      isDeclined ? 'opacity:0.5;' : '',
    ].filter(Boolean).join(';');

    card.dataset.eventId = ev.id;

    const badgeEl = document.createElement('span');
    badgeEl.style.cssText = `display:inline-block;font-size:9px;padding:2px 6px;border-radius:4px;background:${badge.color}22;color:${badge.color};align-self:flex-start;`;
    badgeEl.textContent = ev.isWorkBlock ? '🔒 ' + badge.label : badge.label;

    const titleEl = document.createElement('div');
    titleEl.style.cssText = 'font-weight:600;color:var(--color-text-primary);line-height:1.3;';
    titleEl.textContent = isOverlapped && !isProtected ? '⚠️ Überschrieben?' : title || ev.title;

    const meta = document.createElement('div');
    meta.style.cssText = 'font-size:10px;color:var(--color-text-secondary);';
    meta.textContent = `${ev.time || ''} · ${ev.organizer || ''}`;

    card.appendChild(badgeEl);
    card.appendChild(titleEl);
    card.appendChild(meta);

    if (ev.isConflict && ev.conflictOptions) {
      const opts = ev.conflictOptions;
      const chosen = eventDecisions[ev.id];
      if (chosen && (chosen === 'conflict_a' || chosen === 'conflict_b' || chosen === 'conflict_c')) {
        const lbl = opts.option_a?.label || opts.option_b?.label || opts.option_c?.label;
        const sel = document.createElement('div');
        sel.style.cssText = 'font-size:10px;color:var(--color-accent-green);margin-top:4px;';
        sel.textContent = '✓ ' + (opts['option_' + chosen.slice(-1)]?.label || lbl);
        card.appendChild(sel);
      } else if (decisionsLeft > 0) {
        const btnWrap = document.createElement('div');
        btnWrap.style.cssText = 'display:flex;flex-direction:column;gap:4px;margin-top:6px;';
        ['option_a', 'option_b', 'option_c'].forEach(key => {
          const opt = opts[key];
          if (!opt) return;
          const btn = document.createElement('button');
          btn.style.cssText = 'font-size:10px;padding:4px 8px;text-align:left;background:transparent;border:1px solid var(--color-border);border-radius:4px;cursor:pointer;color:var(--color-text-primary);';
          btn.textContent = opt.label;
          btn.addEventListener('click', () => {
            if (decisionsLeft <= 0) return;
            eventDecisions[ev.id] = key.replace('option_', 'conflict_');
            decisionsLeft--;
            window.Sound?.play('click');
            refreshCalendar();
          });
          btnWrap.appendChild(btn);
        });
        card.appendChild(btnWrap);
      }
    } else if (ev.isWorkBlock) {
      if (isProtected) {
        const sel = document.createElement('div');
        sel.style.cssText = 'font-size:10px;color:var(--color-accent-green);margin-top:4px;';
        sel.textContent = '✓ Geschützt';
        card.appendChild(sel);
      } else if (decisionsLeft > 0) {
        const btn = document.createElement('button');
        btn.style.cssText = 'font-size:10px;padding:4px 8px;margin-top:4px;background:transparent;border:1px solid var(--color-accent-cyan);color:var(--color-accent-cyan);border-radius:4px;cursor:pointer;';
        btn.textContent = 'Schützen (+1 Entscheidung)';
        btn.addEventListener('click', () => {
          if (decisionsLeft <= 0) return;
          eventDecisions[ev.id] = 'protected';
          currentWeek.filter(m => !m.isWorkBlock && overlaps(ev, m)).forEach(m => {
            eventDecisions[m.id] = 'declined';
          });
          decisionsLeft--;
          window.Sound?.play('click');
          refreshCalendar();
        });
        card.appendChild(btn);
      }
    } else if (ev.canDecline && !isDeclined && decisionsLeft > 0) {
      const btn = document.createElement('button');
      btn.style.cssText = 'font-size:10px;padding:4px 8px;margin-top:4px;background:transparent;border:1px solid var(--color-accent-red);color:var(--color-accent-red);border-radius:4px;cursor:pointer;';
      btn.textContent = 'Absagen';
      btn.addEventListener('click', () => {
        if (decisionsLeft <= 0) return;
        eventDecisions[ev.id] = 'declined';
        decisionsLeft--;
        window.Sound?.play('click');
        refreshCalendar();
      });
      card.appendChild(btn);
    }

    return card;
  }

  // ── Main render ──────────────────────────────────────────

  function refreshCalendar() {
    if (!overlayEl) return;
    const counter = overlayEl.querySelector('#cal-decisions');
    if (counter) counter.textContent = decisionsLeft;

    if (summaryBarEl) {
      summaryBarEl.textContent = 'Diese Woche kostet dich voraussichtlich: ' + getWeekSummary();
    }

    const grid = overlayEl.querySelector('#cal-grid');
    if (!grid) return;

    grid.innerHTML = '';
    const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
    days.forEach(day => {
      const col = document.createElement('div');
      col.style.cssText = 'display:flex;flex-direction:column;gap:var(--space-sm);min-width:140px;';
      col.innerHTML = `<div style="font-size:var(--font-size-sm);font-weight:600;color:var(--color-accent-cyan);margin-bottom:4px;">${DAY_SHORT[day]}</div>`;
      currentWeek.filter(e => e.day === day).forEach(ev => {
        col.appendChild(buildEventCard(ev, day));
      });
      grid.appendChild(col);
    });

    const confirmBtn = overlayEl.querySelector('#cal-confirm');
    if (confirmBtn) {
      const hasDecision = Object.keys(eventDecisions).length > 0;
      confirmBtn.disabled = !hasDecision;
    }

    const noDecisionsMsg = overlayEl.querySelector('#cal-no-decisions');
    if (noDecisionsMsg) {
      noDecisionsMsg.style.display = decisionsLeft === 0 ? 'block' : 'none';
    }
  }

  function renderCalendar() {
    document.getElementById('calendar-overlay')?.remove();

    overlayEl = document.createElement('div');
    overlayEl.id = 'calendar-overlay';
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:1700',
      'background:var(--color-bg)',
      'overflow-y:auto',
      'display:flex', 'flex-direction:column',
      'font-family:var(--font-mono)',
      'padding:var(--space-lg)',
    ].join(';');

    overlayEl.innerHTML = `
      <div style="text-align:center;margin-bottom:var(--space-md);">
        <div style="font-size:var(--font-size-xl);color:var(--color-accent-cyan);">📅 Deine Woche</div>
        <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);">3 Entscheidungen. Wähle weise.</div>
        <div style="font-size:var(--font-size-sm);color:var(--color-accent-amber);margin-top:4px;">Entscheidungen übrig: <span id="cal-decisions">${decisionsLeft}</span></div>
      </div>

      <div id="cal-grid" style="display:flex;gap:var(--space-lg);overflow-x:auto;padding-bottom:var(--space-md);flex:1;justify-content:center;"></div>

      <div id="cal-no-decisions" style="display:none;text-align:center;font-size:var(--font-size-sm);color:var(--color-text-secondary);margin-top:var(--space-sm);">
        Keine Entscheidungen mehr. Der Rest passiert einfach.
      </div>

      <div id="cal-summary" style="margin-top:var(--space-md);padding:var(--space-md);background:var(--color-surface-elevated);border-radius:var(--radius-md);font-size:var(--font-size-sm);color:var(--color-text-secondary);text-align:center;"></div>

      <div style="display:flex;justify-content:center;margin-top:var(--space-md);">
        <button id="cal-confirm" class="choice-btn" disabled style="width:220px;">Woche bestätigen →</button>
      </div>
    `;

    summaryBarEl = overlayEl.querySelector('#cal-summary');

    overlayEl.querySelector('#cal-confirm').addEventListener('click', () => {
      window.Sound?.play('click');
      applyWeekConsequences();
      overlayEl?.remove();
      overlayEl = null;
      if (typeof window.Engine?.startNextProjectSelection === 'function') {
        window.Engine.startNextProjectSelection();
      }
    });

    document.getElementById('app').appendChild(overlayEl);
    refreshCalendar();

    if (window.KeyboardController?.trapFocus) {
      setTimeout(() => window.KeyboardController.trapFocus(overlayEl), 0);
    }
  }

  // ── Public API ───────────────────────────────────────────

  return {
    get allEvents() { return allEvents; },
    get currentWeek() { return currentWeek; },
    get workBlocksRemaining() { return workBlocksRemaining; },
    get decisionsLeft() { return decisionsLeft; },
    loadEvents,
    generateWeek,
    renderCalendar,
    applyWeekConsequences,
    getWeekSummary,
  };

}());
