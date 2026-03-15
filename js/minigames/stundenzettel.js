/**
 * stundenzettel.js
 * Time tracking minigame for "License To Bill".
 * Player must book exactly 40 hours across 7 activity blocks.
 * Satirizes the horror of consulting timesheets.
 */

const ACTIVITY_BLOCKS = [
  { id: 'a1', description: 'Kundengespräche & Meetings beim Kunden', suggestedHours: 12, correctKST: 'active_project' },
  { id: 'a2', description: 'Analyse & Dokumentation', suggestedHours: 10, correctKST: 'active_project' },
  { id: 'a3', description: 'Interne Abstimmungen & Mails', suggestedHours: 6, correctKST: 'KST-8800' },
  { id: 'a4', description: 'Reisezeit Hin- und Rückfahrt', suggestedHours: 4, correctKST: 'KST-9000' },
  { id: 'a5', description: 'Warten am Bahnhof (Verspätung: 47 Min)', suggestedHours: 1, correctKST: 'KST-9001' },
  { id: 'a6', description: 'Pflichtschulung Sandra (Modul 8)', suggestedHours: 1, correctKST: 'KST-7700' },
  { id: 'a7', description: 'Diverse Tätigkeiten die keiner Kategorie passen', suggestedHours: 6, correctKST: 'KST-0001' },
];

const DURATION = 90;
const FALLBACK_KST = 'KST-0001';

window.StundenzettelMinigame = (function () {

  let kostenstellen = [];
  let assignments = {}; // blockId -> { hours, kstId }
  let timerHandle = null;
  let timeLeft = DURATION;
  let overlayEl = null;
  let onCompleteCallback = null;

  // ── Data ───────────────────────────────────────────────

  async function loadKostenstellen() {
    if (kostenstellen.length > 0) return;
    try {
      const res = await fetch('/data/kostenstellen.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      kostenstellen = await res.json();
    } catch (e) {
      console.warn('[Stundenzettel] Failed to load kostenstellen.json:', e);
      kostenstellen = [];
    }
  }

  function getActiveProjectKST() {
    const projectId = window.Engine?.GameState?.currentProject;
    const kst = kostenstellen.find(k => k.active && k.projectRef === projectId);
    return kst?.id ?? FALLBACK_KST;
  }

  function getCorrectKST(block) {
    if (block.correctKST === 'active_project') return getActiveProjectKST();
    return block.correctKST || FALLBACK_KST;
  }

  function isInactiveKST(kstId) {
    const k = kostenstellen.find(x => x.id === kstId);
    return k && !k.active;
  }

  // ── UI Build ───────────────────────────────────────────

  function buildOverlay() {
    overlayEl = document.createElement('div');
    overlayEl.id = 'stundenzettel-overlay';
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:2100',
      'background:var(--color-bg)',
      'overflow-y:auto',
      'font-family:var(--font-mono)',
      'padding:var(--space-lg)',
      'display:flex', 'flex-direction:column',
    ].join(';');
    document.body.appendChild(overlayEl);
    return overlayEl;
  }

  function buildHeader() {
    const hdr = document.createElement('div');
    hdr.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md);flex-wrap:wrap;gap:var(--space-sm);';

    hdr.innerHTML = `
      <div>
        <div style="font-size:var(--font-size-xl);color:var(--color-accent-amber);">🕐 Stundennachweis</div>
        <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);">Finance wartet. Frist: gestern.</div>
      </div>
      <div id="stz-timer" style="font-size:var(--font-size-lg);color:var(--color-accent-amber);">${DURATION}s</div>
    `;
    overlayEl.appendChild(hdr);
  }

  function buildMain() {
    const main = document.createElement('div');
    main.style.cssText = 'display:flex;gap:var(--space-xl);flex:1;flex-wrap:wrap;';

    const left = document.createElement('div');
    left.style.cssText = 'flex:1;min-width:280px;display:flex;flex-direction:column;gap:var(--space-sm);';

    ACTIVITY_BLOCKS.forEach(block => {
      const card = document.createElement('div');
      card.id = `stz-block-${block.id}`;
      card.style.cssText = [
        'background:var(--color-surface-elevated)',
        'border:1px solid var(--color-border)',
        'border-radius:var(--radius-md)',
        'padding:var(--space-md)',
        'display:flex', 'flex-direction:column', 'gap:6px',
      ].join(';');

      const desc = document.createElement('div');
      desc.style.cssText = 'font-size:var(--font-size-sm);color:var(--color-text-primary);';
      desc.textContent = block.description;

      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:var(--space-sm);align-items:center;flex-wrap:wrap;';

      const inputWrap = document.createElement('div');
      inputWrap.style.cssText = 'display:flex;align-items:center;gap:4px;';
      const input = document.createElement('input');
      input.type = 'number';
      input.min = 0;
      input.max = 20;
      input.value = block.suggestedHours;
      input.style.cssText = 'width:60px;padding:8px;font-family:var(--font-mono);font-size:var(--font-size-sm);min-height:44px;border:1px solid var(--color-border);border-radius:var(--radius-sm);background:var(--color-bg);color:var(--color-text-primary);';
      input.dataset.blockId = block.id;
      input.addEventListener('input', updateSummary);
      input.addEventListener('change', () => {
        const v = parseInt(input.value, 10);
        if (isNaN(v) || v < 0) input.value = 0;
        else if (v > 20) input.value = 20;
        updateSummary();
      });
      const hLabel = document.createElement('span');
      hLabel.style.cssText = 'font-size:var(--font-size-sm);color:var(--color-text-secondary);';
      hLabel.textContent = 'h';
      inputWrap.appendChild(input);
      inputWrap.appendChild(hLabel);

      const select = document.createElement('select');
      select.dataset.blockId = block.id;
      select.style.cssText = 'flex:1;min-width:180px;padding:8px 10px;font-family:var(--font-mono);font-size:var(--font-size-sm);min-height:44px;border:1px solid var(--color-border);border-radius:var(--radius-sm);background:var(--color-bg);color:var(--color-text-primary);';
      select.innerHTML = '<option value="">— Kostenstelle wählen —</option>';
      kostenstellen.forEach(k => {
        const opt = document.createElement('option');
        opt.value = k.id;
        opt.textContent = `${k.id} — ${k.name}`;
        if (!k.active) {
          opt.style.textDecoration = 'line-through';
          opt.style.color = 'var(--color-text-secondary)';
          opt.title = k.lockedReason || 'Deaktiviert';
        }
        if (k.id === 'KST-MÜLLER') {
          opt.style.color = 'var(--color-accent-amber)';
          opt.textContent = `${k.id} — ${k.name} ??`;
        }
        select.appendChild(opt);
      });
      select.addEventListener('change', updateSummary);

      row.appendChild(inputWrap);
      row.appendChild(select);
      card.appendChild(desc);
      card.appendChild(row);
      left.appendChild(card);
    });

    const right = document.createElement('div');
    right.style.cssText = 'min-width:260px;';
    right.innerHTML = `
      <div style="font-size:var(--font-size-sm);font-weight:600;color:var(--color-text-secondary);margin-bottom:var(--space-sm);">Kostenstellen</div>
      <div id="stz-kst-list" style="display:flex;flex-direction:column;gap:4px;font-size:11px;"></div>
    `;

    kostenstellen.forEach(k => {
      const el = document.createElement('div');
      el.style.cssText = [
        'padding:4px 8px',
        'border-radius:4px',
        'background:var(--color-surface)',
        k.active ? '' : 'text-decoration:line-through;color:var(--color-text-secondary);opacity:0.7',
        k.id === 'KST-MÜLLER' ? 'color:var(--color-accent-amber);' : '',
      ].filter(Boolean).join(';');
      el.textContent = `${k.id} — ${k.name}`;
      if (k.lockedReason) el.title = k.lockedReason;
      right.querySelector('#stz-kst-list').appendChild(el);
    });

    main.appendChild(left);
    main.appendChild(right);
    overlayEl.appendChild(main);
  }

  function buildBottom() {
    const bottom = document.createElement('div');
    bottom.style.cssText = 'margin-top:var(--space-lg);padding-top:var(--space-md);border-top:1px solid var(--color-border);';

    bottom.innerHTML = `
      <div id="stz-summary" style="font-size:var(--font-size-sm);margin-bottom:var(--space-sm);padding:var(--space-sm);border-radius:var(--radius-md);">
        Gebuchte Stunden: <span id="stz-total">0</span> / 40
      </div>
      <div id="stz-message" style="font-size:11px;color:var(--color-text-secondary);margin-bottom:var(--space-sm);"></div>
      <button id="stz-submit" class="choice-btn" disabled style="width:200px;">Einreichen</button>
    `;

    overlayEl.appendChild(bottom);
  }

  // ── Summary & validation ─────────────────────────────────

  function getAssignments() {
    const out = {};
    ACTIVITY_BLOCKS.forEach(block => {
      const input = overlayEl?.querySelector(`input[data-block-id="${block.id}"]`);
      const select = overlayEl?.querySelector(`select[data-block-id="${block.id}"]`);
      const hours = input ? Math.max(0, Math.min(20, parseInt(input.value, 10) || 0)) : 0;
      const kstId = select?.value || '';
      out[block.id] = { hours, kstId };
    });
    return out;
  }

  function updateSummary() {
    const as = getAssignments();
    const total = Object.values(as).reduce((s, a) => s + a.hours, 0);
    const allAssigned = Object.values(as).every(a => a.kstId);

    const totalEl = overlayEl?.querySelector('#stz-total');
    const msgEl = overlayEl?.querySelector('#stz-message');
    const summaryEl = overlayEl?.querySelector('#stz-summary');
    const submitBtn = overlayEl?.querySelector('#stz-submit');

    if (totalEl) totalEl.textContent = total;
    if (summaryEl) {
      summaryEl.style.background = total === 40 ? 'rgba(63,185,80,0.15)' : total > 40 ? 'rgba(248,81,73,0.15)' : 'rgba(230,162,60,0.15)';
      summaryEl.style.borderLeft = total === 40 ? '4px solid var(--color-accent-green)' : total > 40 ? '4px solid var(--color-accent-red)' : '4px solid var(--color-accent-amber)';
    }
    if (msgEl) {
      msgEl.textContent = total === 40 ? 'Genau 40. Ungewöhnlich.' : total > 40 ? 'Zu viele Stunden. Finance wird fragen.' : 'Zu wenig Stunden. Finance wird auch fragen.';
    }
    if (submitBtn) submitBtn.disabled = !allAssigned;
  }

  // ── Timer ───────────────────────────────────────────────

  function startTimer() {
    timeLeft = DURATION;
    timerHandle = setInterval(() => {
      timeLeft--;
      const el = overlayEl?.querySelector('#stz-timer');
      if (el) el.textContent = `${timeLeft}s`;
      if (timeLeft <= 20 && el) el.style.color = 'var(--color-accent-red)';
      if (timeLeft <= 0) {
        clearInterval(timerHandle);
        autoSubmit();
      }
    }, 1000);
  }

  function autoSubmit() {
    const as = getAssignments();
    ACTIVITY_BLOCKS.forEach(block => {
      if (!as[block.id].kstId) as[block.id].kstId = FALLBACK_KST;
    });
    finish(as, true);
  }

  // ── Scoring ─────────────────────────────────────────────

  function finish(assignmentsMap, wasAutoSubmit) {
    clearInterval(timerHandle);

    const totalHours = Object.values(assignmentsMap).reduce((s, a) => s + a.hours, 0);

    let hoursScore = 0;
    const diff = Math.abs(totalHours - 40);
    if (diff === 0) hoursScore = 20;
    else if (diff <= 1) hoursScore = 15;
    else if (diff <= 3) hoursScore = 5;

    let kstScore = 0;
    let inactivePenalty = 0;
    const allMueller = Object.values(assignmentsMap).every(a => a.kstId === 'KST-MÜLLER');

    ACTIVITY_BLOCKS.forEach(block => {
      const a = assignmentsMap[block.id];
      const correct = getCorrectKST(block);
      if (a.kstId === correct) kstScore += 8;
      if (isInactiveKST(a.kstId)) inactivePenalty += 10;
    });

    let muellerBonus = 0;
    if (allMueller) {
      window.Achievements?.checkTrigger?.('minigame_stundenzettel_all_mueller');
      // Always apply chaos effects, no random
    } else {
      Object.values(assignmentsMap).forEach(a => {
        if (a.kstId === 'KST-MÜLLER') {
          muellerBonus += Math.random() < 0.5 ? 5 : -15;
        }
      });
    }

    let score = Math.max(0, hoursScore + kstScore - inactivePenalty + muellerBonus);

    if (score >= 80) window.Achievements?.checkTrigger?.('minigame_stundenzettel_perfect');

    let result;
    if (allMueller) {
      result = {
        score: 0,
        message: 'Mutig. Sehr mutig. Müller-Brandt hat angerufen. Das Gespräch war kurz.',
        effects: { bullshit: 10, prestige: -8 },
        xpBonus: 0,
      };
    } else if (score >= 80) {
      result = {
        score,
        message: 'Perfekte Abrechnung. Finance schaut zweimal hin weil sie das nicht kennen.',
        effects: { prestige: 4, kompetenz: 2 },
        xpBonus: 25,
      };
    } else if (score >= 50) {
      result = {
        score,
        message: 'Akzeptabel. 2 Positionen werden \'zur Klärung\' zurückgehalten. Wie immer.',
        effects: { burnout: 5 },
        xpBonus: 15,
      };
    } else if (score >= 20) {
      result = {
        score,
        message: 'Finance schickt eine Mail. Betreff: \'Rückfragen Stundennachweis KW XX\'. Es sind 7 Fragen.',
        effects: { burnout: 10, prestige: -3 },
        xpBonus: 5,
      };
    } else {
      result = {
        score,
        message: 'Müller-Brandt wurde informiert. Er spricht von \'administrativer Reife\'. Er meint dich nicht positiv.',
        effects: { burnout: 15, prestige: -5 },
        xpBonus: 0,
      };
    }

    if (wasAutoSubmit) {
      result.message = 'Frist abgelaufen. Alles was offen war landet in \'Sonstiges\'. Finance liebt das. ' + result.message;
    }

    showResult(result);
  }

  function showResult(result) {
    overlayEl.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:var(--space-lg);padding:var(--space-xl);max-width:480px;margin:0 auto;';

    const emoji = result.effects?.prestige > 0 ? '✅' : result.effects?.burnout > 10 ? '😬' : '📋';
    wrap.innerHTML = `
      <div style="font-size:48px;">${emoji}</div>
      <div style="font-size:var(--font-size-lg);color:var(--color-accent-amber);">${result.score} Punkte</div>
      <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);text-align:center;line-height:1.7;">${result.message}</div>
      <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);">
        ${[
          result.effects?.prestige != null && `Prestige ${result.effects.prestige > 0 ? '+' : ''}${result.effects.prestige}`,
          result.effects?.kompetenz != null && `Kompetenz +${result.effects.kompetenz}`,
          result.effects?.burnout != null && `Burnout +${result.effects.burnout}`,
          result.effects?.bullshit != null && `Bullshit +${result.effects.bullshit}`,
          `+${result.xpBonus} XP`,
        ].filter(Boolean).join('  ·  ')}
      </div>
    `;

    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = 'Weiter';
    btn.style.cssText = 'width:200px;';
    btn.addEventListener('click', () => {
      window.Sound?.play('click');
      overlayEl?.remove();
      overlayEl = null;
      if (typeof onCompleteCallback === 'function') onCompleteCallback(result);
    });
    wrap.appendChild(btn);
    overlayEl.appendChild(wrap);
  }

  // ── Submit handler ───────────────────────────────────────

  function onSubmit() {
    const as = getAssignments();
    if (!Object.values(as).every(a => a.kstId)) return;
    finish(as, false);
  }

  // ── Public API ──────────────────────────────────────────

  async function start(onComplete) {
    onCompleteCallback = onComplete;
    await loadKostenstellen();

    buildOverlay();
    buildHeader();
    buildMain();
    buildBottom();

    overlayEl.querySelector('#stz-submit').addEventListener('click', () => {
      window.Sound?.play('click');
      onSubmit();
    });

    updateSummary();
    startTimer();
    window.Sound?.play('click');
  }

  return { start };

}());
