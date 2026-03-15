/**
 * zombie_check.js
 * "Zombie-Erkennung" minigame for Projekt 2 — SAP Zombie-Lizenzen.
 * Players classify 15 SAP user accounts as aktiv / inaktiv / verdächtig
 * within 75 seconds.
 */

const ZOMBIE_USERS = [
  { username: 'MSCHMIDT',          lastLogin: 'gestern',           department: 'Vertrieb',       correct: 'aktiv' },
  { username: 'HBAUM',             lastLogin: 'nie',               department: 'IT',             correct: 'inaktiv',    hint: 'Erstellt 2011. Nie benutzt.' },
  { username: 'AWEBER',            lastLogin: 'vor 4 Jahren',      department: 'HR',             correct: 'inaktiv' },
  { username: 'ZZZ_TEST',          lastLogin: 'vor 2 Jahren',      department: '---',            correct: 'inaktiv',    hint: 'Testaccount. Hat aber SAP-Vollzugriff.' },
  { username: 'ADMIN2',            lastLogin: 'vor 6 Monaten',     department: 'IT',             correct: 'verdächtig', hint: 'Wer ist Admin2? Niemand weiß es.' },
  { username: 'TFRANZ',            lastLogin: 'letzte Woche',      department: 'Einkauf',        correct: 'aktiv' },
  { username: 'WBAUM',             lastLogin: 'Oktober 2022',      department: 'Controlling',    correct: 'verdächtig', hint: 'HR: Wolfgang Baum, verstorben März 2020.' },
  { username: 'PRAKTIKANT',        lastLogin: 'vor 3 Jahren',      department: 'Marketing',      correct: 'inaktiv',    hint: 'Praktikum war 2021. Account noch offen.' },
  { username: 'BKOCH',             lastLogin: 'täglich',           department: 'Buchhaltung',    correct: 'aktiv' },
  { username: 'MMÜLLER1',          lastLogin: 'täglich',           department: 'Geschäftsf.',    correct: 'aktiv' },
  { username: 'MMÜLLER2',          lastLogin: 'nie',               department: 'Geschäftsf.',    correct: 'inaktiv',    hint: 'Duplikat. Schreibfehler bei Erstellung 2015.' },
  { username: 'ZZZ_LÖSCHEN_2018',  lastLogin: 'nie',               department: '---',            correct: 'inaktiv',    hint: 'Der Name sagt alles. Und doch ist er noch da.' },
  { username: 'EXTERN_BERATER',    lastLogin: 'vor 18 Monaten',    department: 'extern',         correct: 'verdächtig', hint: 'Externer Berater. Projekt endete 2022.' },
  { username: 'SVOGT',             lastLogin: 'heute',             department: 'Vorstand',       correct: 'aktiv' },
  { username: '???',               lastLogin: 'unbekannt',         department: 'unbekannt',      correct: 'verdächtig', hint: 'Keine HR-Daten gefunden. Account existiert seit 2008.' },
];

const ZOMBIE_DURATION = 75;
const BORDER_COLORS = {
  correct: 'var(--color-accent-green)',
  wrong:   'var(--color-accent-red)',
};

window.ZombieCheckMinigame = (function () {

  let answers      = {};
  let timerEl      = null;
  let timerBarEl   = null;
  let timerHandle  = null;
  let timeLeft     = ZOMBIE_DURATION;
  let onCompleteCallback = null;
  let overlay      = null;

  // ── Build UI ────────────────────────────────────────────

  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.id = 'zombie-minigame-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:2100',
      'background:var(--color-bg)',
      'overflow-y:auto',
      'display:flex', 'flex-direction:column',
      'font-family:var(--font-mono)',
    ].join(';');
    document.body.appendChild(overlay);
    return overlay;
  }

  function buildHeader(wrap) {
    const hdr = document.createElement('div');
    hdr.style.cssText = [
      'position:sticky', 'top:0', 'z-index:10',
      'background:var(--color-bg)',
      'padding:var(--space-md) var(--space-lg)',
      'border-bottom:1px solid var(--color-border)',
      'display:flex', 'flex-direction:column', 'gap:6px',
    ].join(';');

    hdr.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:var(--font-size-lg);">🧟 SAP Zombie-Erkennung</span>
        <span id="zm-timer" style="color:var(--color-accent-amber);font-size:var(--font-size-base);">${ZOMBIE_DURATION}s</span>
      </div>
      <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);">
        Klassifiziere alle Accounts: 👤 Aktiv · 💀 Inaktiv · 👻 Verdächtig
      </div>
    `;

    const barWrap = document.createElement('div');
    barWrap.style.cssText = 'height:4px;background:var(--color-border);border-radius:2px;overflow:hidden;margin-top:4px;';
    timerBarEl = document.createElement('div');
    timerBarEl.style.cssText = `height:100%;width:100%;background:var(--color-accent-amber);transition:width 1s linear,background 0.5s;`;
    barWrap.appendChild(timerBarEl);
    hdr.appendChild(barWrap);

    timerEl = hdr.querySelector('#zm-timer');
    wrap.appendChild(hdr);
  }

  function buildFlashZone(wrap) {
    const flash = document.createElement('div');
    flash.id = 'zm-flash';
    flash.style.cssText = [
      'margin:var(--space-sm) var(--space-lg) 0',
      'padding:var(--space-sm) var(--space-md)',
      'background:rgba(230,162,60,0.15)',
      'border:1px solid var(--color-accent-amber)',
      'border-radius:var(--radius-md)',
      'font-size:var(--font-size-sm)',
      'color:var(--color-accent-amber)',
      'display:none',
    ].join(';');
    wrap.appendChild(flash);
  }

  function showFlash(msg) {
    const el = overlay.querySelector('#zm-flash');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 5000);
  }

  function buildUserCard(user, index) {
    const card = document.createElement('div');
    card.id = `zm-card-${index}`;
    card.style.cssText = [
      'background:var(--color-surface-elevated)',
      'border:1px solid var(--color-border)',
      'border-radius:var(--radius-md)',
      'padding:var(--space-md)',
      'display:flex', 'flex-direction:column', 'gap:6px',
      'transition:border-color 0.2s',
    ].join(';');

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px;">
        <span style="font-size:var(--font-size-base);font-family:var(--font-mono);color:var(--color-accent-cyan);">${user.username}</span>
        <span style="font-size:10px;color:var(--color-text-secondary);">Letzter Login: <b>${user.lastLogin}</b> · Abt.: ${user.department}</span>
      </div>
      ${user.hint ? `<div style="font-size:11px;color:var(--color-text-secondary);font-style:italic;">ℹ ${user.hint}</div>` : ''}
    `;

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;';

    const options = [
      { key: 'aktiv',     label: '👤 Aktiv',     color: 'var(--color-accent-green)' },
      { key: 'inaktiv',   label: '💀 Inaktiv',   color: 'var(--color-text-secondary)' },
      { key: 'verdächtig',label: '👻 Verdächtig', color: 'var(--color-accent-amber)' },
    ];

    options.forEach(({ key, label, color }) => {
      const btn = document.createElement('button');
      btn.dataset.choice = key;
      btn.style.cssText = [
        `color:${color}`,
        'background:transparent',
        `border:1px solid ${color}`,
        'border-radius:var(--radius-sm)',
        'padding:4px 10px',
        'font-family:var(--font-mono)',
        'font-size:var(--font-size-sm)',
        'cursor:pointer',
        'touch-action:manipulation',
        'transition:background 0.15s, opacity 0.15s',
        'min-height:36px',
      ].join(';');
      btn.textContent = label;

      btn.addEventListener('click', () => onAnswer(user, index, key, card, btnRow));
      btnRow.appendChild(btn);
    });

    card.appendChild(btnRow);
    return card;
  }

  // ── Answer handling ─────────────────────────────────────

  function onAnswer(user, index, choice, card, btnRow) {
    if (answers[index] !== undefined) return;
    answers[index] = choice;

    const isCorrect = choice === user.correct;
    card.style.borderColor = isCorrect ? BORDER_COLORS.correct : BORDER_COLORS.wrong;

    Array.from(btnRow.querySelectorAll('button')).forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = btn.dataset.choice === choice ? '1' : '0.3';
    });

    if (user.username === 'WBAUM' && choice === 'verdächtig') {
      window.Engine?.setFlag?.('ghost_login_found', true);
      showFlash('⚠️ Wolfgang Baum — verstorben März 2020. Last login: Oktober 2022. Du hast das gefunden.');
    }

    if (Object.keys(answers).length === ZOMBIE_USERS.length) {
      clearInterval(timerHandle);
      setTimeout(finish, 800);
    }
  }

  // ── Timer ───────────────────────────────────────────────

  function startTimer() {
    timeLeft = ZOMBIE_DURATION;
    timerHandle = setInterval(() => {
      timeLeft--;
      if (timerEl) timerEl.textContent = `${timeLeft}s`;
      const pct = (timeLeft / ZOMBIE_DURATION) * 100;
      if (timerBarEl) {
        timerBarEl.style.width = `${pct}%`;
        if (timeLeft <= 20) timerBarEl.style.background = 'var(--color-accent-red)';
      }
      if (timeLeft <= 0) {
        clearInterval(timerHandle);
        finish();
      }
    }, 1000);
  }

  // ── Scoring & finish ────────────────────────────────────

  function finish() {
    clearInterval(timerHandle);

    let score = 0;
    ZOMBIE_USERS.forEach((user, i) => {
      const ans = answers[i];
      if (!ans) return;
      if (ans === user.correct) score += 2;
      else score -= 1;
    });
    score = Math.max(0, score);
    const maxScore = ZOMBIE_USERS.length * 2;
    const pct = Math.round((score / maxScore) * 100);

    let result;
    if (pct >= 80) {
      result = {
        score: pct,
        effects: { kompetenz: 6 },
        achievementTrigger: 'flag_all_zombies_found',
        xpBonus: 25,
      };
    } else if (pct >= 50) {
      result = {
        score: pct,
        effects: { kompetenz: 3 },
        achievementTrigger: null,
        xpBonus: 15,
      };
    } else {
      result = {
        score: pct,
        effects: { kompetenz: -2, burnout: 6 },
        achievementTrigger: null,
        xpBonus: 5,
      };
    }

    showResult(pct, result);
  }

  function showResult(pct, result) {
    const isGreat  = pct >= 80;
    const isMedium = pct >= 50;

    const label   = isGreat  ? 'Zombie-Jäger. Alle Geister gefunden.'
      : isMedium ? 'Solide. Ein paar Zombies schlüpfen durch.'
      : 'Mehrere aktive Accounts von Verstorbenen übersehen. SAP ist nicht amüsiert.';
    const accent  = isGreat ? 'var(--color-accent-green)'
      : isMedium ? 'var(--color-accent-amber)'
      : 'var(--color-accent-red)';
    const emoji   = isGreat ? '🏆' : isMedium ? '🕵️' : '💀';

    overlay.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.style.cssText = [
      'display:flex', 'flex-direction:column', 'align-items:center',
      'gap:var(--space-lg)', 'padding:var(--space-xl)',
      'max-width:480px', 'margin:0 auto',
    ].join(';');

    wrap.innerHTML = `
      <div style="font-size:48px;">${emoji}</div>
      <div style="font-size:var(--font-size-xl);color:${accent};text-align:center;">
        ${pct}% korrekt
      </div>
      <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);text-align:center;line-height:1.7;">
        ${label}
      </div>
      <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);">
        ${result.effects.kompetenz > 0 ? `+${result.effects.kompetenz}` : result.effects.kompetenz} Kompetenz
        ${result.effects.burnout ? ` · +${result.effects.burnout} Burnout` : ''}
        · +${result.xpBonus} XP
      </div>
    `;

    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = 'Weiter';
    btn.style.cssText = 'width:200px;';
    btn.addEventListener('click', () => {
      window.Sound?.play('click');
      overlay.remove();
      overlay = null;
      if (typeof onCompleteCallback === 'function') {
        onCompleteCallback(result);
      }
    });
    wrap.appendChild(btn);
    overlay.appendChild(wrap);
  }

  // ── Public API ──────────────────────────────────────────

  function start(onComplete) {
    answers  = {};
    timeLeft = ZOMBIE_DURATION;
    onCompleteCallback = onComplete;

    overlay = buildOverlay();
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:var(--space-sm);max-width:640px;margin:0 auto;width:100%;';

    buildHeader(wrap);
    buildFlashZone(wrap);

    const grid = document.createElement('div');
    grid.style.cssText = 'display:flex;flex-direction:column;gap:var(--space-sm);padding:var(--space-md) var(--space-lg);';

    ZOMBIE_USERS.forEach((user, i) => {
      grid.appendChild(buildUserCard(user, i));
    });

    wrap.appendChild(grid);
    overlay.appendChild(wrap);

    startTimer();
    window.Sound?.play('click');
  }

  return { start };

}());
