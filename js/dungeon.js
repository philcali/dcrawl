const TILE = { WALL: 1, FLOOR: 0, STAIRS: 2 };
const GRID_W = 60;
const GRID_H = 60;
const ROOM_MIN = 4;
const ROOM_MAX = 10;
const ROOM_TARGET = 8;

const ENEMY_TEMPLATES = {
  slime: { name: 'Slime', hp: 30, atk: 5, def: 1, speed: 1, xp: 15, color: '#2ecc71', aggro: 6 },
  rat:   { name: 'Rat',   hp: 25, atk: 7, def: 2, speed: 4, xp: 20, color: '#7f8c8d', aggro: 10 },
  skeleton: { name: 'Skeleton', hp: 50, atk: 10, def: 5, speed: 2, xp: 35, color: '#ecf0f1', aggro: 7 },
  ghost: { name: 'Ghost', hp: 40, atk: 12, def: 0, speed: 5, xp: 40, color: '#a29bfe', aggro: 12, phases: true },
  orc:   { name: 'Orc',   hp: 80, atk: 15, def: 8, speed: 2, xp: 55, color: '#27ae60', aggro: 6 },
  boss:  { name: 'Dark Lord', hp: 500, atk: 30, def: 15, speed: 3, xp: 500, color: '#c0392b', aggro: 10, isBoss: true },
};

const ITEM_TEMPLATES = {
  health_potion:  { name: 'Health Potion', color: '#e74c3c', effect: 'heal', value: 30 },
  str_elixir:     { name: 'Str Elixir',    color: '#e67e22', effect: 'atk', value: 3 },
  shield_scroll:  { name: 'Shield Scroll', color: '#3498db', effect: 'def', value: 3 },
  xp_scroll:      { name: 'XP Scroll',     color: '#9b59b6', effect: 'xp', value: 50 },
};

function generateDungeon(level) {
  const grid = Array.from({ length: GRID_H }, () => Array(GRID_W).fill(TILE.WALL));
  const rooms = [];
  const explored = Array.from({ length: GRID_H }, () => Array(GRID_W).fill(false));

  // Place rooms
  for (let attempt = 0; attempt < 300 && rooms.length < ROOM_TARGET; attempt++) {
    const w = ROOM_MIN + Math.floor(Math.random() * (ROOM_MAX - ROOM_MIN + 1));
    const h = ROOM_MIN + Math.floor(Math.random() * (ROOM_MAX - ROOM_MIN + 1));
    const x = 2 + Math.floor(Math.random() * (GRID_W - w - 4));
    const y = 2 + Math.floor(Math.random() * (GRID_H - h - 4));

    const room = { x, y, w, h, cx: Math.floor(x + w / 2), cy: Math.floor(y + h / 2) };

    // Check overlap
    let overlap = false;
    for (const r of rooms) {
      if (x - 1 < r.x + r.w && x + w + 1 > r.x && y - 1 < r.y + r.h && y + h + 1 > r.y) {
        overlap = true;
        break;
      }
    }
    if (overlap) continue;

    rooms.push(room);
    for (let ry = y; ry < y + h; ry++) {
      for (let rx = x; rx < x + w; rx++) {
        grid[ry][rx] = TILE.FLOOR;
      }
    }
  }

  // Connect rooms with L-shaped corridors
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1];
    const b = rooms[i];
    const horizontalFirst = Math.random() > 0.5;
    if (horizontalFirst) {
      carveLine(grid, a.cx, a.cy, b.cx, a.cy);
      carveLine(grid, b.cx, a.cy, b.cx, b.cy);
    } else {
      carveLine(grid, a.cx, a.cy, a.cx, b.cy);
      carveLine(grid, a.cx, b.cy, b.cx, b.cy);
    }
  }

  // Player start in first room
  const playerStart = { x: rooms[0].cx, y: rooms[0].cy };

  // Mark explored around player start
  const viewRadius = 5;
  for (let dy = -viewRadius; dy <= viewRadius; dy++) {
    for (let dx = -viewRadius; dx <= viewRadius; dx++) {
      const ey = rooms[0].cy + dy;
      const ex = rooms[0].cx + dx;
      if (ey >= 0 && ey < GRID_H && ex >= 0 && ex < GRID_W) {
        if (Math.sqrt(dx * dx + dy * dy) <= viewRadius) {
          explored[ey][ex] = true;
        }
      }
    }
  }

  // Last room has stairs (or boss at level 20)
  const lastRoom = rooms[rooms.length - 1];
  grid[lastRoom.cy][lastRoom.cx] = level >= 20 ? TILE.STAIRS : TILE.STAIRS;

  // Enemy and item placement
  const enemies = [];
  const items = [];

  if (level >= 20) {
    // Boss room
    for (let ry = lastRoom.y; ry < lastRoom.y + lastRoom.h; ry++) {
      for (let rx = lastRoom.x; rx < lastRoom.x + lastRoom.w; rx++) {
        if (ry === lastRoom.cy && rx === lastRoom.cx) continue;
        if (grid[ry][rx] === TILE.FLOOR && Math.random() < 0.08) {
          grid[ry][rx] = TILE.WALL;
        }
      }
    }
    enemies.push(createEnemyFromTemplate('boss', lastRoom.cx, lastRoom.cy, level));
    // Minions
    const minionTypes = ['skeleton', 'rat'];
    for (let i = 0; i < 2; i++) {
      const mx = lastRoom.x + 1 + Math.floor(Math.random() * (lastRoom.w - 2));
      const my = lastRoom.y + 1 + Math.floor(Math.random() * (lastRoom.h - 2));
      if (grid[my][mx] === TILE.FLOOR) {
        enemies.push(createEnemyFromTemplate(minionTypes[i % minionTypes.length], mx, my, level));
      }
    }
  } else {
    for (let i = 1; i < rooms.length; i++) {
      const room = rooms[i];
      const count = 1 + Math.floor(Math.random() * Math.max(1, Math.ceil(level / 4)));
      for (let j = 0; j < count; j++) {
        const mx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
        const my = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
        if (grid[my][mx] === TILE.FLOOR) {
          const type = pickEnemyType(level);
          enemies.push(createEnemyFromTemplate(type, mx, my, level));
        }
      }
    }
  }

  // Items
  const itemKeys = Object.keys(ITEM_TEMPLATES);
  for (let i = 1; i < rooms.length; i++) {
    if (Math.random() < 0.35) {
      const room = rooms[i];
      const ix = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
      const iy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
      if (grid[iy][ix] === TILE.FLOOR) {
        const itemKey = itemKeys[Math.floor(Math.random() * itemKeys.length)];
        items.push({ type: 'item', itemType: itemKey, x: ix, y: iy, collected: false });
      }
    }
  }

  return { grid, rooms, playerStart, enemies, items, explored, walls: [] };
}

function carveLine(grid, x0, y0, x1, y1) {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let x = x0, y = y0;
  let err = dx - dy;
  while (true) {
    if (y >= 0 && y < GRID_H && x >= 0 && x < GRID_W) {
      grid[y][x] = TILE.FLOOR;
    }
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
}

function createEnemyFromTemplate(type, x, y, level) {
  const t = ENEMY_TEMPLATES[type];
  const scale = 1 + (level - 1) * 0.15;
  return {
    type: 'enemy', enemyType: type, name: t.name,
    x, y, targetX: x, targetY: y,
    hp: Math.floor(t.hp * scale), maxHp: Math.floor(t.hp * scale),
    atk: Math.floor(t.atk * scale), def: Math.floor(t.def * scale),
    speed: t.speed, xp: Math.floor(t.xp * scale),
    color: t.color, aggro: t.aggro, isBoss: t.isBoss || false,
    stunned: 0, attackCooldown: 0,
  };
}

function pickEnemyType(level) {
  if (level <= 5) return Math.random() < 0.6 ? 'slime' : 'rat';
  if (level <= 10) return ['rat', 'skeleton'][Math.floor(Math.random() * 2)];
  if (level <= 15) return ['skeleton', 'ghost'][Math.floor(Math.random() * 2)];
  return ['orc', 'ghost'][Math.floor(Math.random() * 2)];
}

function updateExplored(player, explored, grid) {
  const radius = 7;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const ey = player.y + dy;
      const ex = player.x + dx;
      if (ey < 0 || ey >= GRID_H || ex < 0 || ex >= GRID_W) continue;
      if (Math.sqrt(dx * dx + dy * dy) <= radius) {
        explored[ey][ex] = true;
      }
    }
  }
}

function getAdjacentEnemies(ex, ey, enemies, range) {
  return enemies.filter(e => {
    const dx = e.x - ex, dy = e.y - ey;
    return Math.sqrt(dx * dx + dy * dy) < range && e.hp > 0;
  });
}

function getEnemiesInRange(ex, ey, range, enemies) {
  return enemies.filter(e => {
    const dx = e.x - ex, dy = e.y - ey;
    return Math.sqrt(dx * dx + dy * dy) <= range && e.hp > 0;
  });
}

function isBehind(player, enemy) {
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1.5) return false;
  const nx = dx / dist, ny = dy / dist;
  const facing = player.facing;
  const dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const [fdx, fdy] = dirs[facing] || [0, 1];
  return nx * fdx + ny * fdy > 0.3;
}
