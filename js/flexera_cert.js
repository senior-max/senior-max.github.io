/**
 * flexera_cert.js
 * Flexera One Certification screen for "License To Bill".
 * Runs after compliance training, before projekt_dieter.
 * Visual design replicates flexera.com — authentic before satire.
 * Depends: engine.js, storage.js, achievements.js
 */

(function () {
  'use strict';

  const FLEXERA = {
    orange: '#E8622A',
    orangeLt: '#F07840',
    navy: '#1A1A2E',
    dark: '#1D1D1D',
    gray: '#F5F5F5',
    midGray: '#6B6B6B',
    border: '#E0E0E0',
    white: '#FFFFFF',
    green: '#2E7D32',
    red: '#C62828',
  };

  const SECTIONS = [
    {
      id: 'sam',
      title: 'SAM Grundlagen',
      icon: '📦',
      intro: 'IT Asset Management — Conquer complexity in your technology portfolio',
      questions: [
        {
          q: 'Was ist der Hauptzweck von Software Asset Management?',
          options: [
            { text: 'Software möglichst teuer einzukaufen', correct: false },
            { text: 'Den IT-Keller aufzuräumen', correct: false },
            { text: 'Lizenzen verwalten und Compliance sicherstellen', correct: true },
            { text: 'Kevin zu beschäftigen', correct: false },
          ],
          correctFeedback: 'Korrekt. SAM reduziert Kosten und Audit-Risiken erheblich.',
          wrongFeedback: 'Falsch. Bitte lesen Sie das Flexera SAM Whitepaper. Es hat 847 Seiten. Seite 3 reicht.',
          buchhaltungOption: -1,
        },
        {
          q: "Was versteht man unter einem 'Zombie-Device'?",
          options: [
            { text: 'Ein Gerät das im System existiert aber physisch nicht mehr vorhanden ist', correct: true },
            { text: 'Ein Gerät das Kevin betreut', correct: false },
            { text: 'Ein sehr langsamer Server', correct: false },
            { text: 'BUCHHALTUNG 2006', correct: false },
          ],
          correctFeedback: 'Richtig. Zombie-Devices verfälschen Ihre Lizenzposition erheblich.',
          wrongFeedback: "Falsch — obwohl 'BUCHHALTUNG 2006' faktisch alle Kriterien erfüllt.",
          buchhaltungOption: 3,
        },
        {
          q: "Was bedeutet 'True-Up'?",
          options: [
            { text: 'Ein Software-Update', correct: false },
            { text: 'Wenn der Kaffeeautomat wieder funktioniert', correct: false },
            { text: 'Die jährliche Nachzahlung für überschrittene Lizenzmengen', correct: true },
            { text: 'Müller-Brandts Lieblingsphrase', correct: false },
          ],
          correctFeedback: 'Korrekt. True-Up ist meistens eine unangenehme Überraschung.',
          wrongFeedback: 'Falsch. Oracle freut sich über Ihre Unwissenheit. Sehr.',
          buchhaltungOption: -1,
        },
        {
          q: 'Wie lange dauert ein typischer Flexera Discovery-Scan?',
          options: [
            { text: '5 Minuten', correct: false },
            { text: 'Genau 1 Stunde', correct: false },
            { text: 'Abhängig von Infrastruktur — oft Stunden bis Tage', correct: true },
            { text: 'Bis Kevin fertig ist', correct: false },
          ],
          correctFeedback: 'Korrekt. Planen Sie ausreichend Zeit.',
          wrongFeedback: 'Falsch. Fragen Sie nie Kevin wie lange Discovery dauert.',
          buchhaltungOption: -1,
        },
      ],
    },
    {
      id: 'flexera',
      title: 'Flexera One Bedienung',
      icon: '🔍',
      intro: 'IT Visibility — Actionable insights into the hybrid IT estate',
      questions: [
        {
          q: 'Wo finden Sie die Software-Compliance-Übersicht in Flexera One?',
          options: [
            { text: 'Unter Einstellungen', correct: false },
            { text: 'Kevin weiß das', correct: false },
            { text: 'Reports → Standard Reports → Software Reports → Compliance Reports → Software Compliance Summary', correct: true },
            { text: 'Die gibt es nicht mehr seit dem letzten Update', correct: false },
          ],
          correctFeedback: 'Richtig. Nur 4 Klicks. Plus Ladezeit. Plus der Ladebalken bleibt bei 94%.',
          wrongFeedback: 'Falsch. Der vollständige Pfad ist: Reports → Standard Reports → Software Reports → Compliance Reports → Software Compliance Summary. Das Minigame später hilft beim Üben.',
          buchhaltungOption: -1,
          pathQuestion: true,
        },
        {
          q: "Was bedeutet der Status 'Under-licensed' in Flexera One?",
          options: [
            { text: 'Sie nutzen mehr Software als lizenziert — Nachkauf oder Deinstallation erforderlich', correct: true },
            { text: 'Die Lizenz ist zu günstig', correct: false },
            { text: 'Flexera hat einen Fehler gemacht', correct: false },
            { text: 'Kevin hat etwas installiert', correct: false },
          ],
          correctFeedback: 'Korrekt. Under-licensed ist der häufigste — und teuerste — Befund.',
          wrongFeedback: 'Falsch. Under-licensed bedeutet: Oracle ruft bald an.',
          buchhaltungOption: -1,
        },
        {
          q: 'Ein Discovery-Agent meldet sich nicht zurück. Was prüfen Sie zuerst?',
          options: [
            { text: 'Ob Kevin den Server neugestartet hat', correct: false },
            { text: 'Netzwerkverbindung, Firewall-Regeln und Agent-Status im Management-Server', correct: true },
            { text: 'Ob der Server überhaupt existiert', correct: false },
            { text: 'BUCHHALTUNG 2006 neustarten', correct: false },
          ],
          correctFeedback: 'Richtig. Systematisch vorgehen. KB-Article FLX-2019-4471 hilft. Er ist veraltet aber nah dran.',
          wrongFeedback: 'Falsch. BUCHHALTUNG 2006 neuzustarten ist nie die Antwort. Auch wenn es sich manchmal anfühlt.',
          buchhaltungOption: 3,
        },
        {
          q: "Was ist ein 'Flexera Beacon'?",
          options: [
            { text: 'Eine Komponente die Discovery-Daten aus entfernten Netzwerksegmenten weiterleitet', correct: true },
            { text: 'Müller-Brandts Lieblingstool', correct: false },
            { text: 'Ein Signal das Oracle-Auditoren anzieht', correct: false },
            { text: 'Ein Marketing-Begriff ohne technischen Inhalt', correct: false },
          ],
          correctFeedback: 'Korrekt. Beacons sind essentiell für verteilte Umgebungen.',
          wrongFeedback: "Falsch. Ein Beacon ist kein Marketing-Begriff. Das ist 'Synergy Score™'.",
          buchhaltungOption: -1,
        },
      ],
    },
    {
      id: 'compliance',
      title: 'Compliance & Audit',
      icon: '⚖️',
      intro: 'Defend against vendor audits and strengthen your position in vendor negotiations.',
      questions: [
        {
          q: 'Oracle kündigt ein Lizenz-Audit an. Was ist Ihre erste Reaktion?',
          options: [
            { text: 'Panik', correct: false },
            { text: 'Urlaub einreichen', correct: false },
            { text: 'Aktuellen Lizenzbestand dokumentieren und Rechtsabteilung informieren', correct: true },
            { text: 'Tyler von AWS anrufen — er freut sich', correct: false },
          ],
          correctFeedback: 'Richtig. Vorbereitung ist alles. Panik kommt automatisch später.',
          wrongFeedback: 'Falsch. Panik ist verständlich aber keine Strategie. Obwohl Müller-Brandt das anders sieht.',
          buchhaltungOption: -1,
        },
        {
          q: "Was ist 'Shadow IT'?",
          options: [
            { text: 'IT-Systeme die ohne Wissen der IT-Abteilung betrieben werden', correct: true },
            { text: 'Der Server im Keller', correct: false },
            { text: "Kevin's persönliches Excel-Makro", correct: false },
            { text: 'Alle obigen Antworten treffen zu', correct: false },
          ],
          correctFeedback: 'Korrekt — obwohl statistisch gesehen alle Antworten zutreffen.',
          wrongFeedback: 'Falsch. Shadow IT ist ein ernstes Compliance-Risiko. Der Server im Keller auch.',
          buchhaltungOption: -1,
        },
        {
          q: 'Wie berechnet Oracle die Lizenzpflicht für Datenbankserver?',
          options: [
            { text: 'Anzahl Nutzer × Tagessatz', correct: false },
            { text: 'Das entscheidet Kevin', correct: false },
            { text: 'Nach Prozessoren oder Named User Plus — je nachdem was für Oracle teurer ist', correct: true },
            { text: 'Das weiß niemand genau, auch Oracle nicht', correct: false },
          ],
          correctFeedback: "Korrekt. Oracle's Lizenzregeln sind komplex. Das ist kein Zufall.",
          wrongFeedback: "Falsch. Die ehrlichste Antwort wäre 'Das weiß niemand genau' — aber das können wir nicht offiziell bestätigen.",
          buchhaltungOption: -1,
        },
        {
          q: 'Sie haben Flexera One konfiguriert. Der Discovery-Scan läuft. Der Fortschrittsbalken zeigt 94%.\n\nWas tun Sie?',
          options: [
            { text: 'Warten — er wird fertig', correct: true },
            { text: 'Kevin fragen', correct: true },
            { text: 'Neustart versuchen', correct: true },
            { text: 'Warten. Er ist immer bei 94%. Das ist normal. Das war schon immer so. Niemand weiß warum.', correct: true },
          ],
          correctFeedback: 'Richtig. Willkommen bei Flexera.',
          wrongFeedback: '',
          buchhaltungOption: -1,
          allCorrect: true,
          ninetyFourOption: 3,
        },
      ],
    },
  ];

  const state = {
    currentSection: 0,
    currentQuestion: 0,
    score: 0,
    onComplete: null,
    certId: null,
  };

  let overlayEl = null;
  let contentCardEl = null;
  let loadBarInterval = null;
  let loadBarStartTime = 0;

  /**
   * Generates a random 8-char cert ID: FLX-XXXXXXXX.
   */
  function generateCertId() {
    return 'FLX-' + Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  /**
   * Builds the 94% loading bar (easter egg).
   */
  function buildLoadBar() {
    const wrap = document.createElement('div');
    wrap.title = '94% — Lädt seit 00:00:00';
    wrap.style.cssText = 'display:flex;align-items:center;gap:8px;margin-left:16px;';

    const label = document.createElement('span');
    label.style.cssText = 'font-size:10px;color:#3A3A3A;';
    label.textContent = 'Synchronisiert...';

    const barWrap = document.createElement('div');
    barWrap.style.cssText = 'width:120px;height:3px;background:#E0E0E0;border-radius:2px;overflow:hidden;';

    const barFill = document.createElement('div');
    barFill.id = 'flexera-load-bar-fill';
    barFill.style.cssText = 'height:100%;width:0%;background:#E8622A;transition:width 0.5s ease;';

    barWrap.appendChild(barFill);
    wrap.appendChild(label);
    wrap.appendChild(barWrap);

    loadBarStartTime = Date.now();
    setTimeout(() => {
      const el = document.getElementById('flexera-load-bar-fill');
      if (el) el.style.width = '94%';
    }, 2000);

    if (loadBarInterval) clearInterval(loadBarInterval);
    loadBarInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - loadBarStartTime) / 1000);
      const h = Math.floor(elapsed / 3600);
      const m = Math.floor((elapsed % 3600) / 60);
      const s = elapsed % 60;
      wrap.title = `94% — Lädt seit ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }, 1000);

    return wrap;
  }

  /**
   * Builds topbar with logo and load bar.
   */
  function buildTopbar() {
    const top = document.createElement('div');
    top.style.cssText = [
      'height:56px', 'background:#FFFFFF', 'border-bottom:1px solid #E0E0E0',
      'box-shadow:0 1px 4px rgba(0,0,0,0.08)', 'padding:0 32px',
      'display:flex', 'align-items:center', 'justify-content:space-between',
    ].join(';');

    const logo = document.createElement('div');
    logo.style.cssText = 'display:flex;align-items:center;gap:10px;';
    logo.innerHTML = `
      <div style="width:16px;height:16px;background:#E8622A;flex-shrink:0;"></div>
      <span style="font-family:Inter,Segoe UI,sans-serif;font-weight:700;font-size:1.2rem;color:#1A1A1A;letter-spacing:-0.02em;">flexera</span>
      <span style="color:#E0E0E0;margin:0 8px;">|</span>
      <span style="color:#3A3A3A;font-size:0.8rem;">Certification Portal</span>
    `;

    const right = document.createElement('div');
    right.style.cssText = 'display:flex;align-items:center;gap:10px;';
    right.innerHTML = `
      <div style="width:32px;height:32px;border-radius:50%;background:#E8622A;color:white;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:600;">NM</div>
      <span style="color:#3A3A3A;font-size:0.8rem;">Neuer Mitarbeiter</span>
    `;
    right.appendChild(buildLoadBar());

    top.appendChild(logo);
    top.appendChild(right);
    return top;
  }

  /**
   * Builds hero section.
   */
  function buildHero(progressState) {
    const hero = document.createElement('div');
    hero.style.cssText = [
      'background:linear-gradient(135deg,#1A1A2E 0%,#2D2D4E 100%)',
      'padding:48px 32px', 'text-align:center', 'color:white',
    ].join(';');

    const badges = SECTIONS.map((s, i) => {
      const done = i < state.currentSection;
      const active = i === state.currentSection;
      const label = i === 0 ? 'SAM Grundlagen' : i === 1 ? 'Flexera One Bedienung' : 'Compliance & Audit';
      return `
        <div style="
          display:inline-block;padding:12px 20px;margin:0 8px;border-radius:6px;
          border:2px solid ${done ? FLEXERA.orange : active ? '#fff' : 'rgba(255,255,255,0.3)'};
          opacity:${!done && !active ? 0.5 : 1};
          background:${done ? 'rgba(232,98,42,0.2)' : 'transparent'};
        ">
          <span style="font-size:1.2rem;margin-right:6px;">${done ? '✓' : active ? '◉' : '○'}</span>
          <span style="font-size:0.85rem;">${label}</span>
        </div>
      `;
    }).join('');

    hero.innerHTML = `
      <div style="font-size:0.75rem;color:rgba(255,255,255,0.3);margin-bottom:12px;">Flexera One > Lernportal > Grundzertifizierung</div>
      <h1 style="font-family:Inter,Segoe UI,sans-serif;font-size:clamp(1.6rem,4vw,2.4rem);font-weight:700;margin:0 0 8px;">Flexera One Certified SAM Analyst</h1>
      <p style="font-size:1rem;color:rgba(255,255,255,0.65);margin:0 0 24px;">Optimize your IT with full visibility, cost control & compliance</p>
      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;">${badges}</div>
    `;
    return hero;
  }

  /**
   * Builds content card wrapper.
   */
  function buildContentCard() {
    const card = document.createElement('div');
    card.style.cssText = [
      'max-width:720px', 'margin:32px auto', 'background:white',
      'border-radius:8px', 'box-shadow:0 2px 12px rgba(0,0,0,0.08)',
      'border:1px solid #E0E0E0', 'overflow:hidden',
    ].join(';');
    card.innerHTML = '<div style="height:4px;background:#E8622A;width:100%;"></div><div id="flexera-card-body" style="padding:32px;"></div>';
    return card;
  }

  /**
   * Builds footer.
   */
  function buildFooter() {
    const footer = document.createElement('div');
    footer.style.cssText = [
      'background:#1A1A2E', 'color:rgba(255,255,255,0.5)', 'font-size:0.72rem',
      'padding:12px 32px', 'display:flex', 'justify-content:space-between',
      'flex-wrap:wrap', 'gap:8px',
    ].join(';');
    footer.innerHTML = `
      <span>© 2024 Flexera. All rights reserved.</span>
      <span>Flexera One Certification Program v4.2.1</span>
      <span>Support: <span style="color:rgba(255,255,255,0.7);cursor:pointer;">certification@flexera.com</span></span>
    `;
    return footer;
  }

  /**
   * Builds full overlay structure.
   */
  function buildOverlay() {
    document.getElementById('flexera-cert-overlay')?.remove();
    overlayEl = document.createElement('div');
    overlayEl.id = 'flexera-cert-overlay';
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.setAttribute('aria-label', 'Flexera One Zertifizierung');
    overlayEl.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:99999',
      'background:#F5F5F5', 'display:flex', 'flex-direction:column',
      'font-family:Inter,Segoe UI,sans-serif;font-weight:400',
    ].join(';');

    overlayEl.appendChild(buildTopbar());
    overlayEl.appendChild(buildHero());
    const scroll = document.createElement('div');
    scroll.style.cssText = 'flex:1;overflow-y:auto;';
    contentCardEl = buildContentCard();
    scroll.appendChild(contentCardEl);
    overlayEl.appendChild(scroll);
    overlayEl.appendChild(buildFooter());

    document.getElementById('app').appendChild(overlayEl);
  }

  /**
   * Updates hero progress badges.
   */
  function updateHero() {
    if (!overlayEl) return;
    const hero = overlayEl.querySelector('div[style*="linear-gradient"]');
    if (hero) hero.replaceWith(buildHero());
  }

  /**
   * Renders intro screen.
   */
  function showIntro() {
    const body = document.getElementById('flexera-card-body');
    if (!body) return;

    body.innerHTML = `
      <div style="margin-bottom:20px;">
        <span style="background:#FFF3E0;color:#E8622A;border:1px solid #E8622A;font-size:0.72rem;padding:3px 10px;border-radius:12px;">PFLICHTSCHULUNG</span>
      </div>
      <h2 style="font-size:1.4rem;font-weight:700;color:#1A1A1A;margin:0 0 8px;">Willkommen zur Flexera One Grundzertifizierung</h2>
      <p style="color:#3A3A3A;font-size:0.95rem;margin:0 0 24px;">Pflichtschulung für alle Mitarbeitenden mit Flexera-Zugang</p>

      <div class="flexera-info-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px;">
        <div style="padding:16px;background:#F5F5F5;border-radius:6px;border:1px solid #E0E0E0;">
          <div style="font-size:1.2rem;margin-bottom:8px;">📋</div>
          <div style="font-weight:600;color:#1A1A1A;">12 Fragen</div>
          <div style="font-size:0.85rem;color:#3A3A3A;">3 Themenbereiche</div>
        </div>
        <div style="padding:16px;background:#F5F5F5;border-radius:6px;border:1px solid #E0E0E0;">
          <div style="font-size:1.2rem;margin-bottom:8px;">⏱️</div>
          <div style="font-weight:600;color:#1A1A1A;">Ca. 20 Minuten</div>
          <div style="font-size:0.85rem;color:#3A3A3A;">Keine Zeitbegrenzung</div>
        </div>
        <div style="padding:16px;background:#F5F5F5;border-radius:6px;border:1px solid #E0E0E0;">
          <div style="font-size:1.2rem;margin-bottom:8px;">✅</div>
          <div style="font-weight:600;color:#1A1A1A;">70% zum Bestehen</div>
          <div style="font-size:0.85rem;color:#3A3A3A;">(8 von 12 richtig)</div>
        </div>
        <div style="padding:16px;background:#F5F5F5;border-radius:6px;border:1px solid #E0E0E0;">
          <div style="font-size:1.2rem;margin-bottom:8px;">🏆</div>
          <div style="font-weight:600;color:#1A1A1A;">Zertifikat</div>
          <div style="font-size:0.85rem;color:#3A3A3A;">wird ausgestellt</div>
        </div>
      </div>

      <div style="background:#F5F5F5;border:1px solid #E0E0E0;border-radius:6px;padding:16px;margin-bottom:24px;font-size:0.9rem;color:#3A3A3A;line-height:1.5;">
        ℹ️ Diese Zertifizierung ist Voraussetzung für die Arbeit mit Flexera One. Das Zertifikat ist 12 Monate gültig. Flexera One selbst funktioniert auch ohne Zertifikat.
      </div>

      <button id="flexera-start-btn" style="width:100%;background:#E8622A;color:white;border:none;border-radius:4px;padding:14px;font-weight:600;font-size:1rem;cursor:pointer;font-family:inherit;">
        Zertifizierung starten →
      </button>
    `;

    document.getElementById('flexera-start-btn')?.addEventListener('click', () => {
      state.certId = generateCertId();
      showSectionIntro(0);
    });
  }

  /**
   * Renders section intro.
   */
  function showSectionIntro(sectionIdx) {
    const sec = SECTIONS[sectionIdx];
    state.currentSection = sectionIdx;
    updateHero();

    const body = document.getElementById('flexera-card-body');
    if (!body) return;

    body.innerHTML = `
      <div style="text-align:center;padding:24px 0;">
        <div style="font-size:48px;margin-bottom:16px;color:#E8622A;">${sec.icon}</div>
        <h2 style="font-size:1.2rem;font-weight:700;color:#1A1A1A;margin:0 0 8px;">${sec.intro}</h2>
        <button id="flexera-section-start-btn" style="margin-top:24px;background:#E8622A;color:white;border:none;border-radius:4px;padding:12px 24px;font-weight:600;cursor:pointer;font-family:inherit;">
          Bereich starten →
        </button>
      </div>
    `;

    document.getElementById('flexera-section-start-btn')?.addEventListener('click', () => {
      showQuestion(sectionIdx, 0);
    });
  }

  /**
   * Renders question screen.
   */
  function showQuestion(sectionIdx, questionIdx) {
    const sec = SECTIONS[sectionIdx];
    const q = sec.questions[questionIdx];
    state.currentQuestion = questionIdx;
    updateHero();

    const body = document.getElementById('flexera-card-body');
    if (!body) return;

    const progress = ((questionIdx + 1) / 4) * 100;

    const optionsHtml = q.options.map((opt, i) => `
      <label class="flexera-option" data-idx="${i}" style="
        display:flex;align-items:center;gap:12px;border:2px solid #E0E0E0;border-radius:6px;
        padding:14px 16px;margin-bottom:10px;cursor:pointer;transition:all 0.15s;color:#1A1A1A;
      ">
        <span class="flexera-radio" style="width:20px;height:20px;border:2px solid #E0E0E0;border-radius:50%;flex-shrink:0;"></span>
        <span style="flex:1;color:#1A1A1A;">${opt.text}</span>
      </label>
    `).join('');

    body.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <span style="background:#E8622A;color:white;font-size:0.8rem;padding:4px 12px;border-radius:12px;">Bereich ${sectionIdx + 1}: ${sec.title}</span>
        <span style="color:#3A3A3A;font-size:0.9rem;">Frage ${questionIdx + 1} / 4</span>
      </div>
      <div style="height:3px;background:#E0E0E0;border-radius:2px;margin-bottom:24px;overflow:hidden;">
        <div style="height:100%;width:${progress}%;background:#E8622A;transition:width 0.3s ease;"></div>
      </div>
      <p style="font-size:1.05rem;font-weight:600;color:#1A1A1A;line-height:1.5;margin-bottom:20px;white-space:pre-line;">${q.q}</p>
      <div class="flexera-options">${optionsHtml}</div>
      <button id="flexera-confirm-btn" style="display:none;margin-top:24px;width:100%;background:#E8622A;color:white;border:none;border-radius:4px;padding:14px;font-weight:600;cursor:pointer;font-family:inherit;">
        [Antwort bestätigen]
      </button>
    `;

    const options = body.querySelectorAll('.flexera-option');
    const confirmBtn = document.getElementById('flexera-confirm-btn');
    let selectedIdx = -1;

    options.forEach((opt, i) => {
      opt.addEventListener('click', () => {
        selectedIdx = i;
        options.forEach((o, j) => {
          o.style.borderColor = j === i ? '#E8622A' : '#E0E0E0';
          o.style.background = j === i ? '#FFF8F5' : '';
          const radio = o.querySelector('.flexera-radio');
          if (radio) {
            radio.style.borderColor = j === i ? '#E8622A' : '#E0E0E0';
            radio.style.background = j === i ? '#E8622A' : '';
          }
        });
        confirmBtn.style.display = 'block';
      });
      opt.addEventListener('mouseenter', () => {
        if (selectedIdx === -1) {
          opt.style.borderColor = '#E8622A';
          opt.style.background = '#FFF3E0';
        }
      });
      opt.addEventListener('mouseleave', () => {
        if (selectedIdx !== i) {
          opt.style.borderColor = '#E0E0E0';
          opt.style.background = '';
        }
      });
    });

    confirmBtn.addEventListener('click', () => {
      if (selectedIdx < 0) return;
      const selected = q.options[selectedIdx];
      options.forEach((o) => { o.style.pointerEvents = 'none'; });
      confirmBtn.style.display = 'none';

      if (q.buchhaltungOption >= 0 && selectedIdx === q.buchhaltungOption) {
        window.Achievements?.checkTrigger?.('buchhaltung_as_answer');
      }
      if (q.pathQuestion && selected.correct) {
        window.Engine?.setFlag?.('knows_flexera_path', true);
      }
      if (q.ninetyFourOption >= 0 && selectedIdx === q.ninetyFourOption) {
        window.Engine?.setFlag?.('understands_94_percent', true);
        window.Achievements?.checkTrigger?.('understands_94_percent');
      }

      if (selected.correct || q.allCorrect) {
        state.score += 1;
        showFeedback(q.correctFeedback, true, q.allCorrect, () => advanceQuestion(sectionIdx, questionIdx));
      } else {
        showFeedback(q.wrongFeedback, false, false, () => advanceQuestion(sectionIdx, questionIdx), q);
      }
    });
  }

  /**
   * Shows feedback (correct/wrong) then calls next.
   */
  function showFeedback(text, isCorrect, isAllCorrect, next, questionData) {
    const body = document.getElementById('flexera-card-body');
    if (!body) return;

    const borderColor = isAllCorrect ? FLEXERA.orange : (isCorrect ? FLEXERA.green : FLEXERA.red);
    const bgColor = isAllCorrect ? '#FFF8F5' : (isCorrect ? '#E8F5E9' : '#FFEBEE');
    const textColor = isAllCorrect ? '#1A1A1A' : (isCorrect ? '#1B5E20' : '#B71C1C');

    let optionsHtml = '';
    if (questionData && !isCorrect) {
      optionsHtml = questionData.options.map((opt) => {
        return `<div style="border:2px solid #E0E0E0;border-radius:6px;padding:14px 16px;margin-bottom:10px;color:#1A1A1A;${opt.correct ? 'border-color:#2E7D32;background:#E8F5E9;color:#1B5E20;' : ''}">${opt.text}</div>`;
      }).join('');
    }

    body.innerHTML = `
      <div style="background:${bgColor};border-left:4px solid ${borderColor};padding:16px;margin-bottom:20px;border-radius:4px;color:${textColor};">
        <span style="font-weight:600;">${isCorrect ? '✓' : '✗'} ${isCorrect ? 'Korrekt' : 'Leider falsch'} — ${text}</span>
      </div>
      ${optionsHtml}
      <button id="flexera-next-btn" style="width:100%;background:#E8622A;color:white;border:none;border-radius:4px;padding:14px;font-weight:600;cursor:pointer;font-family:inherit;">
        Nächste Frage →
      </button>
    `;

    document.getElementById('flexera-next-btn')?.addEventListener('click', next);
  }

  /**
   * Advances to next question or section or completion.
   */
  function advanceQuestion(sectionIdx, questionIdx) {
    const sec = SECTIONS[sectionIdx];
    if (questionIdx < sec.questions.length - 1) {
      showQuestion(sectionIdx, questionIdx + 1);
    } else if (sectionIdx < SECTIONS.length - 1) {
      showSectionIntro(sectionIdx + 1);
    } else {
      showCertScreen();
    }
  }

  /**
   * Renders certificate screen.
   */
  function showCertScreen() {
    const now = new Date();
    const validUntil = new Date(now);
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    const dateStr = now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const validStr = validUntil.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

    applyStatEffects();
    window.Engine?.setFlag?.('flexera_cert_complete', true);
    window.Achievements?.checkTrigger?.('flexera_cert_complete');
    if (state.score === 12) window.Achievements?.checkTrigger?.('flexera_cert_perfect');
    if (window.Storage?.saveGame) window.Storage.saveGame(window.Engine?.GameState);

    const body = document.getElementById('flexera-card-body');
    if (!body) return;

    const card = body.closest('div[style*="max-width"]');
    if (card) card.style.maxWidth = '600px';

    body.innerHTML = `
      <div style="text-align:center;padding:24px 0;">
        <div style="font-size:48px;margin-bottom:16px;">🏆</div>
        <div style="font-size:0.75rem;letter-spacing:2px;color:#3A3A3A;margin-bottom:8px;">ZERTIFIKAT</div>
        <div style="width:80px;height:2px;background:#E8622A;margin:0 auto 16px;"></div>
        <div style="font-size:1.2rem;font-weight:700;color:#1A1A1A;margin-bottom:4px;">Flexera One</div>
        <div style="font-size:1rem;color:#3A3A3A;margin-bottom:24px;">Certified SAM Analyst</div>

        <div style="text-align:left;max-width:360px;margin:0 auto;">
          <div style="margin-bottom:8px;"><span style="color:#3A3A3A;">Ausgestellt für:</span><br><span style="color:#1A1A1A;">Neuer Mitarbeiter</span></div>
          <div style="margin-bottom:8px;"><span style="color:#3A3A3A;">Datum:</span> <span style="color:#1A1A1A;">${dateStr}</span></div>
          <div style="margin-bottom:8px;"><span style="color:#3A3A3A;">Zertifikat-ID:</span> <code style="font-family:Courier New,monospace;background:#F5F5F5;padding:2px 6px;color:#1A1A1A;">${state.certId}</code></div>
          <div style="margin-bottom:16px;"><span style="color:#3A3A3A;">Gültig bis:</span> <span style="color:#1A1A1A;">${validStr}</span></div>
          <div style="width:100%;height:1px;background:#E0E0E0;margin:16px 0;"></div>
          <div style="margin-bottom:8px;"><span style="color:#3A3A3A;">Ergebnis:</span> <span style="color:#1A1A1A;">${state.score} / 12</span></div>
          <div style="font-weight:600;color:#2E7D32;">✅ BESTANDEN</div>
        </div>

        <p style="font-size:0.85rem;color:#3A3A3A;font-style:italic;margin:24px 0;line-height:1.5;">
          Dieses Zertifikat berechtigt Sie zur Nutzung von Flexera One.<br><br>
          Die Nutzung von Flexera One berechtigt Sie nicht zur Annahme dass alles funktioniert.
        </p>

        <p style="font-size:0.7rem;color:#5A5A5A;margin-bottom:24px;">
          Nächste Pflichtzertifizierung: in 365 Tagen. Erinnerung: Sandra Breuer.<br>
          Nächste Pflichtschulung: Brandschutz Modul 1. Fällig: übermorgen.
        </p>

        <button id="flexera-cert-done-btn" style="width:100%;background:#E8622A;color:white;border:none;border-radius:4px;padding:14px;font-weight:600;cursor:pointer;font-family:inherit;">
          Zum ersten Projekt →
        </button>
      </div>
    `;

    document.getElementById('flexera-cert-done-btn')?.addEventListener('click', finishAndContinue);
  }

  /**
   * Applies stat effects based on score.
   */
  function applyStatEffects() {
    if (state.score === 12) {
      window.Engine?.applyEffects?.({ kompetenz: 5, burnout: 6 });
      window.KeyboardController?.showToast?.('Perfektes Ergebnis. Müller-Brandt erwartet jetzt mehr von dir.', 'var(--color-accent-amber)');
    } else if (state.score >= 8) {
      window.Engine?.applyEffects?.({ kompetenz: 3, burnout: 3 });
      window.KeyboardController?.showToast?.('Zertifiziert. Flexera lädt trotzdem nicht schneller.', 'var(--color-accent-cyan)');
    } else {
      window.Engine?.applyEffects?.({ bullshit: 4, burnout: 2 });
      window.KeyboardController?.showToast?.('Bestanden. Das System akzeptiert alles ab 50%. Wie das echte Leben.', 'var(--color-accent-amber)');
    }
  }

  /**
   * Fades out and calls onComplete.
   */
  function finishAndContinue() {
    window.Engine?.clearActiveOverlay?.();
    if (loadBarInterval) clearInterval(loadBarInterval);
    overlayEl.style.transition = 'opacity 0.3s ease';
    overlayEl.style.opacity = '0';
    overlayEl.addEventListener('transitionend', () => {
      overlayEl?.remove();
      if (typeof state.onComplete === 'function') state.onComplete();
    }, { once: true });
  }

  /**
   * Starts the Flexera certification. Skips if already complete.
   * @param {function} onComplete - Called when certification is finished.
   */
  function start(onComplete) {
    if (window.Engine?.hasFlag?.('flexera_cert_complete')) {
      if (typeof onComplete === 'function') onComplete();
      return;
    }
    state.onComplete = onComplete;
    state.currentSection = 0;
    state.currentQuestion = 0;
    state.score = 0;
    state.certId = generateCertId();

    window.Engine?.setActiveOverlay?.('flexera_cert');
    buildOverlay();
    showIntro();
  }

  window.FlexeraCert = {
    start,
    state,
    generateCertId,
  };
})();
