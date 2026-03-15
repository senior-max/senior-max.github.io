/**
 * ivanti.js
 * Ivanti discovery scan parody for "License To Bill".
 * Progress bar stuck at 94%. Player must troubleshoot through 4 rounds.
 * No timer — burnout accumulates per failed attempt.
 */

const IVANTI_RED = '#D71920';

window.IvantiMinigame = (function () {
  'use strict';

  let overlayEl = null;
  let onCompleteCallback = null;
  let state = {};
  let logInterval = null;
  let timeElapsed = { h: 18, m: 34, s: 7 };
  let timeInterval = null;

  // ── State ──────────────────────────────────────────────

  function resetState() {
    state = {
      round: 1,
      wrongTurns: 0,
      scanRestarted: false,
      supportCalled: false,
      endpointExcluded: false,
      kevinUsed: false,
      reducedOptions: false,
      tier2Hint: false,
      wmiTimeoutIncreased: false,
    };
  }

  // ── Log & Time ────────────────────────────────────────

  function appendLog(msg, type = 'INFO') {
    const logEl = overlayEl?.querySelector('#ivanti-log');
    if (!logEl) return;
    const tag = type === 'WARN' ? '[WARN]' : type === 'ERROR' ? '[ERROR]' : '[INFO]';
    const line = document.createElement('div');
    line.style.cssText = 'font-family:monospace;font-size:11px;color:#8b949e;margin:2px 0;';
    line.textContent = `${tag} 14.03 ${String(timeElapsed.h).padStart(2,'0')}:${String(timeElapsed.m).padStart(2,'0')}:${String(timeElapsed.s).padStart(2,'0')} — ${msg}`;
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function startLogLoop() {
    if (logInterval) return;
    const msgs = [
      'Processing CORP-KELLER-SRV-03...',
      'Processing CORP-KELLER-SRV-03...',
      'Processing CORP-KELLER-SRV-03...',
    ];
    let i = 0;
    logInterval = setInterval(() => {
      if (!overlayEl) return;
      appendLog(msgs[i % 3]);
      i++;
    }, 2000);
  }

  function startTimeCounter() {
    if (timeInterval) return;
    timeInterval = setInterval(() => {
      timeElapsed.s += 1;
      if (timeElapsed.s >= 60) { timeElapsed.s = 0; timeElapsed.m += 1; }
      if (timeElapsed.m >= 60) { timeElapsed.m = 0; timeElapsed.h += 1; }
      const el = overlayEl?.querySelector('#ivanti-time');
      if (el) el.textContent = `${String(timeElapsed.h).padStart(2,'0')}:${String(timeElapsed.m).padStart(2,'0')}:${String(timeElapsed.s).padStart(2,'0')}`;
    }, 1000);
  }

  function stopIntervals() {
    if (logInterval) { clearInterval(logInterval); logInterval = null; }
    if (timeInterval) { clearInterval(timeInterval); timeInterval = null; }
  }

  // ── Toast ──────────────────────────────────────────────

  function showToast(text) {
    if (window.KeyboardController?.showToast) {
      window.KeyboardController.showToast(text, 'var(--color-accent-amber)');
    } else {
      const t = document.createElement('div');
      t.style.cssText = 'position:fixed;bottom:var(--space-lg);left:50%;transform:translateX(-50%);z-index:3000;background:var(--color-surface-elevated);padding:8px 16px;border-radius:4px;font-size:13px;';
      t.textContent = text;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 3000);
    }
  }

  // ── Progress bar ────────────────────────────────────────

  function setProgress(percent, animate = false) {
    const bar = overlayEl?.querySelector('#ivanti-progress-fill');
    const pct = overlayEl?.querySelector('#ivanti-progress-pct');
    if (!bar || !pct) return;
    if (animate) {
      bar.style.transition = 'width 5s linear';
      bar.style.width = percent + '%';
      pct.textContent = percent + '%';
    } else {
      bar.style.transition = 'none';
      bar.style.width = percent + '%';
      pct.textContent = percent + '%';
    }
  }

  function animateProgressTo94() {
    return new Promise((resolve) => {
      setProgress(0);
      setTimeout(() => {
        setProgress(94, true);
        setTimeout(resolve, 5100);
      }, 50);
    });
  }

  // ── Mission Brief ──────────────────────────────────────

  function showMissionBrief() {
    const brief = document.createElement('div');
    brief.id = 'ivanti-brief';
    brief.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:2100',
      'background:var(--color-bg)', 'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center', 'padding:var(--space-xl)',
      'font-family:var(--font-mono)', 'text-align:center',
    ].join(';');

    brief.innerHTML = `
      <div style="font-size:var(--font-size-xl);color:${IVANTI_RED};margin-bottom:var(--space-lg);">Ivanti Neurons for ITAM</div>
      <div style="font-size:var(--font-size-base);color:var(--color-text-primary);max-width:480px;line-height:1.8;margin-bottom:var(--space-xl);">
        Discovery-Scan für das Q4-Reporting gestartet.<br>
        Der Scan hängt bei 94%.<br>
        Er hängt seit gestern bei 94%.<br>
        <strong>Er hängt wahrscheinlich seit 2019 bei 94%.</strong>
      </div>
      <button type="button" class="choice-btn" id="ivanti-start-btn" style="width:200px;">Scan öffnen</button>
    `;

    document.body.appendChild(brief);
    brief.querySelector('#ivanti-start-btn').addEventListener('click', () => {
      window.Sound?.play?.('click');
      brief.remove();
      buildMainUI();
    });
  }

  // ── Main UI ─────────────────────────────────────────────

  function buildMainUI() {
    overlayEl = document.createElement('div');
    overlayEl.id = 'ivanti-overlay';
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:2100',
      'background:#f5f5f5', 'display:flex', 'flex-direction:column',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'overflow:hidden',
    ].join(';');

    overlayEl.innerHTML = `
      <header style="background:${IVANTI_RED};color:#fff;padding:12px 20px;font-weight:600;">Ivanti Neurons for ITAM — Discovery</header>
      <main style="flex:1;overflow-y:auto;padding:var(--space-lg);">
        <div style="margin-bottom:var(--space-md);">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:13px;">
            <span>Scanning: CORP-KELLER-SRV-03</span>
            <span id="ivanti-time">18:34:07</span>
          </div>
          <div style="height:24px;background:#e0e0e0;border-radius:4px;overflow:hidden;">
            <div id="ivanti-progress-fill" style="height:100%;width:94%;background:${IVANTI_RED};transition:none;"></div>
          </div>
          <div id="ivanti-progress-pct" style="text-align:right;font-size:12px;color:#666;">94%</div>
        </div>
        <div id="ivanti-log" style="background:#1a1a1a;color:#8b949e;padding:var(--space-md);border-radius:4px;height:180px;overflow-y:auto;font-family:monospace;font-size:11px;"></div>
        <div id="ivanti-actions" style="margin-top:var(--space-md);display:flex;gap:var(--space-sm);flex-wrap:wrap;"></div>
      </main>
    `;

    document.body.appendChild(overlayEl);

    appendLog('Scan started. Target: 847 endpoints');
    appendLog('Discovery agent responsive on 831 endpoints');
    appendLog('16 endpoints unreachable (timeout)', 'WARN');
    appendLog('94% complete');
    appendLog('Processing CORP-KELLER-SRV-03...');

    startLogLoop();
    startTimeCounter();

    renderRound1();
  }

  // ── Round 1 ─────────────────────────────────────────────

  function renderRound1() {
    const actions = overlayEl.querySelector('#ivanti-actions');
    actions.innerHTML = '';
    const btns = [
      { id: 'restart', label: '🔄 Scan neu starten' },
      { id: 'diagnose', label: '🔍 Endpoint diagnostizieren' },
      { id: 'support', label: '☎️ Support anrufen' },
    ];
    btns.forEach((b) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = b.label;
      btn.dataset.action = b.id;
      btn.addEventListener('click', () => handleRound1Action(b.id));
      actions.appendChild(btn);
    });
  }

  async function handleRound1Action(action) {
    if (action === 'restart') {
      stopIntervals();
      appendLog('Scan restarted. Processing CORP-KELLER-SRV-03...');
      await animateProgressTo94();
      state.scanRestarted = true;
      state.wrongTurns += 1;
      window.Engine?.applyEffects?.({ burnout: 3 });
      startLogLoop();
      startTimeCounter();
      renderRound2();
    } else if (action === 'diagnose') {
      showDiagnoseSubChoices();
    } else if (action === 'support') {
      showSupportOverlay();
    }
  }

  function showDiagnoseSubChoices() {
    const actions = overlayEl.querySelector('#ivanti-actions');
    actions.innerHTML = '';
    const choices = [
      { id: 'agent', label: 'Agent-Status auf CORP-KELLER-SRV-03 prüfen', correct: true },
      { id: 'firewall', label: 'Firewall-Regeln checken', correct: false },
      { id: 'restart_srv', label: 'Server neu starten (remote)', correct: false },
    ];
    choices.forEach((c) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = c.label;
      btn.addEventListener('click', () => handleDiagnoseChoice(c.id, c.correct));
      actions.appendChild(btn);
    });
  }

  function handleDiagnoseChoice(choice, correct) {
    if (choice === 'agent') {
      appendLog('Agent version 9.2.1 detected. Current: 11.4.2. Update required.', 'WARN');
      renderRound2();
    } else if (choice === 'firewall') {
      appendLog('Firewall check complete. No issues detected.');
      state.wrongTurns += 1;
      window.Engine?.applyEffects?.({ burnout: 2 });
      renderRound2();
    } else {
      appendLog('Remote restart failed. RDP connection refused.', 'ERROR');
      state.wrongTurns += 1;
      state.reducedOptions = true;
      window.Engine?.applyEffects?.({ burnout: 5 });
      renderRound2();
    }
  }

  function showSupportOverlay() {
    const modal = document.createElement('div');
    modal.id = 'ivanti-support-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:2200;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:var(--space-lg);';
    modal.innerHTML = `
      <div style="background:#fff;padding:var(--space-lg);border-radius:8px;max-width:400px;text-align:center;">
        <div style="font-weight:600;margin-bottom:var(--space-md);">Ivanti Support — Warteschlange</div>
        <p id="ivanti-wait-msg" style="font-size:14px;color:#666;">Ihre geschätzte Wartezeit: 47 Minuten.</p>
        <div style="display:flex;gap:var(--space-sm);justify-content:center;margin-top:var(--space-lg);">
          <button type="button" class="choice-btn" id="ivanti-wait">Weiter warten</button>
          <button type="button" class="choice-btn" id="ivanti-hangup" style="background:#ddd;color:#333;">Auflegen</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    let waitCount = 0;
    const waitMsg = modal.querySelector('#ivanti-wait-msg');

    modal.querySelector('#ivanti-hangup').addEventListener('click', () => {
      modal.remove();
      state.supportCalled = true;
      window.Engine?.applyEffects?.({ burnout: -2 });
      renderRound2();
    });

    modal.querySelector('#ivanti-wait').addEventListener('click', () => {
      waitCount++;
      if (waitCount === 1) {
        waitMsg.textContent = 'Wartezeit aktualisiert: 62 Minuten.';
        modal.querySelector('#ivanti-wait').textContent = 'Weiter warten...';
        modal.querySelector('#ivanti-wait').disabled = true;
        setTimeout(() => {
          modal.innerHTML = `
            <div style="font-weight:600;margin-bottom:var(--space-md);">Support antwortet</div>
            <p style="font-size:14px;color:#666;margin-bottom:var(--space-md);">"Haben Sie versucht den Scan neu zu starten?"</p>
            <div style="display:flex;gap:var(--space-sm);justify-content:center;flex-wrap:wrap;">
              <button type="button" class="choice-btn" id="ivanti-ja">Ja.</button>
              <button type="button" class="choice-btn" id="ivanti-nein">Nein.</button>
            </div>
          `;
          modal.querySelector('#ivanti-ja').addEventListener('click', () => finishSupport(modal));
          modal.querySelector('#ivanti-nein').addEventListener('click', () => finishSupport(modal));
        }, 5000);
      }
    });
  }

  function finishSupport(modal) {
    modal.innerHTML = `
      <div style="font-weight:600;margin-bottom:var(--space-md);">Support</div>
      <p style="font-size:14px;color:#666;">Wir eskalieren das an Tier-2. Ticket: INC-2024-99341.</p>
      <button type="button" class="choice-btn" style="margin-top:var(--space-md);">Schließen</button>
    `;
    modal.querySelector('button').addEventListener('click', () => {
      modal.remove();
      state.supportCalled = true;
      state.tier2Hint = true;
      state.wrongTurns += 2;
      window.Engine?.applyEffects?.({ burnout: 8 });
      renderRound2();
    });
  }

  // ── Round 2 ─────────────────────────────────────────────

  function renderRound2() {
    appendLog('Agent version mismatch detected.', 'WARN');
    const actions = overlayEl.querySelector('#ivanti-actions');
    actions.innerHTML = '';
    if (state.tier2Hint) {
      const hint = document.createElement('div');
      hint.style.cssText = 'width:100%;font-size:12px;color:#666;margin-bottom:8px;';
      hint.textContent = 'Tier-2 hat noch nicht geantwortet.';
      actions.appendChild(hint);
    }
    const choices = [
      { id: 'update', label: 'Agent-Update auf CORP-KELLER-SRV-03 deployen', correct: true },
      { id: 'reinstall', label: 'Agent deinstallieren und neu installieren', correct: false },
      { id: 'exclude', label: 'Diesen Endpoint vom Scan ausschließen', shortcut: true },
    ];
    choices.forEach((c) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = c.label;
      btn.addEventListener('click', () => handleRound2Choice(c.id));
      actions.appendChild(btn);
    });
  }

  async function handleRound2Choice(choice) {
    if (choice === 'update') {
      appendLog('Update wird deployed...');
      setProgress(40, true);
      await new Promise((r) => setTimeout(r, 2000));
      appendLog('Agent update complete. Re-scanning CORP-KELLER-SRV-03...');
      setProgress(97);
      renderRound3();
    } else if (choice === 'reinstall') {
      appendLog('Deinstallation erfolgreich. Neuinstallation fehlgeschlagen.', 'ERROR');
      appendLog('Insufficient permissions.', 'ERROR');
      state.wrongTurns += 1;
      window.Engine?.applyEffects?.({ burnout: 5 });
      renderRound3();
    } else {
      state.endpointExcluded = true;
      finishWithScore({
        score: 30,
        effects: { kompetenz: -2, bullshit: 4 },
        xpBonus: 5,
        message: 'Scan abgeschlossen. CORP-KELLER-SRV-03 fehlt im Report. Müller-Brandt fragt nach dem Keller-Server.',
      });
    }
  }

  // ── Round 3 ─────────────────────────────────────────────

  function renderRound3() {
    appendLog('WMI query timeout on CORP-KELLER-SRV-03.', 'WARN');
    const actions = overlayEl.querySelector('#ivanti-actions');
    actions.innerHTML = '';
    const choices = [
      { id: 'wmi', label: 'WMI-Service auf Server neu starten', correct: true },
      { id: 'timeout', label: 'WMI-Timeout in Ivanti-Einstellungen erhöhen', correct: false },
      { id: 'kevin', label: 'Kevin fragen', correct: false },
    ];
    choices.forEach((c) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = c.label;
      btn.addEventListener('click', () => handleRound3Choice(c.id));
      actions.appendChild(btn);
    });
  }

  async function handleRound3Choice(choice) {
    if (choice === 'wmi') {
      appendLog('WMI restarted. Retrying query...');
      setProgress(100, true);
      await new Promise((r) => setTimeout(r, 1500));
      finishScan();
    } else if (choice === 'timeout') {
      appendLog('Timeout erhöht auf 300s. Scan läuft weiter.');
      state.wrongTurns += 1;
      state.wmiTimeoutIncreased = true;
      window.Engine?.applyEffects?.({ burnout: 4 });
      appendLog('Processing CORP-KELLER-SRV-03... (still 97%)');
      setTimeout(() => {
        appendLog('WMI restarted. Retrying query...');
        setProgress(100, true);
        setTimeout(finishScan, 1500);
      }, 2000);
    } else {
      appendLog('Kevin antwortet: "WMI? Ist das nicht was mit Windows? Ich schau mal bei Stack Overflow."');
      state.kevinUsed = true;
      state.wrongTurns += 1;
      window.Engine?.applyEffects?.({ burnout: 2 });
      window.Achievements?.checkTrigger?.('kevin_saved_the_day_again');
      setTimeout(() => {
        appendLog('Kevin: Link gefunden. WMI-Service neu starten.');
        appendLog('WMI restarted. Retrying query...');
        setProgress(100, true);
        setTimeout(finishScan, 1500);
      }, 3000);
    }
  }

  // ── Finish ──────────────────────────────────────────────

  function finishScan() {
    stopIntervals();
    appendLog('Discovery complete. 847 of 847 endpoints scanned.');
    appendLog('CORP-KELLER-SRV-03: 47 software titles discovered.');
    appendLog('Including: BUCHHALTUNG_2006.exe (last accessed: 3 days ago)');

    const buchhaltungFound = window.Engine?.hasFlag?.('buchhaltung_2006_found');
    if (buchhaltungFound) {
      showToast('Wieder. Es ist immer noch da.');
    } else {
      showToast('BUCHHALTUNG 2006 lebt noch. Der Scan hat es bestätigt.');
    }

    let result;
    if (state.wrongTurns === 0 && !state.scanRestarted && !state.supportCalled) {
      result = {
        score: 100,
        effects: { kompetenz: 7 },
        xpBonus: 30,
        achievementTrigger: 'ivanti_whisperer',
        message: 'Scan abgeschlossen. Sie haben die Fallstricke umgangen.',
      };
    } else if (state.wrongTurns <= 1) {
      result = {
        score: 70,
        effects: { kompetenz: 4, burnout: 5 },
        xpBonus: 20,
        message: 'Scan abgeschlossen. Mit Umwegen.',
      };
    } else if (state.supportCalled && state.scanRestarted) {
      result = {
        score: 20,
        effects: { burnout: 20, kompetenz: 1 },
        xpBonus: 5,
        message: 'Scan abgeschlossen. Support und Neustarts. Es hat funktioniert. Irgendwie.',
      };
    } else {
      result = {
        score: 50,
        effects: { kompetenz: 3, burnout: 10 },
        xpBonus: 10,
        message: 'Scan abgeschlossen. Nach einigen Fehlversuchen.',
      };
    }

    setTimeout(() => finishWithScore(result), 2500);
  }

  function finishWithScore(scoreOrOpts, opts = {}) {
    stopIntervals();
    const score = typeof scoreOrOpts === 'object' ? scoreOrOpts.score : scoreOrOpts;
    const fullOpts = typeof scoreOrOpts === 'object' ? scoreOrOpts : opts;
    const result = {
      score: fullOpts.score ?? score ?? 0,
      effects: fullOpts.effects ?? {},
      xpBonus: fullOpts.xpBonus ?? 0,
      achievementTrigger: fullOpts.achievementTrigger,
      message: fullOpts.message ?? 'Scan abgeschlossen.',
    };

    overlayEl.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:var(--space-lg);padding:var(--space-xl);max-width:480px;margin:0 auto;';

    const emoji = result.score >= 70 ? '✅' : result.score > 0 ? '😅' : '😬';
    wrap.innerHTML = `
      <div style="font-size:48px;">${emoji}</div>
      <div style="font-size:var(--font-size-lg);color:${IVANTI_RED};">${result.score} Punkte</div>
      <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);text-align:center;line-height:1.7;">${result.message}</div>
      <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);">
        ${[
          result.effects?.kompetenz != null && `Kompetenz ${result.effects.kompetenz > 0 ? '+' : ''}${result.effects.kompetenz}`,
          result.effects?.burnout != null && `Burnout +${result.effects.burnout}`,
          result.effects?.bullshit != null && `Bullshit +${result.effects.bullshit}`,
          result.xpBonus != null && result.xpBonus > 0 && `+${result.xpBonus} XP`,
        ].filter(Boolean).join('  ·  ')}
      </div>
    `;

    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = 'Weiter';
    btn.style.cssText = 'width:200px;';
    btn.addEventListener('click', () => {
      window.Sound?.play?.('click');
      overlayEl?.remove();
      overlayEl = null;
      if (typeof onCompleteCallback === 'function') onCompleteCallback(result);
    });
    wrap.appendChild(btn);
    overlayEl.appendChild(wrap);
  }

  // ── Public API ───────────────────────────────────────────

  function start(onComplete) {
    onCompleteCallback = onComplete;
    resetState();
    timeElapsed = { h: 18, m: 34, s: 7 };
    showMissionBrief();
  }

  return { start };
})();
