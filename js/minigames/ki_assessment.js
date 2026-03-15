/**
 * KI Readiness Assessment Minigame
 * A multiple-choice questionnaire that evaluates a client's readiness for AI.
 * 8 questions, 3 answers each (optimistic/realistic/clueless), max 16 points.
 * Exposed as window.KIAssessmentMinigame.
 */
'use strict';

window.KIAssessmentMinigame = (() => {

  const QUESTIONS = [
    {
      question: 'Wie gut ist die vorhandene Datenbasis?',
      answers: [
        { text: 'Sehr gut — vollständig, konsistent, zentral verfügbar.', points: 1 },
        { text: 'Fragmentiert — sechs Systeme, keine einheitliche Strategie.', points: 2 },
        { text: 'Was ist eine Datenbasis?', points: 0 },
      ],
    },
    {
      question: 'Gibt es eine dokumentierte Datenstrategie?',
      answers: [
        { text: 'Ja — vollständig dokumentiert und aktiv genutzt.', points: 2 },
        { text: 'In Arbeit. Seit 2019.', points: 1 },
        { text: 'Der CEO hat das beim Joggen entschieden.', points: 0 },
      ],
    },
    {
      question: 'Welche GPU/KI-Infrastruktur steht zur Verfügung?',
      answers: [
        { text: 'Dedizierte KI-Infrastruktur, on-premise oder Cloud.', points: 2 },
        { text: 'Cloud-basiert, skalierbar auf Abruf.', points: 2 },
        { text: 'Mein Laptop hat eine GTX 1060.', points: 0 },
      ],
    },
    {
      question: 'Wie hoch ist die KI-Literacy der Belegschaft?',
      answers: [
        { text: 'Regelmäßige Schulungen, dediziertes KI-Team vorhanden.', points: 2 },
        { text: 'Drei Personen waren auf einem Webinar.', points: 1 },
        { text: 'Kevin hat YouTube geschaut.', points: 0 },
      ],
    },
    {
      question: 'Wann war die letzte erfolgreiche große IT-Transformation?',
      answers: [
        { text: 'Letztes Jahr — on schedule, on budget.', points: 2 },
        { text: '2019 — mit Verzögerungen, aber abgeschlossen.', points: 1 },
        { text: 'Wir erwähnen 2021 nicht.', points: 0 },
      ],
    },
    {
      question: 'Wie ausgereift ist der Change-Management-Prozess?',
      answers: [
        { text: 'Ausgereift — erprobt, mit klaren Rollen und Eskalationspfaden.', points: 2 },
        { text: 'Vorhanden, wird aber selten konsequent angewendet.', points: 1 },
        { text: 'Der CEO kündigt Veränderungen per Newsletter an.', points: 0 },
      ],
    },
    {
      question: 'Sind die regulatorischen Anforderungen bekannt und dokumentiert?',
      answers: [
        { text: 'Vollständig dokumentiert, Legal und Compliance eingebunden.', points: 2 },
        { text: 'Grundsätzlich bekannt — Details noch offen.', points: 1 },
        { text: 'Das klärt Legal schon irgendwie.', points: 0 },
      ],
    },
    {
      question: 'Steht ein realistisches Budget für 18 Monate KI-Vorbereitung bereit?',
      answers: [
        { text: 'Ja — definiert, genehmigt, mit Puffer für Unvorhergesehenes.', points: 2 },
        { text: 'Flexibel. (CEO-Wort für: unklar.)', points: 1 },
        { text: 'Der ROI kommt von selbst — da müssen wir nichts investieren.', points: 0 },
      ],
    },
  ];

  const COMMENTS = {
    high:   'Die Grundlagen sind vorhanden. KI ist in 12–18 Monaten denkbar — mit der richtigen Datenstrategie und Change-Management.',
    medium: 'Einige Bausteine sind da. Viel fehlt noch. KI-Readiness ist ein 18-Monats-Projekt — mindestens.',
    low:    'Ehrliche Einschätzung: noch nicht bereit. Das Fundament muss zuerst gebaut werden. KI kommt danach.',
  };

  let onCompleteCallback = null;
  let currentQuestion    = 0;
  let totalPoints        = 0;
  let answers            = [];
  let overlayEl          = null;

  function start(onComplete) {
    onCompleteCallback = onComplete;
    currentQuestion    = 0;
    totalPoints        = 0;
    answers            = [];
    render();
  }

  function render() {
    if (overlayEl) overlayEl.remove();

    overlayEl = document.createElement('div');
    overlayEl.id = 'ki-assessment-overlay';
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.setAttribute('aria-label', 'KI Readiness Assessment');
    overlayEl.style.cssText = `
      position:fixed; inset:0;
      background:rgba(0,0,0,0.88);
      display:flex; align-items:center; justify-content:center;
      z-index:1200;
      padding:var(--space-md);
      box-sizing:border-box;
      animation:fadeIn 0.25s ease;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      background:var(--color-surface);
      border:1px solid var(--color-accent-cyan);
      border-radius:var(--radius-lg);
      padding:var(--space-xl);
      max-width:600px;
      width:100%;
      max-height:90vh;
      overflow-y:auto;
      box-sizing:border-box;
    `;

    if (currentQuestion < QUESTIONS.length) {
      renderQuestion(card);
    } else {
      renderResult(card);
    }

    overlayEl.appendChild(card);
    document.body.appendChild(overlayEl);

    if (window.KeyboardController && typeof window.KeyboardController.trapFocus === 'function') {
      window.KeyboardController.trapFocus(overlayEl);
    }

    const firstBtn = card.querySelector('button');
    if (firstBtn) firstBtn.focus();
  }

  function renderQuestion(card) {
    const q = QUESTIONS[currentQuestion];
    const progress = currentQuestion + 1;

    card.innerHTML = `
      <div style="margin-bottom:var(--space-md);">
        <div style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          margin-bottom:var(--space-sm);
        ">
          <span style="
            font-family:var(--font-mono);
            font-size:var(--font-size-xs);
            color:var(--color-accent-cyan);
            text-transform:uppercase;
            letter-spacing:1px;
          ">🤖 KI-Readiness Assessment</span>
          <span style="
            font-family:var(--font-mono);
            font-size:var(--font-size-xs);
            color:var(--color-text-secondary);
          ">${progress} / ${QUESTIONS.length}</span>
        </div>
        <div style="
          height:3px;
          background:var(--color-border);
          border-radius:2px;
          overflow:hidden;
        ">
          <div style="
            height:100%;
            width:${(currentQuestion / QUESTIONS.length) * 100}%;
            background:var(--color-accent-cyan);
            transition:width 0.3s ease;
          "></div>
        </div>
      </div>
      <p style="
        color:var(--color-text-primary);
        font-size:var(--font-size-md);
        line-height:1.6;
        margin:0 0 var(--space-lg);
        font-weight:500;
      ">${q.question}</p>
      <div id="ki-answers" style="display:flex;flex-direction:column;gap:var(--space-sm);"></div>
    `;

    const answersEl = card.querySelector('#ki-answers');
    q.answers.forEach((ans, i) => {
      const btn = document.createElement('button');
      btn.textContent = ans.text;
      btn.style.cssText = `
        background:var(--color-surface-raised);
        border:1px solid var(--color-border);
        border-radius:var(--radius-md);
        color:var(--color-text-primary);
        font-family:var(--font-mono);
        font-size:var(--font-size-sm);
        padding:var(--space-sm) var(--space-md);
        cursor:pointer;
        text-align:left;
        line-height:1.5;
        min-height:var(--touch-target, 44px);
        transition:border-color 0.15s, background 0.15s;
        touch-action:manipulation;
        -webkit-tap-highlight-color:transparent;
      `;
      btn.setAttribute('aria-label', `Antwort ${i + 1}: ${ans.text}`);

      btn.addEventListener('mouseenter', () => {
        btn.style.borderColor = 'var(--color-accent-cyan)';
        btn.style.background  = 'var(--color-border)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.borderColor = 'var(--color-border)';
        btn.style.background  = 'var(--color-surface-raised)';
      });
      btn.addEventListener('click', () => {
        window.Sound?.play('click');
        selectAnswer(ans.points);
      });

      answersEl.appendChild(btn);
    });
  }

  function selectAnswer(points) {
    totalPoints += points;
    answers.push(points);
    currentQuestion++;

    if (currentQuestion < QUESTIONS.length) {
      render();
    } else {
      render();
    }
  }

  function renderResult(card) {
    const maxPoints  = QUESTIONS.length * 2;
    const percent    = Math.round((totalPoints / maxPoints) * 100);
    const isHigh     = percent >= 75;
    const isMedium   = percent >= 40 && percent < 75;
    const accentColor = isHigh ? 'var(--color-accent-green)' : isMedium ? 'var(--color-accent-yellow, #e3b341)' : 'var(--color-accent-red)';
    const label      = isHigh ? 'KI-ready (mit Arbeit)' : isMedium ? 'Grundlagen vorhanden — viel zu tun' : 'Noch nicht bereit — bitte ehrlich sein';
    const comment    = isHigh ? COMMENTS.high : isMedium ? COMMENTS.medium : COMMENTS.low;

    const effectsToApply = isHigh
      ? { kompetenz: 5 }
      : isMedium
        ? { kompetenz: 2 }
        : { kompetenz: 3, bullshit: -3 };

    card.innerHTML = `
      <div style="text-align:center; margin-bottom:var(--space-lg);">
        <div style="
          font-size:3rem;
          margin-bottom:var(--space-sm);
          animation:levelUpEmoji 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
        ">🤖</div>
        <div style="
          font-family:var(--font-mono);
          font-size:var(--font-size-xs);
          color:var(--color-accent-cyan);
          text-transform:uppercase;
          letter-spacing:2px;
          margin-bottom:var(--space-xs);
        ">KI-Readiness Score</div>
        <div style="
          font-size:3.5rem;
          font-weight:700;
          color:${accentColor};
          font-family:var(--font-mono);
          line-height:1;
          margin-bottom:var(--space-xs);
        ">${percent}<span style="font-size:1.5rem;">/100</span></div>
        <div style="
          font-size:var(--font-size-sm);
          color:${accentColor};
          font-family:var(--font-mono);
          font-weight:600;
          margin-bottom:var(--space-md);
        ">${label}</div>
        <div style="
          height:8px;
          background:var(--color-border);
          border-radius:4px;
          overflow:hidden;
          margin:0 auto var(--space-md);
          max-width:300px;
        ">
          <div style="
            height:100%;
            width:0%;
            background:${accentColor};
            border-radius:4px;
            transition:width 1s ease;
          " id="ki-result-bar"></div>
        </div>
        <p style="
          color:var(--color-text-secondary);
          font-size:var(--font-size-sm);
          line-height:1.6;
          margin:0 0 var(--space-lg);
          font-style:italic;
          text-align:left;
        ">"${comment}"</p>
      </div>
      <button id="ki-continue-btn" style="
        width:100%;
        background:var(--color-accent-cyan);
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
      ">Weiter →</button>
    `;

    setTimeout(() => {
      const bar = card.querySelector('#ki-result-bar');
      if (bar) bar.style.width = `${percent}%`;
    }, 50);

    window.Sound?.play('achievement');

    card.querySelector('#ki-continue-btn').addEventListener('click', () => {
      window.Sound?.play('click');
      finish(effectsToApply);
    });
  }

  function finish(effectsToApply) {
    if (overlayEl) {
      overlayEl.style.opacity = '0';
      overlayEl.style.transition = 'opacity 0.25s ease';
      setTimeout(() => {
        overlayEl?.remove();
        overlayEl = null;
      }, 260);
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
