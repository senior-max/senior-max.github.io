/**
 * intro.js
 * Opening animation for "License To Bill" — satirical corporate presentation.
 * Plays once per session. SPACE or click skips to title card; on title card, starts game.
 */

(function () {
  'use strict';

  const INTRO_PLAYED_KEY = 'intro_played';

  /**
   * Typewriter effect: reveals text character by character.
   * @param {HTMLElement} el - Element to write into.
   * @param {string} text - Full text.
   * @param {number} msPerChar - Delay per character.
   * @returns {Promise<void>}
   */
  function typewriter(el, text, msPerChar = 55) {
    return new Promise((resolve) => {
      let i = 0;
      el.textContent = '';
      const tick = () => {
        if (i < text.length) {
          el.textContent += text[i];
          i++;
          setTimeout(tick, msPerChar);
        } else {
          resolve();
        }
      };
      tick();
    });
  }

  /**
   * Waits for a duration in ms.
   * @param {number} ms
   * @returns {Promise<void>}
   */
  function delay(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  /**
   * Creates the intro overlay and runs the animation sequence.
   * @param {() => void} onComplete - Called when intro finishes (or is skipped to end).
   */
  function play(onComplete) {
    if (sessionStorage.getItem(INTRO_PLAYED_KEY) === 'true') {
      onComplete();
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'intro-overlay';
    overlay.setAttribute('role', 'presentation');
    overlay.setAttribute('aria-label', 'Spiel-Intro');
    document.body.appendChild(overlay);

    let skipRequested = false;
    let currentBeat = 0;

    const skipToTitle = () => {
      if (skipRequested) return;
      skipRequested = true;
      jumpToBeat(6);
    };

    let finished = false;
    const finishIntro = () => {
      if (finished) return;
      finished = true;
      overlay.removeEventListener('click', handleInput);
      document.removeEventListener('keydown', handleInput);
      sessionStorage.setItem(INTRO_PLAYED_KEY, 'true');
      overlay.style.transition = 'opacity 0.3s ease';
      overlay.style.opacity = '0';
      overlay.addEventListener('transitionend', () => {
        overlay.remove();
        onComplete();
      }, { once: true });
    };

    const handleInput = (e) => {
      if (e.type === 'keydown' && e.code !== 'Space') return;
      e.preventDefault();
      if (currentBeat < 6) {
        skipToTitle();
      } else if (currentBeat === 6) {
        // During title card: jump to Beat 7 (press to start)
        currentBeat = 7;
        overlay.querySelectorAll('.intro-beat').forEach((b) => b.classList.remove('active'));
        const b7 = overlay.querySelector('[data-beat="7"]');
        if (b7) {
          b7.classList.add('active');
          runBeat7(overlay, handleInput, finishIntro);
        }
      } else {
        finishIntro();
      }
    };

    overlay.addEventListener('click', handleInput);
    document.addEventListener('keydown', handleInput, { once: false });

    function jumpToBeat(beatNum) {
      currentBeat = beatNum;
      overlay.querySelectorAll('.intro-beat').forEach((b) => b.classList.remove('active'));
      const target = overlay.querySelector(`[data-beat="${beatNum}"]`);
      if (target) {
        target.classList.add('active');
        if (beatNum === 6) {
          runBeat6(overlay);
          setTimeout(() => {
            if (!overlay.parentNode) return;
            currentBeat = 7;
            overlay.querySelectorAll('.intro-beat').forEach((b) => b.classList.remove('active'));
            const b7 = overlay.querySelector('[data-beat="7"]');
            if (b7) {
              b7.classList.add('active');
              runBeat7(overlay, handleInput, finishIntro);
            }
          }, 4800);
        }
        if (beatNum === 7) runBeat7(overlay, handleInput, finishIntro);
      }
    }

    async function runSequence() {
      // Beat 1
      currentBeat = 1;
      const beat1 = overlay.querySelector('[data-beat="1"]');
      beat1.classList.add('active');
      if (window.Sound) window.Sound.play('startup_chime');
      await runBeat1(beat1);
      if (skipRequested) return;
      beat1.classList.remove('active');
      await delay(600);

      // Beat 2
      currentBeat = 2;
      const beat2 = overlay.querySelector('[data-beat="2"]');
      beat2.classList.add('active');
      await runBeat2(beat2);
      if (skipRequested) return;
      beat2.classList.remove('active');
      await delay(600);

      // Beat 3
      currentBeat = 3;
      const beat3 = overlay.querySelector('[data-beat="3"]');
      beat3.classList.add('active');
      await runBeat3(beat3);
      if (skipRequested) return;
      beat3.classList.remove('active');
      await delay(600);

      // Beat 4
      currentBeat = 4;
      const beat4 = overlay.querySelector('[data-beat="4"]');
      beat4.classList.add('active');
      await runBeat4(beat4);
      if (skipRequested) return;
      beat4.classList.remove('active');
      await delay(600);

      // Beat 5
      currentBeat = 5;
      const beat5 = overlay.querySelector('[data-beat="5"]');
      beat5.classList.add('active');
      await runBeat5(beat5);
      if (skipRequested) return;
      beat5.classList.remove('active');
      await delay(600);

      // Beat 6
      currentBeat = 6;
      const beat6 = overlay.querySelector('[data-beat="6"]');
      beat6.classList.add('active');
      runBeat6(overlay);
      await delay(4500);

      if (skipRequested) return;

      // Beat 7
      currentBeat = 7;
      const beat7 = overlay.querySelector('[data-beat="7"]');
      beat6.classList.remove('active');
      beat7.classList.add('active');
      runBeat7(overlay, handleInput, finishIntro);
    }

    // Build all beats upfront (required for skip-to-title)
    createBeat1(overlay);
    createBeat2(overlay);
    createBeat3(overlay);
    createBeat4(overlay);
    createBeat5(overlay);
    createBeat6(overlay);
    createBeat7(overlay);

    // Show beat 1 and start
    overlay.querySelectorAll('.intro-beat').forEach((b) => b.classList.remove('active'));
    const b1 = overlay.querySelector('[data-beat="1"]');
    if (b1) b1.classList.add('active');

    runSequence().catch((err) => {
      console.warn('[Intro]', err);
      finishIntro();
    });
  }

  function createBeat1(overlay) {
    let el = overlay.querySelector('[data-beat="1"]');
    if (el) return el;
    el = document.createElement('div');
    el.className = 'intro-beat';
    el.setAttribute('data-beat', '1');
    el.innerHTML = `
      <div class="intro-beat1-line1"></div>
      <div class="intro-beat1-line2"></div>
    `;
    overlay.appendChild(el);
    return el;
  }

  async function runBeat1(beat) {
    const line1 = beat.querySelector('.intro-beat1-line1');
    const line2 = beat.querySelector('.intro-beat1-line2');
    await typewriter(line1, 'GREYSUIT & PARTNER CONSULTING', 55);
    await delay(1400);
    line2.style.opacity = '1';
    await delay(1000);
  }

  function createBeat2(overlay) {
    let el = overlay.querySelector('[data-beat="2"]');
    if (el) return el;
    el = document.createElement('div');
    el.className = 'intro-beat';
    el.setAttribute('data-beat', '2');
    el.innerHTML = `
      <div class="intro-beat2-host">CORP-LAPTOP-MH-042</div>
      <div class="intro-loadbar-track">
        <div class="intro-loadbar-fill" id="intro-loadbar-fill"></div>
      </div>
      <div class="intro-beat2-status" id="intro-beat2-status">0%</div>
    `;
    overlay.appendChild(el);
    return el;
  }

  async function runBeat2(beat) {
    const fill = document.getElementById('intro-loadbar-fill');
    const status = document.getElementById('intro-beat2-status');
    if (!fill || !status) return;
    await delay(200);
    fill.style.width = '100%';
    const steps = 20;
    const stepMs = 1200 / steps;
    for (let i = 0; i <= steps; i++) {
      if (document.getElementById('intro-overlay')?.querySelector('[data-beat="2"]')?.classList.contains('active')) {
        status.textContent = (i * 5) + '%';
        await delay(stepMs);
      }
    }
    fill.style.background = '#fff';
    status.textContent = 'BEREIT. FAST.';
    status.style.color = '#fff';
    await delay(800);
  }

  const NOTIFICATIONS = [
    '47 ungelesene E-Mails',
    'VPN-Token läuft ab in: 00:47:12',
    'Sandra Breuer: Pflichtschulung Erinnerung (4/4)',
    "Kalender: 'Synergy Call' beginnt in 3 Minuten",
    'Dieter Kammann hat Ihnen eine Nachricht gesendet',
    'Dieter Kammann hat Ihnen eine Nachricht gesendet',
    'Dieter Kammann hat Ihnen eine Nachricht gesendet',
  ];

  function createBeat3(overlay) {
    let el = overlay.querySelector('[data-beat="3"]');
    if (el) return el;
    el = document.createElement('div');
    el.className = 'intro-beat';
    el.setAttribute('data-beat', '3');
    const stack = document.createElement('div');
    stack.className = 'intro-notification-stack';
    NOTIFICATIONS.forEach((text) => {
      const card = document.createElement('div');
      card.className = 'intro-notification';
      card.innerHTML = `🔔 ${text}`;
      stack.appendChild(card);
    });
    el.appendChild(stack);
    overlay.appendChild(el);
    return el;
  }

  async function runBeat3(beat) {
    const overlay = document.getElementById('intro-overlay');
    if (overlay) {
      overlay.style.transition = 'background 0.1s ease';
      overlay.style.background = '#fff';
      await delay(100);
      overlay.style.background = '#0a0a0a';
    }
    const cards = beat.querySelectorAll('.intro-notification');
    for (let i = 0; i < cards.length; i++) {
      if (window.Sound) window.Sound.play('notification');
      cards[i].classList.add('visible');
      await delay(450);
    }
    await delay(700);
    cards.forEach((c) => c.classList.add('shake'));
    await delay(500);
    cards.forEach((c) => {
      c.style.opacity = '0';
      c.style.transition = 'opacity 0.3s ease';
    });
    await delay(350);
  }

  function createBeat4(overlay) {
    let el = overlay.querySelector('[data-beat="4"]');
    if (el) return el;
    el = document.createElement('div');
    el.className = 'intro-beat';
    el.setAttribute('data-beat', '4');
    el.innerHTML = `
      <div class="intro-beat4-line1"></div>
      <div class="intro-beat4-line2"></div>
      <div class="intro-beat4-line3"></div>
    `;
    overlay.appendChild(el);
    return el;
  }

  async function runBeat4(beat) {
    const l1 = beat.querySelector('.intro-beat4-line1');
    const l2 = beat.querySelector('.intro-beat4-line2');
    const l3 = beat.querySelector('.intro-beat4-line3');
    await typewriter(l1, 'Du hast eine neue Aufgabe.', 55);
    await delay(1000);
    l2.textContent = 'Microsoft-Audit. Montag. 09:00 Uhr.';
    l2.style.opacity = '1';
    await delay(700);
    l3.textContent = 'Heute ist Freitag. 17:47 Uhr.';
    l3.style.opacity = '1';
    await delay(900);
  }

  function createBeat5(overlay) {
    let el = overlay.querySelector('[data-beat="5"]');
    if (el) return el;
    el = document.createElement('div');
    el.className = 'intro-beat intro-beat5';
    el.setAttribute('data-beat', '5');
    el.innerHTML = `<div class="intro-beat5-text" id="intro-beat5-text"></div>`;
    overlay.appendChild(el);
    return el;
  }

  async function runBeat5(beat) {
    const text = document.getElementById('intro-beat5-text');
    if (!text) return;
    text.textContent = '😰 Dieter Kammann tippt...';
    text.style.opacity = '1';
    await delay(1200);
    text.textContent = "😰 Dieter Kammann: 'Hallo! Kurze Frage...'";
    text.style.color = '#666';
    await delay(900);
    text.style.opacity = '0';
    await delay(400);
  }

  function createBeat6(overlay) {
    let el = overlay.querySelector('[data-beat="6"]');
    if (el) return el;
    const year = new Date().getFullYear();
    el = document.createElement('div');
    el.className = 'intro-beat';
    el.setAttribute('data-beat', '6');
    el.innerHTML = `
      <div class="intro-beat6-byline">Ein Spiel von Maximilian Hensel</div>
      <div class="intro-title-wrap">
        <h1 class="intro-title" id="intro-title">LICENSE TO BILL</h1>
      </div>
      <div class="intro-beat6-subtitle" id="intro-beat6-subtitle">Das IT Asset Management Berater-Abenteuer</div>
      <div class="intro-title-line" id="intro-title-line"></div>
      <div class="intro-beat6-copy" id="intro-beat6-copy">© ${year} Maximilian Hensel</div>
    `;
    overlay.appendChild(el);
    return el;
  }

  async function runBeat6(overlay) {
    const beat = overlay.querySelector('[data-beat="6"]');
    if (!beat) return;
    if (window.Sound) window.Sound.play('title_hit');
    const byline = beat.querySelector('.intro-beat6-byline');
    const titleWrap = beat.querySelector('.intro-title-wrap');
    const title = document.getElementById('intro-title');
    const subtitle = document.getElementById('intro-beat6-subtitle');
    const line = document.getElementById('intro-title-line');
    const copy = document.getElementById('intro-beat6-copy');

    byline.style.opacity = '1';
    await delay(400);
    if (titleWrap) titleWrap.style.opacity = '1';
    if (title) {
      title.style.animation = 'titleSlam 0.5s ease-out forwards';
    }
    await delay(500);
    if (subtitle) subtitle.style.opacity = '1';
    await delay(500);
    if (line) {
      line.classList.add('drawn');
      await delay(400);
    }
    if (copy) copy.style.opacity = '1';
  }

  function createBeat7(overlay) {
    let el = overlay.querySelector('[data-beat="7"]');
    if (el) return el;
    el = document.createElement('div');
    el.className = 'intro-beat';
    el.setAttribute('data-beat', '7');
    el.innerHTML = `
      <div class="intro-beat6-content">
        <div class="intro-beat6-byline">Ein Spiel von Maximilian Hensel</div>
        <div class="intro-title-wrap">
          <h1 class="intro-title">LICENSE TO BILL</h1>
        </div>
        <div class="intro-beat6-subtitle">Das IT Asset Management Berater-Abenteuer</div>
        <div class="intro-title-line drawn"></div>
        <div class="intro-beat6-copy">© ${new Date().getFullYear()} Maximilian Hensel</div>
      </div>
      <div class="intro-press-hint" id="intro-press-hint">SPACE oder Klick zum Starten</div>
    `;
    overlay.appendChild(el);
    return el;
  }

  function runBeat7(overlay, handleInput, finishIntro) {
    const hint = document.getElementById('intro-press-hint');
    if (hint) {
      hint.style.opacity = '0';
      hint.style.transition = 'none';
      setTimeout(() => {
        hint.style.transition = 'opacity 0.4s ease';
        hint.style.opacity = '1';
      }, 500);
    }
    // handleInput already attached — on Beat 7 it calls finishIntro
  }

  window.Intro = { play };
})();
