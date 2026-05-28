let keys = {};
let joystickDir = { x: 0, y: 0 };
let joystickActive = false;
let moveQueue = [];
let moveTimer = 0;
const MOVE_INTERVAL = 0.12;

function initControls() {
  document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key >= '1' && e.key <= '9') {
      playerAttack(parseInt(e.key) - 1);
    }
    if (e.key === ' ' || e.key === 'f') {
      playerAttack(0);
    }
    if (e.key === 'Enter' || e.key === 's' || e.key === 'ArrowDown') {
      checkDescend();
    }
    if (e.key === 'Tab' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
      toggleStatusPage();
    }
    if (e.key === 'Escape') {
      if (G && G.statusPageOpen) {
        closeStatusPage();
      }
    }
  });
  document.addEventListener('keyup', e => { keys[e.key] = false; });

  initJoystick();
  initButtons();
}

function initJoystick() {
  const zone = document.getElementById('joystick-zone');
  if (!zone) return;
  let touchId = null;
  let startX, startY;
  let moved = false;

  zone.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    touchId = t.identifier;
    startX = t.clientX;
    startY = t.clientY;
    moved = false;
    joystickActive = true;
  });

  zone.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier !== touchId) continue;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const dist2 = Math.sqrt(dx * dx + dy * dy);
      if (dist2 > 15) {
        moved = true;
        joystickDir.x = dx / dist2;
        joystickDir.y = dy / dist2;
      }
    }
  });

  const endTouch = e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier !== touchId) continue;
      if (!moved && G && G.player) {
        playerAttack(0);
      }
      touchId = null;
      joystickActive = false;
      joystickDir = { x: 0, y: 0 };
    }
  };
  zone.addEventListener('touchend', endTouch);
  zone.addEventListener('touchcancel', endTouch);
}

function initButtons() {
  document.getElementById('btn-attack').addEventListener('click', () => { if (G && G.player) playerAttack(0); });
  document.getElementById('btn-ability1').addEventListener('click', () => { if (G && G.player) playerAttack(1); });
  document.getElementById('btn-ability2').addEventListener('click', () => { if (G && G.player) playerAttack(2); });
  document.getElementById('btn-descend').addEventListener('click', () => { if (G) checkDescend(); });
  document.getElementById('btn-status').addEventListener('click', () => { if (G) toggleStatusPage(); });
  document.getElementById('btn-close-status').addEventListener('click', () => { if (G) closeStatusPage(); });
  document.getElementById('btn-start').addEventListener('click', () => {
    if (G.selectedClass) startGame(G.selectedClass);
  });
  document.getElementById('btn-restart').addEventListener('click', () => {
    transitionTo('character-select');
    renderCharacterSelect();
  });
  document.getElementById('btn-continue').addEventListener('click', () => {
    const save = loadGame();
    if (!save) return;
    G = createInitialState();
    G.selectedClass = save.selectedClass;
    G.player = createPlayer(save.selectedClass);
    G.player.hp = save.hp;
    G.player.maxHp = save.maxHp;
    G.player.atk = save.atk;
    G.player.def = save.def;
    G.player.xp = save.xp;
    G.player.xpToNext = save.xpToNext;
    G.player.level = save.playerLevel;
    if (save.equipment) {
      G.player.equipment = save.equipment;
      G.player.equipmentBonuses = save.equipmentBonuses || { atk: 0, def: 0, maxHp: 0 };
      G.player.skills = save.skills || [];
      rebuildEquipmentBonuses(G.player);
      // Re-apply gear skills to abilities
      for (const skillKey of G.player.skills) {
        if (EQUIPMENT_SKILLS[skillKey]) {
          G.player.abilities.push({ ...EQUIPMENT_SKILLS[skillKey], cooldownTimer: 0, isGearSkill: true });
        }
      }
    }
    descendLevel(save.level);
    transitionTo('game');
  });
}

function toggleStatusPage() {
  if (G.statusPageOpen) {
    closeStatusPage();
  } else {
    openStatusPage();
  }
}

function openStatusPage() {
  G.statusPageOpen = true;
  G.paused = true;
  transitionTo('status');
  renderStatusPage();
}

function closeStatusPage() {
  G.statusPageOpen = false;
  G.paused = false;
  transitionTo('game');
}

function checkDescend() {
  if (G.gameOver || G.paused) return;
  const p = G.player;
  const tile = G.dungeon.grid[p.y][p.x];
  if (tile === TILE.STAIRS) {
    descendLevel(G.level + 1);
  }
}

function processInput(dt) {
  if (G.paused || G.gameOver || G.screen !== 'game') return;

  let dx = 0, dy = 0;

  // Keyboard
  if (keys['ArrowUp'] || keys['w'] || keys['W']) dy = -1;
  if (keys['ArrowDown'] || keys['s'] || keys['S']) dy = 1;
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) dx = -1;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) dx = 1;

  // Joystick
  if (joystickActive) {
    if (Math.abs(joystickDir.x) > 0.3) dx = Math.sign(joystickDir.x);
    if (Math.abs(joystickDir.y) > 0.3) dy = Math.sign(joystickDir.y);
  }

  if (dx === 0 && dy === 0) return;

  // Update facing
  if (dx > 0) G.player.facing = 'right';
  else if (dx < 0) G.player.facing = 'left';
  if (dy > 0) G.player.facing = 'down';
  else if (dy < 0) G.player.facing = 'up';

  moveTimer += dt;
  if (moveTimer >= MOVE_INTERVAL) {
    moveTimer -= MOVE_INTERVAL;
    const nx = G.player.x + dx;
    const ny = G.player.y + dy;
    if (isWalkable(nx, ny, G.dungeon.grid)) {
      G.player.x = nx;
      G.player.y = ny;
      G.player.targetX = nx;
      G.player.targetY = ny;

      // Check item pickup
      for (const item of G.items) {
        if (!item.collected && item.x === nx && item.y === ny) {
          item.collected = true;
          applyItem(item, G.player);
          // Equipment auto-drop may have placed an item at the current position;
          // break to avoid re-picking it up in the same tick.
          if (item.type === 'equipment') break;
        }
      }

      // Check trap room
      if (G.dungeon) {
        for (const room of G.dungeon.rooms) {
          if (room.variant === 'trap' && !room.trapped &&
              nx >= room.x && nx < room.x + room.w && ny >= room.y && ny < room.y + room.h) {
            room.trapped = true;
            const trapDmg = 10 + G.level * 3;
            G.player.hp -= trapDmg;
            addDamageNumber(G.player.x, G.player.y, '-' + trapDmg, '#e74c3c');
            addLog(`You stepped on a trap! (-${trapDmg} HP)`);
            break;
          }
        }
      }
    }
  }
}
