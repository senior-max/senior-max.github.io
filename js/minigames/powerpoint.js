/**
 * PowerPoint Cleanup Minigame (full version)
 * 47 slides spread across 29 card items. 90-second timer.
 * Player assigns each slide to KEEP (max 12), ANHANG, or LÖSCHEN.
 * Exposed as window.PowerpointMinigame.
 */
'use strict';

window.PowerpointMinigame = (() => {

  // ── Slide definitions ──────────────────────────────────────
  // Total slide count across all items must equal 47.
  // KEEP(10) + ANHANG(26) + LÖSCHEN(11) = 47
  const SLIDES = [
    // ── KEEP (correct answer: these belong in the board deck) ──
    {
      id: 'exec_sum',
      title: 'Executive Summary',
      subtitle: 'Eine Seite. Alles was zählt.',
      count: 1,
      correct: 'keep',
      kevin: false,
    },
    {
      id: 'kosten',
      title: 'Kostenanalyse',
      subtitle: '€2,3M über 3 Jahre — die Folie auf die alle warten.',
      count: 1,
      correct: 'keep',
      kevin: false,
    },
    {
      id: 'roadmap',
      title: 'Roadmap Phase 1–3',
      subtitle: 'Der Plan. Der eigentliche Grund für das Meeting.',
      count: 1,
      correct: 'keep',
      kevin: false,
    },
    {
      id: 'risiken',
      title: 'Risiken und Maßnahmen',
      subtitle: 'Zeigt: ihr habt nachgedacht.',
      count: 1,
      correct: 'keep',
      kevin: false,
    },
    {
      id: 'techstack',
      title: 'Technologie-Stack Empfehlung',
      subtitle: 'Was bleibt. Was geht. Was kommt.',
      count: 1,
      correct: 'keep',
      kevin: false,
    },
    {
      id: 'governance',
      title: 'Governance Framework',
      subtitle: 'Wer entscheidet was. Sehr wichtig.',
      count: 1,
      correct: 'keep',
      kevin: false,
    },
    {
      id: 'quickwins',
      title: 'Quick Wins Jahr 1',
      subtitle: 'Das Board liebt schnelle Erfolge.',
      count: 1,
      correct: 'keep',
      kevin: false,
    },
    {
      id: 'budget',
      title: 'Budget Übersicht',
      subtitle: 'Muss im Deck sein. Kein Kompromiss.',
      count: 1,
      correct: 'keep',
      kevin: false,
    },
    {
      id: 'benchmark',
      title: 'Benchmark Daten',
      subtitle: 'Zeigt: andere machen es schlechter.',
      count: 1,
      correct: 'keep',
      kevin: false,
    },
    {
      id: 'naechste',
      title: 'Nächste Schritte',
      subtitle: 'Das letzte was sie sehen. Das erste was sie vergessen.',
      count: 1,
      correct: 'keep',
      kevin: false,
    },

    // ── ANHANG (correct: useful but too detailed for the board) ──
    {
      id: 'markt19',
      title: 'ITAM Marktüberblick 2019',
      subtitle: 'Etwas veraltet. Vielleicht noch relevant.',
      count: 1,
      correct: 'anhang',
      kevin: false,
    },
    {
      id: 'glossar',
      title: 'Glossar',
      subtitle: '12 Seiten. Das Board wird es nie öffnen.',
      count: 1,
      correct: 'anhang',
      kevin: false,
    },
    {
      id: 'lizenz',
      title: 'Lizenzmatrix Detail',
      subtitle: 'Detailliert. Zu detailliert für diesen Raum.',
      count: 1,
      correct: 'anhang',
      kevin: false,
    },
    {
      id: 'interviews',
      title: 'Interview Ergebnisse Rohdaten',
      subtitle: 'Fundament der Analyse. Nicht präsentierbar.',
      count: 1,
      correct: 'anhang',
      kevin: false,
    },
    {
      id: 'backup',
      title: 'Backup Folien',
      subtitle: '"Für alle Fälle." — Es gibt 17 Fälle.',
      count: 17,
      correct: 'anhang',
      kevin: false,
    },
    {
      id: 'stakeholder',
      title: 'Stakeholder-Analyse (Detail)',
      subtitle: 'Wichtige Arbeit. Falsche Zielgruppe.',
      count: 2,
      correct: 'anhang',
      kevin: false,
    },
    {
      id: 'wettbewerb',
      title: 'Wettbewerber-Benchmarking',
      subtitle: '12 Unternehmen. Zu viel für Folie 6.',
      count: 2,
      correct: 'anhang',
      kevin: false,
    },
    {
      id: 'zeitplan',
      title: 'Detaillierter Projektzeitplan',
      subtitle: 'Mit Meilensteinen und Ampeln. Gehört in den Anhang.',
      count: 1,
      correct: 'anhang',
      kevin: false,
    },

    // ── LÖSCHEN (correct: trash these entirely) ──
    {
      id: 'uber1',
      title: 'Über Greysuit & Partner (1/3)',
      subtitle: 'Gegründet 1998. Standorte. Niemand fragt danach.',
      count: 1,
      correct: 'loeschen',
      kevin: false,
    },
    {
      id: 'uber2',
      title: 'Über Greysuit & Partner (2/3)',
      subtitle: 'Unsere Methodik — sehr detailliert. 47 Bulletpoints.',
      count: 1,
      correct: 'loeschen',
      kevin: false,
    },
    {
      id: 'uber3',
      title: 'Über Greysuit & Partner (3/3)',
      subtitle: 'Awards. Zertifikate. Logo. Kein Board-Mitglied schaut das an.',
      count: 1,
      correct: 'loeschen',
      kevin: false,
    },
    {
      id: 'ref_auto',
      title: 'Referenzprojekte Automotive',
      subtitle: 'Gute Arbeit. Falscher Kontext. Reinhold ist kein Auto.',
      count: 1,
      correct: 'loeschen',
      kevin: false,
    },
    {
      id: 'ref_retail',
      title: 'Referenzprojekte Retail',
      subtitle: 'Auch falscher Kontext. Auch raus.',
      count: 1,
      correct: 'loeschen',
      kevin: false,
    },
    {
      id: 'team',
      title: 'Unser Team',
      subtitle: 'Inkl. Kevins Foto. Er hat gelächelt.',
      count: 1,
      correct: 'loeschen',
      kevin: true,
    },
    {
      id: 'pfeil',
      title: 'Folie mit nur einem Pfeil drauf',
      subtitle: 'Richtung: rechts. Zweck: unklar. Ersteller: unbekannt.',
      count: 1,
      correct: 'loeschen',
      kevin: false,
    },
    {
      id: 'animation',
      title: 'Animation: Transformations-Journey (GIF)',
      subtitle: 'Läuft in einer Endlosschleife. Abschaltbar: nein.',
      count: 1,
      correct: 'loeschen',
      kevin: false,
    },
    {
      id: 'placeholder',
      title: 'Platzhalter — TODO',
      subtitle: 'Kevin: "das füll ich noch aus". Kevin hat es nicht ausgefüllt.',
      count: 1,
      correct: 'loeschen',
      kevin: false,
    },
    {
      id: 'hyperscaler',
      title: "Kevin's Hyperscaler Integration Matrix",
      subtitle: 'v2. Was v1 war: unbekannt. Was das bedeutet: unklar.',
      count: 1,
      correct: 'loeschen',
      kevin: false,
    },
    {
      id: 'einleitung',
      title: 'Einleitung (zu ausführlich)',
      subtitle: '4 Seiten Kontext bevor die eigentliche Präsentation beginnt.',
      count: 1,
      correct: 'loeschen',
      kevin: false,
    },
  ];

  // Verify total = 47
  // KEEP:10 + ANHANG:26 (1+1+1+1+17+2+2+1) + LÖSCHEN:11 = 47 ✓

  const TIMER_DURATION   = 90;
  const MAX_KEEP_SLIDES  = 12;
  const CORRECT_KEEP_IDS = SLIDES.filter(s => s.correct === 'keep').map(s => s.id);

  let selections         = {};
  let timerInterval      = null;
  let timeRemaining      = TIMER_DURATION;
  let onCompleteCallback = null;
  let overlayEl          = null;
  let kevinToastShown    = false;
  let finished           = false;

  // ── Public API ─────────────────────────────────────────────

  function start(onComplete) {
    onCompleteCallback = onComplete;
    finished           = false;
    kevinToastShown    = false;
    timeRemaining      = TIMER_DURATION;
    selections         = {};
    SLIDES.forEach(s => { selections[s.id] = null; });
    render();
    startTimer();
  }

  // ── Helpers ────────────────────────────────────────────────

  function getKeepCount() {
    return SLIDES
      .filter(s => selections[s.id] === 'keep')
      .reduce((sum, s) => sum + s.count, 0);
  }

  function getCorrectKeepCount() {
    return CORRECT_KEEP_IDS.filter(id => selections[id] === 'keep').length;
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ── Render ─────────────────────────────────────────────────

  function render() {
    if (overlayEl) overlayEl.remove();

    overlayEl = document.createElement('div');
    overlayEl.id = 'ppt-minigame-overlay';
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.setAttribute('aria-label', 'PowerPoint Cleanup');
    overlayEl.style.cssText = `
      position:fixed; inset:0;
      background:rgba(0,0,0,0.94);
      display:flex; flex-direction:column;
      z-index:1200;
      font-family:var(--font-mono);
      animation:fadeIn 0.25s ease;
    `;

    // ── Header bar ──
    const header = buildHeader();
    overlayEl.appendChild(header);

    // ── Legend ──
    const legend = document.createElement('div');
    legend.style.cssText = `
      padding:var(--space-xs) var(--space-md);
      background:var(--color-surface);
      border-bottom:1px solid var(--color-border);
      display:flex; gap:var(--space-md); flex-wrap:wrap;
      font-size:10px;
      flex-shrink:0;
    `;
    legend.innerHTML = `
      <span style="color:var(--color-accent-green);">✅ KEEP = ins Board-Deck (max ${MAX_KEEP_SLIDES} Folien)</span>
      <span style="color:var(--color-accent-cyan);">📎 ANHANG = Backup, nicht aktiv</span>
      <span style="color:var(--color-accent-red);">🗑️ LÖSCHEN = komplett weg</span>
    `;
    overlayEl.appendChild(legend);

    // ── Slides grid ──
    const grid = document.createElement('div');
    grid.id = 'ppt-slides-grid';
    grid.style.cssText = `
      flex:1; overflow-y:auto;
      padding:var(--space-md);
      display:grid;
      grid-template-columns:repeat(auto-fill, minmax(250px, 1fr));
      gap:var(--space-sm);
      align-content:start;
    `;

    shuffle(SLIDES).forEach(slide => {
      grid.appendChild(buildSlideCard(slide));
    });
    overlayEl.appendChild(grid);

    document.body.appendChild(overlayEl);

    header.querySelector('#ppt-submit-btn').addEventListener('click', () => {
      if (finished) return;
      window.Sound?.play('choice_made');
      finishGame(false);
    });

    if (window.KeyboardController && typeof window.KeyboardController.trapFocus === 'function') {
      window.KeyboardController.trapFocus(overlayEl);
    }
  }

  function buildHeader() {
    const h = document.createElement('div');
    h.style.cssText = `
      padding:var(--space-sm) var(--space-md);
      border-bottom:1px solid var(--color-border);
      background:var(--color-surface);
      display:flex; align-items:center; justify-content:space-between;
      gap:var(--space-md); flex-wrap:wrap; flex-shrink:0;
    `;
    h.innerHTML = `
      <div>
        <div style="color:var(--color-accent-yellow,#e3b341);font-size:var(--font-size-xs);text-transform:uppercase;letter-spacing:2px;margin-bottom:2px;">
          📊 PowerPoint Cleanup
        </div>
        <div style="color:var(--color-text-secondary);font-size:10px;">
          47 Folien — Board wartet — max ${MAX_KEEP_SLIDES} im Deck
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:var(--space-lg);">
        <div style="text-align:center;">
          <div id="ppt-keep-count" style="font-size:1.4rem;font-weight:700;color:var(--color-accent-green);line-height:1;">0</div>
          <div style="font-size:9px;color:var(--color-text-secondary);">KEEP</div>
        </div>
        <div style="text-align:center;">
          <div id="ppt-timer" style="font-size:1.6rem;font-weight:700;color:var(--color-accent-cyan);line-height:1;">${TIMER_DURATION}</div>
          <div style="font-size:9px;color:var(--color-text-secondary);">Sekunden</div>
        </div>
      </div>
      <button id="ppt-submit-btn" style="
        background:var(--color-accent-yellow,#e3b341);
        border:none; border-radius:var(--radius-sm);
        color:#000; font-family:var(--font-mono);
        font-size:var(--font-size-xs); font-weight:700;
        padding:var(--space-xs) var(--space-md);
        cursor:pointer; min-height:36px;
        white-space:nowrap; touch-action:manipulation;
      " aria-label="Deck einreichen und Minispiel beenden">Fertig →</button>
    `;
    return h;
  }

  function buildSlideCard(slide) {
    const card = document.createElement('div');
    card.dataset.slideId = slide.id;
    card.style.cssText = `
      background:var(--color-surface-raised, var(--color-surface));
      border:1px solid var(--color-border);
      border-radius:var(--radius-md);
      padding:var(--space-sm);
      display:flex; flex-direction:column; gap:var(--space-xs);
      transition:border-color 0.15s, background 0.15s;
    `;

    const titleRow = document.createElement('div');
    titleRow.style.cssText = `
      font-size:var(--font-size-sm);
      color:var(--color-text-primary);
      line-height:1.4;
      ${slide.kevin ? 'color:var(--color-accent-cyan);' : ''}
    `;
    titleRow.textContent = slide.title;

    const meta = document.createElement('div');
    meta.style.cssText = `color:var(--color-text-secondary);font-size:10px;line-height:1.4;`;
    const metaParts = [];
    if (slide.count > 1) metaParts.push(`${slide.count} Folien`);
    if (slide.subtitle)  metaParts.push(slide.subtitle);
    meta.textContent = metaParts.join(' · ');

    const btnRow = document.createElement('div');
    btnRow.style.cssText = `display:flex;gap:4px;margin-top:4px;`;
    ['keep', 'anhang', 'loeschen'].forEach(val => {
      btnRow.appendChild(makeBtn(slide.id, val));
    });

    card.appendChild(titleRow);
    if (metaParts.length > 0) card.appendChild(meta);
    card.appendChild(btnRow);
    return card;
  }

  const BTN_LABELS = { keep: '✅ KEEP', anhang: '📎 Anhang', loeschen: '🗑️ Weg' };
  const BTN_COLORS = {
    keep:     'var(--color-accent-green)',
    anhang:   'var(--color-accent-cyan)',
    loeschen: 'var(--color-accent-red)',
  };

  function makeBtn(slideId, value) {
    const btn = document.createElement('button');
    btn.dataset.slideId = slideId;
    btn.dataset.value   = value;
    btn.textContent     = BTN_LABELS[value];
    btn.setAttribute('aria-label', `${BTN_LABELS[value]} für Folie`);
    btn.style.cssText = `
      flex:1;
      background:transparent;
      border:1px solid var(--color-border);
      border-radius:var(--radius-sm);
      color:var(--color-text-secondary);
      font-family:var(--font-mono);
      font-size:9px;
      padding:3px 4px;
      cursor:pointer;
      min-height:28px;
      touch-action:manipulation;
      -webkit-tap-highlight-color:transparent;
      transition:background 0.1s, border-color 0.1s, color 0.1s;
    `;
    btn.addEventListener('click', () => handleAssign(slideId, value));
    return btn;
  }

  // ── Interaction ────────────────────────────────────────────

  function handleAssign(slideId, value) {
    if (finished) return;
    window.Sound?.play('click');
    selections[slideId] = value;
    refreshCard(slideId);
    refreshHeader();

    const slide = SLIDES.find(s => s.id === slideId);
    if (slide?.kevin && value === 'keep' && !kevinToastShown) {
      kevinToastShown = true;
      setTimeout(() => {
        window.KeyboardController?.showToast(
          '🤳 Kevin hat sich selbst in die Board-Präsentation gerettet.',
          'var(--color-accent-cyan)'
        );
      }, 200);
    }
  }

  function refreshCard(slideId) {
    if (!overlayEl) return;
    const card = overlayEl.querySelector(`[data-slide-id="${slideId}"]:not(button)`);
    if (!card) return;

    const sel   = selections[slideId];
    const color = sel ? BTN_COLORS[sel] : null;

    card.style.borderColor = color ?? 'var(--color-border)';
    card.style.background  = sel
      ? `var(--color-surface-raised, var(--color-surface))`
      : 'var(--color-surface-raised, var(--color-surface))';

    card.querySelectorAll('button[data-value]').forEach(btn => {
      const isActive = btn.dataset.value === sel;
      const c        = BTN_COLORS[btn.dataset.value];
      btn.style.background  = isActive ? c : 'transparent';
      btn.style.borderColor = isActive ? c : 'var(--color-border)';
      btn.style.color       = isActive ? '#000' : 'var(--color-text-secondary)';
      btn.style.fontWeight  = isActive ? '700' : '400';
      btn.setAttribute('aria-pressed', String(isActive));
    });

    if (color) card.style.borderColor = color;
  }

  function refreshHeader() {
    if (!overlayEl) return;
    const keepCount = getKeepCount();
    const el        = overlayEl.querySelector('#ppt-keep-count');
    if (el) {
      el.textContent = keepCount;
      el.style.color = keepCount <= MAX_KEEP_SLIDES
        ? 'var(--color-accent-green)'
        : keepCount <= 20
          ? 'var(--color-accent-yellow,#e3b341)'
          : 'var(--color-accent-red)';
    }
  }

  // ── Timer ──────────────────────────────────────────────────

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (finished) { clearInterval(timerInterval); return; }
      timeRemaining = Math.max(0, timeRemaining - 1);
      const el = overlayEl?.querySelector('#ppt-timer');
      if (el) {
        el.textContent = timeRemaining;
        el.style.color = timeRemaining <= 15
          ? 'var(--color-accent-red)'
          : timeRemaining <= 30
            ? 'var(--color-accent-yellow,#e3b341)'
            : 'var(--color-accent-cyan)';
      }
      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        finishGame(true);
      }
    }, 1000);
  }

  // ── Scoring & Result ───────────────────────────────────────

  function finishGame(timedOut = false) {
    if (finished) return;
    finished = true;
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }

    const keepCount        = getKeepCount();
    const correctKeepCount = getCorrectKeepCount();
    const kevinInKeep      = selections['team'] === 'keep';

    const isExcellent = keepCount <= MAX_KEEP_SLIDES && correctKeepCount >= 8;
    const isGood      = keepCount <= 20 && !isExcellent;

    const accentColor = isExcellent
      ? 'var(--color-accent-green)'
      : isGood
        ? 'var(--color-accent-yellow,#e3b341)'
        : 'var(--color-accent-red)';

    const effectsToApply = isExcellent
      ? { kompetenz: 6, prestige: 4 }
      : isGood
        ? { kompetenz: 2, bullshit: 3 }
        : { bullshit: 8, burnout: 5 };

    const headline = isExcellent
      ? 'Exzellentes Deck.'
      : isGood
        ? 'Solides Deck — mit Optimierungspotenzial.'
        : 'Das Board hat 90 Minuten. Das hier dauert 4 Stunden.';

    const comment = isExcellent
      ? `${keepCount} Folien. ${correctKeepCount} von 10 Kernfolien behalten. Müller-Brandt sagt nichts — das bedeutet: gut.`
      : isGood
        ? `${keepCount} Folien im Deck. Etwas viel, aber der Anhang rettet euch. Vielleicht.`
        : `${keepCount} Folien. Das ist kein Deck. Das ist ein Buch. Mit schlechten Bildern. Das Board schaut nach Folie 8 weg.`;

    const grid = overlayEl?.querySelector('#ppt-slides-grid');
    if (!grid) { finish(effectsToApply, isExcellent); return; }

    grid.style.cssText = `
      flex:1;
      display:flex; align-items:center; justify-content:center;
      padding:var(--space-xl);
    `;

    grid.innerHTML = `
      <div style="
        background:var(--color-surface);
        border:1px solid ${accentColor};
        border-radius:var(--radius-lg);
        padding:var(--space-xl);
        max-width:480px; width:100%;
        text-align:center;
        animation:levelUpCard 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
        box-sizing:border-box;
      ">
        <div style="font-size:3rem;margin-bottom:var(--space-sm);animation:levelUpEmoji 0.5s ease both;">
          ${isExcellent ? '📋' : isGood ? '📊' : '📉'}
        </div>
        <div style="font-size:var(--font-size-xs);color:var(--color-accent-yellow,#e3b341);text-transform:uppercase;letter-spacing:2px;margin-bottom:var(--space-xs);">
          ${timedOut ? '⏱️ Zeit abgelaufen — Deck wird eingereicht' : 'Deck eingereicht'}
        </div>
        <div style="font-size:2rem;font-weight:700;color:${accentColor};font-family:var(--font-mono);margin-bottom:var(--space-xs);">${keepCount} Folien</div>
        <div style="font-size:var(--font-size-sm);color:${accentColor};font-weight:600;margin-bottom:var(--space-md);">${headline}</div>
        <p style="color:var(--color-text-secondary);font-size:var(--font-size-sm);line-height:1.6;margin:0 0 var(--space-lg);font-style:italic;">"${comment}"</p>
        <div style="display:flex;gap:var(--space-md);justify-content:center;margin-bottom:var(--space-lg);flex-wrap:wrap;">
          <div style="text-align:center;">
            <div style="font-family:var(--font-mono);font-size:1.2rem;font-weight:700;color:${accentColor};">${keepCount}</div>
            <div style="font-size:10px;color:var(--color-text-secondary);">Folien im Deck</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:var(--font-mono);font-size:1.2rem;font-weight:700;color:var(--color-text-secondary);">${correctKeepCount}/10</div>
            <div style="font-size:10px;color:var(--color-text-secondary);">Kernfolien behalten</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:var(--font-mono);font-size:1.2rem;font-weight:700;color:${kevinInKeep ? 'var(--color-accent-cyan)' : 'var(--color-accent-green)'};">
              ${kevinInKeep ? '🤳' : '✓'}
            </div>
            <div style="font-size:10px;color:var(--color-text-secondary);">${kevinInKeep ? 'Kevin approved' : 'Kevin entfernt'}</div>
          </div>
        </div>
        <button id="ppt-continue-btn" style="
          width:100%;
          background:${accentColor};
          border:none; border-radius:var(--radius-md);
          color:#000; font-family:var(--font-mono);
          font-size:var(--font-size-sm); font-weight:700;
          padding:var(--space-sm) var(--space-md);
          cursor:pointer; min-height:var(--touch-target,44px);
          touch-action:manipulation;
        ">Weiter →</button>
      </div>
    `;

    window.Sound?.play('achievement');

    grid.querySelector('#ppt-continue-btn').addEventListener('click', () => {
      window.Sound?.play('click');
      finish(effectsToApply, isExcellent);
    });
  }

  function finish(effectsToApply, setTightDeck) {
    if (overlayEl) {
      overlayEl.style.opacity    = '0';
      overlayEl.style.transition = 'opacity 0.25s ease';
      setTimeout(() => { overlayEl?.remove(); overlayEl = null; }, 260);
    }

    if (window.Engine?.applyEffects) {
      window.Engine.applyEffects(effectsToApply);
    }

    if (setTightDeck && window.Engine?.GameState?.flags) {
      window.Engine.GameState.flags.tight_deck = true;
    }

    if (typeof onCompleteCallback === 'function') {
      onCompleteCallback();
      onCompleteCallback = null;
    }
  }

  return { start };

})();
