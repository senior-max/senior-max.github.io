/**
 * framework_generator.js
 * Satirical consulting framework generator for "License To Bill".
 * Produces randomized but believable enterprise methodology names.
 * Accessible from main menu and as in-game easter egg.
 */

window.FrameworkGenerator = (function () {
  let words = {};
  let history = [];
  let generateCount = 0;
  let openContext = null; // { fromBoardScene: boolean } when opened from b_03

  function getFrameworksSentCount() {
    return window.Engine?.GameState?.frameworksSentToMueller ?? 0;
  }
  function incrementFrameworksSent() {
    if (window.Engine?.GameState) {
      window.Engine.GameState.frameworksSentToMueller = (window.Engine.GameState.frameworksSentToMueller ?? 0) + 1;
    }
  }

  // ── Data loading ─────────────────────────────────────────

  async function loadWords() {
    if (Object.keys(words).length > 0) return words;
    try {
      const res = await fetch('/data/framework_words.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      words = await res.json();
      return words;
    } catch (e) {
      console.warn('[FrameworkGenerator] Failed to load framework_words.json:', e);
      words = {};
      return words;
    }
  }

  function pick(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ── Name generation ──────────────────────────────────────

  function generateName() {
    const prefixes = words.prefixes ?? [];
    const connectors = words.connectors ?? [];
    const suffixes = words.suffixes ?? [];
    const suffix = pick(suffixes) || 'FRAMEWORK™';

    const r = Math.random();
    if (r < 0.60) {
      const p = pick(prefixes);
      const c = pick(connectors);
      return `${p}-${c} ${suffix}`;
    }
    if (r < 0.85) {
      const p = pick(prefixes);
      const c1 = pick(connectors);
      let c2 = pick(connectors);
      while (c2 === c1 && connectors.length > 1) c2 = pick(connectors);
      return `${p}-${c1}-${c2} ${suffix}`;
    }
    const c = pick(connectors);
    return `${c} ${suffix}`;
  }

  // ── Description generation ────────────────────────────────

  function generateDescription() {
    const templates = words.templates ?? [];
    const t = pick(templates) || 'Eine {adjective} Methodik für {domain}.';
    return t
      .replace('{adjective}', pick(words.adjectives) ?? 'agile')
      .replace('{phase_count}', String(pick(words.phase_counts) ?? 5))
      .replace('{domain}', pick(words.domains) ?? 'Enterprise-Strukturen')
      .replace('{goal}', pick(words.goals) ?? 'maximale Wertschöpfung');
  }

  // ── Phases generation ────────────────────────────────────

  function generatePhases(count) {
    const phaseNames = words.phase_names ?? ['Assess', 'Discover', 'Align'];
    const deliverables = words.deliverables ?? ['ein Deliverable'];
    const used = new Set();
    const phases = [];

    for (let i = 0; i < count; i++) {
      let name = pick(phaseNames);
      let attempts = 0;
      while (used.has(name) && attempts < 50) {
        name = pick(phaseNames);
        attempts++;
      }
      used.add(name);
      phases.push({
        number: i + 1,
        name,
        duration: `[${2 + Math.floor(Math.random() * 7)}] Wochen`,
        deliverable: pick(deliverables),
      });
    }
    return phases;
  }

  function generateDisclaimer() {
    return pick(words.disclaimers) ?? 'Ergebnisse können variieren.';
  }

  // ── Easter eggs ───────────────────────────────────────────

  function checkKevinEasterEgg(framework) {
    const name = (framework.name || '').toUpperCase();
    if (name.includes('AGILE') && name.includes('MATRIX')) {
      framework.phases.push({
        number: '+1',
        name: "Kevin's Idee",
        duration: 'unbegrenzt',
        deliverable: 'Excel-Tabelle mit Fehlern (v7_FINAL_NEU.xlsx)',
      });
      if (window.KeyboardController?.showToast) {
        window.KeyboardController.showToast("Kevin hat spontan eine Phase ergänzt.", 'var(--color-accent-amber)');
      }
    }
  }

  function check100EasterEgg(framework) {
    if (generateCount === 100) {
      framework.name = 'DAS ULTIMATIVE FRAMEWORK™';
      framework.description = 'Nach 100 generierten Frameworks haben wir das perfekte Modell gefunden. Es ist identisch mit Framework #1.';
      window.Achievements?.checkTrigger?.('framework_100');
    }
  }

  function checkDieterEasterEgg(framework) {
    if (Math.random() < 0.01) {
      framework.name = 'DIETER-EXCELLENCE FRAMEWORK™';
      framework.description = 'Dieter hat kurz nachgefragt ob es Neuigkeiten gibt. Daraus ist dieses Framework entstanden.';
      const dieterDeliverable = 'Excel-Tabelle (Dieter schickt sie noch)';
      framework.phases.forEach((p) => { p.deliverable = dieterDeliverable; });
      window.Achievements?.checkTrigger?.('dieter_framework');
    }
  }

  // ── Main generate ────────────────────────────────────────

  function generate() {
    generateCount++;
    let framework;

    if (generateCount === 100) {
      framework = {
        name: 'DAS ULTIMATIVE FRAMEWORK™',
        description: 'Nach 100 generierten Frameworks haben wir das perfekte Modell gefunden. Es ist identisch mit Framework #1.',
        phases: generatePhases(pick(words.phase_counts) ?? 5),
        disclaimer: generateDisclaimer(),
        generatedAt: new Date().toLocaleTimeString('de-DE'),
        id: generateCount,
      };
      window.Achievements?.checkTrigger?.('framework_100');
    } else if (Math.random() < 0.01) {
      const dieterDeliverable = 'Excel-Tabelle (Dieter schickt sie noch)';
      const phases = generatePhases(pick(words.phase_counts) ?? 5);
      phases.forEach((p) => { p.deliverable = dieterDeliverable; });
      framework = {
        name: 'DIETER-EXCELLENCE FRAMEWORK™',
        description: 'Dieter hat kurz nachgefragt ob es Neuigkeiten gibt. Daraus ist dieses Framework entstanden.',
        phases,
        disclaimer: generateDisclaimer(),
        generatedAt: new Date().toLocaleTimeString('de-DE'),
        id: generateCount,
      };
      window.Achievements?.checkTrigger?.('dieter_framework');
    } else {
      const phaseCount = pick(words.phase_counts) ?? 5;
      framework = {
        name: generateName(),
        description: generateDescription(),
        phases: generatePhases(phaseCount),
        disclaimer: generateDisclaimer(),
        generatedAt: new Date().toLocaleTimeString('de-DE'),
        id: generateCount,
      };
      checkKevinEasterEgg(framework);
      check100EasterEgg(framework);
    }

    history.unshift(framework);
    if (history.length > 5) history.pop();
    return framework;
  }

  // ── Müller-Brandt send action ────────────────────────────

  function sendToMuellerBrandt(framework) {
    document.getElementById('framework-overlay')?.remove();

    if (openContext?.fromBoardScene && window.Engine?.setFlag) {
      window.Engine.setFlag('framework_fuer_board', true);
    }
    openContext = null;

    setTimeout(() => {
      const msg = '📧 Müller-Brandt antwortet in 3 Minuten.';
      if (window.Renderer?.showToast) window.Renderer.showToast(msg, 3000);
      else window.KeyboardController?.showToast?.(msg, 'var(--color-accent-amber)');
    }, 2000);

    setTimeout(() => {
      const msg = '💬 Müller-Brandt: "Sehr interessant. Können wir das in den Q2-Review einbauen? Schick mir eine Executive Summary."';
      if (window.Renderer?.showToast) window.Renderer.showToast(msg, 6000);
      else window.KeyboardController?.showToast?.(msg, 'var(--color-accent-amber)');
      if (window.Engine?.applyEffects) {
        window.Engine.applyEffects({ prestige: 3, bullshit: 5 });
      }
      if (window.Stats?.updateStatBars) window.Stats.updateStatBars();
      window.Achievements?.checkTrigger?.('framework_sent');
      incrementFrameworksSent();
      if (getFrameworksSentCount() >= 3) {
        window.Achievements?.checkTrigger?.('framework_addict');
      }
      if (window.Storage?.saveGame && window.Engine?.GameState) {
        window.Storage.saveGame(window.Engine.GameState);
      }
    }, 180000);
  }

  // ── UI: renderModal ──────────────────────────────────────

  function renderModal(framework, opts = {}) {
    document.getElementById('framework-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'framework-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Framework Generator');
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:2500',
      'background:rgba(0,0,0,0.8)',
      'display:flex', 'align-items:center', 'justify-content:center',
      'padding:var(--space-lg)',
      'overflow-y:auto',
    ].join(';');

    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    const cardWrap = document.createElement('div');
    cardWrap.style.cssText = [
      'display:flex',
      'gap:var(--space-lg)',
      'align-items:flex-start',
      'justify-content:center',
      'width:100%',
      'max-width:720px',
    ].join(';');

    const card = document.createElement('div');
    card.style.cssText = [
      'background:#fff',
      'border-radius:var(--radius-lg)',
      'max-width:560px',
      'width:100%',
      'box-shadow:0 20px 60px rgba(0,0,0,0.4)',
      'overflow:hidden',
      'font-family:var(--font-sans, -apple-system, BlinkMacSystemFont, sans-serif)',
    ].join(';');

    const headerBar = document.createElement('div');
    headerBar.style.cssText = [
      'background:#1a1a2e',
      'padding:10px 20px',
      'display:flex',
      'justify-content:space-between',
      'align-items:center',
      'font-size:12px',
      'color:rgba(255,255,255,0.75)',
      'letter-spacing:0.5px',
    ].join(';');
    headerBar.innerHTML = `
      <span>GREYSUIT & PARTNER | METHODOLOGY SERVICES</span>
      <span>Generiert: ${framework.generatedAt}</span>
    `;
    card.appendChild(headerBar);

    const nameEl = document.createElement('div');
    nameEl.style.cssText = [
      'text-align:center',
      'padding:var(--space-xl) var(--space-lg) 0',
      'font-size:clamp(1.5rem, 4vw, 2.2rem)',
      'font-weight:700',
      'color:#0d1117',
      'letter-spacing:0.05em',
      'text-transform:uppercase',
      'line-height:1.3',
    ].join(';');
    nameEl.textContent = framework.name;
    card.appendChild(nameEl);

    const goldLine = document.createElement('div');
    goldLine.style.cssText = 'width:120px;height:2px;background:#C9A84C;margin:12px auto 0;';
    card.appendChild(goldLine);

    const descEl = document.createElement('div');
    descEl.style.cssText = [
      'font-style:italic',
      'text-align:center',
      'color:#24292f',
      'padding:20px 32px',
      'font-size:1.05rem',
      'line-height:1.6',
    ].join(';');
    descEl.textContent = framework.description;
    card.appendChild(descEl);

    const phaseHeader = document.createElement('div');
    phaseHeader.style.cssText = [
      'font-size:13px',
      'font-weight:600',
      'text-transform:uppercase',
      'letter-spacing:1.5px',
      'color:#0d1117',
      'padding:20px 24px 12px',
    ].join(';');
    phaseHeader.textContent = 'PHASENMODELL';
    card.appendChild(phaseHeader);

    const tableWrap = document.createElement('div');
    tableWrap.style.cssText = 'overflow-x:auto;';
    const table = document.createElement('table');
    table.style.cssText = [
      'width:100%',
      'border-collapse:collapse',
      'font-size:15px',
      'line-height:1.5',
    ].join(';');
    table.innerHTML = `
      <thead>
        <tr style="background:#d0d7de;">
          <th style="padding:14px 16px;text-align:left;border-bottom:2px solid #8c959f;font-weight:600;color:#0d1117;">Nr.</th>
          <th style="padding:14px 16px;text-align:left;border-bottom:2px solid #8c959f;font-weight:600;color:#0d1117;">Phase</th>
          <th style="padding:14px 16px;text-align:left;border-bottom:2px solid #8c959f;font-weight:600;color:#0d1117;">Dauer</th>
          <th style="padding:14px 16px;text-align:left;border-bottom:2px solid #8c959f;font-weight:600;color:#0d1117;">Deliverable</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');
    framework.phases.forEach((p, i) => {
      const tr = document.createElement('tr');
      tr.style.cssText = [
        `background:${i % 2 === 0 ? '#fff' : '#f8f8f8'}`,
        'animation:fadeInUp 0.3s ease both',
        `animation-delay:${i * 100}ms`,
      ].join(';');
      tr.innerHTML = `
        <td style="padding:14px 16px;border-bottom:1px solid #d0d7de;color:#0d1117;">${p.number}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #d0d7de;color:#0d1117;font-weight:500;">${p.name}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #d0d7de;color:#0d1117;">${p.duration}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #d0d7de;color:#0d1117;">${p.deliverable}</td>
      `;
      tbody.appendChild(tr);
    });
    tableWrap.appendChild(table);
    card.appendChild(tableWrap);

    const disclaimerBox = document.createElement('div');
    disclaimerBox.style.cssText = [
      'background:#d0d7de',
      'border-radius:var(--radius-md)',
      'padding:16px 20px',
      'margin:20px 24px',
      'font-size:14px',
      'font-style:italic',
      'color:#0d1117',
      'line-height:1.5',
    ].join(';');
    disclaimerBox.textContent = '⚠️ Hinweis: ' + framework.disclaimer;
    card.appendChild(disclaimerBox);

    const btnWrap = document.createElement('div');
    btnWrap.style.cssText = [
      'display:flex',
      'gap:var(--space-sm)',
      'flex-wrap:wrap',
      'justify-content:center',
      'padding:0 24px 24px',
    ].join(';');

    const btnNew = document.createElement('button');
    btnNew.className = 'choice-btn';
    btnNew.textContent = '🔄 Neues Framework';
    btnNew.addEventListener('click', () => {
      const f = generate();
      renderModal(f, opts);
    });

    const btnSend = document.createElement('button');
    btnSend.className = 'choice-btn';
    btnSend.textContent = '📧 An Müller-Brandt';
    btnSend.style.background = 'var(--color-surface-elevated)';
    btnSend.addEventListener('click', () => sendToMuellerBrandt(framework));

    const btnClose = document.createElement('button');
    btnClose.className = 'choice-btn';
    btnClose.textContent = '✕ Schließen';
    btnClose.style.background = 'var(--color-surface-elevated);color:var(--color-text-secondary)';
    btnClose.addEventListener('click', () => {
      overlay.remove();
      openContext = null;
    });

    btnWrap.appendChild(btnNew);
    btnWrap.appendChild(btnSend);
    btnWrap.appendChild(btnClose);
    card.appendChild(btnWrap);

    cardWrap.appendChild(card);

    if (!isMobile && history.length > 1) {
      const sidebar = document.createElement('div');
      sidebar.style.cssText = [
        'min-width:180px',
        'background:rgba(255,255,255,0.08)',
        'border-radius:var(--radius-md)',
        'padding:var(--space-md)',
        'font-size:14px',
        'line-height:1.4',
      ].join(';');
      sidebar.innerHTML = '<div style="color:rgba(255,255,255,0.7);margin-bottom:10px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Zuletzt generiert</div>';
      history.forEach((h, i) => {
        const entry = document.createElement('div');
        entry.style.cssText = [
          'padding:8px 0',
          'cursor:pointer',
          'color:rgba(255,255,255,0.85)',
          'border-bottom:1px solid rgba(255,255,255,0.15)',
          i === 0 ? 'font-weight:600;color:var(--color-accent-amber)' : '',
        ].join(';');
        entry.textContent = (h.name || '').slice(0, 28) + (h.name?.length > 28 ? '…' : '');
        entry.addEventListener('click', () => renderModal(h, opts));
        sidebar.appendChild(entry);
      });
      cardWrap.appendChild(sidebar);
    }

    overlay.appendChild(cardWrap);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
        openContext = null;
      }
    });
    document.getElementById('app').appendChild(overlay);
    setTimeout(() => window.KeyboardController?.trapFocus?.(overlay), 0);
  }

  function reset() {
    history = [];
    generateCount = 0;
    openContext = null;
  }

  // ── Open entry point ─────────────────────────────────────

  async function open(ctx = {}) {
    openContext = ctx;
    await loadWords();
    const framework = generate();
    renderModal(framework, ctx);
  }

  return {
    words: () => words,
    history: () => [...history],
    generateCount: () => generateCount,
    reset,
    loadWords,
    pick,
    generateName,
    generateDescription,
    generatePhases,
    generateDisclaimer,
    generate,
    renderModal,
    open,
    sendToMuellerBrandt,
  };
})();
