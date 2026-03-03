
const Game = (() => {

  //  State 
  let players      = [];
  let currentIdx   = 0;
  let turnNo       = 0;
  let gameOver     = false;
  let mode         = 'single';
  let log          = [];

  // Player factory 
  function createPlayer(name, index, isComputer = false) {
    const cfg = CONFIG.PLAYER_CONFIGS[index];
    return {
      id        : index,
      name      : name,
      token     : cfg.token,
      color     : cfg.color,
      bg        : cfg.bg,
      position  : 0,
      turns     : 0,
      isComputer: isComputer,
    };
  }

  //  Init 
  function init(names, selectedMode) {
    mode       = selectedMode;
    gameOver   = false;
    currentIdx = 0;
    turnNo     = 0;
    log        = [];

    players = names.map((name, i) => {
      const isComp = (mode === 'single' && i === names.length - 1);
      return createPlayer(name, i, isComp);
    });

    addLog(`🎲 Game started! ${players.map(p=>p.name).join(' vs ')}`, 'info');
  }

  //  Current player 
  function currentPlayer() {
    return players[currentIdx];
  }

  // Roll & move
  function roll() {
    if (gameOver) return null;
    const player = currentPlayer();
    const diceVal = Math.floor(Math.random() * 6) + 1;
    player.turns++;
    turnNo++;

    const result = Board.applyMove(player.position, diceVal);
    const name   = player.name;

    // Log the event
    if (result.event === 'overshoot') {
      addLog(`${player.token} ${name} rolled ${diceVal} — overshoots! Stay ✋`, 'info');
    } else if (result.event === 'snake') {
      addLog(`🐍 ${name} hit snake at ${result.via}! Slides to ${result.pos}`, 'snake');
    } else if (result.event === 'ladder') {
      addLog(`🪜 ${name} hit ladder at ${result.via}! Climbs to ${result.pos}`, 'ladder');
    } else if (result.event === 'win') {
      addLog(`🏆 ${name} wins in ${turnNo} turns!`, 'win');
      gameOver = true;
    } else {
      addLog(`${player.token} ${name} rolled ${diceVal} → ${result.pos}`, 'normal');
    }

    // Update position
    player.position = result.pos;

    // Advance turn
    if (!gameOver) {
      currentIdx = (currentIdx + 1) % players.length;
    }

    return { player, diceVal, result };
  }

  // Log
  function addLog(msg, type) {
    log.unshift({ msg, type });
    if (log.length > 25) log.pop();
  }

  function getLog()     { return log; }
  function getPlayers() { return players; }
  function isOver()     { return gameOver; }
  function getMode()    { return mode; }
  function getTurnNo()  { return turnNo; }

  return { init, roll, currentPlayer, getPlayers, isOver, getLog, getMode, getTurnNo };

})();