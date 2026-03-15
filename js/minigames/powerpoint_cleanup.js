/**
 * PowerPoint Cleanup Minigame
 * The player has 47 slides spread across 12 groups.
 * For each group: decide DECK (keep in presentation), ANHANG (appendix), or PAPIERKORB (trash).
 * Score depends on sensible curation decisions — fewer deck slides and the right cuts.
 * Exposed as window.PowerpointCleanupMinigame.
 */
'use strict';

window.PowerpointCleanupMinigame = (() => {

  const SLIDE_GROUPS = [
    {
      id: 'deckblatt',
      title: 'Deckblatt & Agenda',
      count: 3,
      hint: 'Immer dabei. Kein Spielraum.',
      correct: 'deck',
    },
    {
      id: 'exec_summary',
      title: 'Executive Summary — 1 Seite',
      count: 1,
      hint: 'Das einzige was das Board komplett liest.',
      correct: 'deck',
    },
    {
      id: 'status_quo',
      title: 'ITAM-Status-Quo bei Reinhold (inkl. Benchmarks)',
      count: 4,
      hint: 'Kontext für die Empfehlung. Gehört ins Deck.',
      correct: 'deck',
    },
    {
      id: 'methodik',
      title: 'Unsere Beratungsmethodik im Detail',
      count: 5,
      hint: 'Das Board interessiert sich nicht für eure Methode. Anhang.',
      correct: 'anhang',
    },
    {
      id: 'benchmarking',
      title: 'Wettbewerber-Benchmarking (12 Unternehmen)',
      count: 7,
      hint: 'Gut für die Tiefe — zu viel für das Board. Anhang.',
      correct: 'anhang',
    },
    {
      id: 'roadmap',
      title: 'Strategische Roadmap (Phasen 1–3)',
      count: 3,
      hint: 'Der Kern der Empfehlung. Bleibt im Deck.',
      correct: 'deck',
    },
    {
      id: 'budget',
      title: 'Budget & ROI-Kalkulation',
      count: 2,
      hint: 'Die CFO schaut hier zuerst hin. Unbedingt ins Deck.',
      correct: 'deck',
    },
    {
      id: 'budget_detail',
      title: 'Detailliertes Budget nach Kostenstelle (6 Tabs)',
      count: 6,
      hint: 'Wichtig — aber zu granular für das Board. Anhang.',
      correct: 'anhang',
    },
    {
      id: 'risiken',
      title: 'Risikomatrix und Mitigation',
      count: 3,
      hint: 'Zeigt dass ihr gedacht habt. Ins Deck.',
      correct: 'deck',
    },
    {
      id: 'kpis',
      title: 'KPI-Dashboard und Erfolgsmessung',
      count: 2,
      hint: 'Boards mögen Kennzahlen. Bleibt drin.',
      correct: 'deck',
    },
    {
      id: 'lessons',
      title: 'Lessons Learned aus 7 früheren Projekten',
      count: 5,
      hint: 'Intern wertvoll. Für das Board: Anhang.',
      correct: 'anhang',
    },
    {
      id: 'kevin',
      title: "Kevin's Hyperscaler Integration Matrix v2",
      count: 6,
      hint: 'Niemand weiß was das bedeutet. Niemand muss es wissen.',
      correct: 'trash',
    },
  ];

  const MAX_SLIDES = SLIDE_GROUPS.reduce((s, g) => s + g.count, 0); // = 47

  let selections       = {};
  let onCompleteCallback = null;
  let overlayEl        = null;

  function start(onComplete) {
    onCompleteCallback = onComplete;
    selections = {};
    SLIDE_GROUPS.forEach(g => { selections[g.id] = 'deck'; });
    render();
  }

  function getDeckCount() {
    return SLIDE_GROUPS
      .filter(g => selections[g.id] === 'deck')
      .reduce((s, g) => s + g.count, 0);
  }

  function render() {
    if (overlayEl) overlayEl.remove();

    overlayEl = document.createElement('div');
    overlayEl.id = 'ppt-cleanup-overlay';
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.setAttribute('aria-label', 'PowerPoint Cleanup');
    overlayEl.style.cssText = `
      position:fixed; inset:0;
      background:rgba(0,0,0,0.92);
      display:flex; align-items:flex-start; justify-content:center;
      z-index:1200;
      padding:var(--space-md);
      box-sizing:border-box;
      overflow-y:auto;
      animation:fadeIn 0.25s ease;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      background:var(--color-surface);
      border:1px solid var(--color-accent-yellow, #e3b341);
      border-radius:var(--radius-lg);
      padding:var(--space-xl);
      max-width:680px;
      width:100%;
      margin:auto;
      box-sizing:border-box;
    `;

    card.innerHTML = buildUI();
    overlayEl.appendChild(card);
    document.body.appendChild(overlayEl);

    attachListeners(card);

    if (window.KeyboardController && typeof window.KeyboardController.trapFocus === 'function') {
      window.KeyboardController.trapFocus(overlayEl);
    }
  }

  function buildUI() {
    const deckCount = getDeckCount();
    const countColor = deckCount <= 15
      ? 'var(--color-accent-green)'
      : deckCount <= 25
        ? 'var(--color-accent-yellow, #e3b341)'
        : 'var(--color-accent-red)';

    const rows = SLIDE_GROUPS.map(g => {
      const sel = selections[g.id];
      const isKevin = g.id === 'kevin';

      return `
        <div class="ppt-row" style="
          display:grid;
          grid-template-columns:1fr auto;
          gap:var(--space-sm);
          align-items:start;
          padding:var(--space-sm) 0;
          border-bottom:1px solid var(--color-border);
        ">
          <div>
            <div style="
              color:var(--color-text-primary);
              font-size:var(--font-size-sm);
              font-family:var(--font-mono);
              margin-bottom:2px;
              ${isKevin ? 'color:var(--color-accent-red);' : ''}
            ">${g.title}</div>
            <div style="color:var(--color-text-secondary);font-size:10px;letter-spacing:0.5px;">
              ${g.count} Folie${g.count !== 1 ? 'n' : ''}
            </div>
          </div>
          <div style="display:flex;gap:4px;flex-shrink:0;" data-group="${g.id}">
            ${buildToggleBtn(g.id, 'deck',   '📋 Deck',    sel === 'deck')}
            ${buildToggleBtn(g.id, 'anhang', '📁 Anhang',  sel === 'anhang')}
            ${buildToggleBtn(g.id, 'trash',  '🗑️ Weg',     sel === 'trash')}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        margin-bottom:var(--space-lg);
        flex-wrap:wrap;
        gap:var(--space-sm);
      ">
        <div>
          <div style="
            font-family:var(--font-mono);
            font-size:var(--font-size-xs);
            color:var(--color-accent-yellow, #e3b341);
            text-transform:uppercase;
            letter-spacing:2px;
            margin-bottom:4px;
          ">📊 PowerPoint Cleanup</div>
          <div style="
            color:var(--color-text-secondary);
            font-size:var(--font-size-sm);
          ">47 Folien. 4 Wochen Arbeit. Das Board hat 30 Minuten.</div>
        </div>
        <div style="text-align:right;">
          <div style="
            font-family:var(--font-mono);
            font-size:1.8rem;
            font-weight:700;
            color:${countColor};
            line-height:1;
          " id="ppt-deck-count">${deckCount}</div>
          <div style="
            font-family:var(--font-mono);
            font-size:var(--font-size-xs);
            color:var(--color-text-secondary);
          ">Folien im Deck</div>
        </div>
      </div>
      <div style="
        display:flex;
        gap:var(--space-sm);
        margin-bottom:var(--space-md);
        font-family:var(--font-mono);
        font-size:10px;
        color:var(--color-text-secondary);
      ">
        <span>📋 Im Deck = Board sieht es</span>
        <span>·</span>
        <span>📁 Anhang = verfügbar, nicht aktiv</span>
        <span>·</span>
        <span>🗑️ Weg = raus</span>
      </div>
      <div id="ppt-rows">${rows}</div>
      <div style="margin-top:var(--space-lg);display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm);flex-wrap:wrap;">
        <div id="ppt-advice" style="
          color:var(--color-text-secondary);
          font-size:var(--font-size-sm);
          font-style:italic;
          flex:1;
        ">${getAdvice(deckCount)}</div>
        <button id="ppt-submit-btn" style="
          background:var(--color-accent-yellow, #e3b341);
          border:none;
          border-radius:var(--radius-md);
          color:#000;
          font-family:var(--font-mono);
          font-size:var(--font-size-sm);
          font-weight:700;
          padding:var(--space-sm) var(--space-lg);
          cursor:pointer;
          min-height:var(--touch-target, 44px);
          white-space:nowrap;
          touch-action:manipulation;
        ">Deck einreichen →</button>
      </div>
    `;
  }

  function buildToggleBtn(groupId, value, label, active) {
    const activeStyle = active
      ? `background:var(--color-border);border-color:var(--color-accent-yellow, #e3b341);color:var(--color-text-primary);`
      : `background:transparent;border-color:var(--color-border);color:var(--color-text-secondary);`;
    return `
      <button
        data-group="${groupId}"
        data-value="${value}"
        style="
          ${activeStyle}
          border:1px solid;
          border-radius:var(--radius-sm);
          font-family:var(--font-mono);
          font-size:10px;
          padding:4px 8px;
          cursor:pointer;
          min-height:32px;
          touch-action:manipulation;
          -webkit-tap-highlight-color:transparent;
          transition:background 0.1s, border-color 0.1s;
          white-space:nowrap;
        "
        aria-pressed="${active}"
      >${label}</button>
    `;
  }

  function getAdvice(deckCount) {
    if (deckCount <= 12) return '"Weniger ist mehr." — jeder der je vor einem Board stand.';
    if (deckCount <= 15) return 'Solide. Das Board wird nicht einschlafen.';
    if (deckCount <= 20) return 'Etwas viel — aber der Anhang rettet euch vielleicht.';
    if (deckCount <= 30) return 'Müller-Brandt hat gesagt: maximal 15 Folien.';
    return 'Das ist kein Deck. Das ist ein Buch. Mit schlechten Bildern.';
  }

  function attachListeners(card) {
    card.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-group][data-value]');
      if (!btn) return;

      const groupId = btn.dataset.group;
      const value   = btn.dataset.value;
      if (!groupId || !value) return;

      window.Sound?.play('click');
      selections[groupId] = value;
      updateUI(card);
    });

    const submitBtn = card.querySelector('#ppt-submit-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        window.Sound?.play('choice_made');
        showResult(card);
      });
    }
  }

  function updateUI(card) {
    const deckCount  = getDeckCount();
    const countColor = deckCount <= 15
      ? 'var(--color-accent-green)'
      : deckCount <= 25
        ? 'var(--color-accent-yellow, #e3b341)'
        : 'var(--color-accent-red)';

    const countEl = card.querySelector('#ppt-deck-count');
    if (countEl) {
      countEl.textContent = deckCount;
      countEl.style.color = countColor;
    }

    const adviceEl = card.querySelector('#ppt-advice');
    if (adviceEl) adviceEl.textContent = getAdvice(deckCount);

    card.querySelectorAll('button[data-group][data-value]').forEach(btn => {
      const isActive = selections[btn.dataset.group] === btn.dataset.value;
      btn.style.background    = isActive ? 'var(--color-border)' : 'transparent';
      btn.style.borderColor   = isActive ? 'var(--color-accent-yellow, #e3b341)' : 'var(--color-border)';
      btn.style.color         = isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)';
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  function calculateScore() {
    let score = 0;
    let correctCount = 0;

    SLIDE_GROUPS.forEach(g => {
      if (selections[g.id] === g.correct) correctCount++;
    });

    const deckCount = getDeckCount();
    if (deckCount <= 12)  score += 3;
    else if (deckCount <= 15) score += 2;
    else if (deckCount <= 20) score += 1;

    if (selections['kevin']   === 'trash') score += 3;
    if (selections['kevin']   === 'deck')  score -= 3;
    if (selections['budget']  === 'deck')  score += 1;
    if (selections['exec_summary'] === 'deck') score += 1;

    return { score, deckCount, correctCount };
  }

  function showResult(card) {
    const { score, deckCount, correctCount } = calculateScore();

    const isExcellent = score >= 6;
    const isGood      = score >= 3 && score < 6;
    const accentColor = isExcellent
      ? 'var(--color-accent-green)'
      : isGood
        ? 'var(--color-accent-yellow, #e3b341)'
        : 'var(--color-accent-red)';

    const headline = isExcellent
      ? 'Exzellente Kuration.'
      : isGood
        ? 'Solides Deck — mit Luft nach oben.'
        : 'Das Board wird leiden.';

    const comment = isExcellent
      ? `${deckCount} Folien. ${correctCount}/12 Kategorien richtig eingeordnet. Müller-Brandt würde sagen: 'Gut.' Das ist sein Maximallob.`
      : isGood
        ? `${deckCount} Folien im Deck. ${correctCount}/12 Kategorien gut sortiert. Folie für Folie wird es besser. Nicht heute, aber bald.`
        : `${deckCount} Folien. Das Board ist nach 18 Minuten fertig — sie haben aufgehört zu lesen. ${selections['kevin'] === 'deck' ? "Kevin's Hyperscaler Matrix ist auf Folie 12. Das war der Moment." : 'Zu viel, zu dicht, zu wenig Fokus.'}`;

    const effectsToApply = isExcellent
      ? { kompetenz: 6, prestige: 4 }
      : isGood
        ? { kompetenz: 3, prestige: 2 }
        : { bullshit: 5, burnout: 8 };

    card.innerHTML = `
      <div style="text-align:center;margin-bottom:var(--space-lg);">
        <div style="font-size:3rem;margin-bottom:var(--space-sm);animation:levelUpEmoji 0.5s cubic-bezier(0.34,1.56,0.64,1) both;">
          ${isExcellent ? '📋' : isGood ? '📊' : '📉'}
        </div>
        <div style="
          font-family:var(--font-mono);
          font-size:var(--font-size-xs);
          color:var(--color-accent-yellow, #e3b341);
          text-transform:uppercase;
          letter-spacing:2px;
          margin-bottom:var(--space-xs);
        ">Deck-Analyse</div>
        <div style="
          font-size:2rem;
          font-weight:700;
          color:${accentColor};
          font-family:var(--font-mono);
          margin-bottom:var(--space-xs);
        ">${deckCount} Folien</div>
        <div style="
          font-size:var(--font-size-md);
          color:${accentColor};
          font-family:var(--font-mono);
          font-weight:600;
          margin-bottom:var(--space-md);
        ">${headline}</div>
        <p style="
          color:var(--color-text-secondary);
          font-size:var(--font-size-sm);
          line-height:1.6;
          margin:0 0 var(--space-lg);
          font-style:italic;
          text-align:left;
        ">"${comment}"</p>
        <div style="
          display:flex;
          gap:var(--space-md);
          justify-content:center;
          margin-bottom:var(--space-lg);
          flex-wrap:wrap;
        ">
          <div style="text-align:center;">
            <div style="font-family:var(--font-mono);font-size:1.4rem;font-weight:700;color:${accentColor};">${deckCount}</div>
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--color-text-secondary);">Folien im Deck</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:var(--font-mono);font-size:1.4rem;font-weight:700;color:var(--color-text-secondary);">${correctCount}/12</div>
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--color-text-secondary);">Richtig sortiert</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:var(--font-mono);font-size:1.4rem;font-weight:700;color:${selections['kevin'] === 'trash' ? 'var(--color-accent-green)' : 'var(--color-accent-red)'};">
              ${selections['kevin'] === 'trash' ? '✓' : '✗'}
            </div>
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--color-text-secondary);">Kevin's Folie entfernt</div>
          </div>
        </div>
      </div>
      <button id="ppt-continue-btn" style="
        width:100%;
        background:${accentColor};
        border:none;
        border-radius:var(--radius-md);
        color:#000;
        font-family:var(--font-mono);
        font-size:var(--font-size-sm);
        font-weight:700;
        padding:var(--space-sm) var(--space-md);
        cursor:pointer;
        min-height:var(--touch-target, 44px);
        touch-action:manipulation;
      ">Präsentation starten →</button>
    `;

    window.Sound?.play('achievement');

    card.querySelector('#ppt-continue-btn').addEventListener('click', () => {
      window.Sound?.play('click');
      finish(effectsToApply);
    });
  }

  function finish(effectsToApply) {
    if (overlayEl) {
      overlayEl.style.opacity = '0';
      overlayEl.style.transition = 'opacity 0.25s ease';
      setTimeout(() => { overlayEl?.remove(); overlayEl = null; }, 260);
    }

    if (window.Engine && typeof window.Engine.applyEffects === 'function') {
      window.Engine.applyEffects(effectsToApply);
    }

    if (typeof onCompleteCallback === 'function') {
      onCompleteCallback();
      onCompleteCallback = null;
    }
  }

  return { start };

})();
