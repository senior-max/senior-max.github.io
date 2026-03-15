/**
 * npcs.js
 * NPC data loading, display, and dialog system for "License To Bill".
 * Populates window.NPC_DATA and manages the #npc-display HUD element.
 * Depends on: engine.js (window.Engine)
 */

// ── NPC accent colors ─────────────────────────────────────

/** @type {Object.<string, string>} CSS color values keyed by NPC id. */
const NPC_ACCENT_COLORS = {
  dieter:     'var(--color-accent-amber)',
  kevin:      'var(--color-accent-cyan)',
  dr_mueller: 'var(--color-accent-purple)',
  sandra:     'var(--color-accent-green)',
  ms_auditor: 'var(--color-accent-red)',
  hal:        '#6e7681',
  phantom:    '#f0f6fc',
};

// ── Data loading ──────────────────────────────────────────

/**
 * Fetches /data/npcs.json, stores every NPC in window.NPC_DATA keyed by id,
 * and returns the resulting map.
 * Safe to call multiple times — skips the fetch if data is already loaded.
 * @returns {Promise<Object.<string, Object>>}
 */
async function loadNPCs() {
  if (window.NPC_DATA && Object.keys(window.NPC_DATA).length > 0) {
    return window.NPC_DATA;
  }
  try {
    const res = await fetch('/data/npcs.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const list = await res.json();
    window.NPC_DATA = Object.fromEntries(list.map(npc => [npc.id, npc]));
  } catch (e) {
    console.warn('[NPCs] Failed to load npcs.json:', e);
    window.NPC_DATA = {};
  }
  return window.NPC_DATA;
}

// ── Accessors ─────────────────────────────────────────────

/**
 * Returns the NPC object for the given id, or null if not found.
 * @param {string} id
 * @returns {Object|null}
 */
function getNPC(id) {
  return window.NPC_DATA?.[id] ?? null;
}

/**
 * Returns the NPC's catchphrase, or a random dialog line with equal probability.
 * Falls back to an empty string if the NPC is unknown.
 * @param {string} npcId
 * @returns {string}
 */
function getRandomCatchphrase(npcId) {
  const npc = getNPC(npcId);
  if (!npc) return '';

  const pool = npc.dialogLines?.length ? npc.dialogLines : [npc.catchphrase];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── NPC display ───────────────────────────────────────────

/**
 * Clears the #npc-display element and resets its styling.
 * @param {HTMLElement} el
 */
function clearNPCDisplay(el) {
  el.textContent = '';
  el.style.cssText = '';
  el.removeAttribute('data-npc');
}

/**
 * Builds the inner HTML for the NPC display card.
 * @param {Object} npc
 * @param {string} accentColor
 * @returns {string}
 */
function buildNPCDisplayHTML(npc, accentColor, npcId) {
  const isHalGlitch = npcId === 'hal' && Math.random() < 0.05;
  const titleText   = isHalGlitch ? "I'M AFRAID I CAN'T PRINT THAT" : npc.title;
  const titleStyle  = isHalGlitch
    ? 'color:var(--color-accent-red);font-size:9px;text-transform:uppercase;letter-spacing:1px;animation:flickerLoop 0.4s infinite;'
    : 'color:var(--color-text-secondary);font-size:10px;text-transform:uppercase;letter-spacing:1px;';
  return `
    <span style="font-size:2rem;line-height:1;" aria-hidden="true">${npc.emoji}</span>
    <span style="display:flex;flex-direction:column;gap:1px;">
      <span style="color:${accentColor};font-size:var(--font-size-sm);">${npc.name}</span>
      <span style="${titleStyle}">${titleText}</span>
    </span>
  `;
}

/**
 * Updates #npc-display with the given NPC's emoji, name, and title.
 * Applies an NPC-specific accent color and a fadeInUp entrance animation.
 * Clears the display if npcId is null or the NPC is not found.
 * @param {string|null} npcId
 */
function renderNPCDisplay(npcId) {
  const el = document.getElementById('npc-display');
  if (!el) return;

  if (!npcId) {
    clearNPCDisplay(el);
    return;
  }

  const npc = getNPC(npcId);
  if (!npc) {
    clearNPCDisplay(el);
    return;
  }

  const accentColor = NPC_ACCENT_COLORS[npcId] ?? 'var(--color-text-primary)';

  el.setAttribute('data-npc', npcId);
  el.style.cssText = [
    'display:flex',
    'align-items:center',
    'gap:var(--space-sm)',
    'animation:fadeInUp 0.3s ease both',
    `border-left:3px solid ${accentColor}`,
    'padding-left:var(--space-sm)',
  ].join(';');

  el.innerHTML = buildNPCDisplayHTML(npc, accentColor, npcId);
}

/**
 * Renders a one-off NPC defined inline in a scene (no registry lookup needed).
 * Useful for scene-specific characters like CEOs or guest speakers.
 * @param {{ emoji: string, name: string, title: string, accentColor?: string }} npcData
 */
function renderNPCInline(npcData) {
  const el = document.getElementById('npc-display');
  if (!el || !npcData) return;

  const accentColor = npcData.accentColor ?? 'var(--color-text-primary)';

  el.setAttribute('data-npc', 'inline');
  el.style.cssText = [
    'display:flex',
    'align-items:center',
    'gap:var(--space-sm)',
    'animation:fadeInUp 0.3s ease both',
    `border-left:3px solid ${accentColor}`,
    'padding-left:var(--space-sm)',
  ].join(';');

  el.innerHTML = `
    <span style="font-size:2rem;line-height:1;" aria-hidden="true">${npcData.emoji ?? '👤'}</span>
    <span style="display:flex;flex-direction:column;gap:1px;">
      <span style="color:${accentColor};font-size:var(--font-size-sm);">${npcData.name ?? ''}</span>
      <span style="color:var(--color-text-secondary);font-size:10px;text-transform:uppercase;letter-spacing:1px;">${npcData.title ?? ''}</span>
    </span>
  `;
}

// ── Passive stat modifiers ────────────────────────────────

/**
 * Tracks which NPCs have already had their modifiers applied this scene
 * to prevent double-application on re-renders.
 * @type {string|null}
 */
let lastAppliedNPCId = null;

/**
 * Applies the NPC's statModifiers to GameState once per unique NPC appearance.
 * Resets when a different NPC (or no NPC) appears.
 * Call this from renderer.renderScene() when scene.npc changes.
 * @param {string|null} npcId
 */
function applyNPCModifiers(npcId) {
  if (npcId === lastAppliedNPCId) return;
  lastAppliedNPCId = npcId;

  if (!npcId) return;

  const npc = getNPC(npcId);
  if (!npc || !npc.statModifiers || !Object.keys(npc.statModifiers).length) return;

  if (window.Engine && typeof window.Engine.applyEffects === 'function') {
    window.Engine.applyEffects(npc.statModifiers);
  }
}

/**
 * Resets the NPC modifier guard. Call at the start of a new project.
 */
function resetNPCModifierGuard() {
  lastAppliedNPCId = null;
}

// ── Public API ────────────────────────────────────────────

window.NPCs = {
  loadNPCs,
  getNPC,
  getRandomCatchphrase,
  renderNPCDisplay,
  renderNPCInline,
  applyNPCModifiers,
  resetNPCModifierGuard,
  NPC_ACCENT_COLORS,
};
