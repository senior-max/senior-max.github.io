/**
 * flexera.js
 * Flexera One navigation parody minigame for "License To Bill".
 * Player must find the Software Compliance Summary Report in a satirical enterprise UX.
 * 75 second timer. Burnout scales with time and wrong paths.
 */

const FLEXERA_DEBUG = false; // set true to enable debug logging

function debugLog(msg, data) {
  if (!FLEXERA_DEBUG) return;
  console.log(`[Flexera] ${msg}`, data ?? '');
}

const FLEXERA_ORANGE = '#E8622A';
const FLEXERA_FLEXERA_TIMER_SECONDS = 75;
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
          'Software Compliance Summary': '✅ ZIEL ERREICHT',
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

  const state = {
    currentNode: NAV_TREE,
    breadcrumb: [],
    clickCount: 0,
    deadEndCount: 0,
    communityForumClicked: false,
    isLoading: false,
    timerInterval: null,
    sessionWarningTimeout: null,
    loadingTimeout: null,
    onComplete: null,
    timeLeft: FLEXERA_TIMER_SECONDS,
    overlayEl: null,
    contentEl: null,
    sidebarEl: null,
    breadcrumbEl: null,
    escHandler: null,
  };

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

  // ── Cleanup ─────────────────────────────────────────────

  function cleanup() {
    debugLog('Cleanup called');
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
    if (state.sessionWarningTimeout) {
      clearTimeout(state.sessionWarningTimeout);
      state.sessionWarningTimeout = null;
    }
    if (state.loadingTimeout) {
      clearTimeout(state.loadingTimeout);
      state.loadingTimeout = null;
    }
    if (state.escHandler) {
      document.removeEventListener('keydown', state.escHandler);
      state.escHandler = null;
    }
    const overlay = document.getElementById('flexera-overlay');
    const brief = document.getElementById('flexera-brief');
    const sessionWarn = document.getElementById('flexera-session-warn');
    if (overlay) overlay.remove();
    if (brief) brief.remove();
    if (sessionWarn) sessionWarn.remove();
    state.overlayEl = null;
    state.contentEl = null;
    state.sidebarEl = null;
    state.breadcrumbEl = null;
  }

  // ── Timer ───────────────────────────────────────────────

  function startTimer() {
    const timerEl = state.overlayEl?.querySelector('#flexera-timer');
    if (!timerEl) return;

    state.timerInterval = setInterval(() => {
      state.timeLeft -= 1;
      timerEl.textContent = `${state.timeLeft}s`;
      if (state.timeLeft <= 0) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
        triggerTimeout();
      }
    }, 1000);

    state.sessionWarningTimeout = setTimeout(() => {
      state.sessionWarningTimeout = null;
      showSessionWarning();
    }, SESSION_WARNING_AT * 1000);
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
      if (state.contentEl) {
        state.contentEl.style.position = 'relative';
        state.contentEl.appendChild(spinner);
      }
      setTimeout(() => {
        spinner.remove();
        resolve();
      }, LOADING_MS);
    });
  }

  function disableAllMenuButtons() {
    if (!state.sidebarEl) return;
    state.sidebarEl.querySelectorAll('button').forEach((btn) => {
      btn.disabled = true;
      btn.style.pointerEvents = 'none';
      btn.style.opacity = '0.5';
    });
  }

  function enableAllMenuButtons() {
    if (!state.sidebarEl) return;
    state.sidebarEl.querySelectorAll('button').forEach((btn) => {
      btn.disabled = false;
      btn.style.pointerEvents = '';
      btn.style.opacity = '';
    });
  }

  function buildMainUI() {
    state.overlayEl = document.createElement('div');
    state.overlayEl.id = 'flexera-overlay';
    state.overlayEl.setAttribute('role', 'dialog');
    state.overlayEl.setAttribute('aria-modal', 'true');
    state.overlayEl.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:2100',
      'background:#fff', 'display:flex', 'flex-direction:column',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'color:#1a1a1a',
    ].join(';');

    state.overlayEl.innerHTML = `
      <div style="display:flex;height:100%;">
        <aside id="flexera-sidebar" style="
          width:240px;background:#1a1a1a;color:#e6edf3;
          padding:var(--space-md);overflow-y:auto;
          border-right:3px solid ${FLEXERA_ORANGE};
        ">
          <div style="font-size:14px;font-weight:bold;color:${FLEXERA_ORANGE};margin-bottom:var(--space-md);">🟠 Flexera One</div>
          <div id="flexera-nav-items"></div>
          <button type="button" id="flexera-skip-btn" style="
            margin-top:var(--space-md);width:100%;padding:8px 12px;
            background:transparent;border:1px solid #555;color:#888;
            font-size:12px;cursor:pointer;border-radius:3px;
          ">Überspringen</button>
        </aside>
        <main style="flex:1;display:flex;flex-direction:column;overflow:hidden;">
          <header style="
            padding:var(--space-sm) var(--space-md);
            border-bottom:1px solid #eee;
            display:flex;justify-content:space-between;align-items:center;
          ">
            <div id="flexera-breadcrumb" style="font-size:12px;color:#666;"></div>
            <div id="flexera-timer" style="font-size:var(--font-size-lg);color:${FLEXERA_ORANGE};font-weight:bold;">${state.timeLeft}s</div>
          </header>
          <div id="flexera-content" style="flex:1;padding:var(--space-lg);overflow-y:auto;background:#fafafa;"></div>
          <footer style="padding:var(--space-xs) var(--space-md);font-size:11px;color:#999;">Sackgassen: <span id="flexera-deadends">0</span></footer>
        </main>
      </div>
    `;

    document.body.appendChild(state.overlayEl);
    state.sidebarEl = state.overlayEl.querySelector('#flexera-nav-items');
    state.contentEl = state.overlayEl.querySelector('#flexera-content');
    state.breadcrumbEl = state.overlayEl.querySelector('#flexera-breadcrumb');

    state.overlayEl.querySelector('#flexera-skip-btn').addEventListener('click', () => {
      debugLog('Skip clicked');
      cleanup();
      const result = {
        score: 0,
        effects: { burnout: 5 },
        xpBonus: 0,
        message: 'Übersprungen. Müller-Brandt hat den Report selbst gesucht.',
      };
      if (typeof state.onComplete === 'function') {
        state.onComplete(result);
        state.onComplete = null;
      }
    });

    state.escHandler = (e) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', state.escHandler);
        state.escHandler = null;
        cleanup();
        const result = {
          score: 0,
          effects: { burnout: 5 },
          xpBonus: 0,
          message: 'Abgebrochen.',
        };
        if (typeof state.onComplete === 'function') {
          state.onComplete(result);
          state.onComplete = null;
        }
      }
    };
    document.addEventListener('keydown', state.escHandler);

    renderNav();
    renderContent('Klicken Sie links, um zu navigieren.');
  }

  function renderBreadcrumb() {
    if (!state.breadcrumbEl) return;
    state.breadcrumbEl.innerHTML = '';
    if (state.breadcrumb.length === 0) {
      state.breadcrumbEl.textContent = '—';
      return;
    }
    state.breadcrumb.forEach((label, i) => {
      const span = document.createElement('span');
      span.style.cssText = 'cursor:pointer;text-decoration:underline;margin-right:4px;';
      span.textContent = label;
      span.addEventListener('click', () => {
        state.breadcrumb = state.breadcrumb.slice(0, i + 1);
        state.currentNode = getNodeAtPath(state.breadcrumb);
        renderBreadcrumb();
        renderNav();
        renderContent('Wählen Sie einen Eintrag aus der linken Navigation.');
      });
      state.breadcrumbEl.appendChild(span);
      if (i < state.breadcrumb.length - 1) {
        state.breadcrumbEl.appendChild(document.createTextNode(' > '));
      }
    });
  }

  function renderNav() {
    if (!state.sidebarEl) return;
    state.sidebarEl.innerHTML = '';

    const keys = state.breadcrumb.length
      ? getChildren(getNodeAtPath(state.breadcrumb))
      : Object.keys(NAV_TREE);

    if (!keys) return;

    keys.forEach((menuKey) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = menuKey;
      btn.dataset.menuKey = encodeURIComponent(menuKey);
      btn.style.cssText = [
        'display:block', 'width:100%', 'text-align:left',
        'padding:8px 12px', 'margin-bottom:4px',
        'background:transparent', 'border:none',
        'color:inherit', 'font-size:13px', 'cursor:pointer',
        'border-radius:3px',
      ].join(';');
      btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(232,98,42,0.2)'; });
      btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; });
      btn.addEventListener('click', (e) => {
        const key = decodeURIComponent(e.currentTarget.dataset.menuKey || '');
        handleMenuClick(key);
      });
      state.sidebarEl.appendChild(btn);
    });
  }

  function renderContent(text) {
    if (!state.contentEl) return;
    state.contentEl.innerHTML = `<div style="font-size:14px;line-height:1.6;color:#333;">${text}</div>`;
  }

  // ── Navigation logic ─────────────────────────────────────

  function processClick(menuKey) {
    if (state.timeLeft <= 0) return;

    const path = [...state.breadcrumb, menuKey];
    const value = getNodeAtPath(path);
    state.clickCount += 1;

    debugLog('Click:', menuKey, '→ type:', typeof value);

    // CHECK 2: Success FIRST — before typeof branch
    if (typeof value === 'string' && value.startsWith('✅')) {
      triggerSuccess();
      return;
    }

    // CHECK 1: Dead end — show message
    if (typeof value === 'string') {
      state.deadEndCount += 1;
      state.overlayEl?.querySelector('#flexera-deadends')?.replaceChildren(document.createTextNode(String(state.deadEndCount)));

      if (isEasterEggPath(value)) {
        state.communityForumClicked = true;
      }

      const msg = getDeadEndMessage(value);
      renderContent(msg);
      return;
    }

    // CHECK 1: Submenu — render children
    if (typeof value === 'object' && value !== null) {
      state.breadcrumb.push(menuKey);
      state.currentNode = value;
      renderBreadcrumb();
      renderNav();
      renderContent('Wählen Sie einen Eintrag aus der linken Navigation.');
    }
  }

  function handleMenuClick(menuKey) {
    if (state.isLoading) return;
    if (state.timeLeft <= 0) return;

    const path = [...state.breadcrumb, menuKey];
    const value = getNodeAtPath(path);

    // CHECK 5: Fake loading — disable buttons, guard against double-click
    if (Math.random() < LOADING_CHANCE) {
      state.isLoading = true;
      showLoadingSpinner();
      disableAllMenuButtons();

      state.loadingTimeout = setTimeout(() => {
        state.loadingTimeout = null;
        state.isLoading = false;
        enableAllMenuButtons();
        processClick(menuKey);
      }, LOADING_MS);
    } else {
      processClick(menuKey);
    }
  }

  function triggerSuccess() {
    debugLog('SUCCESS — clicks:', state.clickCount);

    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
    if (state.sessionWarningTimeout) {
      clearTimeout(state.sessionWarningTimeout);
      state.sessionWarningTimeout = null;
    }
    if (state.loadingTimeout) {
      clearTimeout(state.loadingTimeout);
      state.loadingTimeout = null;
    }

    let result;
    const withCommunityEgg = state.communityForumClicked;
    const triggers = [];

    if (state.clickCount <= 6) {
      result = {
        score: 100,
        effects: { kompetenz: 7 },
        xpBonus: 30,
        message: 'Flexera-Veteran. Sie wussten wo es ist.',
      };
      triggers.push('flexera_speedrun');
    } else if (state.clickCount <= 12) {
      result = {
        score: 70,
        effects: { kompetenz: 4, burnout: 5 },
        xpBonus: 20,
        message: 'Gefunden. Mit Umwegen.',
      };
    } else if (state.clickCount <= 20) {
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

  function triggerTimeout() {
    debugLog('TIMEOUT — clicks:', state.clickCount);

    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
    if (state.sessionWarningTimeout) {
      clearTimeout(state.sessionWarningTimeout);
      state.sessionWarningTimeout = null;
    }
    if (state.loadingTimeout) {
      clearTimeout(state.loadingTimeout);
      state.loadingTimeout = null;
    }

    const result = {
      score: 0,
      effects: { burnout: 15, prestige: -3 },
      xpBonus: 0,
      message: 'Timeout. Müller-Brandt hat den Report selbst gesucht. Er hat ihn auch nicht gefunden.',
    };

    showResult(result);
  }

  function showResult(result) {
    if (!state.overlayEl) return;
    state.overlayEl.innerHTML = '';

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
      cleanup(); // always first
      if (typeof state.onComplete === 'function') {
        debugLog('onComplete fired with result:', result);
        state.onComplete(result);
        state.onComplete = null;
      }
    });
    wrap.appendChild(btn);
    state.overlayEl.appendChild(wrap);
  }

  // ── Public API ───────────────────────────────────────────

  function start(onComplete) {
    debugLog('Minigame started');

    state.onComplete = onComplete;
    state.timeLeft = FLEXERA_TIMER_SECONDS;
    state.breadcrumb = [];
    state.currentNode = NAV_TREE;
    state.clickCount = 0;
    state.deadEndCount = 0;
    state.communityForumClicked = false;
    state.isLoading = false;
    state.timerInterval = null;
    state.sessionWarningTimeout = null;
    state.loadingTimeout = null;
    state.overlayEl = null;
    state.contentEl = null;
    state.sidebarEl = null;
    state.breadcrumbEl = null;

    showMissionBrief();
  }

  return { start };
})();
