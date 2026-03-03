
const UI = (() => {

  let selectedMode  = 'single';
  let playerCount   = 2;
  let rolling       = false;

  // ── Screens ──
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  function selectMode(mode) {
    selectedMode = mode;
    if (mode === 'single') {
      playerCount = 2;
      document.getElementById('countRow').style.display  = 'none';
      document.getElementById('setupTitle').textContent  = 'SINGLE PLAYER SETUP';
    } else {
      document.getElementById('countRow').style.display  = 'flex';
      document.getElementById('setupTitle').textContent  = 'MULTIPLAYER SETUP';
    }
    renderSetupInputs();
    showScreen('screenSetup');
  }

  function goBack() { showScreen('screenMode'); }

  function changeCount(delta) {
    playerCount = Math.min(4, Math.max(2, playerCount + delta));
    document.getElementById('countDisplay').textContent = playerCount;
    renderSetupInputs();
  }

  // ── Setup inputs ──
  function renderSetupInputs() {
    const list  = document.getElementById('playersList');
    const count = selectedMode === 'single' ? 2 : playerCount;
    list.innerHTML = '';

    for (let i = 0; i < count; i++) {
      const cfg    = CONFIG.PLAYER_CONFIGS[i];
      const isComp = selectedMode === 'single' && i === count - 1;
      const row    = document.createElement('div');
      row.className = 'player-input-row';
      row.innerHTML = `
        <span class="p-token-preview">${cfg.token}</span>
        <input class="p-name-input" id="pname${i}"
          placeholder="${isComp ? 'Computer' : 'Player ' + (i+1)}"
          value="${isComp ? 'Computer' : 'Player ' + (i+1)}"
          maxlength="12"
          ${isComp ? 'readonly style="opacity:0.5"' : ''}/>
        <div class="p-color-dot" style="background:${cfg.color}"></div>
      `;
      list.appendChild(row);
    }
  }

  // ── Start game ──
  function startGame() {
    const count = selectedMode === 'single' ? 2 : playerCount;
    const names = [];
    for (let i = 0; i < count; i++) {
      const inp = document.getElementById(`pname${i}`);
      names.push(inp.value.trim() || `Player ${i+1}`);
    }

    Game.init(names, selectedMode);
    Board.buildGrid();
    Board.drawSVG();
    Board.initTokens(Game.getPlayers());
    renderPlayersPanel();
    renderTokenLegend();
    renderLog();
    updateTurnUI();
    showScreen('screenGame');
  }

  // ── Roll handler ──
  function handleRoll() {
    if (rolling) return;

    const cur = Game.currentPlayer();

    // Skip CPU — shouldn't happen but safety check
    if (cur.isComputer) return;

    rolling = true;
    document.getElementById('rollBtn').disabled = true;

    const result = Game.roll();
    if (!result) { rolling = false; return; }

    // Step 1 — animate dice + move to intermediate square
    const intermediate = result.result.via || result.result.pos;
    animateDice(result.diceVal, () => {
      // Move to landed square first
      const players = Game.getPlayers();
      const player  = result.player;
      const tempPos = (player.position !== result.result.pos && result.result.via)
                      ? result.result.via
                      : result.result.pos;

      // Temporarily show at via square then jump
      Board.moveToken(player.id, intermediate === 0 ? result.result.pos : intermediate, players);

      setTimeout(() => {
        // Final position
        Board.moveToken(player.id, result.result.pos, players);
        renderPlayersPanel();
        renderLog();

        if (Game.isOver()) {
          setTimeout(() => showWin(player), 800);
          rolling = false;
          return;
        }

        updateTurnUI();
        rolling = false;

        // If next player is CPU, auto-roll after delay
        if (Game.currentPlayer().isComputer) {
          setTimeout(cpuTurn, 1000);
        }
      }, 500);
    });
  }

  // ── CPU turn ──
  function cpuTurn() {
    if (Game.isOver()) return;

    rolling = true;
    const result = Game.roll();
    if (!result) { rolling = false; return; }

    animateDice(result.diceVal, () => {
      const players     = Game.getPlayers();
      const intermediate = result.result.via || result.result.pos;
      Board.moveToken(result.player.id, intermediate, players);

      setTimeout(() => {
        Board.moveToken(result.player.id, result.result.pos, players);
        renderPlayersPanel();
        renderLog();

        if (Game.isOver()) {
          setTimeout(() => showWin(result.player), 800);
          rolling = false;
          return;
        }

        updateTurnUI();
        rolling = false;
      }, 500);
    });
  }

  // ── Dice animation ──
  function animateDice(finalVal, cb) {
    const face = document.getElementById('diceFace');
    face.classList.add('rolling');
    let count = 0;
    const iv  = setInterval(() => {
      face.textContent = CONFIG.FACES[Math.floor(Math.random() * 6) + 1];
      if (++count > 10) {
        clearInterval(iv);
        face.classList.remove('rolling');
        face.textContent = CONFIG.FACES[finalVal];
        setTimeout(cb, 180);
      }
    }, 65);
  }

  // ── Render helpers ──
  function renderPlayersPanel() {
    const panel   = document.getElementById('playersPanel');
    const players = Game.getPlayers();
    const cur     = Game.currentPlayer();
    panel.innerHTML = '';

    players.forEach(p => {
      const isActive = p.id === cur.id && !Game.isOver();
      const row      = document.createElement('div');
      row.className  = 'player-row' + (isActive ? ' active' : '');
      row.innerHTML  = `
        <div class="p-avatar" style="background:${p.bg};border-color:${p.color}">${p.token}</div>
        <div style="flex:1;min-width:0">
          <div class="p-name">${p.name.toUpperCase()}</div>
          <div class="p-pos">pos: <b>${p.position || 'start'}</b> | turns: ${p.turns}</div>
        </div>
        ${isActive ? '<span class="p-badge">TURN!</span>' : ''}
      `;
      panel.appendChild(row);
    });
  }

  function renderTokenLegend() {
    const leg = document.getElementById('tokenLegend');
    leg.innerHTML = '';
    Game.getPlayers().forEach(p => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `<span>${p.token}</span>&nbsp;<span style="color:${p.color};font-weight:700">${p.name}</span>`;
      leg.appendChild(item);
    });
  }

  function renderLog() {
    const logEl = document.getElementById('gameLog');
    logEl.innerHTML = '';
    Game.getLog().forEach(entry => {
      const item       = document.createElement('div');
      item.className   = `log-item ${entry.type || ''}`;
      item.textContent = entry.msg;
      logEl.appendChild(item);
    });
  }

  function updateTurnUI() {
    if (Game.isOver()) return;
    const cur = Game.currentPlayer();
    document.getElementById('turnLabel').textContent =
      `${cur.token} ${cur.name.toUpperCase()}'S TURN`;
    document.getElementById('rollBtn').disabled = cur.isComputer;
    document.getElementById('rollBtn').textContent =
      cur.isComputer ? 'CPU ROLLING...' : 'ROLL DICE ✦';
  }

  // ── Win ──
  function showWin(player) {
    document.getElementById('winEmoji').textContent = player.token;
    document.getElementById('winTitle').textContent = `${player.name.toUpperCase()} WINS!`;
    document.getElementById('winSub').textContent   = `🎀 Reached 100 in ${Game.getTurnNo()} turns!`;
    document.getElementById('winOverlay').classList.add('show');
    confetti();
  }

  function playAgain() {
    document.getElementById('winOverlay').classList.remove('show');
    showScreen('screenMode');
  }

  // ── Confetti ──
  function confetti() {
    const cols = ['#f9a8d4','#c4b5fd','#86efac','#fdba74','#f87171','#fcd34d'];
    for (let i = 0; i < 70; i++) {
      setTimeout(() => {
        const el = document.createElement('div');
        el.className = 'cp';
        el.style.cssText = `
          left:${Math.random()*100}vw; top:-10px;
          background:${cols[~~(Math.random()*cols.length)]};
          width:${6+Math.random()*8}px; height:${6+Math.random()*8}px;
          border-radius:${Math.random()>.5?'50%':'3px'};
          animation-duration:${1.5+Math.random()*2}s;
          animation-delay:${Math.random()*.5}s;
        `;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3000);
      }, i * 35);
    }
  }

  return {
    selectMode, goBack, changeCount, startGame,
    handleRoll, playAgain, renderSetupInputs,
  };

})();