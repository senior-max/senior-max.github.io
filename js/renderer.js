/**
 * renderer.js
 * Handles all DOM output for "License To Bill".
 * Reads from the HTML structure defined in index.html.
 * Depends on: engine.js (window.Engine), window.NPC_DATA
 */

// ── Internal helpers ──────────────────────────────────────

/**
 * Returns a DOM element by CSS selector. Throws if not found.
 * @param {string} selector
 * @returns {HTMLElement}
 */
function $(selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`[Renderer] Element not found: ${selector}`);
  return el;
}

/**
 * Removes a CSS class from an element after its CSS animation ends once.
 * @param {HTMLElement} el
 * @param {string} className
 */
function removeClassAfterAnimation(el, className) {
  function onEnd() {
    el.classList.remove(className);
    el.removeEventListener('animationend', onEnd);
  }
  el.addEventListener('animationend', onEnd);
}

/**
 * Creates a full-screen overlay div and appends it to #app.
 * Sets role="dialog" and aria-modal="true" for assistive technology.
 * Automatically traps keyboard focus inside the overlay once it is populated
 * (runs on the next task via setTimeout so callers can add content first).
 * @param {string} id - The id attribute for the overlay.
 * @param {string} [label] - Accessible name for aria-label.
 * @returns {HTMLDivElement}
 */
function createOverlay(id, label) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = id;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  if (label) overlay.setAttribute('aria-label', label);

  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:1000',
    'display:flex', 'flex-direction:column',
    'align-items:center', 'justify-content:center',
    'padding:var(--space-lg)',
  ].join(';');

  document.getElementById('app').appendChild(overlay);

  // Defer focus trap until the caller has finished populating the overlay.
  setTimeout(() => window.KeyboardController?.trapFocus(overlay), 0);

  return overlay;
}

// ── Core render functions ─────────────────────────────────

/**
 * Types text character by character into a DOM element.
 * Appends a blinking cursor during typing; removes it on completion.
 * @param {string} text - The text to type out.
 * @param {string} selector - CSS selector of the target element.
 * @param {number} [speed=28] - Milliseconds between each character.
 * @returns {Promise<void>} Resolves when all characters have been typed.
 */
function typeText(text, selector, speed = 28) {
  return new Promise((resolve) => {
    const el = $(selector);
    el.textContent = '';

    const cursor = document.createElement('span');
    cursor.className = 'animate-typing-cursor';
    el.appendChild(cursor);

    let index = 0;
    const interval = setInterval(() => {
      if (index >= text.length) {
        clearInterval(interval);
        cursor.remove();
        resolve();
        return;
      }
      el.insertBefore(document.createTextNode(text[index]), cursor);
      if (index % 3 === 0) window.Sound?.play('typing');
      index += 1;
    }, speed);
  });
}

/**
 * Renders a set of choice buttons into #choices-container.
 * Staggered entrance animation applied via inline delay.
 * @param {Array<{text: string, effects?: Object, flags?: Object, feedback?: string, next: string}>} choices
 */
function renderChoices(choices) {
  const container = $('#choices-container');
  container.innerHTML = '';
  document.getElementById('key-hints')?.remove();

  const visible = choices.filter((choice) => {
    if (!choice.requires_flag) return true;
    return window.Engine?.hasFlag(choice.requires_flag) || false;
  });

  visible.forEach((choice, index) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn animate-fadeInUp';
    btn.textContent = choice.text;
    btn.style.animationDelay = `${index * 80}ms`;

    btn.setAttribute('aria-describedby', 'story-text');
    btn.setAttribute('data-choice-index', String(index));

    btn.addEventListener('click', () => {
      window.Sound?.play('choice_made');
      container.querySelectorAll('.choice-btn').forEach((b) => {
        b.disabled = true;
      });
      window.Engine.makeChoice(choice);
    });

    container.appendChild(btn);
  });

  // Render key hints after the stagger animation frame starts.
  requestAnimationFrame(() => window.KeyboardController?.showKeyHints());
}

/**
 * Renders a full game scene: location, NPC, story text, then choices.
 * @param {{
 *   locationEmoji: string,
 *   locationName: string,
 *   npc: string|null,
 *   text: string,
 *   choices: Array
 * }} scene
 */
function renderScene(scene) {
  $('#scene-location').textContent =
    `${scene.locationEmoji ?? ''} ${scene.locationName ?? ''}`.trim();

  if (window.NPCs) {
    window.NPCs.renderNPCDisplay(scene.npc ?? null);
    window.NPCs.applyNPCModifiers(scene.npc ?? null);
  }

  $('#feedback-text').textContent = '';
  $('#choices-container').innerHTML = '';

  typeText(scene.text, '#story-text').then(() => {
    if (scene.minigame) {
      triggerSceneMinigame(scene);
    } else {
      renderChoices(scene.choices);
    }
  });
}

/**
 * Fires a scene's minigame via Engine.triggerMinigame, then renders choices on completion.
 * @param {{ minigame: string, choices: Array }} scene
 */
function triggerSceneMinigame(scene) {
  if (!window.Engine || typeof window.Engine.triggerMinigame !== 'function') {
    renderChoices(scene.choices);
    return;
  }
  window.Engine.triggerMinigame(scene.minigame, () => {
    renderChoices(scene.choices);
  });
}

// ── Screen helpers ────────────────────────────────────────

/**
 * Types text into a DOM element directly (no CSS selector needed).
 * @param {HTMLElement} el
 * @param {string} text
 * @param {number} [speed=24]
 * @returns {Promise<void>}
 */
function typeIntoEl(el, text, speed = 24) {
  return new Promise((resolve) => {
    el.textContent = '';
    const cursor = document.createElement('span');
    cursor.className = 'animate-typing-cursor';
    el.appendChild(cursor);

    let i = 0;
    const iv = setInterval(() => {
      if (i >= text.length) {
        clearInterval(iv);
        cursor.remove();
        resolve();
        return;
      }
      el.insertBefore(document.createTextNode(text[i]), cursor);
      if (i % 3 === 0) window.Sound?.play('typing');
      i += 1;
    }, speed);
  });
}

/**
 * Animates an XP number counting up from `from` to `to` over 1.5 seconds.
 * Writes "+N XP" into the element with the given id.
 * Uses ease-out cubic for a satisfying feel.
 * @param {number} from
 * @param {number} to
 * @param {string} elementId
 */
function animateXP(from, to, elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const duration = 1500;
  const start = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(from + (to - from) * eased);
    el.textContent = `+${current} XP`;
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

/**
 * Generates 20 confetti dots that fall through the given container.
 * Dots are absolutely positioned — container must be position:relative.
 * @param {HTMLElement} container
 */
function createConfetti(container) {
  const COLORS = [
    'var(--color-accent-cyan)',
    'var(--color-accent-amber)',
    'var(--color-accent-green)',
    'var(--color-accent-purple)',
    'var(--color-accent-red)',
    '#ffffff',
  ];

  for (let i = 0; i < 20; i++) {
    const dot = document.createElement('span');
    const size = 4 + Math.random() * 6;
    const left = 5 + Math.random() * 90;
    const delay = Math.random() * 2;
    const dur   = 1.4 + Math.random() * 1.6;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    dot.style.cssText = [
      'position:absolute',
      `left:${left}%`,
      'top:0',
      `width:${size}px`,
      `height:${size}px`,
      `background:${color}`,
      'border-radius:50%',
      `animation:confettiFall ${dur}s ${delay}s ease-in both`,
      'pointer-events:none',
    ].join(';');
    container.appendChild(dot);
  }
}

/**
 * Builds a stat delta comparison between two stat snapshots.
 * Only shows stats that changed. Burnout decreases are considered positive.
 * @param {Object} before - Stats snapshot at project start.
 * @param {Object} after  - Current stats.
 * @returns {HTMLElement}
 */
function buildStatDelta(before, after) {
  const LABELS = {
    kompetenz:   '🔵 Kompetenz',
    bullshit:    '🟡 Bullshit',
    kundenliebe: '🟢 Kundenliebe',
    burnout:     '🔴 Burnout',
    prestige:    '🟣 Prestige',
  };

  const wrap = document.createElement('div');
  wrap.style.cssText = [
    'display:flex', 'gap:var(--space-md)',
    'flex-wrap:wrap', 'justify-content:center',
    'font-size:var(--font-size-sm)',
    'margin:var(--space-sm) 0',
  ].join(';');

  Object.keys(LABELS).forEach((key) => {
    const delta = (after[key] ?? 0) - (before[key] ?? 0);
    if (delta === 0) return;

    const isBurnout  = key === 'burnout';
    const isPositive = isBurnout ? delta < 0 : delta > 0;
    const color = isPositive
      ? 'var(--color-accent-green)'
      : 'var(--color-accent-red)';
    const sign  = delta > 0 ? '+' : '';

    const chip = document.createElement('span');
    chip.style.cssText = `color:${color};white-space:nowrap;`;
    chip.textContent = `${LABELS[key]}  ${sign}${delta}`;
    wrap.appendChild(chip);
  });

  return wrap;
}

/**
 * Displays feedback text after a player choice.
 * Animates in from the right; removes the animation class when done.
 * @param {string} text
 */
function showFeedback(text) {
  const el = $('#feedback-text');
  el.classList.remove('animate-slide-in-right');
  el.textContent = text;
  void el.offsetWidth; // force reflow so re-adding the class triggers animation
  el.classList.add('animate-slide-in-right');
  removeClassAfterAnimation(el, 'animate-slide-in-right');
}

/** @type {Object.<number, string>} Quirk text unlocked at each career level. */
const LEVEL_QUIRKS = {
  2: {
    emoji: '📋',
    title: 'Consultant',
    line1: 'Du verlässt das Plateau des Junior-Daseins.',
    line2: 'Ab jetzt sagst du "ich schaue mir das an" und meinst damit Google. Niemand merkt es. Noch nicht.',
  },
  3: {
    emoji: '📊',
    title: 'Senior Consultant',
    line1: 'Du darfst jetzt offiziell andere Leute in Meetings einladen.',
    line2: 'Sie kommen nicht immer. Du nennst das "Meeting-Kultur". Es ist keine.',
  },
  4: {
    emoji: '📅',
    title: 'Manager',
    line1: 'Dein Kalender ist zu 80% blockiert. Du selbst weißt nicht mehr warum.',
    line2: 'Kevin fragt dich nach Feedback. Du gibst ihm drei Wochen später eine Stichpunktliste. Er ist dankbar. Das ist das Schlimmste daran.',
  },
  5: {
    emoji: '🎤',
    title: 'Principal',
    line1: 'Du sprichst jetzt bei Konferenzen. Über "Disruption".',
    line2: 'Du meinst damit nicht das, was Dieter heute Morgen mit dem Druckertoner angerichtet hat. Du öffnest Excel nicht mehr selbst. Du "enablest" andere darin.',
  },
  6: {
    emoji: '🤝',
    title: 'Partner',
    line1: 'Du benutzt das Wort "skalieren" in jedem zweiten Satz.',
    line2: 'Dieter schickt dir jetzt E-Mails mit "Sehr geehrter Herr/Frau Partner". Er weiß deinen Vornamen noch. Glaub er.',
  },
};

/**
 * Displays a level-up overlay celebrating the player's promotion.
 * Shows confetti, old title struck through, new title typewriter effect,
 * career bonus, a funny two-line level description, and a dismiss button.
 * @param {string} newTitle - The new career title.
 * @param {number} [newLevel] - The new career level (1-based).
 */
function showLevelUp(newTitle, newLevel) {
  const quirk = LEVEL_QUIRKS[newLevel ?? 0];

  // ── Full-screen dimmed backdrop ──────────────────────────
  const backdrop = document.createElement('div');
  backdrop.id = 'levelup-overlay';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');
  backdrop.setAttribute('aria-label', 'Beförderung');
  backdrop.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:1050',
    'display:flex', 'align-items:center', 'justify-content:center',
    'background:rgba(13,17,23,0.88)',
    'backdrop-filter:blur(4px)',
    '-webkit-backdrop-filter:blur(4px)',
    'animation:fadeIn 0.3s ease both',
  ].join(';');
  document.getElementById('app').appendChild(backdrop);

  // ── Centered card ────────────────────────────────────────
  const card = document.createElement('div');
  card.style.cssText = [
    'position:relative', 'overflow:hidden',
    'width:520px', 'max-width:94vw',
    'background:var(--color-surface)',
    'border:2px solid var(--color-accent-cyan)',
    'border-radius:var(--radius-lg)',
    'padding:var(--space-xl) var(--space-xl) var(--space-lg)',
    'display:flex', 'flex-direction:column', 'align-items:center',
    'gap:var(--space-md)', 'text-align:center',
    'animation:levelUpCard 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
    'box-shadow:0 0 60px rgba(88,166,255,0.18), 0 0 120px rgba(88,166,255,0.06)',
  ].join(';');
  backdrop.appendChild(card);

  // Confetti
  const confettiLayer = document.createElement('div');
  confettiLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;';
  createConfetti(confettiLayer);
  card.appendChild(confettiLayer);

  // Level pill
  const maxLevel = 6;
  const pillEl = document.createElement('div');
  pillEl.style.cssText = [
    'font-size:10px', 'letter-spacing:2px', 'text-transform:uppercase',
    'color:var(--color-accent-cyan)', 'background:rgba(88,166,255,0.1)',
    'border:1px solid rgba(88,166,255,0.3)',
    'border-radius:var(--radius-sm)', 'padding:3px 10px',
    'position:relative', 'z-index:1',
  ].join(';');
  pillEl.textContent = `Stufe ${newLevel ?? '?'} von ${maxLevel}`;
  card.appendChild(pillEl);

  // Big role emoji
  if (quirk?.emoji) {
    const emojiEl = document.createElement('div');
    emojiEl.style.cssText = 'font-size:3.5rem;line-height:1;position:relative;z-index:1;animation:levelUpEmoji 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.15s both;';
    emojiEl.textContent = quirk.emoji;
    card.appendChild(emojiEl);
  }

  // "BEFÖRDERUNG!" header
  const heading = document.createElement('div');
  heading.style.cssText = [
    'font-size:var(--font-size-xl)', 'letter-spacing:3px',
    'color:var(--color-accent-cyan)', 'position:relative', 'z-index:1',
  ].join(';');
  heading.textContent = '🎉 BEFÖRDERUNG!';
  card.appendChild(heading);

  // Old title struck through (level 2+)
  if (newLevel && newLevel > 2) {
    const oldTitles = ['Junior Consultant', 'Consultant', 'Senior Consultant', 'Manager', 'Principal'];
    const oldTitle = oldTitles[newLevel - 2] ?? '';
    if (oldTitle) {
      const struck = document.createElement('div');
      struck.style.cssText = [
        'text-decoration:line-through', 'color:var(--color-text-secondary)',
        'font-size:var(--font-size-sm)', 'position:relative', 'z-index:1',
        'opacity:0.6',
      ].join(';');
      struck.textContent = oldTitle;
      card.appendChild(struck);
    }
  }

  // New title (typewriter, cyan glow)
  const newTitleEl = document.createElement('div');
  newTitleEl.style.cssText = [
    'color:var(--color-accent-cyan)',
    'font-size:var(--font-size-xl)',
    'font-weight:bold',
    'letter-spacing:3px',
    'text-transform:uppercase',
    'min-height:1.5em',
    'text-shadow:0 0 20px rgba(88,166,255,0.5)',
    'position:relative', 'z-index:1',
  ].join(';');
  card.appendChild(newTitleEl);
  setTimeout(() => typeIntoEl(newTitleEl, newTitle, 45), 250);

  // Career bonus
  const bonus = window.Career?.getCareerBonus?.(newLevel ?? 1) ?? {};
  const bonusEntries = Object.entries(bonus).filter(([, v]) => v !== 0);
  if (bonusEntries.length > 0) {
    const bonusStr = bonusEntries
      .map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k.charAt(0).toUpperCase() + k.slice(1)}`)
      .join('   ');
    const bonusEl = document.createElement('div');
    bonusEl.style.cssText = [
      'font-size:var(--font-size-sm)', 'color:var(--color-accent-green)',
      'background:rgba(63,185,80,0.08)',
      'border:1px solid rgba(63,185,80,0.25)',
      'border-radius:var(--radius-sm)', 'padding:4px 12px',
      'position:relative', 'z-index:1',
    ].join(';');
    bonusEl.textContent = `✨ Passivbonus: ${bonusStr}`;
    card.appendChild(bonusEl);
  }

  // Separator
  const sep = document.createElement('div');
  sep.style.cssText = 'width:60%;height:1px;background:var(--color-border);position:relative;z-index:1;';
  card.appendChild(sep);

  // Funny two-line description
  if (quirk) {
    const q1 = document.createElement('div');
    q1.style.cssText = [
      'color:var(--color-text-primary)', 'font-size:var(--font-size-sm)',
      'font-style:italic', 'max-width:400px', 'line-height:1.7',
      'position:relative', 'z-index:1',
    ].join(';');
    q1.textContent = quirk.line1;
    card.appendChild(q1);

    const q2 = document.createElement('div');
    q2.style.cssText = [
      'color:var(--color-text-secondary)', 'font-size:11px',
      'max-width:400px', 'line-height:1.6',
      'position:relative', 'z-index:1',
    ].join(';');
    q2.textContent = quirk.line2;
    card.appendChild(q2);
  }

  // Dismiss button
  const dismissBtn = document.createElement('button');
  dismissBtn.className = 'choice-btn';
  dismissBtn.style.cssText = 'width:200px;margin-top:var(--space-xs);position:relative;z-index:1;';
  dismissBtn.textContent = 'Danke, weiter geht\'s';
  const dismiss = () => {
    backdrop.style.transition = 'opacity 0.4s ease';
    backdrop.style.opacity = '0';
    setTimeout(() => backdrop.remove(), 400);
  };
  dismissBtn.addEventListener('click', dismiss);
  card.appendChild(dismissBtn);

  // Auto-dismiss after 8 seconds if player ignores the button
  setTimeout(dismiss, 8000);

  setTimeout(() => window.KeyboardController?.trapFocus(backdrop), 0);
}

/** Flavour lines shown on the burnout screen, picked randomly. */
const BURNOUT_FLAVOR = [
  'Dein Bürostuhl weint. Die Kaffeemaschine ist abgekühlt. Dieter hat 3 weitere Mails geschickt.',
  'HR hat den Pflichtschulung-Timer pausiert. Aus Mitleid.',
  "Dr. Müller-Brandt sagt, das sei eine 'Optimierungsgelegenheit für dein Workload-Management'.",
  'Kevin übernimmt kurz. Alle haben Angst.',
];

/**
 * Displays the full-screen burnout game-over takeover.
 * Fires the burnout_100 achievement trigger, shows current stats, and
 * offers recovery (burnout → 25, +10 Kompetenz).
 */
function showBurnoutScreen() {
  window.Sound?.play('burnout');
  window.Achievements?.checkTrigger('burnout_100');

  const overlay = createOverlay('burnout-overlay', 'Burnout');

  // Animated gradient background
  overlay.style.background = 'linear-gradient(to bottom, #1a0000, #050000, #1a0000)';
  overlay.style.backgroundSize = '100% 300%';
  overlay.style.animation = 'burnoutBg 3s ease-in-out infinite';
  overlay.style.textAlign = 'center';
  overlay.style.gap = 'var(--space-lg)';

  // 🔥 emoji with pulse
  const emoji = document.createElement('div');
  emoji.textContent = '🔥';
  emoji.style.cssText = [
    'font-size:4rem',
    'line-height:1',
    'animation:burnoutPulse 1.2s ease-in-out infinite',
  ].join(';');
  overlay.appendChild(emoji);

  // Title
  const title = document.createElement('div');
  title.textContent = 'BURNOUT ERREICHT';
  title.style.cssText = [
    'font-size:var(--font-size-xl)',
    'color:var(--color-accent-red)',
    'letter-spacing:4px',
    'font-weight:bold',
  ].join(';');
  overlay.appendChild(title);

  // Subtitle
  const sub = document.createElement('p');
  sub.textContent = 'Du wirst in die Zwangspause geschickt.';
  sub.style.cssText = 'color:var(--color-text-secondary);font-size:var(--font-size-base);margin:0;';
  overlay.appendChild(sub);

  // Random flavour text
  const flavor = document.createElement('p');
  flavor.textContent = BURNOUT_FLAVOR[Math.floor(Math.random() * BURNOUT_FLAVOR.length)];
  flavor.style.cssText = [
    'color:var(--color-text-secondary)',
    'font-size:var(--font-size-sm)',
    'font-style:italic',
    'max-width:520px',
    'line-height:1.7',
    'margin:0',
  ].join(';');
  overlay.appendChild(flavor);

  // Current stats display
  const stats = window.Engine?.GameState?.stats ?? {};
  const STAT_META = [
    { key: 'kompetenz',   label: '🔵 Kompetenz',   color: 'var(--color-accent-cyan)'   },
    { key: 'bullshit',    label: '🟡 Bullshit',     color: 'var(--color-accent-amber)'  },
    { key: 'kundenliebe', label: '🟢 Kundenliebe',  color: 'var(--color-accent-green)'  },
    { key: 'burnout',     label: '🔴 Burnout',      color: 'var(--color-accent-red)'    },
    { key: 'prestige',    label: '🟣 Prestige',     color: 'var(--color-accent-purple)' },
  ];

  const statsBox = document.createElement('div');
  statsBox.style.cssText = [
    'background:rgba(0,0,0,0.4)',
    'border:1px solid rgba(248,81,73,0.3)',
    'border-radius:var(--radius-md)',
    'padding:var(--space-md) var(--space-lg)',
    'display:flex', 'flex-direction:column', 'gap:6px',
    'min-width:240px', 'text-align:left',
  ].join(';');

  STAT_META.forEach(({ key, label, color }) => {
    const val = stats[key] ?? 0;
    const row = document.createElement('div');
    row.style.cssText = [
      'display:flex', 'justify-content:space-between', 'align-items:center',
      'font-size:var(--font-size-sm)', 'gap:var(--space-md)',
    ].join(';');
    row.innerHTML = `
      <span style="color:var(--color-text-secondary);">${label}</span>
      <span style="color:${color};font-weight:bold;">${val}</span>
    `;
    statsBox.appendChild(row);
  });
  overlay.appendChild(statsBox);

  // Recovery button
  const btn = document.createElement('button');
  btn.className = 'choice-btn';
  btn.textContent = '🌴 Erholt zurückkehren';
  btn.style.marginTop = 'var(--space-sm)';
  btn.addEventListener('click', () => {
    if (window.Engine) {
      window.Engine.GameState.stats.burnout = 25;
      window.Engine.GameState.stats.kompetenz = Math.min(
        100,
        (window.Engine.GameState.stats.kompetenz ?? 0) + 10,
      );
    }
    if (window.Stats) Stats.updateStatBars();
    overlay.remove();
  });
  overlay.appendChild(btn);
}

/**
 * Shows a toast notification for an unlocked achievement.
 * Slides in from the bottom-right and auto-dismisses after 4 seconds.
 * @param {{ emoji: string, name: string }} achievement
 */
function showAchievement(achievement) {
  const toast = document.createElement('div');
  toast.style.cssText = [
    'position:fixed', 'bottom:var(--space-lg)', 'right:var(--space-lg)',
    'z-index:1100', 'background-color:var(--color-surface-elevated)',
    'border:1px solid var(--color-accent-purple)',
    'border-radius:var(--radius-md)', 'padding:var(--space-md)',
    'display:flex', 'align-items:center', 'gap:var(--space-sm)',
    'font-family:var(--font-mono)', 'font-size:var(--font-size-sm)',
    'color:var(--color-text-primary)', 'max-width:280px',
    'box-shadow:0 4px 24px rgba(0,0,0,0.5)',
  ].join(';');

  toast.innerHTML = `
    <span style="font-size:var(--font-size-lg);">${achievement.emoji ?? '🏅'}</span>
    <div>
      <div style="color:var(--color-accent-purple);font-size:10px;text-transform:uppercase;letter-spacing:1px;">Achievement</div>
      <div>${achievement.name}</div>
    </div>
  `;

  toast.classList.add('animate-slide-in-right');
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s ease';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

/**
 * Displays the full-screen project completion card.
 * Success variant: green accent, animated XP count-up, stat delta, email CTA.
 * Disaster variant: red flickering border, shame messaging.
 *
 * @param {string} title - Project title shown on the card.
 * @param {'success'|'disaster'|'detour'|string} endingType
 * @param {string} message - Narrative text from the endings JSON.
 * @param {{ xpEarned?: number, statsBefore?: Object }} [opts]
 */
function showProjectComplete(title, endingType, message, opts = {}) {
  const { xpEarned = 0, statsBefore = null } = opts;
  const isSuccess = endingType === 'success';

  const overlay = createOverlay('project-complete-overlay', 'Projekt abgeschlossen');
  overlay.style.backgroundColor = 'rgba(13,17,23,0.97)';
  overlay.style.textAlign = 'center';
  overlay.style.gap = 'var(--space-md)';
  overlay.style.zIndex = '1200';
  overlay.style.overflowY = 'auto';
  overlay.style.padding = 'var(--space-xl) var(--space-lg)';

  if (isSuccess) {
    overlay.style.borderTop = '3px solid var(--color-accent-green)';
  } else {
    overlay.style.borderTop = '3px solid var(--color-accent-red)';
    overlay.style.animation = 'disasterBorderFlicker 1.5s ease-in-out infinite';
  }

  // ── Inner content wrapper ──
  const inner = document.createElement('div');
  inner.style.cssText = [
    'display:flex', 'flex-direction:column', 'align-items:center',
    'gap:var(--space-md)', 'max-width:580px', 'width:100%',
    'animation:fadeInUp 0.4s ease both',
  ].join(';');
  overlay.appendChild(inner);

  // Header label
  const header = document.createElement('div');
  header.style.cssText = [
    'font-size:var(--font-size-sm)',
    'text-transform:uppercase', 'letter-spacing:3px',
    isSuccess ? 'color:var(--color-accent-green)' : 'color:var(--color-accent-red)',
  ].join(';');
  header.textContent = isSuccess ? '✅ PROJEKT ABGESCHLOSSEN' : '💥 TOTALDESASTER';
  inner.appendChild(header);

  // Project title
  const titleEl = document.createElement('div');
  titleEl.style.cssText = 'font-size:var(--font-size-xl);line-height:1.3;';
  titleEl.textContent = title;
  inner.appendChild(titleEl);

  // XP earned (animated count-up)
  if (xpEarned > 0) {
    const xpEl = document.createElement('div');
    xpEl.id = 'project-complete-xp';
    xpEl.style.cssText = [
      'font-size:var(--font-size-lg)',
      isSuccess ? 'color:var(--color-accent-green)' : 'color:var(--color-text-secondary)',
      'font-weight:bold',
      'letter-spacing:1px',
    ].join(';');
    xpEl.textContent = '+0 XP';
    inner.appendChild(xpEl);
    // Delay count-up until overlay animation settles
    setTimeout(() => animateXP(0, xpEarned, 'project-complete-xp'), 400);
  }

  // Separator
  const sep = document.createElement('div');
  sep.style.cssText = 'width:100%;border-top:1px solid var(--color-border);';
  inner.appendChild(sep);

  // Narrative message
  const msgEl = document.createElement('p');
  msgEl.style.cssText = [
    'color:var(--color-text-secondary)',
    'max-width:520px', 'line-height:1.7',
    'font-size:var(--font-size-base)', 'margin:0',
  ].join(';');
  msgEl.textContent = message;
  inner.appendChild(msgEl);

  // Disaster-only: lernkurve text
  if (!isSuccess) {
    const learn = document.createElement('p');
    learn.style.cssText = [
      'color:var(--color-text-secondary)',
      'font-size:var(--font-size-sm)',
      'font-style:italic',
      'margin:0', 'max-width:420px',
    ].join(';');
    learn.textContent = 'Immerhin: du weißt jetzt, was du beim nächsten Mal nicht tun solltest.';
    inner.appendChild(learn);
  }

  // Stat delta (if we have before snapshot)
  if (statsBefore && window.Engine?.GameState?.stats) {
    const delta = buildStatDelta(statsBefore, window.Engine.GameState.stats);
    if (delta.children.length > 0) {
      const deltaLabel = document.createElement('div');
      deltaLabel.style.cssText = [
        'font-size:10px', 'color:var(--color-text-secondary)',
        'text-transform:uppercase', 'letter-spacing:2px',
      ].join(';');
      deltaLabel.textContent = 'Statistik-Entwicklung';
      inner.appendChild(deltaLabel);
      inner.appendChild(delta);
    }
  }

  // CTA button
  const btn = document.createElement('button');
  btn.className = 'choice-btn';
  btn.style.cssText = 'width:220px;margin:var(--space-sm) auto 0;';
  btn.textContent = isSuccess ? '📬 Posteingang öffnen' : '😔 Weiter (in Schande)';
  btn.addEventListener('click', () => {
    overlay.remove();
    if (typeof window.Engine?.startEmailPhase === 'function') {
      window.Engine.startEmailPhase();
    }
  });
  inner.appendChild(btn);
}

// ── Public API ────────────────────────────────────────────

window.Renderer = {
  renderScene,
  typeText,
  renderChoices,
  showFeedback,
  showLevelUp,
  showBurnoutScreen,
  showAchievement,
  showProjectComplete,
  animateXP,
};
