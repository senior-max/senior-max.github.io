/**
 * logfile_search.js
 * Log file analysis minigame for "License To Bill".
 * Exclusive to projekt_whistleblower scene wb_02_investigate.
 * Player scrolls through fake server logs and marks suspicious entries.
 */

const DURATION = 90;
const MAX_MARKS = 8;
const AUTO_SCROLL_INTERVAL = 15000;
const AUTO_SCROLL_PX = 200;
const CRITICAL_LINE_INDICES = [11, 27, 33, 50, 66]; // 1-based lines 12, 28, 34, 51, 67
const BUCHHALTUNG_INDEX = 46; // line 47
const MISDIRECTION_INDICES = [18, 42, 59]; // 3 entries that look suspicious but aren't critical

window.LogfileSearchMinigame = (function () {
  'use strict';

  let overlayEl = null;
  let onCompleteCallback = null;
  let timerHandle = null;
  let autoScrollHandle = null;
  let timeLeft = DURATION;
  let marked = new Set();
  let buchhaltungMarked = false;
  let autoScrollCount = 0;
  let logLines = [];

  // ── Log data ────────────────────────────────────────────

  function buildLogLines() {
    const lines = [];
    const criticalTexts = [
      '[2024-03-14 19:23:41] INFO  APP_INSTALL —\n  Software installation initiated: AdobeCC_2024_Full.exe\n  User: MB_ADMIN | License-Key: [NONE] | Verified: FALSE',
      '[2024-03-14 19:31:07] INFO  APP_INSTALL —\n  Software installation initiated: Visio_Pro_2024.msi\n  User: MB_ADMIN | License-Key: [NONE] | Verified: FALSE',
      '[2024-03-15 20:11:33] WARN  LICENSE_CHECK —\n  License validation FAILED for Adobe Creative Suite\n  User: MB_ADMIN | Attempts: 3 | Status: BYPASSED\n  Note: Firewall rule MB_FW_EXCEPTION_01 applied',
      '[2024-03-19 21:45:02] INFO  USER_SESSION —\n  Extended session started: MB_ADMIN\n  Duration: 4h 23min | Activity: HIGH\n  Applications active: Photoshop, Illustrator, Premiere Pro\n  [All unlicensed]',
      '[2024-03-21 19:02:18] INFO  NETWORK —\n  Outbound connection: mb_admin@corp → adobe.com/activation\n  Status: BLOCKED by corporate proxy\n  Retry count: 7 | Final status: LICENSE_BYPASS_ACTIVE\n  Firewall exception: MB_FW_EXCEPTION_01',
    ];
    const misdirectionTexts = [
      '[2024-03-14 14:22:01] WARN  APP_INSTALL —\n  Software installation: Teams_Update.exe\n  User: SYSTEM | License: MICROSOFT_EA_901 | Verified: TRUE',
      '[2024-03-15 19:00:00] INFO  USER_SESSION —\n  Extended session: SYSADMIN_AUTO\n  Duration: automated | Activity: scheduled backup',
      '[2024-03-18 16:33:12] WARN  LICENSE_CHECK —\n  License validation pending: Office_365_E3\n  User: IT_SERVICE | Status: RENEWAL_IN_PROGRESS',
    ];
    const buchhaltungText = '[2024-03-17 02:14:09] DEBUG SYSTEM —\n  Process detected: BUCHHALTUNG_2006.exe\n  PID: 2006 | Status: RUNNING | User: UNKNOWN\n  Last accessed: today | Origin: unknown';
    const noiseTemplates = [
      '[2024-03-14 08:00:01] INFO  SYSTEM — Daily health check: PASSED',
      '[2024-03-14 08:15:33] INFO  BACKUP — Incremental backup completed',
      '[2024-03-14 09:22:17] INFO  ANTIVIRUS — Scan completed. Threats: 0',
      '[2024-03-14 10:44:52] WARN  DISK — Disk usage at 78%. Threshold: 80%',
      '[2024-03-14 11:30:00] INFO  SCHEDULER — Maintenance task executed',
      '[2024-03-14 12:05:22] INFO  NETWORK — DHCP lease renewed',
      '[2024-03-14 13:18:44] DEBUG CACHE — Cache flush completed',
      '[2024-03-14 15:00:00] INFO  SCHEDULER — Weekly report generated',
      '[2024-03-14 16:22:11] INFO  SYSTEM — Memory usage: 62%',
      '[2024-03-14 17:45:00] INFO  BACKUP — Pre-backup verification OK',
      '[2024-03-15 08:00:02] INFO  SYSTEM — Daily health check: PASSED',
      '[2024-03-15 08:30:15] INFO  UPDATES — Windows Update check: no updates',
      '[2024-03-15 10:12:33] INFO  ANTIVIRUS — Definition update applied',
      '[2024-03-15 11:00:00] INFO  SCHEDULER — Log rotation completed',
      '[2024-03-15 12:45:22] WARN  DISK — Temp folder at 1.2GB',
      '[2024-03-15 14:00:00] INFO  BACKUP — Differential backup started',
      '[2024-03-15 15:30:11] INFO  NETWORK — Firewall rules reloaded',
      '[2024-03-16 08:00:01] INFO  SYSTEM — Daily health check: PASSED',
      '[2024-03-16 09:15:00] INFO  SCHEDULER — Cleanup task executed',
      '[2024-03-16 11:22:44] DEBUG CACHE — Redis connection stable',
      '[2024-03-16 13:00:00] INFO  BACKUP — Backup verification: OK',
      '[2024-03-16 15:45:12] INFO  ANTIVIRUS — Quick scan: 0 threats',
      '[2024-03-17 08:00:01] INFO  SYSTEM — Daily health check: PASSED',
      '[2024-03-17 09:30:00] INFO  UPDATES — Patch Tuesday: 3 applied',
      '[2024-03-17 11:00:22] INFO  NETWORK — VPN tunnel established',
      '[2024-03-17 13:15:33] WARN  DISK — Log volume at 85%',
      '[2024-03-17 15:00:00] INFO  BACKUP — Full backup initiated',
      '[2024-03-18 08:00:01] INFO  SYSTEM — Daily health check: PASSED',
      '[2024-03-18 09:45:00] INFO  SCHEDULER — Index rebuild completed',
      '[2024-03-18 11:30:22] INFO  ANTIVIRUS — Full scan started',
      '[2024-03-18 14:00:00] INFO  BACKUP — Backup completed successfully',
      '[2024-03-18 15:22:11] INFO  NETWORK — DNS cache cleared',
      '[2024-03-19 08:00:01] INFO  SYSTEM — Daily health check: PASSED',
      '[2024-03-19 09:00:00] INFO  UPDATES — No critical updates pending',
      '[2024-03-19 10:30:22] INFO  SCHEDULER — Database maintenance OK',
      '[2024-03-19 12:15:33] WARN  MEMORY — Page file usage: 72%',
      '[2024-03-19 14:45:00] INFO  BACKUP — Incremental backup completed',
      '[2024-03-19 16:00:11] INFO  NETWORK — Load balancer health: OK',
      '[2024-03-20 08:00:01] INFO  SYSTEM — Daily health check: PASSED',
      '[2024-03-20 09:30:00] INFO  ANTIVIRUS — Scan completed. Threats: 0',
      '[2024-03-20 11:00:22] INFO  SCHEDULER — Certificate check: valid',
      '[2024-03-20 13:22:33] DEBUG CACHE — Connection pool: 10/10',
      '[2024-03-20 15:00:00] INFO  BACKUP — Pre-backup verification OK',
      '[2024-03-21 08:00:01] INFO  SYSTEM — Daily health check: PASSED',
      '[2024-03-21 08:45:00] INFO  UPDATES — Security patch applied',
      '[2024-03-21 10:15:22] INFO  NETWORK — BGP session stable',
      '[2024-03-21 11:30:33] WARN  DISK — Backup target at 88%',
      '[2024-03-21 13:00:00] INFO  SCHEDULER — Report generation completed',
      '[2024-03-21 14:30:11] INFO  ANTIVIRUS — Definition update: latest',
      '[2024-03-21 16:00:00] INFO  BACKUP — Differential backup completed',
    ];

    let noiseIdx = 0;
    for (let i = 0; i < 80; i++) {
      if (CRITICAL_LINE_INDICES.includes(i)) {
        lines.push({ text: criticalTexts[CRITICAL_LINE_INDICES.indexOf(i)], type: 'critical', index: i });
      } else if (i === BUCHHALTUNG_INDEX) {
        lines.push({ text: buchhaltungText, type: 'buchhaltung', index: i });
      } else if (MISDIRECTION_INDICES.includes(i)) {
        lines.push({ text: misdirectionTexts[MISDIRECTION_INDICES.indexOf(i)], type: 'misdirection', index: i });
      } else {
        lines.push({ text: noiseTemplates[noiseIdx % noiseTemplates.length], type: 'noise', index: i });
        noiseIdx++;
      }
    }
    return lines;
  }

  // ── Toast ──────────────────────────────────────────────

  function showToast(text) {
    if (window.KeyboardController?.showToast) {
      window.KeyboardController.showToast(text, 'var(--color-accent-amber)');
    } else {
      const t = document.createElement('div');
      t.style.cssText = 'position:fixed;bottom:var(--space-lg);left:50%;transform:translateX(-50%);z-index:3500;background:var(--color-surface-elevated);padding:8px 16px;border-radius:4px;font-size:13px;';
      t.textContent = text;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 3000);
    }
  }

  // ── Scoring ─────────────────────────────────────────────

  function computeScore() {
    let criticalFound = 0;
    let falsePositives = 0;
    for (const idx of marked) {
      if (CRITICAL_LINE_INDICES.includes(idx)) criticalFound++;
      else if (MISDIRECTION_INDICES.includes(idx) || (logLines[idx]?.type === 'noise')) falsePositives++;
    }
    return { criticalFound, falsePositives };
  }

  function finish() {
    clearInterval(timerHandle);
    timerHandle = null;
    if (autoScrollHandle) {
      clearInterval(autoScrollHandle);
      autoScrollHandle = null;
    }

    const { criticalFound, falsePositives } = computeScore();
    let result;

    if (criticalFound === 5 && falsePositives === 0) {
      result = {
        score: 100,
        message: 'Lückenlose Dokumentation. MB_ADMIN hat keine Erklärung für diese Logs.',
        effects: { kompetenz: 8, burnout: 4 },
        xpBonus: 35,
        achievementTrigger: 'log_detective',
        flags: { evidenceStrength_full: true, evidenceStrength_sufficient: true },
      };
    } else if (criticalFound >= 3 && criticalFound <= 4 && falsePositives === 0) {
      result = {
        score: 65,
        message: 'Ausreichend. Nicht perfekt. Ein guter Anwalt könnte die Lücken nutzen.',
        effects: { kompetenz: 5, burnout: 5 },
        xpBonus: 20,
        flags: { evidenceStrength_partial: true, evidenceStrength_sufficient: true },
      };
    } else {
      result = {
        score: 25,
        message: 'Zu wenig Beweise. Zu viele Fehler. Damit kommst du nicht weit.',
        effects: { kompetenz: 2, burnout: 8 },
        xpBonus: 5,
        flags: { evidenceStrength_weak: true },
      };
    }

    overlayEl?.remove();
    overlayEl = null;
    if (typeof onCompleteCallback === 'function') onCompleteCallback(result);
  }

  // ── UI ─────────────────────────────────────────────────

  function buildOverlay() {
    overlayEl = document.createElement('div');
    overlayEl.id = 'logfile-search-overlay';
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:2100',
      'background:#0d1117',
      'font-family:monospace',
      'font-size:0.8rem',
      'color:#8b949e',
      'display:flex', 'flex-direction:column',
      'overflow:hidden',
    ].join(';');
    document.body.appendChild(overlayEl);
    return overlayEl;
  }

  function buildHeader() {
    const header = document.createElement('div');
    header.style.cssText = [
      'display:flex', 'justify-content:space-between', 'align-items:center',
      'padding:8px 16px',
      'border-bottom:1px solid #30363d',
      'flex-shrink:0',
    ].join(';');
    header.innerHTML = `
      <span style="color:#8b949e;">MGMT-SRV-09 // EVENT_LOG // READ-ONLY</span>
      <div style="display:flex;align-items:center;gap:16px;">
        <span id="logfile-cursor" style="color:#3fb950;animation:logfile-blink 1s step-end infinite;">█</span>
        <span id="logfile-timer" style="color:#8b949e;">${timeLeft}s</span>
      </div>
    `;
    overlayEl.appendChild(header);
  }

  function buildSearchBar() {
    const bar = document.createElement('div');
    bar.style.cssText = 'padding:8px 16px;border-bottom:1px solid #30363d;flex-shrink:0;';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Suche... (nicht implementiert auf diesem System)';
    input.style.cssText = [
      'width:100%', 'max-width:400px',
      'background:#161b22', 'border:1px solid #30363d',
      'border-radius:4px', 'padding:8px 12px',
      'color:#8b949e', 'font-family:monospace', 'font-size:0.8rem',
    ].join(';');
    input.addEventListener('focus', () => input.blur());
    input.addEventListener('keydown', (e) => {
      e.preventDefault();
      input.style.animation = 'none';
      input.offsetHeight;
      input.style.animation = 'logfile-shake 0.4s ease';
      setTimeout(() => { input.style.animation = ''; }, 400);
      showToast('Suchfunktion: deaktiviert. Budget: nicht genehmigt.');
    });
    input.addEventListener('click', () => {
      input.style.animation = 'none';
      input.offsetHeight;
      input.style.animation = 'logfile-shake 0.4s ease';
      setTimeout(() => { input.style.animation = ''; }, 400);
      showToast('Suchfunktion: deaktiviert. Budget: nicht genehmigt.');
    });
    bar.appendChild(input);
    overlayEl.appendChild(bar);
  }

  function buildMain() {
    const main = document.createElement('div');
    main.style.cssText = 'display:flex;flex:1;overflow:hidden;min-height:0;';

    const left = document.createElement('div');
    left.style.cssText = 'flex:0 0 70%;display:flex;flex-direction:column;overflow:hidden;border-right:1px solid #30363d;';
    const logTitle = document.createElement('div');
    logTitle.style.cssText = 'padding:8px 16px;font-size:10px;color:#6e7681;text-transform:uppercase;';
    logTitle.textContent = 'Log Output (47.000 Einträge — Ausschnitt)';
    left.appendChild(logTitle);
    const logScroll = document.createElement('div');
    logScroll.id = 'logfile-log';
    logScroll.style.cssText = [
      'flex:1', 'overflow-y:auto', 'padding:8px 16px',
      'font-size:0.75rem', 'line-height:1.6',
      'white-space:pre-wrap', 'word-break:break-all',
    ].join(';');
    logLines.forEach((line, i) => {
      const row = document.createElement('div');
      row.dataset.index = String(i);
      row.style.cssText = [
        'padding:4px 8px', 'margin:2px 0',
        'border-radius:4px', 'cursor:pointer',
        'border:1px solid transparent',
        line.type === 'critical' ? 'color:#c9d1d9' : 'color:#8b949e',
      ].join(';');
      row.textContent = `[${i + 1}] ${line.text}`;
      row.addEventListener('click', () => toggleMark(i, row));
      logScroll.appendChild(row);
    });
    left.appendChild(logScroll);
    main.appendChild(left);

    const right = document.createElement('div');
    right.style.cssText = 'flex:0 0 30%;display:flex;flex-direction:column;overflow:hidden;';
    const rightTitle = document.createElement('div');
    rightTitle.style.cssText = 'padding:8px 16px;font-size:10px;color:#6e7681;text-transform:uppercase;border-bottom:1px solid #30363d;';
    rightTitle.textContent = 'Markierte Einträge';
    right.appendChild(rightTitle);
    const rightList = document.createElement('div');
    rightList.id = 'logfile-marked';
    rightList.style.cssText = 'flex:1;overflow-y:auto;padding:8px;font-size:0.7rem;';
    right.appendChild(rightList);
    main.appendChild(right);

    overlayEl.appendChild(main);
  }

  function toggleMark(index, rowEl) {
    const line = logLines[index];
    if (line.type === 'buchhaltung') {
      if (!buchhaltungMarked) {
        buchhaltungMarked = true;
        rowEl.style.background = 'rgba(210, 153, 34, 0.2)';
        rowEl.style.borderColor = '#d29922';
        updateMarkedPanel();
        showToast('BUCHHALTUNG 2006 läuft auch hier. Es ist überall.');
        window.Achievements?.checkTrigger?.('buchhaltung_everywhere');
      } else {
        buchhaltungMarked = false;
        rowEl.style.background = '';
        rowEl.style.borderColor = 'transparent';
        updateMarkedPanel();
      }
      return;
    }

    if (marked.has(index)) {
      marked.delete(index);
      rowEl.style.background = '';
      rowEl.style.borderColor = 'transparent';
    } else {
      if (marked.size >= MAX_MARKS) {
        showToast('Maximale Markierungen erreicht. Priorisieren Sie.');
        return;
      }
      marked.add(index);
      rowEl.style.background = 'rgba(210, 153, 34, 0.25)';
      rowEl.style.borderColor = '#d29922';
    }
    updateMarkedPanel();
  }

  function updateMarkedPanel() {
    const panel = overlayEl?.querySelector('#logfile-marked');
    if (!panel) return;
    panel.innerHTML = '';
    const entries = [...marked].sort((a, b) => a - b);
    entries.forEach((idx) => {
      const line = logLines[idx];
      const div = document.createElement('div');
      div.style.cssText = 'padding:4px 0;border-bottom:1px solid #21262d;color:#8b949e;';
      div.textContent = `[${idx + 1}] ${(line.text || '').slice(0, 60)}${(line.text || '').length > 60 ? '…' : ''}`;
      panel.appendChild(div);
    });
    if (buchhaltungMarked) {
      const div = document.createElement('div');
      div.style.cssText = 'padding:4px 0;border-bottom:1px solid #21262d;color:#d29922;';
      div.textContent = `[47] BUCHHALTUNG_2006.exe — Easter Egg`;
      panel.appendChild(div);
    }
  }

  function startAutoScroll() {
    if (autoScrollHandle) return;
    autoScrollHandle = setInterval(() => {
      const logEl = overlayEl?.querySelector('#logfile-log');
      if (!logEl) return;
      autoScrollCount++;
      if (autoScrollCount === 1) {
        showToast('Log läuft weiter. Das System schreibt live.');
      }
      logEl.scrollTop = Math.min(logEl.scrollHeight, logEl.scrollTop + AUTO_SCROLL_PX);
    }, AUTO_SCROLL_INTERVAL);
  }

  function startTimer() {
    timerHandle = setInterval(() => {
      timeLeft--;
      const el = overlayEl?.querySelector('#logfile-timer');
      if (el) {
        el.textContent = `${timeLeft}s`;
        if (timeLeft <= 20) el.style.color = '#f85149';
      }
      if (timeLeft <= 0) {
        clearInterval(timerHandle);
        timerHandle = null;
        showToast('Zeit abgelaufen. Log läuft weiter. Du nicht mehr.');
        finish();
      }
    }, 1000);
  }

  // ── Public API ─────────────────────────────────────────

  function start(onComplete) {
    onCompleteCallback = onComplete;
    timeLeft = DURATION;
    marked = new Set();
    buchhaltungMarked = false;
    autoScrollCount = 0;
    logLines = buildLogLines();

    buildOverlay();
    buildHeader();
    buildSearchBar();
    buildMain();

    const style = document.createElement('style');
    style.textContent = `
      @keyframes logfile-blink { 50% { opacity: 0; } }
      @keyframes logfile-shake {
        0%,100% { transform: translateX(0); }
        20% { transform: translateX(-4px); }
        40% { transform: translateX(4px); }
        60% { transform: translateX(-2px); }
        80% { transform: translateX(2px); }
      }
    `;
    overlayEl.appendChild(style);

    startTimer();
    startAutoScroll();
    window.Sound?.play?.('click');
  }

  return { start };
})();
