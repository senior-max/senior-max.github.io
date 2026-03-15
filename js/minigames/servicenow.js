/**
 * servicenow.js
 * ServiceNow Asset Management ticket form parody for "License To Bill".
 * 12 mandatory fields, validation fails on first submit, duplicate dialog on second.
 * 90 second timer.
 */

const SN_GREEN = '#62D84E';
const TIMER_SECONDS = 90;
const CI_SEARCH_FAILS_BEFORE_MESSAGE = 3;

const VENDORS = [
  'Accenture', 'Acronis', 'Adobe', 'Amazon Web Services', 'Apple', 'Atlassian',
  'BMC', 'Broadcom', 'CA Technologies', 'Cisco', 'Citrix', 'Dell', 'Dropbox',
  'Google', 'Hewlett Packard', 'IBM', 'Intel', 'JetBrains', 'Kaspersky',
  'Lenovo', 'McAfee', 'Microsoft', 'MongoDB', 'NetApp', 'Norton',
  'Oracle', 'Palo Alto', 'Red Hat', 'SAP', 'Salesforce', 'Splunk',
  'Symantec', 'VMware', 'Zoom', 'Zscaler',
].sort();

const ASSIGNED_TO_OPTIONS = [
  'Kevin Schreiber', 'Sandra Breuer', 'Dr. Müller-Brandt', 'Dieter Kammann',
  'Tyler (AWS)', 'Unknown User [INACTIVE]', 'System Administrator',
];

window.ServiceNowMinigame = (function () {
  'use strict';

  let overlayEl = null;
  let formEl = null;
  let onCompleteCallback = null;
  let timerHandle = null;
  let timeLeft = TIMER_SECONDS;
  let submitCount = 0;
  let draftCount = 0;
  let ciSearchCount = 0;
  let startTime = 0;
  let otherDescVisible = false;
  let approvalCondVisible = false;

  // ── Toast ──────────────────────────────────────────────

  function showToast(text, color) {
    if (window.KeyboardController?.showToast) {
      window.KeyboardController.showToast(text, color || 'var(--color-accent-amber)');
    } else {
      const t = document.createElement('div');
      t.style.cssText = 'position:fixed;bottom:var(--space-lg);left:50%;transform:translateX(-50%);z-index:3000;background:var(--color-surface-elevated);padding:8px 16px;border-radius:4px;font-size:13px;';
      t.textContent = text;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 2500);
    }
  }

  // ── Timer ──────────────────────────────────────────────

  function startTimer() {
    const timerEl = overlayEl?.querySelector('#snow-timer');
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
    brief.id = 'servicenow-brief';
    brief.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:2100',
      'background:#f0f0f0', 'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center', 'padding:var(--space-xl)',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'text-align:center',
    ].join(';');

    brief.innerHTML = `
      <div style="font-size:var(--font-size-xl);color:${SN_GREEN};margin-bottom:var(--space-lg);">🟢 ServiceNow</div>
      <div style="font-size:var(--font-size-base);color:#333;max-width:480px;line-height:1.8;margin-bottom:var(--space-xl);">
        Ein neues Software-Asset muss in ServiceNow erfasst werden.<br>
        Formular ausfüllen und einreichen.<br>
        <strong>Pflichtfelder: alle. Optionale Felder: auch eigentlich alle.</strong>
      </div>
      <button type="button" class="choice-btn" id="snow-start-btn" style="width:200px;">Formular öffnen</button>
    `;

    document.body.appendChild(brief);
    brief.querySelector('#snow-start-btn').addEventListener('click', () => {
      window.Sound?.play?.('click');
      brief.remove();
      buildForm();
      startTimer();
      startTime = Date.now();
    });
  }

  // ── Form Build ──────────────────────────────────────────

  function buildForm() {
    overlayEl = document.createElement('div');
    overlayEl.id = 'servicenow-overlay';
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:2100',
      'background:#f0f0f0', 'overflow-y:auto',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'padding:var(--space-lg)',
    ].join(';');

    overlayEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md);">
        <span style="font-size:var(--font-size-sm);color:#666;">ITAM > Asset Management > Software Assets > New</span>
        <span id="snow-timer" style="font-size:var(--font-size-lg);font-weight:bold;color:${SN_GREEN};">${timeLeft}s</span>
      </div>

      <div style="background:#fff;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1);overflow:hidden;max-width:720px;margin:0 auto;">
        <div style="background:${SN_GREEN};color:#fff;padding:12px 20px;font-weight:600;">New Asset Record — Software</div>

        <form id="snow-form" style="padding:var(--space-lg);">
          <div id="snow-errors" style="display:none;background:#fff3f3;border:1px solid #f0c0c0;border-radius:4px;padding:var(--space-md);margin-bottom:var(--space-md);"></div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);">
            <div>
              <label style="display:block;margin-bottom:4px;font-size:13px;">Asset Name <span style="color:red;">*</span></label>
              <input type="text" id="snow-asset-name" maxlength="50" placeholder="z.B. Microsoft 365 E3" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:3px;box-sizing:border-box;">
            </div>
            <div>
              <label style="display:block;margin-bottom:4px;font-size:13px;">Asset Category <span style="color:red;">*</span></label>
              <select id="snow-category" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:3px;">
                <option value="">— Bitte wählen —</option>
                <option value="Software">Software</option>
                <option value="Hardware">Hardware</option>
                <option value="Cloud Service">Cloud Service</option>
                <option value="Virtual">Virtual</option>
                <option value="Other">Other</option>
                <option value="Unknown">Unknown</option>
                <option value="Legacy (pre-2010)">Legacy (pre-2010)</option>
                <option value="Legacy (post-2010)">Legacy (post-2010)</option>
                <option value="Not Applicable">Not Applicable</option>
                <option value="See Related Record">See Related Record</option>
              </select>
            </div>
            <div>
              <label style="display:block;margin-bottom:4px;font-size:13px;">Vendor <span style="color:red;">*</span></label>
              <select id="snow-vendor" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:3px;max-height:120px;">
                <option value="">— Bitte wählen —</option>
                ${VENDORS.map((v) => `<option value="${v}">${v}</option>`).join('')}
              </select>
            </div>
            <div>
              <label style="display:block;margin-bottom:4px;font-size:13px;">License Type <span style="color:red;">*</span></label>
              <select id="snow-license-type" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:3px;">
                <option value="">— Bitte wählen —</option>
                <option value="Subscription">Subscription</option>
                <option value="Perpetual">Perpetual</option>
                <option value="Named User">Named User</option>
                <option value="Volume">Volume</option>
                <option value="OEM">OEM</option>
                <option value="Concurrent">Concurrent</option>
                <option value="Enterprise">Enterprise</option>
                <option value="Device CAL">Device CAL</option>
                <option value="User CAL">User CAL</option>
                <option value="Floating">Floating</option>
                <option value="Processor">Processor</option>
                <option value="Core">Core</option>
                <option value="Site License">Site License</option>
                <option value="Academic">Academic</option>
                <option value="NFR">NFR</option>
                <option value="Evaluation">Evaluation</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label style="display:block;margin-bottom:4px;font-size:13px;">Purchase Date <span style="color:red;">*</span></label>
              <input type="date" id="snow-purchase-date" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:3px;box-sizing:border-box;">
            </div>
            <div>
              <label style="display:block;margin-bottom:4px;font-size:13px;">License Count <span style="color:red;">*</span></label>
              <input type="number" id="snow-license-count" min="1" max="99998" step="1" placeholder="z.B. 100" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:3px;box-sizing:border-box;">
            </div>
            <div>
              <label style="display:block;margin-bottom:4px;font-size:13px;">Cost Center <span style="color:red;">*</span></label>
              <input type="text" id="snow-cost-center" placeholder="KST-XXXX" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:3px;box-sizing:border-box;">
            </div>
            <div>
              <label style="display:block;margin-bottom:4px;font-size:13px;">Assigned To <span style="color:red;">*</span></label>
              <select id="snow-assigned-to" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:3px;">
                <option value="">— Bitte wählen —</option>
                ${ASSIGNED_TO_OPTIONS.map((v) => `<option value="${v}">${v}</option>`).join('')}
                <option value="" disabled>— und 847 weitere —</option>
              </select>
            </div>
            <div>
              <label style="display:block;margin-bottom:4px;font-size:13px;">Environment <span style="color:red;">*</span></label>
              <select id="snow-environment" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:3px;">
                <option value="">— Bitte wählen —</option>
                <option value="Production">Production</option>
                <option value="Test">Test</option>
                <option value="Development">Development</option>
                <option value="Staging">Staging</option>
                <option value="DR">DR</option>
                <option value="Pre-Production">Pre-Production</option>
                <option value="Sandbox">Sandbox</option>
                <option value="Archive">Archive</option>
                <option value="Retired">Retired</option>
                <option value="Active-Pending-Retirement">Active-Pending-Retirement</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label style="display:block;margin-bottom:4px;font-size:13px;">Compliance Status <span style="color:red;">*</span></label>
              <select id="snow-compliance" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:3px;">
                <option value="">— Bitte wählen —</option>
                <option value="Compliant">Compliant</option>
                <option value="Non-Compliant">Non-Compliant</option>
                <option value="Under Review">Under Review</option>
                <option value="Pending Assessment">Pending Assessment</option>
                <option value="Data Insufficient">Data Insufficient</option>
                <option value="Compliant (Unverified)">Compliant (Unverified)</option>
                <option value="See Audit Record">See Audit Record</option>
                <option value="N/A">N/A</option>
              </select>
            </div>
            <div style="grid-column:1/-1;">
              <label style="display:block;margin-bottom:4px;font-size:13px;">Related CI <span style="color:red;">*</span></label>
              <div style="display:flex;gap:8px;">
                <input type="text" id="snow-related-ci" placeholder="Suchen oder Referenz eingeben" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:3px;">
                <button type="button" id="snow-ci-search" style="padding:8px 16px;background:#ddd;border:none;border-radius:3px;cursor:pointer;">Suchen</button>
              </div>
              <div id="snow-ci-message" style="font-size:12px;color:#666;margin-top:4px;"></div>
            </div>
            <div style="grid-column:1/-1;">
              <label style="display:block;margin-bottom:4px;font-size:13px;">Approval Required <span style="color:red;">*</span></label>
              <div style="display:flex;gap:var(--space-lg);">
                <label><input type="radio" name="snow-approval" value="Yes"> Yes</label>
                <label><input type="radio" name="snow-approval" value="No"> No</label>
                <label><input type="radio" name="snow-approval" value="Depends"> Depends</label>
              </div>
            </div>
            <div id="snow-other-desc-wrap" style="display:none;grid-column:1/-1;">
              <label style="display:block;margin-bottom:4px;font-size:13px;">Other Description <span style="color:red;">*</span></label>
              <input type="text" id="snow-other-desc" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:3px;box-sizing:border-box;">
            </div>
            <div id="snow-approval-cond-wrap" style="display:none;grid-column:1/-1;">
              <label style="display:block;margin-bottom:4px;font-size:13px;">Approval Condition <span style="color:red;">*</span></label>
              <textarea id="snow-approval-cond" rows="2" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:3px;box-sizing:border-box;"></textarea>
            </div>
            <div style="grid-column:1/-1;">
              <label style="display:block;margin-bottom:4px;font-size:13px;">Notes</label>
              <textarea id="snow-notes" rows="2" style="width:100%;padding:8px;border:1px solid #f0c0c0;border-radius:3px;box-sizing:border-box;"></textarea>
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:var(--space-sm);margin-top:var(--space-lg);">
            <button type="button" id="snow-draft" style="padding:8px 20px;background:#ddd;border:none;border-radius:3px;cursor:pointer;">Save Draft</button>
            <button type="submit" id="snow-submit" style="padding:8px 24px;background:${SN_GREEN};color:#fff;border:none;border-radius:3px;cursor:pointer;font-weight:600;">Submit</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlayEl);
    formEl = overlayEl.querySelector('#snow-form');

    overlayEl.querySelector('#snow-category').addEventListener('change', (e) => {
      const wrap = overlayEl.querySelector('#snow-other-desc-wrap');
      if (e.target.value === 'Other') {
        wrap.style.display = 'block';
        otherDescVisible = true;
      } else {
        wrap.style.display = 'none';
        otherDescVisible = false;
      }
    });

    overlayEl.querySelectorAll('input[name="snow-approval"]').forEach((r) => {
      r.addEventListener('change', (e) => {
        const wrap = overlayEl.querySelector('#snow-approval-cond-wrap');
        if (e.target.value === 'Depends') {
          wrap.style.display = 'block';
          approvalCondVisible = true;
        } else {
          wrap.style.display = 'none';
          approvalCondVisible = false;
        }
      });
    });

    overlayEl.querySelector('#snow-ci-search').addEventListener('click', () => {
      ciSearchCount += 1;
      const msg = overlayEl.querySelector('#snow-ci-message');
      if (ciSearchCount >= CI_SEARCH_FAILS_BEFORE_MESSAGE) {
        msg.textContent = 'CI not found? Create new CI first, then return to this form.';
        msg.style.color = '#c00';
      } else {
        msg.textContent = 'No CIs found';
      }
    });

    overlayEl.querySelector('#snow-assigned-to').addEventListener('change', (e) => {
      if (e.target.value === 'Tyler (AWS)') {
        showToast('Tyler ist kein interner Mitarbeiter. Er ist trotzdem im System.');
      } else if (e.target.value === 'Unknown User [INACTIVE]') {
        showToast('Dieser User ist seit 2019 inaktiv. Das Ticket würde trotzdem zugewiesen.');
      }
    });

    overlayEl.querySelector('#snow-draft').addEventListener('click', () => {
      draftCount += 1;
      showToast('Draft saved.');
      setTimeout(() => {
        showToast('Draft could not be saved. Please try again.', 'var(--color-accent-red)');
      }, 800);
      if (draftCount >= 3) {
        window.Achievements?.checkTrigger?.('draft_obsession');
        showToast('Das Draft-Syndrom ist real.');
      }
    });

    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSubmit();
    });
  }

  // ── Submit Flow ────────────────────────────────────────

  function handleSubmit() {
    submitCount += 1;

    if (submitCount === 1) {
      showFirstSubmitErrors();
      return;
    }

    if (submitCount === 2) {
      showDuplicateDialog();
      return;
    }
  }

  function showFirstSubmitErrors() {
    const errEl = overlayEl.querySelector('#snow-errors');
    errEl.style.display = 'block';
    errEl.innerHTML = `
      <strong>3 errors found:</strong>
      <ul style="margin:8px 0 0 20px;padding:0;">
        <li>Cost Center format invalid. Expected: CC-XXXX-XX-XX</li>
        <li>Related CI: Must be a valid CI reference</li>
        <li>License Count: Value exceeds maximum for selected License Type</li>
      </ul>
    `;
    errEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function showDuplicateDialog() {
    const modal = document.createElement('div');
    modal.id = 'snow-duplicate-modal';
    modal.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:2200',
      'background:rgba(0,0,0,0.5)', 'display:flex', 'align-items:center', 'justify-content:center',
      'padding:var(--space-lg)',
    ].join(';');

    modal.innerHTML = `
      <div style="background:#fff;padding:var(--space-lg);border-radius:8px;max-width:420px;box-shadow:0 8px 32px rgba(0,0,0,0.2);">
        <div style="font-weight:600;margin-bottom:var(--space-md);">Duplicate record detected</div>
        <p style="font-size:14px;color:#666;line-height:1.6;margin-bottom:var(--space-lg);">
          An asset with this name may already exist.
        </p>
        <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap;">
          <button type="button" id="snow-view-dup" style="padding:8px 16px;background:#ddd;border:none;border-radius:3px;cursor:pointer;">View Duplicate</button>
          <button type="button" id="snow-submit-anyway" style="padding:8px 16px;background:${SN_GREEN};color:#fff;border:none;border-radius:3px;cursor:pointer;font-weight:600;">Submit Anyway</button>
          <button type="button" id="snow-cancel-dup" style="padding:8px 16px;background:#ddd;border:none;border-radius:3px;cursor:pointer;">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#snow-view-dup').addEventListener('click', () => {
      modal.remove();
      showToast('View Duplicate — Seite lädt...', 'var(--color-text-secondary)');
      setTimeout(() => showToast('(Leere Seite)', 'var(--color-text-secondary)'), 500);
    });

    modal.querySelector('#snow-submit-anyway').addEventListener('click', () => {
      modal.remove();
      handleSuccess();
    });

    modal.querySelector('#snow-cancel-dup').addEventListener('click', () => {
      modal.remove();
      overlayEl.querySelector('#snow-purchase-date').value = '';
      overlayEl.querySelector('#snow-errors').style.display = 'none';
    });
  }

  // ── Success / Timeout ───────────────────────────────────

  function handleSuccess() {
    stopTimer();
    const elapsed = (Date.now() - startTime) / 1000;

    let result;
    if (elapsed <= 60) {
      result = {
        score: 100,
        effects: { kompetenz: 5, prestige: 3 },
        xpBonus: 25,
        achievementTrigger: 'servicenow_survivor',
        message: 'Erfahrener ServiceNow-Nutzer. Sie kennen die Fallstricke.',
      };
    } else if (elapsed <= 90) {
      result = {
        score: 65,
        effects: { kompetenz: 3, burnout: 8 },
        xpBonus: 15,
        message: 'Ticket erstellt. Mit Narben.',
      };
    } else {
      result = {
        score: 50,
        effects: { kompetenz: 2, burnout: 10 },
        xpBonus: 10,
        message: 'Ticket erstellt. Knapp.',
      };
    }

    showResult(result);
  }

  function handleTimeout() {
    stopTimer();
    const result = {
      score: 0,
      effects: { burnout: 20, kompetenz: -2 },
      xpBonus: 0,
      achievementTrigger: 'servicenow_timeout',
      message: 'Ticket nicht eingereicht. ServiceNow hat die Session beendet. Alle Eingaben verloren. Das Formular ist leer.',
    };
    showResult(result);
  }

  function showResult(result) {
    overlayEl.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:var(--space-lg);padding:var(--space-xl);max-width:480px;margin:0 auto;';

    const emoji = result.score >= 65 ? '✅' : result.score > 0 ? '😅' : '😬';
    wrap.innerHTML = `
      <div style="font-size:48px;">${emoji}</div>
      <div style="font-size:var(--font-size-lg);color:${SN_GREEN};">${result.score} Punkte</div>
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
    timeLeft = TIMER_SECONDS;
    submitCount = 0;
    draftCount = 0;
    ciSearchCount = 0;
    otherDescVisible = false;
    approvalCondVisible = false;

    showMissionBrief();
  }

  return { start };
})();
