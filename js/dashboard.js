/**
 * dashboard.js
 * Satirical Management Dashboard for "License To Bill".
 * Shows real GameState data as meaningless enterprise KPIs.
 * Tiles unlock with career level. Easter egg "Sinn dieser Arbeit" after 10s idle at Level 6.
 */

(function () {
  'use strict';

  const LEVEL_NAMES = [
    'Junior Consultant',
    'Consultant',
    'Senior Consultant',
    'Manager',
    'Principal',
    'Partner',
  ];

  const TILES = [
    // ━━━ LEVEL 1 — Junior Consultant ━━━
    {
      id: 'produktivitaet',
      title: 'Produktivitätsscore',
      type: 'number',
      unlockLevel: 1,
      getValue: (gs) => Math.min(99, Math.round(
        (gs.stats.kompetenz * 0.5) + (gs.stats.prestige * 0.3) +
        (Math.max(0, 100 - gs.stats.burnout) * 0.2)
      )),
      unit: '/ 100',
      subtext: 'Benchmark: 74. Knapp.',
      trend: 'dynamic',
      threshold: 74,
    },
    {
      id: 'meetings',
      title: 'Meetings diese Woche',
      type: 'number',
      unlockLevel: 1,
      getValue: (gs) => gs.meetingsAttended ?? 0,
      unit: '',
      subtext: 'Davon produktiv: 1. Möglicherweise.',
      trend: 'up',
    },
    {
      id: 'email_response',
      title: 'Ø E-Mail Response Time',
      type: 'number',
      unlockLevel: 1,
      getValue: (gs) => {
        const ignored = gs.counters?.emails_ignored ?? 0;
        return (2.0 + (ignored * 0.4)).toFixed(1);
      },
      unit: 'h',
      subtext: 'SLA: 2h. Kevin: 11h. Du bist besser als Kevin.',
      trend: 'dynamic',
      threshold: 2,
    },
    {
      id: 'billable_hours',
      title: 'Billable Hours',
      type: 'number',
      unlockLevel: 1,
      getValue: (gs) => {
        const base = 32;
        const bonus = Math.floor(gs.stats.kompetenz / 10);
        return base + bonus;
      },
      unit: 'h',
      subtext: 'Ziel: 40h. Differenz: in Sonstiges gebucht.',
      trend: 'dynamic',
      threshold: 40,
    },
    // ━━━ LEVEL 2 — Consultant ━━━
    {
      id: 'kundenzufriedenheit',
      title: 'Kundenzufriedenheit',
      type: 'number',
      unlockLevel: 2,
      getValue: (gs) => (gs.stats.kundenliebe / 10).toFixed(1),
      unit: '/ 10',
      subtext: 'Dieter: 6,1. Dieter zählt doppelt.',
      trend: 'dynamic',
      threshold: 6,
    },
    {
      id: 'buzzword_density',
      title: 'Buzzword Density',
      type: 'number',
      unlockLevel: 2,
      getValue: (gs) => (gs.stats.bullshit / 20).toFixed(1),
      unit: '/ Folie',
      subtext: 'Benchmark Industry: 3,2. Outperformt.',
      trend: 'up',
    },
    {
      id: 'slides_erstellt',
      title: 'PowerPoint Slides erstellt',
      type: 'number',
      unlockLevel: 2,
      getValue: (gs) => {
        const base = gs.projectsCompleted?.length ?? 0;
        return (base * 47) + (gs.stats.bullshit * 2);
      },
      unit: '',
      subtext: 'Davon vom Board gesehen: 3',
      trend: 'neutral',
    },
    {
      id: 'synergy_score',
      title: 'Synergy Score™',
      type: 'status',
      unlockLevel: 2,
      getValue: (gs) => {
        if (gs.stats.bullshit > 70) return 'OPTIMAL';
        if (gs.stats.bullshit > 40) return 'STABIL';
        return 'KRITISCH';
      },
      statusColors: { OPTIMAL: 'green', STABIL: 'amber', KRITISCH: 'red' },
      subtext: 'Müller-Brandt hat diesen KPI erfunden.',
      trend: 'neutral',
    },
    // ━━━ LEVEL 3 — Senior Consultant ━━━
    {
      id: 'kevin_fehlerquote',
      title: 'Kevin-Fehlerquote',
      type: 'number',
      unlockLevel: 3,
      getValue: (gs) => {
        const base = 31;
        const improvement = Math.floor(gs.stats.kompetenz / 5);
        return Math.max(8, base - improvement);
      },
      unit: '%',
      subtext: 'Verbessert. War 31%. Du hast geholfen.',
      trend: 'down',
    },
    {
      id: 'audit_survival',
      title: 'Audit Survival Rate',
      type: 'fraction',
      unlockLevel: 3,
      getValue: (gs) => {
        const completed = gs.projectsCompleted?.length ?? 0;
        const disasters = gs.disasterCount ?? 0;
        const survived = Math.max(0, completed - disasters);
        return completed > 0 ? `${survived} / ${completed}` : '0 / 0';
      },
      subtext: 'Projekt 1: knapp. Projekt 2: Zombie-Lizenzen.',
      trend: 'dynamic',
    },
    {
      id: 'excel_versionen',
      title: 'Excel-Versionen im Umlauf',
      type: 'number',
      unlockLevel: 3,
      getValue: (gs) => 4 + (gs.projectsCompleted?.length ?? 0),
      unit: '',
      subtext: 'Davon aktuell: 1. Vermutlich.',
      trend: 'up',
    },
    {
      id: 'strategic_alignment',
      title: 'Strategic Alignment Index',
      type: 'special',
      unlockLevel: 3,
      getValue: () => 'N/A',
      subtext: 'Niemand weiß was das bedeutet. Auch nicht Müller-Brandt.',
      trend: 'neutral',
    },
    // ━━━ LEVEL 4 — Manager ━━━
    {
      id: 'vendor_calls',
      title: 'Vendor Calls ignoriert',
      type: 'number',
      unlockLevel: 4,
      getValue: (gs) => gs.counters?.vendor_ads_skipped ?? 0,
      unit: '',
      subtext: 'Tyler hat 8x angerufen. Tapfer.',
      trend: 'neutral',
    },
    {
      id: 'lizenzluecke',
      title: 'Lizenzlücke gesamt',
      type: 'currency',
      unlockLevel: 4,
      getValue: (gs) => {
        const base = 47400;
        const projects = gs.projectsCompleted?.length ?? 0;
        return (base * Math.max(1, projects)).toLocaleString('de-DE');
      },
      unit: '€',
      subtext: 'Gefunden. Noch nicht vollständig kommuniziert.',
      trend: 'up',
    },
    {
      id: 'buchhaltung_2006',
      title: 'BUCHHALTUNG 2006 Status',
      type: 'status',
      unlockLevel: 4,
      getValue: (gs) => gs.flags?.buchhaltung_offline ? 'OFFLINE' : 'LÄUFT',
      statusColors: { LÄUFT: 'green', OFFLINE: 'red' },
      subtext: 'Bitte nicht anfassen.',
      trend: 'neutral',
    },
    {
      id: 'burnout_trajectory',
      title: 'Burnout-Trajectory',
      type: 'trend_only',
      unlockLevel: 4,
      getValue: (gs) => `+${Math.round(gs.stats.burnout / 8)}%/Woche`,
      subtext: 'HR wurde informiert. Sandra schickt Modul 9.',
      trend: 'up',
    },
    // ━━━ LEVEL 5 — Principal ━━━
    {
      id: 'roi',
      title: 'ROI dieser Präsentation',
      type: 'special',
      unlockLevel: 5,
      getValue: () => 'TBD',
      subtext: 'Board entscheidet in Q3. Oder Q4. Oder nie.',
      trend: 'neutral',
    },
    {
      id: 'meetings_als_mail',
      title: 'Meetings die auch Mails hätten sein können',
      type: 'number',
      unlockLevel: 5,
      getValue: (gs) => {
        const attended = gs.meetingsAttended ?? 0;
        return attended > 0 ? Math.round(attended * 0.89) : 89;
      },
      unit: '%',
      subtext: 'Industrie-Benchmark: 92%. Noch Luft nach oben.',
      trend: 'up',
    },
    {
      id: 'mueller_brandt_posts',
      title: 'Müller-Brandt Posts über deine Arbeit',
      type: 'number',
      unlockLevel: 5,
      getValue: (gs) => gs.projectsCompleted?.length ?? 0,
      unit: '',
      subtext: 'Dein Name: 0 Erwähnungen.',
      trend: 'up',
    },
    // ━━━ LEVEL 6 — Partner ━━━
    {
      id: 'golf_meetings',
      title: 'Golf-Meetings',
      type: 'number',
      unlockLevel: 6,
      getValue: () => 0,
      unit: '',
      subtext: 'Noch. Die Einladung kommt Freitag.',
      trend: 'neutral',
    },
    {
      id: 'legacy',
      title: 'Legacy dieser Arbeit',
      type: 'special',
      unlockLevel: 6,
      getValue: () => '∞',
      subtext: 'BUCHHALTUNG 2006 läuft noch. Du warst dabei.',
      trend: 'neutral',
    },
  ];

  const EASTER_EGG_TILE = {
    id: 'sinn',
    title: 'Sinn dieser Arbeit',
    type: 'loading',
    getValue: () => '💭 Lädt...',
    subtext: 'Bitte warten.',
  };

  const STORAGE_LAST_LEVEL = 'ltb_dashboard_last_level';
  const EASTER_EGG_DELAY_MS = 10000;

  let easterEggTimer = null;
  let easterEggShown = false;
  let escHandler = null;

  function getLevel() {
    const gs = window.Engine?.GameState;
    return gs?.career?.level ?? 1;
  }

  function getCareerTitle() {
    const level = getLevel();
    return window.Career?.getTitle?.(level) ?? LEVEL_NAMES[level - 1] ?? 'Junior Consultant';
  }

  /**
   * Returns tiles unlocked for current career level.
   * Level 1: 1-4, Level 2: 1-8, Level 3: 1-12, Level 4: 1-16, Level 5: 1-19, Level 6: 1-21
   */
  function getTiles() {
    const level = getLevel();
    const maxCount = level <= 1 ? 4 : level <= 2 ? 8 : level <= 3 ? 12 : level <= 4 ? 16 : level <= 5 ? 19 : 21;
    return TILES.filter((t) => t.unlockLevel <= level).slice(0, maxCount);
  }

  function getWeekNumber() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return Math.ceil((diff / oneWeek) + (start.getDay() / 7));
  }

  function formatTime() {
    const now = new Date();
    return now.toLocaleTimeString('de-DE', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function resolveTrend(tile, gs) {
    if (tile.trend === 'neutral' || tile.trend === 'up' || tile.trend === 'down') return tile.trend;
    if (tile.trend !== 'dynamic' || tile.threshold == null) return 'neutral';
    const val = tile.getValue(gs);
    const num = typeof val === 'string' ? parseFloat(val.replace(/[^\d.-]/g, '')) : Number(val);
    if (isNaN(num)) return 'neutral';
    if (tile.id === 'produktivitaet' || tile.id === 'kundenzufriedenheit' || tile.id === 'billable_hours') {
      return num >= tile.threshold ? 'down' : 'up'; // higher = good → green down
    }
    if (tile.id === 'email_response') return num <= tile.threshold ? 'down' : 'up'; // lower = good
    if (tile.id === 'audit_survival') {
      const [a, b] = String(val).split('/').map((s) => parseInt(s.trim(), 10));
      if (!b || b === 0) return 'neutral';
      return a / b >= 0.5 ? 'down' : 'up';
    }
    return 'neutral';
  }

  function renderTrendIcon(trend) {
    if (trend === 'up') return '<span class="dashboard-trend dashboard-trend--up">📈</span>';
    if (trend === 'down') return '<span class="dashboard-trend dashboard-trend--down">📉</span>';
    return '<span class="dashboard-trend dashboard-trend--neutral">—</span>';
  }

  function getChartPercent(tile, gs) {
    const raw = tile.getValue(gs);
    const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/[^\d.-]/g, ''));
    if (isNaN(num)) return null;
    if (tile.threshold != null) {
      if (tile.id === 'produktivitaet' || tile.id === 'kundenzufriedenheit' || tile.id === 'billable_hours') return Math.min(100, (num / (tile.threshold || 100)) * 100);
      if (tile.id === 'email_response') return Math.max(0, 100 - (num - 2) * 20);
    }
    if (tile.unit === '%') return Math.min(100, num);
    if (tile.unit === '/ 100') return Math.min(100, num);
    if (tile.unit === '/ 10') return Math.min(100, num * 10);
    return Math.min(100, (num / 100) * 100);
  }

  function renderMiniChart(percent, trend) {
    if (percent == null) return '';
    const pct = Math.max(0, Math.min(100, percent));
    const color = trend === 'down' ? 'var(--color-accent-green)' : trend === 'up' ? 'var(--color-accent-red)' : '#E8622A';
    return `<div class="dashboard-mini-chart"><div class="dashboard-mini-chart-fill" style="width:${pct}%;background:${color};"></div></div>`;
  }

  function renderTileValue(tile, gs) {
    const raw = tile.getValue(gs);
    const val = typeof raw === 'number' ? String(raw) : String(raw ?? '');

    if (tile.type === 'number') {
      const chartPct = getChartPercent(tile, gs);
      const chart = chartPct != null ? renderMiniChart(chartPct, resolveTrend(tile, gs)) : '';
      return { html: `<span class="dashboard-value">${val}</span><span class="dashboard-unit">${tile.unit || ''}</span>${chart}`, value: val };
    }
    if (tile.type === 'status') {
      const color = tile.statusColors?.[val] ?? 'gray';
      return { html: `<span class="dashboard-status dashboard-status--${color}">${val}</span>`, value: val };
    }
    if (tile.type === 'fraction') {
      const [a, b] = val.split('/').map((s) => parseInt(s.trim(), 10));
      const ratio = b && b > 0 ? a / b : 0;
      const cls = ratio >= 0.5 ? 'dashboard-fraction--ok' : 'dashboard-fraction--low';
      const pct = b && b > 0 ? Math.round((a / b) * 100) : 0;
      const chart = renderMiniChart(pct, ratio >= 0.5 ? 'down' : 'up');
      return { html: `<span class="dashboard-fraction ${cls}">${val}</span>${chart}`, value: val };
    }
    if (tile.type === 'currency') {
      const num = parseFloat(val.replace(/\D/g, '')) || 0;
      const chartPct = Math.min(100, (num / 100000) * 100);
      const chart = renderMiniChart(chartPct, 'up');
      return { html: `<span class="dashboard-currency">${val} ${tile.unit || '€'}</span>${chart}`, value: val };
    }
    if (tile.type === 'trend_only') {
      const num = parseFloat(val.replace(/[^\d.-]/g, '')) || 0;
      const chartPct = Math.min(100, Math.max(0, num * 3));
      const chart = renderMiniChart(chartPct, 'up');
      return { html: `<span class="dashboard-trend-value">${val}</span>${chart}`, value: val };
    }
    if (tile.type === 'special') {
      return { html: `<span class="dashboard-special">${val}</span>`, value: val };
    }
    if (tile.type === 'loading') {
      return { html: `<span class="dashboard-loading-text">${val}</span><div class="dashboard-loadbar"><div class="dashboard-loadbar-fill"></div></div>`, value: val };
    }
    return { html: val, value: val };
  }

  function buildTileCard(tile, gs, isNew) {
    const card = document.createElement('div');
    card.className = 'dashboard-tile' + (isNew ? ' dashboard-tile--new' : '');
    card.dataset.tileId = tile.id;

    const trend = resolveTrend(tile, gs);
    const { html } = renderTileValue(tile, gs);

    card.innerHTML = `
      <div class="dashboard-tile-header">
        <span class="dashboard-tile-title">${tile.title}</span>
        ${renderTrendIcon(trend)}
      </div>
      <div class="dashboard-tile-body">
        ${html}
      </div>
      <div class="dashboard-tile-subtext">${tile.subtext || ''}</div>
    `;

    if (tile.type === 'loading') {
      const fill = card.querySelector('.dashboard-loadbar-fill');
      if (fill) {
        requestAnimationFrame(() => {
          fill.style.width = '94%';
          fill.style.transition = 'width 2s ease';
        });
      }
      card.addEventListener('click', () => {
        window.KeyboardController?.showToast?.('Dieser KPI ist in der Premium-Version verfügbar.', 'var(--color-accent-amber)');
      });
    }

    return card;
  }

  function buildLockedTile(unlockLevel) {
    const name = LEVEL_NAMES[unlockLevel - 1] ?? `Level ${unlockLevel}`;
    const card = document.createElement('div');
    card.className = 'dashboard-tile dashboard-tile--locked';
    card.innerHTML = `
      <div class="dashboard-tile-locked">🔒</div>
      <div class="dashboard-tile-locked-text">Verfügbar ab: ${name}</div>
    `;
    return card;
  }

  function countNewTiles() {
    const level = getLevel();
    const last = parseInt(sessionStorage.getItem(STORAGE_LAST_LEVEL) ?? '0', 10);
    if (level <= last || last === 0) return 0; // Only show when leveled up (not on first open)
    const prevCount = last <= 1 ? 4 : last <= 2 ? 8 : last <= 3 ? 12 : last <= 4 ? 16 : last <= 5 ? 19 : 21;
    const currCount = level <= 1 ? 4 : level <= 2 ? 8 : level <= 3 ? 12 : level <= 4 ? 16 : level <= 5 ? 19 : 21;
    return Math.max(0, currCount - prevCount);
  }

  function persistDashboardLevel() {
    sessionStorage.setItem(STORAGE_LAST_LEVEL, String(getLevel()));
  }

  function open() {
    document.getElementById('dashboard-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'dashboard-overlay';
    overlay.className = 'dashboard-overlay';
    document.body.appendChild(overlay);

    const gs = window.Engine?.GameState ?? {};
    const level = getLevel();
    const tiles = getTiles();
    const newCount = countNewTiles();

    const maxTiles = level <= 1 ? 4 : level <= 2 ? 8 : level <= 3 ? 12 : level <= 4 ? 16 : level <= 5 ? 19 : 21;
    const lockedCount = Math.max(0, 6 - level);

    overlay.innerHTML = `
      <div class="dashboard-header">
        <button class="dashboard-close" id="dashboard-close" aria-label="Schließen">✕ Schließen</button>
        <div class="dashboard-header-center">
          <h1 class="dashboard-title">📊 Performance Dashboard</h1>
          <div class="dashboard-subtitle">Greysuit & Partner Consulting — ${getCareerTitle()}</div>
        </div>
        <div class="dashboard-header-right">
          <div class="dashboard-clock" id="dashboard-clock">${formatTime()}</div>
          <div class="dashboard-refresh">Last Refresh: just now</div>
        </div>
      </div>
      <div class="dashboard-subtitle-bar">
        KW ${getWeekNumber()} | Daten: Live | Genauigkeit: ±∞ | Nächstes Review: Freitag 17:30
      </div>
      <div class="dashboard-grid" id="dashboard-grid"></div>
    `;

    const grid = document.getElementById('dashboard-grid');
    const lastSeenLevel = parseInt(sessionStorage.getItem(STORAGE_LAST_LEVEL) ?? '0', 10);

    tiles.forEach((tile) => {
      const isNew = tile.unlockLevel > lastSeenLevel;
      const card = buildTileCard(tile, gs, isNew);
      grid.appendChild(card);
    });

    for (let i = 0; i < lockedCount; i++) {
      grid.appendChild(buildLockedTile(level + 1 + i));
    }

    if (newCount > 0) {
      window.KeyboardController?.showToast?.(`🔓 ${newCount} neue KPIs freigeschaltet`, 'var(--color-accent-amber)');
    }
    persistDashboardLevel();

    // Live clock
    const clockEl = document.getElementById('dashboard-clock');
    const clockIv = setInterval(() => {
      if (!document.getElementById('dashboard-overlay')) {
        clearInterval(clockIv);
        return;
      }
      if (clockEl) clockEl.textContent = formatTime();
    }, 1000);

    // Easter egg: Level 6, 10s idle, show Sinn tile
    easterEggShown = false;
    if (easterEggTimer) clearTimeout(easterEggTimer);
    if (level >= 6 && lockedCount === 0) {
      easterEggTimer = setTimeout(() => {
        if (!document.getElementById('dashboard-overlay') || easterEggShown) return;
        easterEggShown = true;
        const egg = buildTileCard(EASTER_EGG_TILE, gs, false);
        egg.classList.add('dashboard-tile--easter');
        grid.appendChild(egg);
      }, EASTER_EGG_DELAY_MS);
    }

    escHandler = (e) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', escHandler);
        escHandler = null;
        close();
      }
    };
    document.addEventListener('keydown', escHandler);

    document.getElementById('dashboard-close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  }

  function close() {
    if (easterEggTimer) {
      clearTimeout(easterEggTimer);
      easterEggTimer = null;
    }
    if (escHandler) {
      document.removeEventListener('keydown', escHandler);
      escHandler = null;
    }
    document.getElementById('dashboard-overlay')?.remove();
  }

  window.Dashboard = {
    open,
    close,
    getTiles,
  };
})();
