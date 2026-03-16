/**
 * compliance.js
 * Satirical mandatory compliance training for "License To Bill".
 * Plays after onboarding, before projekt_dieter. Required step — no skip.
 * Player can cheat through (wrong answers still pass) just like in real life.
 * Depends: engine.js, storage.js, renderer.js, achievements.js
 */

(function () {
  'use strict';

  const COMPLIANCE_ORANGE = '#E8622A';

  const MODULES = [
    {
      icon: '🔐',
      title: 'Informationssicherheit im Arbeitsalltag',
      text: 'In diesem Modul lernen Sie wie Sie vertrauliche Daten schützen. Dauer: ca. 12 Minuten.',
      questions: [
        {
          q: 'Sollten Sie Ihr Passwort mit Kollegen teilen?',
          options: [
            { text: 'Ja, für bessere Zusammenarbeit', correct: false },
            { text: 'Nur bei dringendem Bedarf', correct: false },
            { text: 'Nein, niemals', correct: true },
            { text: 'Kommt auf das Passwort an', correct: false },
          ],
          correctFeedback: 'Korrekt. Passwörter sind vertraulich.',
          wrongFeedback: 'Falsch. Bitte beachten Sie Richtlinie IS-04. Diese Frage wird am Ende wiederholt.',
          kevinOption: -1,
        },
        {
          q: "Sie erhalten eine E-Mail mit dem Betreff 'Dringend: Ihr Konto wird gesperrt'. Was tun Sie?",
          options: [
            { text: 'Link nicht anklicken, IT informieren', correct: true },
            { text: 'Link anklicken und Passwort eingeben', correct: false },
            { text: 'E-Mail an Kollegen weiterleiten', correct: false },
            { text: 'E-Mail an Müller-Brandt weiterleiten', correct: false },
          ],
          correctFeedback: 'Richtig. Phishing-Mails sind gefährlich.',
          wrongFeedback: "Falsch. Bitte nehmen Sie an Modul 3 'E-Mail-Sicherheit' teil. Modul 3 ist dieses Modul.",
          kevinOption: -1,
        },
        {
          q: 'Wie oft sollten Sie Ihr Passwort ändern?',
          options: [
            { text: 'Nie — wenn es sicher ist reicht es', correct: false },
            { text: 'Täglich', correct: false },
            { text: 'Regelmäßig gemäß IT-Richtlinie', correct: true },
            { text: 'Wenn Kevin fragt', correct: false },
          ],
          correctFeedback: 'Korrekt. Unsere IT-Richtlinie gilt.',
          wrongFeedback: 'Leider falsch. Die korrekte Antwort finden Sie in Dokument IT-POL-2019-v3. Das Dokument existiert nicht mehr.',
          kevinOption: 3,
        },
      ],
    },
    {
      icon: '🛡️',
      title: 'Datenschutz-Grundverordnung im Überblick',
      text: 'Die DSGVO gilt seit Mai 2018. In diesem Modul erfahren Sie warum das Sie persönlich betrifft. Dauer: ca. 11 Minuten.',
      questions: [
        {
          q: 'Was ist personenbezogene Daten?',
          options: [
            { text: 'Nur Name und Adresse', correct: false },
            { text: 'Nur digitale Daten', correct: false },
            { text: 'Alle Daten die eine Person identifizieren', correct: true },
            { text: 'Daten die eine Person selbst eingegeben hat', correct: false },
          ],
          correctFeedback: 'Korrekt. Der Begriff ist weit gefasst.',
          wrongFeedback: 'Leider falsch. Die DSGVO definiert dies in Artikel 4 Absatz 1. Bitte lesen Sie Artikel 4 Absatz 1. Er hat 27 Unterpunkte.',
          kevinOption: -1,
        },
        {
          q: 'Ein Kunde bittet Sie seine Daten zu löschen. Was tun Sie?',
          options: [
            { text: 'Daten sofort selbst löschen', correct: false },
            { text: 'Anfrage ignorieren — zu aufwendig', correct: false },
            { text: 'Anfrage dokumentieren und Prozess einleiten', correct: true },
            { text: 'Kevin fragen', correct: false },
          ],
          correctFeedback: 'Richtig. Das Recht auf Vergessenwerden muss innerhalb von 30 Tagen erfüllt werden.',
          wrongFeedback: 'Falsch. Bitte konsultieren Sie den Datenschutzbeauftragten. Wir haben keinen Datenschutzbeauftragten. Das ist ein separates Thema.',
          kevinOption: 3,
        },
        {
          q: 'Dürfen Sie Kundendaten auf Ihrem privaten USB-Stick speichern?',
          options: [
            { text: 'Nein', correct: true },
            { text: 'Ja, wenn verschlüsselt', correct: false },
            { text: 'Nur temporär', correct: false },
            { text: 'Nur wenn der USB-Stick von Kevin ist', correct: false },
          ],
          correctFeedback: 'Korrekt. Firmendaten gehören auf Firmengeräte.',
          wrongFeedback: 'Leider falsch. Dies ist ein häufiger Fehler. Sie sind nicht allein. Kevin macht das auch.',
          kevinOption: -1,
        },
      ],
    },
    {
      icon: '⚖️',
      title: 'Compliance und ethisches Verhalten',
      text: 'In diesem Modul geht es um Interessenkonflikte, Korruption und was Sie tun wenn Sie etwas Verdächtiges bemerken. Dauer: ca. 10 Minuten. Dieser Abschnitt ist ernst gemeint.',
      questions: [
        {
          q: 'Ein Vendor lädt Sie zum Abendessen ein. Was tun Sie?',
          options: [
            { text: 'Einladung annehmen — ist doch nett', correct: false },
            { text: 'Einladung annehmen und nichts melden', correct: false },
            { text: 'Compliance-Richtlinie prüfen und ggf. melden', correct: true },
            { text: 'Tyler fragen ob er zahlt', correct: false },
          ],
          correctFeedback: 'Richtig. Unsere Richtlinie erlaubt Geschenke bis €35. Tyler gibt mehr aus. Das ist sein Problem.',
          wrongFeedback: 'Falsch. Bitte lesen Sie Compliance-Richtlinie CG-07-2022. Sie werden sie nicht finden.',
          kevinOption: -1,
        },
        {
          q: 'Sie bemerken dass ein Kollege Software nutzt für die keine Lizenz vorliegt. Was tun Sie?',
          options: [
            { text: 'Nichts — nicht Ihr Problem', correct: false },
            { text: 'Intern melden über den korrekten Kanal', correct: true },
            { text: 'Oracle informieren', correct: false },
            { text: 'Davon ausgehen dass eine Lizenz vorliegt', correct: false },
          ],
          correctFeedback: 'Korrekt. Lizenz-Compliance ist Teamverantwortung.',
          wrongFeedback: 'Leider falsch. Fehlende Lizenzen können zu erheblichen Nachzahlungen führen. Das werden Sie noch erleben.',
          kevinOption: -1,
          licenseQuestion: true,
        },
        {
          q: 'Was ist ein Interessenkonflikt?',
          options: [
            { text: 'Wenn zwei Kollegen sich nicht einig sind', correct: false },
            { text: 'Wenn private Interessen die berufliche Entscheidung beeinflussen könnten', correct: true },
            { text: 'Wenn Kevin und Sie unterschiedliche Meinungen haben', correct: false },
            { text: 'Das Thema von Modul 4', correct: false },
          ],
          correctFeedback: 'Korrekt.',
          wrongFeedback: 'Falsch. Ein Interessenkonflikt ist nicht dasselbe wie ein Meinungsunterschied. Obwohl Kevin beides verursacht.',
          kevinOption: 2,
        },
      ],
    },
    {
      icon: '🌱',
      title: 'Gesundheit, Work-Life-Balance und Wohlbefinden',
      text: 'Ihr Wohlbefinden ist uns wichtig. In diesem Modul erfahren Sie wie Sie gesund und motiviert bleiben. Dauer: ca. 12 Minuten.\n\nDieses Modul wurde hinzugefügt nachdem drei Mitarbeitende gleichzeitig krankgeschrieben waren.',
      questions: [
        {
          q: 'Was sollten Sie tun wenn Sie sich überlastet fühlen?',
          options: [
            { text: 'Durcharbeiten — es wird besser', correct: false },
            { text: 'Kevin um Hilfe bitten', correct: false },
            { text: 'Mit Ihrer Führungskraft oder HR sprechen', correct: true },
            { text: 'Modul 4 nochmal durcharbeiten', correct: false },
          ],
          correctFeedback: 'Richtig. Offene Kommunikation ist wichtig. Sandra hat immer ein offenes Ohr. Und ein Formular.',
          wrongFeedback: 'Falsch. Bitte nutzen Sie die angebotenen Ressourcen. Die Ressourcen werden in Kürze kommuniziert.',
          kevinOption: -1,
        },
        {
          q: 'Wie viele Überstunden sind laut Arbeitsvertrag pro Woche zulässig?',
          options: [
            { text: 'Unbegrenzt — wir sind ein Team', correct: false },
            { text: '20 Stunden', correct: false },
            { text: 'Gemäß individueller Vereinbarung', correct: true },
            { text: 'Müller-Brandt entscheidet das', correct: false },
          ],
          correctFeedback: 'Korrekt. Bitte prüfen Sie Ihren Arbeitsvertrag Abschnitt 7.',
          wrongFeedback: 'Leider falsch. Überstunden sind vertraglich geregelt. Bitte prüfen Sie Abschnitt 7. Abschnitt 7 ist absichtlich vage formuliert.',
          kevinOption: -1,
        },
        {
          q: 'Sie haben nun alle 4 Module abgeschlossen. Wie fühlen Sie sich?',
          options: [
            { text: 'Gut vorbereitet und motiviert', correct: true },
            { text: 'Bereit für neue Herausforderungen', correct: true },
            { text: 'Dankbar für diese Lernerfahrung', correct: true },
          ],
          correctFeedback: 'Ausgezeichnet. Ihre Zertifizierung wird in Kürze per E-Mail zugesandt. Bitte bewahren Sie das Zertifikat auf. Niemand wird jemals danach fragen.',
          wrongFeedback: '',
          kevinOption: -1,
          allCorrect: true,
        },
      ],
    },
  ];

  const state = {
    currentModule: 0,
    currentQuestion: 0,
    score: 0,
    wrongAnswers: 0,
    tabSwitches: 0,
    kevinClicks: 0,
    onComplete: null,
    startTime: null,
    idleTimer: null,
    idleWarningShown: false,
    idlePaused: false,
    tabSwitchMessageShown: false,
  };

  let overlayEl = null;
  let contentEl = null;
  let visibilityHandler = null;
  let idleCheckInterval = null;
  let lastActivityTime = 0;

  /**
   * Resets idle timers and records activity.
   */
  function resetIdleTimer() {
    lastActivityTime = Date.now();
    state.idleWarningShown = false;
    state.idlePaused = false;
  }

  /**
   * Builds the full overlay DOM structure.
   */
  function buildOverlay() {
    document.getElementById('compliance-overlay')?.remove();
    overlayEl = document.createElement('div');
    overlayEl.id = 'compliance-overlay';
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.setAttribute('aria-label', 'Pflichtschulung Compliance');
    overlayEl.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:1500',
      'background:#f5f5f0',
      'display:flex', 'flex-direction:column',
      'font-family:var(--font-mono),system-ui,sans-serif',
      'color:#1A1A1A',
    ].join(';');

    const header = document.createElement('header');
    header.style.cssText = [
      'display:flex', 'justify-content:space-between', 'align-items:flex-start',
      'padding:16px 24px', 'background:#e8e8e0',
      'border-bottom:1px solid #ccc',
    ].join(';');
    header.innerHTML = `
      <div>
        <div style="font-size:12px;font-weight:bold;letter-spacing:1px;color:#3A3A3A;">GREYSUIT & PARTNER // LERNPORTAL</div>
        <div style="font-size:11px;color:#4A4A4A;margin-top:2px;">Pflichtschulung — Neue Mitarbeitende</div>
      </div>
      <div style="text-align:right;">
        <div id="compliance-module-indicator" style="font-size:12px;font-weight:bold;color:#3A3A3A;">Modul 1 / 4</div>
        <div style="font-size:10px;color:#4A4A4A;margin-top:2px;">Geschätzte Dauer: 45 Min.</div>
      </div>
    `;
    overlayEl.appendChild(header);

    const progressBar = document.createElement('div');
    progressBar.id = 'compliance-progress-bar';
    progressBar.style.cssText = [
      'display:flex', 'height:8px', 'width:100%',
    ].join(';');
    overlayEl.appendChild(progressBar);

    const main = document.createElement('main');
    main.style.cssText = [
      'flex:1', 'display:flex', 'align-items:flex-start',
      'justify-content:center', 'padding:32px 24px',
      'overflow-y:auto',
    ].join(';');
    contentEl = document.createElement('div');
    contentEl.style.cssText = [
      'background:#fff', 'max-width:680px', 'width:100%',
      'padding:32px', 'box-shadow:0 2px 12px rgba(0,0,0,0.08)',
      'border-radius:4px',
    ].join(';');
    main.appendChild(contentEl);
    overlayEl.appendChild(main);

    const footer = document.createElement('footer');
    footer.style.cssText = [
      'display:flex', 'justify-content:space-between',
      'padding:12px 24px', 'font-size:10px', 'color:#5A5A5A',
      'background:#e8e8e0', 'border-top:1px solid #ccc',
    ].join(';');
    footer.innerHTML = `
      <span>© Greysuit & Partner Academy</span>
      <span>Bei Problemen wenden Sie sich an Sandra Breuer.</span>
    `;
    overlayEl.appendChild(footer);

    document.getElementById('app').appendChild(overlayEl);
    updateProgressBar();
  }

  /**
   * Updates the 4-segment progress bar.
   */
  function updateProgressBar() {
    const bar = document.getElementById('compliance-progress-bar');
    if (!bar) return;
    bar.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const seg = document.createElement('div');
      seg.style.cssText = 'flex:1;margin:0 1px;border-radius:2px;';
      if (i < state.currentModule) seg.style.background = '#2ea043';
      else if (i === state.currentModule) seg.style.background = COMPLIANCE_ORANGE;
      else seg.style.background = '#ddd';
      bar.appendChild(seg);
    }
  }

  /**
   * Updates the module indicator text.
   */
  function updateModuleIndicator() {
    const el = document.getElementById('compliance-module-indicator');
    if (el) el.textContent = `Modul ${state.currentModule + 1} / 4`;
  }

  /**
   * Renders the intro screen (before module 1).
   */
  function showIntro() {
    contentEl.innerHTML = `
      <div style="text-align:center;padding:24px 0;">
        <div style="font-size:48px;margin-bottom:16px;">📋</div>
        <h2 style="font-size:18px;margin:0 0 16px;color:#1A1A1A;">Pflichtschulung Compliance Grundlagen</h2>
        <p style="font-size:14px;line-height:1.6;color:#3A3A3A;max-width:480px;margin:0 auto;">
          Willkommen bei Greysuit & Partner. Bevor Sie Ihr erstes Projekt beginnen,
          müssen Sie diese Pflichtschulung absolvieren. 4 Module. 12 Fragen.
          Bestanden wird ab 50%. Wie im echten Leben.
        </p>
        <button id="compliance-intro-btn" class="choice-btn" style="margin-top:32px;padding:12px 24px;">
          Schulung starten →
        </button>
      </div>
    `;
    document.getElementById('compliance-intro-btn')?.addEventListener('click', () => {
      resetIdleTimer();
      showModuleIntro(0);
    });
  }

  /**
   * Renders the module intro screen.
   */
  function showModuleIntro(moduleIdx) {
    const mod = MODULES[moduleIdx];
    state.currentModule = moduleIdx;
    updateProgressBar();
    updateModuleIndicator();

    contentEl.innerHTML = `
      <div style="text-align:center;padding:16px 0;">
        <div style="font-size:40px;margin-bottom:12px;">${mod.icon}</div>
        <h2 style="font-size:16px;margin:0 0 12px;color:#1A1A1A;">${mod.title}</h2>
        <p style="font-size:14px;line-height:1.6;color:#3A3A3A;white-space:pre-line;text-align:left;max-width:520px;margin:0 auto 24px;">${mod.text}</p>
        <button id="compliance-module-start-btn" class="choice-btn" style="padding:10px 20px;">
          Modul starten →
        </button>
      </div>
    `;
    const startModule = () => {
      resetIdleTimer();
      showQuestion(moduleIdx, 0);
    };
    document.getElementById('compliance-module-start-btn')?.addEventListener('click', startModule);
  }

  /**
   * Renders a question with multiple choice options.
   */
  function showQuestion(moduleIdx, questionIdx) {
    const mod = MODULES[moduleIdx];
    const q = mod.questions[questionIdx];
    state.currentQuestion = questionIdx;
    updateModuleIndicator();

    const optionsHtml = q.options.map((opt, i) => {
      const kevinClass = i === q.kevinOption ? ' data-kevin="1"' : '';
      return `<label class="compliance-option"${kevinClass}><input type="radio" name="compliance-q" value="${i}"> ${opt.text}</label>`;
    }).join('');

    contentEl.innerHTML = `
      <div class="compliance-question">
        <p style="font-size:15px;line-height:1.5;margin-bottom:20px;font-weight:500;color:#1A1A1A;">${q.q}</p>
        <div class="compliance-options" style="display:flex;flex-direction:column;gap:10px;">
          ${optionsHtml}
        </div>
        <button id="compliance-submit-btn" class="choice-btn" style="margin-top:24px;padding:10px 20px;" disabled>
          Antwort bestätigen
        </button>
      </div>
    `;

    const options = contentEl.querySelectorAll('.compliance-option');
    const submitBtn = document.getElementById('compliance-submit-btn');
    const radios = contentEl.querySelectorAll('input[name="compliance-q"]');

    radios.forEach((r, i) => {
      r.addEventListener('change', () => {
        resetIdleTimer();
        submitBtn.disabled = false;
      });
    });

    options.forEach((opt) => {
      opt.style.cssText = 'display:flex;align-items:flex-start;gap:10px;padding:12px;border:1px solid #ddd;border-radius:4px;cursor:pointer;background:#fafafa;color:#2A2A2A;';
      opt.addEventListener('click', () => {
        resetIdleTimer();
        opt.querySelector('input').checked = true;
        submitBtn.disabled = false;
      });
    });

    submitBtn.addEventListener('click', () => {
      resetIdleTimer();
      const checked = contentEl.querySelector('input[name="compliance-q"]:checked');
      if (!checked) return;
      const idx = parseInt(checked.value, 10);
      const selected = q.options[idx];
      submitBtn.disabled = true;
      options.forEach((o) => { o.style.pointerEvents = 'none'; });

      if (q.kevinOption >= 0 && idx === q.kevinOption) {
        state.kevinClicks += 1;
      }

      if (selected.correct || q.allCorrect) {
        state.score += 1;
        if (q.licenseQuestion) {
          window.Engine?.applyEffects?.({ kompetenz: 2, burnout: -2 });
          window.Engine?.setFlag?.('compliance_license_aware', true);
          window.KeyboardController?.showToast?.('Sie merken dass Sie bereits wissen wie das läuft.', 'var(--color-accent-cyan)');
        }
        showFeedback(q.correctFeedback, true, () => {
          advanceQuestion(moduleIdx, questionIdx);
        });
      } else {
        state.wrongAnswers += 1;
        showFeedback(q.wrongFeedback, false, () => {
          advanceQuestion(moduleIdx, questionIdx);
        });
      }
    });
  }

  /**
   * Shows feedback (correct/wrong) then calls next.
   */
  function showFeedback(text, isCorrect, next) {
    const color = isCorrect ? '#1B5E20' : '#B71C1C';
    contentEl.innerHTML = `
      <div style="padding:16px 0;">
        <div style="font-size:14px;line-height:1.6;color:${color};font-weight:500;">${text}</div>
        <button id="compliance-feedback-continue" class="choice-btn" style="margin-top:20px;padding:10px 20px;">
          Weiter →
        </button>
      </div>
    `;
    document.getElementById('compliance-feedback-continue')?.addEventListener('click', () => {
      resetIdleTimer();
      next();
    });
  }

  /**
   * Advances to next question or next module or completion.
   */
  function advanceQuestion(moduleIdx, questionIdx) {
    const mod = MODULES[moduleIdx];
    if (questionIdx < mod.questions.length - 1) {
      showQuestion(moduleIdx, questionIdx + 1);
    } else if (moduleIdx < MODULES.length - 1) {
      showModuleIntro(moduleIdx + 1);
    } else {
      showCompletionScreen();
    }
  }

  /**
   * Renders the completion screen with results.
   */
  function showCompletionScreen() {
    const elapsed = state.startTime ? Math.round((Date.now() - state.startTime) / 1000) : 0;
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const timeStr = `${mins} Min. ${secs} Sek.`;

    contentEl.innerHTML = `
      <div style="text-align:center;padding:24px 0;">
        <div id="compliance-checkmark" style="font-size:64px;margin-bottom:16px;opacity:0;">✅</div>
        <h2 style="font-size:18px;margin:0 0 12px;color:#1A1A1A;">🎓 Pflichtschulung abgeschlossen</h2>
        <p style="font-size:14px;line-height:1.6;color:#3A3A3A;margin-bottom:24px;">
          Sie haben alle 4 Module erfolgreich absolviert.<br>
          Ihr Zertifikat 'Compliance Grundlagen 2024' wurde Ihrer Personalakte hinzugefügt.
        </p>
        <div style="background:#f0f0f0;border:1px solid #ddd;border-radius:4px;padding:16px 24px;max-width:320px;margin:0 auto 20px;text-align:left;">
          <div style="margin-bottom:8px;">Richtige Antworten: ${state.score} / 12</div>
          <div style="margin-bottom:8px;">Benötigte Zeit: ${timeStr}</div>
          <div style="margin-bottom:8px;">Wiederholungen: 0</div>
          <div>Status: ✅ BESTANDEN</div>
        </div>
        <p style="font-size:11px;color:#5A5A5A;margin-bottom:8px;">
          Diese Schulung muss jährlich wiederholt werden. Erinnerung: in 365 Tagen. Sandra schickt rechtzeitig eine E-Mail.
        </p>
        <p style="font-size:10px;color:#aaa;margin-bottom:24px;">
          Nächste Pflichtschulung: 'Brandschutz Modul 1' — Fällig: übermorgen.
        </p>
        <button id="compliance-done-btn" class="choice-btn" style="padding:12px 28px;">
          Zur Flexera-Zertifizierung →
        </button>
      </div>
    `;

    const checkEl = document.getElementById('compliance-checkmark');
    if (checkEl) {
      requestAnimationFrame(() => {
        checkEl.style.transition = 'opacity 0.5s ease';
        checkEl.style.opacity = '1';
      });
    }

    applyStatEffects();
    window.Engine?.setFlag?.('compliance_complete', true);
    window.Achievements?.checkTrigger?.('compliance_done');
    if (state.score === 12) window.Achievements?.checkTrigger?.('compliance_perfect');
    if (state.kevinClicks >= 3) {
      window.Achievements?.checkTrigger?.('kevin_compliance_expert');
      window.KeyboardController?.showToast?.('Kevin wurde dreimal konsultiert. Kevin hat keine der Antworten gewusst. Du auch nicht mehr.', 'var(--color-accent-amber)');
    }
    if (window.Storage?.saveGame) window.Storage.saveGame(window.Engine?.GameState);

    document.getElementById('compliance-done-btn')?.addEventListener('click', finishAndContinue);
  }

  /**
   * Applies stat effects based on score.
   */
  function applyStatEffects() {
    if (state.score === 12) {
      window.Engine?.applyEffects?.({ kompetenz: 3, burnout: 5 });
      window.KeyboardController?.showToast?.('Alles richtig. Du hast zu genau aufgepasst.', 'var(--color-accent-amber)');
    } else if (state.score >= 8) {
      window.Engine?.applyEffects?.({ burnout: 3 });
      window.KeyboardController?.showToast?.('Bestanden. Sandra ist zufrieden.', 'var(--color-accent-cyan)');
    } else {
      window.Engine?.applyEffects?.({ bullshit: 5, burnout: 2 });
      window.KeyboardController?.showToast?.('Bestanden. Das System akzeptiert alles ab 50%.', 'var(--color-accent-amber)');
    }
  }

  /**
   * Fades out overlay and calls onComplete.
   */
  function finishAndContinue() {
    window.Engine?.clearActiveOverlay?.();
    overlayEl.style.transition = 'opacity 0.3s ease';
    overlayEl.style.opacity = '0';
    overlayEl.addEventListener('transitionend', () => {
      overlayEl?.remove();
      teardown();
      if (typeof state.onComplete === 'function') {
        window.FlexeraCert?.start?.(state.onComplete);
      }
    }, { once: true });
  }

  /**
   * Removes event listeners and timers.
   */
  function teardown() {
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler);
      visibilityHandler = null;
    }
    if (idleCheckInterval) {
      clearInterval(idleCheckInterval);
      idleCheckInterval = null;
    }
  }

  /**
   * Shows the tab-switch easter egg message.
   */
  function showTabSwitchMessage() {
    if (state.tabSwitchMessageShown) return;
    state.tabSwitchMessageShown = true;
    window.Achievements?.checkTrigger?.('tab_switcher');
    const pop = document.createElement('div');
    pop.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%', 'transform:translate(-50%,-50%)',
      'z-index:1600', 'background:#fff', 'padding:24px 32px',
      'border:2px solid #E8622A', 'border-radius:8px',
      'box-shadow:0 4px 20px rgba(0,0,0,0.15)',
      'text-align:center', 'max-width:360px',
    ].join(';');
    pop.innerHTML = `
      <p style="margin:0 0 16px;font-size:14px;line-height:1.5;">Willkommen zurück. Wir haben Ihre Abwesenheit registriert. Zum Spaß.</p>
      <button class="choice-btn" style="padding:8px 16px;">OK</button>
    `;
    pop.querySelector('button').addEventListener('click', () => pop.remove());
    overlayEl?.appendChild(pop);
  }

  /**
   * Shows idle warning (60s).
   */
  function showIdleWarning() {
    if (state.idleWarningShown || state.idlePaused) return;
    state.idleWarningShown = true;
    const pop = document.createElement('div');
    pop.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%', 'transform:translate(-50%,-50%)',
      'z-index:1600', 'background:#fff', 'padding:24px 32px',
      'border:2px solid #E8622A', 'border-radius:8px',
      'box-shadow:0 4px 20px rgba(0,0,0,0.15)',
      'text-align:center', 'max-width:360px',
    ].join(';');
    pop.innerHTML = `
      <p style="margin:0 0 16px;font-size:14px;line-height:1.5;">Sind Sie noch da? Das Modul pausiert nach weiteren 60 Sekunden Inaktivität.</p>
      <button class="choice-btn" style="padding:8px 16px;">Ja, ich bin noch da</button>
    `;
    pop.querySelector('button').addEventListener('click', () => {
      resetIdleTimer();
      state.idleWarningShown = false;
      pop.remove();
    });
    overlayEl?.appendChild(pop);
  }

  /**
   * Shows idle paused (120s).
   */
  function showIdlePaused() {
    if (state.idlePaused) return;
    state.idlePaused = true;
    const pop = document.createElement('div');
    pop.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%', 'transform:translate(-50%,-50%)',
      'z-index:1600', 'background:#fff', 'padding:24px 32px',
      'border:2px solid #E8622A', 'border-radius:8px',
      'box-shadow:0 4px 20px rgba(0,0,0,0.15)',
      'text-align:center', 'max-width:360px',
    ].join(';');
    pop.innerHTML = `
      <p style="margin:0 0 16px;font-size:14px;line-height:1.5;">Training pausiert. Bitte melden Sie sich bei Sandra um das Training neu zu starten.</p>
      <button class="choice-btn" style="padding:8px 16px;">Training fortsetzen</button>
    `;
    pop.querySelector('button').addEventListener('click', () => {
      state.idlePaused = false;
      state.idleWarningShown = false;
      resetIdleTimer();
      pop.remove();
    });
    overlayEl?.appendChild(pop);
  }

  /**
   * Starts the compliance training. If already completed, skips and calls onComplete.
   * @param {function} onComplete - Called when training is finished.
   */
  function start(onComplete) {
    if (window.Engine?.hasFlag?.('compliance_complete')) {
      if (typeof onComplete === 'function') onComplete();
      return;
    }
    state.onComplete = onComplete;
    state.currentModule = 0;
    state.currentQuestion = 0;
    state.score = 0;
    state.wrongAnswers = 0;
    state.tabSwitches = 0;
    state.kevinClicks = 0;
    state.tabSwitchMessageShown = false;
    state.idleWarningShown = false;
    state.idlePaused = false;
    state.startTime = Date.now();
    lastActivityTime = Date.now();

    window.Engine?.setActiveOverlay?.('compliance');
    buildOverlay();
    showIntro();

    visibilityHandler = () => {
      if (document.hidden) {
        state.tabSwitches += 1;
        if (state.tabSwitches === 3) {
          document.addEventListener('visibilitychange', function onVisible() {
            if (!document.hidden) {
              document.removeEventListener('visibilitychange', onVisible);
              showTabSwitchMessage();
            }
          }, { once: true });
        }
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);

    idleCheckInterval = setInterval(() => {
      if (state.idlePaused) return;
      const idle = (Date.now() - lastActivityTime) / 1000;
      if (idle >= 120) showIdlePaused();
      else if (idle >= 60) showIdleWarning();
    }, 5000);
  }

  window.ComplianceTraining = {
    start,
    state,
  };
})();
