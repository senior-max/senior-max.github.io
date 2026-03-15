/**
 * flexera.js
 * Flexera One navigation parody minigame for "License To Bill".
 * Player must find the Software Compliance Summary Report in a satirical enterprise UX.
 * 75 second timer. Burnout scales with time and wrong paths.
 */

const FLEXERA_ORANGE = '#E8622A';
const TIMER_SECONDS = 75;
const LOADING_CHANCE = 0.3;
const LOADING_MS = 800;
const SESSION_WARNING_AT = 30;

const NAV_TREE = {
  Dashboard: {
    Overview: 'DEAD_END — Zeigt ein leeres Widget-Dashboard. Hinweis: "Keine Daten verfügbar. Bitte Discovery-Agent prüfen."',
    'My Widgets': 'DEAD_END — Seite lädt. Dann: "Widget konnte nicht geladen werden."',
    'Notifications (3)': 'DEAD_END — Alle 3 Notifications: "Ihre Sitzung wurde auf einem anderen Gerät geöffnet." Es ist Ihr Gerät.',
  },
  'IT Assets': {
    'Hardware Assets': 'DEAD_END — falsche Kategorie',
    'Software Assets': {
      'All Software': 'DEAD_END — 47.000 Einträge. Keine Filter vorausgewählt. Ladezeit: 4 Sekunden (simuliert). Kevin hat mal hier etwas gesucht. Er hat es nicht gefunden.',
      'Software Models': 'DEAD_END — falsche Ebene',
      Installations: 'DEAD_END — Installationsliste. Kein Report hier.',
      'License Positions': {
        Overview: 'DEAD_END — zeigt Zahlen ohne Kontext',
        'By Vendor': 'DEAD_END — Liste. Kein Export-Button.',
        Compliance: {
          Summary: 'DEAD_END — fast! Aber das ist License Compliance, nicht Software Compliance. Andere Sektion.',
          'Detail View': 'DEAD_END',
          Remediation: 'DEAD_END',
        },
      },
    },
    'Cloud Assets': 'DEAD_END — falsche Kategorie',
  },
  Reports: {
    'Standard Reports': {
      'Hardware Reports': 'DEAD_END — falsche Kategorie',
      'Software Reports': {
        'Usage Reports': 'DEAD_END — Nutzung, nicht Compliance',
        'Compliance Reports': {
          'License Compliance': 'DEAD_END — ähnlicher Name, falscher Report',
          'Software Compliance Summary': 'GOAL',
          'Software Compliance Detail': 'DEAD_END — zu detailliert',
          'Vendor Compliance': 'DEAD_END',
        },
        'Cost Reports': 'DEAD_END',
      },
      'Cloud Reports': 'DEAD_END',
    },
    'Custom Reports': 'DEAD_END — "Sie haben keine Custom Reports. Wenden Sie sich an Ihren Administrator."',
    'Scheduled Reports': 'DEAD_END — zeigt einen Report der "zuletzt ausgeführt: nie" war',
    'Report Templates (BETA)': 'DEAD_END — Beta-Feature. Zeigt: "Diese Funktion ist noch nicht verfügbar in Ihrer Region."',
  },
  Optimization: 'DEAD_END — ganzer Bereich ist hinter "Advanced License" gesperrt',
  Administration: {
    Users: 'DEAD_END — Sie haben keine Admin-Rechte für diesen Bereich',
    Settings: 'DEAD_END — Sie haben keine Admin-Rechte für diesen Bereich',
    'Data Import': 'DEAD_END — falsche Sektion',
    'License Records': 'DEAD_END — close but wrong',
  },
  Help: {
    Documentation: 'DEAD_END — öffnet externes Portal. Suche nach "Software Compliance Summary Report": 47 Ergebnisse. Keine davon erklärt wo der Report ist.',
    'Support Ticket erstellen': 'DEAD_END — Formular mit 12 Pflichtfeldern. Kategorie "Report Location" existiert nicht.',
    'Community Forum': 'DEAD_END_EASTER_EGG — Letzter Post von "flexera_user_2019": "Hat jemand den Software Compliance Summary Report gefunden?" 2 Antworten. Keine Lösung. 847 Aufrufe.',
  },
};

window.FlexeraMinigame = (function () {
  'use strict';

  let overlayEl = null;
  let onCompleteCallback = null;
  let timerHandle = null;
  let timeLeft = TIMER_SECONDS;
  let breadcrumb = [];
  let currentNode = NAV_TREE;
  let clicksToGoal = 0;
  let deadEndCount = 0;
  let communityForumClicked = false;
  let sessionWarningShown = false;
  let contentEl = null;
  let sidebarEl = null;
  let breadcrumbEl = null;

  // ── Helpers ─────────────────────────────────────────────

  function getNodeAtPath(path) {
    let node = NAV_TREE;
    for (const key of path) {
      if (!node || typeof node !== 'object') return null;
      node = node[key];
    }
    return node;
  }

  function getChildren(node) {
    if (!node || typeof node !== 'object') return null;
    return Object.keys(node);
  }

  function isGoal(value) {
    return value === 'GOAL';
  }

  function isDeadEnd(value) {
    return typeof value === 'string' && value.startsWith('DEAD_END');
  }

  function getDeadEndMessage(value) {
    if (typeof value !== 'string') return '';
    if (value.startsWith('DEAD_END_EASTER_EGG')) {
      return 'Letzter Post von "flexera_user_2019": "Hat jemand den Software Compliance Summary Report gefunden?" 2 Antworten. Keine Lösung. 847 Aufrufe.';
    }
    return value.replace(/^DEAD_END —\s*/, '').trim();
  }

  function isEasterEggPath(value) {
    return typeof value === 'string' && value.startsWith('DEAD_END_EASTER_EGG');
  }

  // ── Timer ───────────────────────────────────────────────

  function startTimer() {
    const timerEl = overlayEl?.querySelector('#flexera-timer');
    if (!timerEl) return;

    timerHandle = setInterval(() => {
      timeLeft -= 1;
      timerEl.textContent = `${timeLeft}s`;
      if (timeLeft <= 0) {
        clearInterval(timerHandle);
        handleTimeout();
      } else if (timeLeft === TIMER_SECONDS - SESSION_WARNING_AT && !sessionWarningShown) {
        sessionWarningShown = true;
        showSessionWarning();
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerHandle) {
      clearInterval(timerHandle);
      timerHandle = null;
    }
  }

  // ── UI Build ────────────────────────────────────────────

  function showMissionBrief() {
    const brief = document.createElement('div');
    brief.id = 'flexera-brief';
    brief.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:2100',
      'background:var(--color-bg)', 'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center', 'padding:var(--space-xl)',
      'font-family:var(--font-mono)', 'text-align:center',
    ].join(';');

    brief.innerHTML = `
      <div style="font-size:var(--font-size-xl);color:${FLEXERA_ORANGE};margin-bottom:var(--space-lg);">🟠 Flexera One</div>
      <div style="font-size:var(--font-size-base);color:var(--color-text-primary);max-width:480px;line-height:1.8;margin-bottom:var(--space-xl);">
        Dr. Müller-Brandt braucht den Software Compliance Summary Report.<br>
        Sofort. Der Report existiert. Irgendwo in Flexera One.<br>
        <strong style="color:var(--color-accent-amber);">Sie haben 75 Sekunden.</strong>
      </div>
      <button type="button" class="choice-btn" id="flexera-start-btn" style="width:200px;">Bericht suchen</button>
    `;

    document.body.appendChild(brief);
    brief.querySelector('#flexera-start-btn').addEventListener('click', () => {
      window.Sound?.play?.('click');
      brief.remove();
      buildMainUI();
      startTimer();
    });
  }

  function showSessionWarning() {
    const warn = document.createElement('div');
    warn.id = 'flexera-session-warn';
    warn.style.cssText = [
      'position:fixed', 'bottom:var(--space-lg)', 'left:50%', 'transform:translateX(-50%)',
      'z-index:2200', 'background:#f0ad4e', 'color:#000',
      'padding:var(--space-sm) var(--space-md)', 'border-radius:var(--radius-sm)',
      'font-size:var(--font-size-sm)', 'display:flex', 'align-items:center', 'gap:var(--space-md)',
      'box-shadow:0 4px 12px rgba(0,0,0,0.3)',
    ].join(';');
    warn.innerHTML = `
      <span>Ihre Sitzung läuft in 10 Minuten ab.</span>
      <button type="button" style="background:#fff;border:none;padding:4px 12px;border-radius:3px;cursor:pointer;font-size:12px;">Sitzung verlängern</button>
    `;
    document.body.appendChild(warn);
    warn.querySelector('button').addEventListener('click', () => {});
    setTimeout(() => warn.remove(), 3000);
  }

  function showLoadingSpinner() {
    return new Promise((resolve) => {
      const spinner = document.createElement('div');
      spinner.id = 'flexera-spinner';
      spinner.style.cssText = [
        'position:absolute', 'inset:0', 'background:rgba(255,255,255,0.7)',
        'display:flex', 'align-items:center', 'justify-content:center',
        'z-index:100', 'font-size:24px',
      ].join(';');
      spinner.innerHTML = '<div style="animation:typing 0.8s ease-in-out infinite;">⏳</div>';
      if (contentEl) {
        contentEl.style.position = 'relative';
        contentEl.appendChild(spinner);
      }
      setTimeout(() => {
        spinner.remove();
        resolve();
      }, LOADING_MS);
    });
  }

  function buildMainUI() {
    overlayEl = document.createElement('div');
    overlayEl.id = 'flexera-overlay';
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:2100',
      'background:#fff', 'display:flex', 'flex-direction:column',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'color:#1a1a1a',
    ].join(';');

    overlayEl.innerHTML = `
      <div style="display:flex;height:100%;">
        <aside id="flexera-sidebar" style="
          width:240px;background:#1a1a1a;color:#e6edf3;
          padding:var(--space-md);overflow-y:auto;
          border-right:3px solid ${FLEXERA_ORANGE};
        ">
          <div style="font-size:14px;font-weight:bold;color:${FLEXERA_ORANGE};margin-bottom:var(--space-md);">🟠 Flexera One</div>
          <div id="flexera-nav-items"></div>
        </aside>
        <main style="flex:1;display:flex;flex-direction:column;overflow:hidden;">
          <header style="
            padding:var(--space-sm) var(--space-md);
            border-bottom:1px solid #eee;
            display:flex;justify-content:space-between;align-items:center;
          ">
            <div id="flexera-breadcrumb" style="font-size:12px;color:#666;"></div>
            <div id="flexera-timer" style="font-size:var(--font-size-lg);color:${FLEXERA_ORANGE};font-weight:bold;">${timeLeft}s</div>
          </header>
          <div id="flexera-content" style="flex:1;padding:var(--space-lg);overflow-y:auto;background:#fafafa;"></div>
          <footer style="padding:var(--space-xs) var(--space-md);font-size:11px;color:#999;">Sackgassen: <span id="flexera-deadends">0</span></footer>
        </main>
      </div>
    `;

    document.body.appendChild(overlayEl);
    sidebarEl = overlayEl.querySelector('#flexera-nav-items');
    contentEl = overlayEl.querySelector('#flexera-content');
    breadcrumbEl = overlayEl.querySelector('#flexera-breadcrumb');

    renderNav();
    renderContent('Klicken Sie links, um zu navigieren.');
  }

  function renderBreadcrumb() {
    if (!breadcrumbEl) return;
    breadcrumbEl.innerHTML = '';
    if (breadcrumb.length === 0) {
      breadcrumbEl.textContent = '—';
      return;
    }
    breadcrumb.forEach((label, i) => {
      const span = document.createElement('span');
      span.style.cssText = 'cursor:pointer;text-decoration:underline;margin-right:4px;';
      span.textContent = label;
      span.addEventListener('click', () => {
        breadcrumb = breadcrumb.slice(0, i + 1);
        renderBreadcrumb();
        renderNav();
        renderContent('Wählen Sie einen Eintrag aus der linken Navigation.');
      });
      breadcrumbEl.appendChild(span);
      if (i < breadcrumb.length - 1) {
        breadcrumbEl.appendChild(document.createTextNode(' > '));
      }
    });
  }

  function renderNav() {
    if (!sidebarEl) return;
    sidebarEl.innerHTML = '';

    const keys = breadcrumb.length
      ? getChildren(getNodeAtPath(breadcrumb))
      : Object.keys(NAV_TREE);

    if (!keys) return;

    keys.forEach((key) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = key;
      btn.style.cssText = [
        'display:block', 'width:100%', 'text-align:left',
        'padding:8px 12px', 'margin-bottom:4px',
        'background:transparent', 'border:none',
        'color:inherit', 'font-size:13px', 'cursor:pointer',
        'border-radius:3px',
      ].join(';');
      btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(232,98,42,0.2)'; });
      btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; });
      btn.addEventListener('click', () => handleNavClick(key));
      sidebarEl.appendChild(btn);
    });
  }

  function renderContent(text) {
    if (!contentEl) return;
    contentEl.innerHTML = `<div style="font-size:14px;line-height:1.6;color:#333;">${text}</div>`;
  }

  // ── Navigation logic ─────────────────────────────────────

  async function handleNavClick(key) {
    if (timeLeft <= 0) return;

    const path = [...breadcrumb, key];
    const value = getNodeAtPath(path);
    clicksToGoal += 1;

    if (Math.random() < LOADING_CHANCE) {
      await showLoadingSpinner();
    }

    if (isGoal(value)) {
      stopTimer();
      handleSuccess();
      return;
    }

    if (isDeadEnd(value)) {
      deadEndCount += 1;
      overlayEl?.querySelector('#flexera-deadends')?.replaceChildren(document.createTextNode(String(deadEndCount)));

      if (isEasterEggPath(value)) {
        communityForumClicked = true;
      }

      const msg = getDeadEndMessage(value);
      renderContent(msg);
      return;
    }

    if (typeof value === 'object' && value !== null) {
      breadcrumb = path;
      renderBreadcrumb();
      renderNav();
      renderContent('Wählen Sie einen Eintrag aus der linken Navigation.');
    }
  }

  function handleSuccess() {
    stopTimer();

    let result;
    const withCommunityEgg = communityForumClicked;
    const triggers = [];

    if (clicksToGoal <= 6) {
      result = {
        score: 100,
        effects: { kompetenz: 7 },
        xpBonus: 30,
        message: 'Flexera-Veteran. Sie wussten wo es ist.',
      };
      triggers.push('flexera_speedrun');
    } else if (clicksToGoal <= 12) {
      result = {
        score: 70,
        effects: { kompetenz: 4, burnout: 5 },
        xpBonus: 20,
        message: 'Gefunden. Mit Umwegen.',
      };
    } else if (clicksToGoal <= 20) {
      result = {
        score: 40,
        effects: { kompetenz: 2, burnout: 10 },
        xpBonus: 10,
        message: 'Gefunden. Knapp vor dem Timeout.',
      };
    } else {
      result = {
        score: 25,
        effects: { kompetenz: 1, burnout: 12 },
        xpBonus: 5,
        message: 'Gefunden. Nach vielen Sackgassen.',
      };
    }

    if (withCommunityEgg) triggers.push('flexera_community_held');
    if (triggers.length === 1) result.achievementTrigger = triggers[0];
    else if (triggers.length > 1) result.achievementTriggers = triggers;

    showResult(result);
  }

  function handleTimeout() {
    stopTimer();
    const result = {
      score: 0,
      effects: { burnout: 15, prestige: -3 },
      xpBonus: 0,
      message: 'Timeout. Müller-Brandt hat den Report selbst gesucht. Er hat ihn auch nicht gefunden.',
    };
    showResult(result);
  }

  function showResult(result) {
    overlayEl.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:var(--space-lg);padding:var(--space-xl);max-width:480px;margin:0 auto;';

    const emoji = result.score >= 70 ? '✅' : result.score > 0 ? '😅' : '😬';
    wrap.innerHTML = `
      <div style="font-size:48px;">${emoji}</div>
      <div style="font-size:var(--font-size-lg);color:${FLEXERA_ORANGE};">${result.score} Punkte</div>
      <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);text-align:center;line-height:1.7;">${result.message}</div>
      <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);">
        ${[
          result.effects?.prestige != null && `Prestige ${result.effects.prestige > 0 ? '+' : ''}${result.effects.prestige}`,
          result.effects?.kompetenz != null && `Kompetenz +${result.effects.kompetenz}`,
          result.effects?.burnout != null && `Burnout +${result.effects.burnout}`,
          result.xpBonus != null && `+${result.xpBonus} XP`,
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
    timeLeft = TIMER_SECONDS;
    breadcrumb = [];
    currentNode = NAV_TREE;
    clicksToGoal = 0;
    deadEndCount = 0;
    communityForumClicked = false;
    sessionWarningShown = false;

    showMissionBrief();
  }

  return { start };
})();
