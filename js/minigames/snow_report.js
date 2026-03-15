/**
 * snow_report.js
 * Snow compliance report investigation minigame for "License To Bill".
 * Player must identify the correct number from 3 contradictory values by
 * cross-referencing source documents. Satirizes SAM tool output trust.
 * 60 second timer.
 */

const SNOW_BLUE = '#00B4D8';
const SNOW_REPORT_SNOW_REPORT_TIMER_SECONDS = 60;
const CORRECT_ANSWER = -89;

window.SnowReportMinigame = (function () {
  'use strict';

  let overlayEl = null;
  let onCompleteCallback = null;
  let timerHandle = null;
  let timeLeft = SNOW_REPORT_TIMER_SECONDS;
  let tabsRead = { tab1: false, tab2: false, tab3: false };
  let answered = false;

  // ── Timer ──────────────────────────────────────────────

  function startTimer() {
    const timerEl = overlayEl?.querySelector('#snow-report-timer');
    if (!timerEl) return;
    timerHandle = setInterval(() => {
      timeLeft -= 1;
      timerEl.textContent = `${timeLeft}s`;
      if (timeLeft <= 0) {
        clearInterval(timerHandle);
        handleTimeout();
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerHandle) {
      clearInterval(timerHandle);
      timerHandle = null;
    }
  }

  // ── Mission Brief ──────────────────────────────────────

  function showMissionBrief() {
    const brief = document.createElement('div');
    brief.id = 'snow-report-brief';
    brief.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:2100',
      'background:var(--color-bg)', 'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center', 'padding:var(--space-xl)',
      'font-family:var(--font-mono)', 'text-align:center',
    ].join(';');

    brief.innerHTML = `
      <div style="font-size:var(--font-size-xl);color:${SNOW_BLUE};margin-bottom:var(--space-lg);">❄️ Snow License Manager</div>
      <div style="font-size:var(--font-size-base);color:var(--color-text-primary);max-width:480px;line-height:1.8;margin-bottom:var(--space-xl);">
        Snow hat einen Compliance-Report generiert.<br>
        Er enthält drei verschiedene Zahlen für die Microsoft Office Lizenzlücke.<br>
        <strong>Finden Sie die richtige.</strong> Müller-Brandt präsentiert das in 10 Minuten.
      </div>
      <button type="button" class="choice-btn" id="snow-report-start-btn" style="width:200px;">Report prüfen</button>
    `;

    document.body.appendChild(brief);
    brief.querySelector('#snow-report-start-btn').addEventListener('click', () => {
      window.Sound?.play?.('click');
      brief.remove();
      buildMainUI();
      startTimer();
    });
  }

  // ── Main UI ─────────────────────────────────────────────

  function buildMainUI() {
    overlayEl = document.createElement('div');
    overlayEl.id = 'snow-report-overlay';
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:2100',
      'background:#f0f0f0', 'display:flex', 'flex-direction:column',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'overflow:hidden',
    ].join(';');

    overlayEl.innerHTML = `
      <header style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-sm) var(--space-md);background:#fff;border-bottom:1px solid #ddd;">
        <span style="font-size:var(--font-size-sm);color:#666;">Snow Compliance Report — Microsoft Office 365 E3</span>
        <span id="snow-report-timer" style="font-size:var(--font-size-lg);font-weight:bold;color:${SNOW_BLUE};">${timeLeft}s</span>
      </header>

      <div style="flex:1;display:flex;overflow:hidden;">
        <!-- LEFT: Snow Report -->
        <div style="flex:1;overflow-y:auto;padding:var(--space-lg);background:#fff;border-right:1px solid #ddd;">
          <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-md);">
            <span style="font-size:24px;">❄️</span>
            <span style="font-weight:600;font-size:var(--font-size-lg);">Snow Compliance Report</span>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <thead>
              <tr style="background:#f5f5f5;">
                <th style="text-align:left;padding:10px 12px;border:1px solid #ddd;">Metric</th>
                <th style="text-align:right;padding:10px 12px;border:1px solid #ddd;">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style="padding:10px 12px;border:1px solid #ddd;">Installed Instances</td><td style="text-align:right;padding:10px 12px;border:1px solid #ddd;">1.247</td></tr>
              <tr><td style="padding:10px 12px;border:1px solid #ddd;">Licensed Quantity</td><td style="text-align:right;padding:10px 12px;border:1px solid #ddd;">1.100</td></tr>
              <tr><td style="padding:10px 12px;border:1px solid #ddd;">Compliance Position</td><td style="text-align:right;padding:10px 12px;border:1px solid #ddd;">-147 ⚠️</td></tr>
              <tr><td style="padding:10px 12px;border:1px solid #ddd;">Effective License Position</td><td style="text-align:right;padding:10px 12px;border:1px solid #ddd;">-89</td></tr>
              <tr><td style="padding:10px 12px;border:1px solid #ddd;">Net License Position</td><td style="text-align:right;padding:10px 12px;border:1px solid #ddd;">-203 🔴</td></tr>
              <tr><td style="padding:10px 12px;border:1px solid #ddd;">Last Discovery Run</td><td style="text-align:right;padding:10px 12px;border:1px solid #ddd;">3 days ago</td></tr>
              <tr><td style="padding:10px 12px;border:1px solid #ddd;">Data Completeness</td><td style="text-align:right;padding:10px 12px;border:1px solid #ddd;">94%</td></tr>
            </tbody>
          </table>
          <p style="font-size:11px;color:#999;margin-top:var(--space-md);line-height:1.5;">
            * Compliance Position, Effective License Position and Net License Position use different calculation methodologies. See documentation for details.<br>
            Documentation link: <a href="#" style="color:#999;">[404 - Page not found]</a>
          </p>
          <p style="font-weight:600;margin-top:var(--space-lg);font-size:15px;">Welche Zahl melden Sie an Dr. Müller-Brandt?</p>
          <div id="snow-report-buttons" style="display:flex;gap:var(--space-sm);flex-wrap:wrap;margin-top:var(--space-md);">
            <button type="button" class="choice-btn snow-answer-btn" data-value="-147" data-label="Compliance Position" style="min-width:180px;">📊 -147 (Compliance Position)</button>
            <button type="button" class="choice-btn snow-answer-btn" data-value="-89" data-label="Effective License Position" style="min-width:180px;">📊 -89 (Effective License Position)</button>
            <button type="button" class="choice-btn snow-answer-btn" data-value="-203" data-label="Net License Position" style="min-width:180px;">📊 -203 (Net License Position)</button>
          </div>
        </div>

        <!-- RIGHT: Source Documents -->
        <div style="width:320px;display:flex;flex-direction:column;background:#fafafa;border-left:1px solid #ddd;">
          <div style="display:flex;border-bottom:1px solid #ddd;">
            <button type="button" class="snow-tab-btn active" data-tab="tab1" style="flex:1;padding:10px;border:none;background:#e8e8e8;cursor:pointer;font-size:12px;">Discovery Data</button>
            <button type="button" class="snow-tab-btn" data-tab="tab2" style="flex:1;padding:10px;border:none;background:#f0f0f0;cursor:pointer;font-size:12px;">Purchase Records</button>
            <button type="button" class="snow-tab-btn" data-tab="tab3" style="flex:1;padding:10px;border:none;background:#f0f0f0;cursor:pointer;font-size:12px;">Methodology</button>
          </div>
          <div id="snow-tab-content" style="flex:1;overflow-y:auto;padding:var(--space-md);font-size:13px;line-height:1.6;"></div>
        </div>
      </div>
    `;

    document.body.appendChild(overlayEl);

    const tabContents = {
      tab1: `
        <h4 style="margin:0 0 var(--space-sm);">Discovery Data (CSV Export)</h4>
        <table style="width:100%;font-size:12px;border-collapse:collapse;">
          <tr><td style="padding:6px 0;">Total discovered installations:</td><td style="text-align:right;">1.247</td></tr>
          <tr><td style="padding:6px 0;">Active users (last 90 days):</td><td style="text-align:right;">1.158</td></tr>
          <tr><td style="padding:6px 0;">Shared devices (counted double):</td><td style="text-align:right;">47</td></tr>
          <tr><td style="padding:6px 0;">Remote workers (VPN only):</td><td style="text-align:right;">42</td></tr>
        </table>
        <p style="font-size:11px;color:#666;margin-top:var(--space-md);">VPN-only users may be counted twice in discovery scan.</p>
      `,
      tab2: `
        <h4 style="margin:0 0 var(--space-sm);">License Purchase Records</h4>
        <table style="width:100%;font-size:12px;border-collapse:collapse;">
          <tr><td style="padding:6px 0;">EA Contract 2022:</td><td style="text-align:right;">900 licenses</td></tr>
          <tr><td style="padding:6px 0;">Additional purchase Q1 2023:</td><td style="text-align:right;">150 licenses</td></tr>
          <tr><td style="padding:6px 0;">Additional purchase Q3 2023:</td><td style="text-align:right;">50 licenses</td></tr>
          <tr><td style="padding:6px 0;border-top:1px solid #ddd;"><strong>Total:</strong></td><td style="text-align:right;border-top:1px solid #ddd;"><strong>1.100 licenses</strong></td></tr>
        </table>
        <p style="font-size:11px;color:#666;margin-top:var(--space-md);">Q3 2023 purchase: delivery confirmed, not yet in Snow database.</p>
      `,
      tab3: `
        <h4 style="margin:0 0 var(--space-sm);">Snow Methodology Notes</h4>
        <p style="margin:0 0 var(--space-sm);"><strong>Compliance Position:</strong> Raw installed vs. licensed. No adjustments.</p>
        <p style="margin:0 0 var(--space-sm);"><strong>Effective License Position:</strong> Adjusts for shared devices and double-counting.</p>
        <p style="margin:0 0 var(--space-sm);"><strong>Net License Position:</strong> Includes pending purchases not yet in system.</p>
        <p style="margin:var(--space-md) 0 0;padding:var(--space-sm);background:#e8f4e8;border-radius:4px;">Recommendation: Use Net License Position for board reporting.</p>
        <p style="font-size:11px;color:#666;margin-top:var(--space-sm);">Note: Net License Position data may take 24-48h to update after purchase entry.</p>
      `,
    };

    const contentEl = overlayEl.querySelector('#snow-tab-content');
    contentEl.innerHTML = tabContents.tab1;

    overlayEl.querySelectorAll('.snow-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        tabsRead[tab] = true;
        overlayEl.querySelectorAll('.snow-tab-btn').forEach((b) => {
          b.style.background = b.dataset.tab === tab ? '#fff' : '#f0f0f0';
          b.classList.toggle('active', b.dataset.tab === tab);
        });
        contentEl.innerHTML = tabContents[tab];
      });
    });

    overlayEl.querySelectorAll('.snow-answer-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        stopTimer();
        const value = parseInt(btn.dataset.value, 10);
        const label = btn.dataset.label;
        handleAnswer(value, label);
      });
    });
  }

  // ── Answer handling ─────────────────────────────────────

  function handleAnswer(value, label) {
    const allTabsRead = tabsRead.tab1 && tabsRead.tab2 && tabsRead.tab3;
    let result;

    if (value === CORRECT_ANSWER) {
      const prefix = allTabsRead ? 'Sie haben alle Quellen gelesen. Das ist selten. Das ist gut. ' : '';
      result = {
        score: 100,
        effects: { kompetenz: 8, prestige: 5 },
        xpBonus: 30,
        achievementTrigger: allTabsRead ? 'rtfm' : 'snow_detective',
        message: prefix + 'Richtig. -89 ist die korrekteste Zahl. • -147 ignoriert doppelt gezählte Geräte (47 shared + einige VPN) • -203 zieht einen Kauf ab der noch nicht im System ist • -89 berücksichtigt beides korrekt',
      };
    } else {
      const wrongMsg = value === -147
        ? 'Knapp. Diese Zahl ignoriert Doppelzählungen aus shared devices. Richtig wäre -89 (Effective License Position).'
        : 'Diese Zahl zieht Lizenzen ab die noch nicht im System sind. Richtig wäre -89 (Effective License Position).';
      result = {
        score: 30,
        effects: { kompetenz: 2, burnout: 5 },
        xpBonus: 10,
        achievementTrigger: allTabsRead ? 'rtfm' : undefined,
        message: wrongMsg,
      };
    }

    showResult(result);
  }

  function handleTimeout() {
    answered = true;
    stopTimer();
    const result = {
      score: 0,
      effects: { burnout: 10, prestige: -5 },
      xpBonus: 0,
      message: 'Müller-Brandt hat -147 präsentiert. Das Board fragt jetzt nach dem Methodology-Dokument.',
    };
    showResult(result);
  }

  function showResult(result) {
    overlayEl.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:var(--space-lg);padding:var(--space-xl);max-width:520px;margin:0 auto;';

    const emoji = result.score >= 100 ? '✅' : result.score > 0 ? '😅' : '😬';
    wrap.innerHTML = `
      <div style="font-size:48px;">${emoji}</div>
      <div style="font-size:var(--font-size-lg);color:${SNOW_BLUE};">${result.score} Punkte</div>
      <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);text-align:center;line-height:1.7;">${result.message}</div>
      <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);">
        ${[
          result.effects?.prestige != null && `Prestige ${result.effects.prestige > 0 ? '+' : ''}${result.effects.prestige}`,
          result.effects?.kompetenz != null && `Kompetenz ${result.effects.kompetenz > 0 ? '+' : ''}${result.effects.kompetenz}`,
          result.effects?.burnout != null && `Burnout +${result.effects.burnout}`,
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
    timeLeft = SNOW_REPORT_TIMER_SECONDS;
    tabsRead = { tab1: false, tab2: false, tab3: false };
    answered = false;

    showMissionBrief();
  }

  return { start };
})();
