/**
 * software_scan.js
 * "Software-Scanner" minigame for Projekt 3 — Shadow IT im Keller.
 * A terminal-style network scan: each result appears line by line,
 * and the player must immediately categorize each service.
 */

const SCAN_ITEMS = [
  { line: '[SCAN] Port 80   → Apache HTTP Server 2.4 (Open Source)',              correct: 'lizenziert', delay: 400 },
  { line: '[SCAN] Port 443  → SSL-Zertifikat abgelaufen 14.03.2024',              correct: 'problem',    delay: 350 },
  { line: '[SCAN] Port 3306 → MySQL 5.7 (GPL — Open Source)',                    correct: 'lizenziert', delay: 500 },
  { line: '[SCAN] Port 8080 → Adobe Creative Cloud (8 User, kein Token)',         correct: 'problem',    delay: 600 },
  { line: '[SCAN] Port 3478 → Zoom Pro API (3 Lizenzen, ~40 Nutzer)',             correct: 'problem',    delay: 450 },
  { line: '[SCAN] Port 7777 → Minecraft Server \'MineCorp\' (23 Spieler)',          correct: 'prüfen',     delay: 800, isMinecraft: true },
  { line: '[SCAN] Port 9090 → Slack Premium Workspace \'Marketing-Secrets\'',       correct: 'problem',    delay: 550 },
  { line: '[SCAN] Port 22   → OpenSSH (Open Source)',                             correct: 'lizenziert', delay: 300 },
  { line: '[SCAN] Port 5432 → PostgreSQL 14 (Open Source)',                       correct: 'lizenziert', delay: 400 },
  { line: '[SCAN] Port 8443 → Dropbox Business API (5 Lizenzen?)',                correct: 'prüfen',     delay: 500 },
  { line: '[SCAN] Port 1433 → Microsoft SQL Server 2019 (Lizenz?)',               correct: 'prüfen',     delay: 550 },
  { line: '[SCAN] Port 4000 → Unbekannter Dienst \'bjorn_tool_v2\'',               correct: 'problem',    delay: 700 },
  { line: '[SCAN] Port 8888 → Jupyter Notebook (Open Source)',                    correct: 'lizenziert', delay: 350 },
  { line: '[SCAN] Port 9999 → TeamViewer Host (2 Lizenzen, 8 Nutzer)',            correct: 'problem',    delay: 500 },
  { line: '[SCAN] Port 2222 → FileZilla Server (Open Source)',                    correct: 'lizenziert', delay: 300 },
  { line: '[SCAN] Port 6666 → ???  Kein Banner. Kein Name. Antwortet.',           correct: 'problem',    delay: 900 },
];

const AUTO_SKIP_MS  = 8000;
const TERM_BG       = '#0a0a0a';
const TERM_GREEN    = '#00ff41';
const TERM_DIM      = '#005f00';

window.SoftwareScanMinigame = (function () {

  let answers           = {};
  let currentIndex      = 0;
  let overlay           = null;
  let terminalEl        = null;
  let counterEl         = null;
  let btnRowEl          = null;
  let autoSkipHandle    = null;
  let onCompleteCallback = null;
  let minecraftChoice   = null;

  // ── Build overlay ───────────────────────────────────────

  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.id = 'software-scan-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:2100',
      `background:${TERM_BG}`,
      'display:flex', 'flex-direction:column',
      'font-family:var(--font-mono)',
      'overflow:hidden',
    ].join(';');
    document.body.appendChild(overlay);
    return overlay;
  }

  function buildHeader() {
    const hdr = document.createElement('div');
    hdr.style.cssText = [
      `background:${TERM_BG}`,
      `border-bottom:1px solid ${TERM_DIM}`,
      'padding:var(--space-sm) var(--space-md)',
      'display:flex',
      'justify-content:space-between',
      'align-items:center',
    ].join(';');

    const title = document.createElement('span');
    title.style.cssText = `color:${TERM_GREEN};font-size:13px;`;
    title.textContent = '> NETZWERK-SCAN LÄUFT — Shadow IT Detektiv v1.0';

    counterEl = document.createElement('span');
    counterEl.style.cssText = `color:${TERM_DIM};font-size:12px;`;
    counterEl.textContent = `0 / ${SCAN_ITEMS.length} Dienste gescannt`;

    hdr.appendChild(title);
    hdr.appendChild(counterEl);
    overlay.appendChild(hdr);
  }

  function buildTerminal() {
    terminalEl = document.createElement('div');
    terminalEl.style.cssText = [
      'flex:1',
      'overflow-y:auto',
      'padding:var(--space-md)',
      `color:${TERM_GREEN}`,
      'font-size:13px',
      'line-height:2',
    ].join(';');
    overlay.appendChild(terminalEl);
  }

  function buildCategoryRow() {
    const wrap = document.createElement('div');
    wrap.style.cssText = [
      `background:${TERM_BG}`,
      `border-top:1px solid ${TERM_DIM}`,
      'padding:var(--space-md)',
      'display:flex',
      'flex-direction:column',
      'gap:var(--space-sm)',
    ].join(';');

    const label = document.createElement('div');
    label.style.cssText = `color:${TERM_DIM};font-size:11px;`;
    label.textContent = '> KLASSIFIZIEREN:';

    btnRowEl = document.createElement('div');
    btnRowEl.style.cssText = 'display:flex;gap:var(--space-sm);flex-wrap:wrap;';

    wrap.appendChild(label);
    wrap.appendChild(btnRowEl);
    overlay.appendChild(wrap);
  }

  // ── Terminal line output ─────────────────────────────────

  function printLine(text, colorOverride) {
    const line = document.createElement('div');
    line.style.cssText = `color:${colorOverride || TERM_GREEN};white-space:pre;`;
    line.textContent = text;
    terminalEl.appendChild(line);
    terminalEl.scrollTop = terminalEl.scrollHeight;
    return line;
  }

  function typewriteLine(text, delayMs, onDone) {
    const line = document.createElement('div');
    line.style.cssText = `color:${TERM_GREEN};white-space:pre;`;
    line.textContent = '';
    terminalEl.appendChild(line);
    terminalEl.scrollTop = terminalEl.scrollHeight;

    let i = 0;
    const perChar = Math.min(30, Math.floor(delayMs / (text.length + 1)));
    const interval = setInterval(() => {
      line.textContent += text[i++] ?? '';
      terminalEl.scrollTop = terminalEl.scrollHeight;
      if (i >= text.length) {
        clearInterval(interval);
        if (typeof onDone === 'function') onDone();
      }
    }, perChar);
  }

  // ── Category buttons ─────────────────────────────────────

  function renderButtons(item, index) {
    btnRowEl.innerHTML = '';

    const options = [
      { key: 'lizenziert', label: '✅ Lizenziert',  color: '#00c853' },
      { key: 'prüfen',     label: '⚠️ Prüfen',      color: '#ffab00' },
      { key: 'problem',    label: '🚫 Problem',     color: '#ff5252' },
    ];

    options.forEach(({ key, label, color }) => {
      const btn = document.createElement('button');
      btn.style.cssText = [
        `color:${color}`,
        `border:1px solid ${color}`,
        'background:transparent',
        'border-radius:var(--radius-sm)',
        'padding:6px 14px',
        'font-family:var(--font-mono)',
        'font-size:13px',
        'cursor:pointer',
        'touch-action:manipulation',
        'min-height:40px',
        'transition:background 0.1s',
      ].join(';');
      btn.textContent = label;

      btn.addEventListener('mouseenter', () => { btn.style.background = `${color}22`; });
      btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; });
      btn.addEventListener('click', () => {
        clearTimeout(autoSkipHandle);
        onScanAnswer(item, index, key);
      });
      btnRowEl.appendChild(btn);
    });
  }

  function disableButtons() {
    Array.from(btnRowEl.querySelectorAll('button')).forEach(b => { b.disabled = true; b.style.opacity = '0.3'; });
  }

  // ── Answer logic ─────────────────────────────────────────

  function onScanAnswer(item, index, choice) {
    disableButtons();
    answers[index] = choice;

    const isCorrect = choice === item.correct;
    const statusColor = isCorrect ? '#00c853' : '#ff5252';
    const statusText  = isCorrect ? '  ✓ OK' : `  ✗ (korrekt: ${item.correct})`;
    printLine(statusText, statusColor);

    if (item.isMinecraft) {
      minecraftChoice = choice;
      let msg = '';
      if (choice === 'problem') {
        msg = '> Korrekt. Aber Kevin schaut traurig.';
      } else if (choice === 'lizenziert') {
        msg = '> Minecraft ist nicht lizenziert. Aber Kevin freut sich.';
        window.Engine?.setFlag?.('minecraft_approved', true);
      } else {
        msg = '> Weise Entscheidung. Du weißt noch nicht was du damit machst.';
      }
      setTimeout(() => printLine(msg, '#ffab00'), 200);
    }

    setTimeout(() => showNextItem(index + 1), 600);
  }

  // ── Scan sequence ────────────────────────────────────────

  function showNextItem(index) {
    if (index >= SCAN_ITEMS.length) {
      clearTimeout(autoSkipHandle);
      setTimeout(finish, 500);
      return;
    }

    currentIndex = index;
    if (counterEl) counterEl.textContent = `${index} / ${SCAN_ITEMS.length} Dienste gescannt`;

    const item = SCAN_ITEMS[index];
    const lineText = item.line + ' ';
    const dots = '.'.repeat(Math.max(0, 62 - item.line.length)) + ' found';

    typewriteLine(lineText + dots, item.delay, () => {
      renderButtons(item, index);

      autoSkipHandle = setTimeout(() => {
        printLine('  > [AUTO-SKIP — keine Eingabe]', TERM_DIM);
        showNextItem(index + 1);
      }, AUTO_SKIP_MS);
    });
  }

  // ── Scoring & result ─────────────────────────────────────

  function finish() {
    clearTimeout(autoSkipHandle);

    let score = 0;
    SCAN_ITEMS.forEach((item, i) => {
      const ans = answers[i];
      if (!ans) return;
      if (ans === item.correct) score += 2;
      else score -= 1;
    });
    score = Math.max(0, score);
    const maxScore = SCAN_ITEMS.length * 2;
    const pct = Math.round((score / maxScore) * 100);

    let result;
    if (pct >= 75) {
      result = {
        score: pct,
        effects: { kompetenz: 5 },
        achievementTrigger: 'flag_shadow_server_found',
        xpBonus: 25,
      };
    } else if (pct >= 50) {
      result = {
        score: pct,
        effects: { kompetenz: 2 },
        achievementTrigger: null,
        xpBonus: 15,
      };
    } else {
      result = {
        score: pct,
        effects: { kompetenz: -1, bullshit: 3 },
        achievementTrigger: null,
        xpBonus: 5,
      };
    }

    showResult(pct, result);
  }

  function showResult(pct, result) {
    const isGreat  = pct >= 75;
    const isMedium = pct >= 50;

    const label = isGreat
      ? 'Vollständiger Scan. Du weißt was hier läuft.'
      : isMedium
        ? 'Grobe Übersicht. Ein paar Lücken.'
        : 'Du hast den Minecraft-Server als \'Lizenziert\' markiert. Kevin freut sich. Sonst niemand.';
    const accent = isGreat ? '#00c853' : isMedium ? '#ffab00' : '#ff5252';
    const emoji  = isGreat ? '🕵️' : isMedium ? '🔍' : '🎮';

    printLine('', TERM_GREEN);
    printLine('━'.repeat(60), TERM_DIM);
    printLine(`> SCAN ABGESCHLOSSEN — ${pct}% korrekt klassifiziert`, accent);
    printLine('', TERM_GREEN);

    setTimeout(() => {
      overlay.innerHTML = '';
      overlay.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:2100',
        `background:${TERM_BG}`,
        'display:flex', 'flex-direction:column', 'align-items:center', 'justify-content:center',
        'font-family:var(--font-mono)',
        'gap:var(--space-lg)',
        'padding:var(--space-xl)',
      ].join(';');

      overlay.innerHTML = `
        <div style="font-size:48px;">${emoji}</div>
        <div style="font-size:var(--font-size-xl);color:${accent};text-align:center;">${pct}% korrekt</div>
        <div style="font-size:var(--font-size-sm);color:#8b949e;text-align:center;max-width:400px;line-height:1.7;">${label}</div>
        <div style="font-size:var(--font-size-sm);color:#8b949e;">
          ${result.effects.kompetenz >= 0 ? '+' : ''}${result.effects.kompetenz} Kompetenz
          ${result.effects.bullshit ? ` · +${result.effects.bullshit} Bullshit` : ''}
          · +${result.xpBonus} XP
        </div>
      `;

      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = 'Scan-Bericht schließen';
      btn.style.cssText = `width:220px;background:transparent;border-color:${accent};color:${accent};`;
      btn.addEventListener('click', () => {
        window.Sound?.play('click');
        overlay.remove();
        overlay = null;
        if (typeof onCompleteCallback === 'function') {
          onCompleteCallback(result);
        }
      });
      overlay.appendChild(btn);
    }, 800);
  }

  // ── Public API ──────────────────────────────────────────

  function start(onComplete) {
    answers            = {};
    currentIndex       = 0;
    minecraftChoice    = null;
    onCompleteCallback = onComplete;

    overlay = buildOverlay();
    buildHeader();
    buildTerminal();
    buildCategoryRow();

    printLine('> Initialisiere Netzwerk-Scanner...', TERM_DIM);
    printLine('> Ziel: UG-3 Dell PowerEdge — 192.168.77.23', TERM_DIM);
    printLine('> Starte Port-Scan...', TERM_DIM);
    printLine('', TERM_GREEN);

    setTimeout(() => showNextItem(0), 800);
    window.Sound?.play('click');
  }

  return { start };

}());
