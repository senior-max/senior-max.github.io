/**
 * vendor_ads.js
 * Satirical enterprise software advertisements for "License To Bill".
 * Interstitial overlays between scenes with hidden stat consequences.
 * Depends: engine.js (Engine), keyboard.js (showToast), achievements.js
 */

(function () {
  'use strict';

  /** @type {Object[]} All ad definitions from vendor_ads.json */
  let allAds = [];

  /** @type {string[]} IDs of ads already shown this session (no repeats). */
  let shownAds = [];

  /** @type {number} How many ads shown this session. */
  let triggerCount = 0;

  /** @type {number} Max ads per game session. */
  const MAX_PER_SESSION = 4;

  /** @type {Promise<void>|null} Resolves when ads are loaded. */
  let loadPromise = null;

  /** @type {function|null} Callback to run when ad is dismissed. */
  let pendingCallback = null;

  // ── Load ─────────────────────────────────────────────────

  /**
   * Fetches /data/vendor_ads.json and stores in allAds.
   * Idempotent — skips if already loaded.
   * @returns {Promise<void>}
   */
  async function loadAds() {
    if (allAds.length > 0) return;
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      try {
        const res = await fetch('/data/vendor_ads.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        allAds = Array.isArray(data) ? data : [];
      } catch (e) {
        console.warn('[VendorAds] Failed to load vendor_ads.json:', e);
        allAds = [];
      }
    })();
    return loadPromise;
  }

  // ── Selection ────────────────────────────────────────────

  /**
   * Returns a random ad that hasn't been shown, respecting incident/phone rules.
   * @param {{ nextSceneId?: string }} [options]
   * @returns {Object|null}
   */
  function getRandomAd(options) {
    const projectId = window.Engine?.GameState?.currentProject ?? null;
    const phoneCallShown = shownAds.some((id) => {
      const ad = allAds.find((a) => a.id === id);
      return ad && ad.isPhoneCall;
    });

    const candidates = allAds.filter((ad) => {
      if (shownAds.includes(ad.id)) return false;
      if (ad.isIncident) {
        if (projectId !== 'projekt_board' && projectId !== 'projekt_cloud') return false;
      }
      if (ad.isPhoneCall && phoneCallShown) return false;
      return true;
    });

    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // ── Trigger logic ───────────────────────────────────────

  /**
   * Returns true if an ad should be shown on this scene transition.
   * @param {{ nextSceneId?: string }} [options]
   * @returns {boolean}
   */
  function shouldTrigger(options) {
    if (triggerCount >= MAX_PER_SESSION) return false;
    if (window.Engine?.GameState?.lastEventType === 'vendor_ad') return false;

    const projectData = window.Engine?.getProjectData?.();
    if (options?.nextSceneId && projectData?.scenes?.[0]?.id === options.nextSceneId) return false;

    return Math.random() < 0.2;
  }

  // ── Render ──────────────────────────────────────────────

  /**
   * Shows feedback as a toast. Uses KeyboardController if available.
   * @param {string} text
   * @param {string} [color]
   */
  function showFeedbackToast(text, color) {
    if (window.KeyboardController?.showToast) {
      window.KeyboardController.showToast(text, color || 'var(--color-accent-amber)');
    } else {
      const toast = document.createElement('div');
      toast.style.cssText = [
        'position:fixed', 'bottom:var(--space-lg)', 'left:50%', 'transform:translateX(-50%)',
        'z-index:3000', 'background:var(--color-surface-elevated)', 'border:1px solid var(--color-accent-amber)',
        'border-radius:var(--radius-md)', 'padding:var(--space-sm) var(--space-md)',
        'font-family:var(--font-mono)', 'font-size:var(--font-size-sm)', 'color:var(--color-accent-amber)',
        'white-space:normal', 'max-width:90vw', 'pointer-events:none',
      ].join(';');
      toast.textContent = text;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  }

  /**
   * Records Tyler call acceptance and checks achievement.
   */
  function recordTylerCallAccepted() {
    const counters = window.Engine?.GameState?.counters;
    if (!counters) return;
    counters.vendor_call_accepted = (counters.vendor_call_accepted || 0) + 1;
    if (counters.vendor_call_accepted >= 3) {
      window.Achievements?.checkTrigger?.('vendor_call_accepted_3');
    }
    window.Storage?.saveGame?.(window.Engine?.GameState);
  }

  /**
   * Records ad skip and checks achievement.
   */
  function recordAdSkipped() {
    const counters = window.Engine?.GameState?.counters;
    if (!counters) return;
    counters.vendor_ads_skipped = (counters.vendor_ads_skipped || 0) + 1;
    if (counters.vendor_ads_skipped >= 5) {
      window.Achievements?.checkTrigger?.('vendor_ads_skipped_5');
    }
    window.Storage?.saveGame?.(window.Engine?.GameState);
  }

  /**
   * Handles button or skip click: applies effects, shows feedback, closes overlay.
   * @param {Object} ad
   * @param {Object} [button] - Button object with effects/feedback, or null for skip.
   */
  function handleAdAction(ad, button) {
    const overlay = document.getElementById('vendor-ad-overlay');
    if (!overlay) return;

    if (button) {
      if (button.effects && window.Engine?.applyEffects) {
        window.Engine.applyEffects(button.effects);
      }
      showFeedbackToast(button.feedback || '');
      if (ad.id === 'ad_cold_call_tyler' && button.style === 'primary') {
        recordTylerCallAccepted();
      }
    } else {
      showFeedbackToast('Werbung übersprungen. Tyler ist enttäuscht.', 'var(--color-text-secondary)');
      recordAdSkipped();
    }

    overlay.remove();
    if (typeof pendingCallback === 'function') {
      pendingCallback();
      pendingCallback = null;
    }
  }

  /**
   * Creates and shows the vendor ad overlay.
   * @param {Object} ad
   * @param {function} onComplete - Called when overlay is dismissed.
   */
  function renderAd(ad, onComplete) {
    pendingCallback = onComplete;
    const existing = document.getElementById('vendor-ad-overlay');
    if (existing) existing.remove();

    const isPhone = !!ad.isPhoneCall;
    const isIncident = !!ad.isIncident;
    const topBarColor = isIncident ? '#d13438' : (ad.color || '#0078D4');

    const cardClasses = ['vendor-ad-card'];
    if (isPhone) cardClasses.push('phone-call');

    const badgeClasses = ['vendor-ad-badge'];
    if (isIncident) badgeClasses.push('flashing');

    const overlay = document.createElement('div');
    overlay.id = 'vendor-ad-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', `Werbung: ${ad.headline}`);

    overlay.innerHTML = `
      <div class="${cardClasses.join(' ')}" style="--vendor-color: ${ad.color || '#0078D4'}">
        <div class="vendor-ad-color-bar" style="background: ${topBarColor}"></div>
        <div class="vendor-ad-header">
          <span class="vendor-ad-logo">${ad.logo || '📢'}</span>
          <span class="vendor-ad-vendor-name">${ad.vendor || ''}</span>
          ${ad.badge ? `<span class="${badgeClasses.join(' ')}" style="background: ${ad.badgeColor || '#30363d'}">${ad.badge}</span>` : ''}
        </div>
        <h2 class="vendor-ad-headline">${ad.headline || ''}</h2>
        <p class="vendor-ad-subline">${ad.subline || ''}</p>
        <p class="vendor-ad-body">${ad.bodyText || ''}</p>
        <p class="vendor-ad-small-print">${ad.smallPrint || ''}</p>
        <div class="vendor-ad-divider"></div>
        <div class="vendor-ad-buttons">
          ${(ad.buttons || []).map((btn) => {
            const styleClass = btn.style || 'primary';
            return `<button type="button" class="vendor-ad-btn ${styleClass}" data-feedback="${(btn.feedback || '').replace(/"/g, '&quot;')}" data-effects='${JSON.stringify(btn.effects || {})}' data-style="${styleClass}">${btn.label || ''}</button>`;
          }).join('')}
        </div>
        <div class="vendor-ad-skip-row">
          <button type="button" id="vendor-ad-skip" class="vendor-ad-skip">Werbung überspringen ▸</button>
        </div>
      </div>
    `;

    document.getElementById('app').appendChild(overlay);

    const skipEl = document.getElementById('vendor-ad-skip');
    setTimeout(() => skipEl.classList.add('visible'), 3000);

    overlay.querySelectorAll('.vendor-ad-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const effects = JSON.parse(btn.dataset.effects || '{}');
        const feedback = btn.dataset.feedback || '';
        const style = btn.dataset.style || '';
        handleAdAction(ad, { effects, feedback, style });
      });
    });

    const dismiss = () => handleAdAction(ad, null);
    skipEl.addEventListener('click', dismiss);

    const escHandler = (e) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', escHandler);
        dismiss();
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  /**
   * Called when an ad is dismissed. Updates state and continues game flow.
   */
  function onAdComplete() {
    triggerCount += 1;
    if (window.Engine?.GameState) {
      window.Engine.GameState.lastEventType = 'vendor_ad';
    }
  }

  // ── Public API ───────────────────────────────────────────

  /**
   * Checks if an ad should trigger; if so, shows it and waits for interaction.
   * Otherwise calls callback immediately.
   * @param {function} callback - Called when no ad or after ad is dismissed.
   * @param {{ nextSceneId?: string }} [options]
   */
  function triggerIfApplicable(callback, options) {
    if (!window.Engine?.randomEventsAllowed?.()) {
      callback();
      return;
    }
    if (window.Engine?.isOnboarding?.()) {
      callback();
      return;
    }
    loadAds().then(() => {
      if (!shouldTrigger(options)) {
        callback();
        return;
      }
      const ad = getRandomAd(options);
      if (!ad) {
        callback();
        return;
      }
      shownAds.push(ad.id);
      renderAd(ad, () => {
        onAdComplete();
        callback();
      });
    }).catch(() => callback());
  }

  /**
   * Resets session state (shown ads, trigger count). Call when starting/continuing a game.
   */
  function resetSession() {
    shownAds = [];
    triggerCount = 0;
  }

  window.VendorAds = {
    allAds: () => allAds,
    shownAds: () => [...shownAds],
    triggerCount: () => triggerCount,
    MAX_PER_SESSION,
    loadAds,
    getRandomAd,
    shouldTrigger,
    renderAd,
    triggerIfApplicable,
    onAdComplete,
    resetSession,
  };
})();
