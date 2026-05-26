let G = null;

function createInitialState() {
  return {
    screen: 'character-select',
    selectedClass: null,
    level: 1,
    player: null,
    enemies: [],
    items: [],
    walls: [],
    dungeon: null,
    explored: null,
    camera: { x: 0, y: 0 },
    paused: false,
    gameOver: false,
    winner: null,
    log: [],
    damageNumbers: [],
    particles: [],
    bossPhase: 0,
    bossSummonTimer: 0,
  };
}

function transitionTo(screenName) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('screen-' + screenName);
  if (target) target.classList.add('active');
  G.screen = screenName;
}

function startGame(classKey) {
  G = createInitialState();
  G.selectedClass = classKey;
  G.player = createPlayer(classKey);
  descendLevel(1);
  transitionTo('game');
}

function descendLevel(level) {
  if (level > 20) {
    G.gameOver = true;
    G.winner = 'victory';
    transitionTo('game-over');
    return;
  }
  G.level = level;
  G.dungeon = generateDungeon(level);
  G.enemies = G.dungeon.enemies;
  G.items = G.dungeon.items;
  G.walls = G.dungeon.walls || [];
  G.explored = G.dungeon.explored;
  G.player.x = G.dungeon.playerStart.x;
  G.player.y = G.dungeon.playerStart.y;
  G.player.targetX = G.player.x;
  G.player.targetY = G.player.y;
  G.camera = { x: G.player.x, y: G.player.y };
  G.damageNumbers = [];
  G.particles = [];
  G.bossPhase = 0;
  G.bossSummonTimer = 0;
}

function addLog(msg) {
  G.log.unshift(msg);
  if (G.log.length > 50) G.log.pop();
}

function addDamageNumber(x, y, value, color) {
  G.damageNumbers.push({ x, y, value, color, life: 1.0 });
}

function addParticle(x, y, color) {
  for (let i = 0; i < 5; i++) {
    G.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      color,
      life: 0.5 + Math.random() * 0.3,
    });
  }
}

function showGameOver(winner) {
  G.gameOver = true;
  G.winner = winner;
  transitionTo('game-over');
  if (typeof populateGameOver === 'function') populateGameOver();
}
