const TILE = { WALL: 1, FLOOR: 0, STAIRS: 2 };
const GRID_W = 60;
const GRID_H = 60;
const ROOM_MIN = 4;
const ROOM_MAX = 10;
const ROOM_TARGET = 8;

const BIOMES = {
  crypt:  { name: 'Crypt',  wallColor: '#2c3e50', floorColor: '#1a1a2e', wallStroke: '#34495e', floorStroke: '#16213e', enemies: ['skeleton', 'ghost'] },
  dungeon:{ name: 'Dungeon',wallColor: '#3e2723', floorColor: '#1a1a2e', wallStroke: '#5d4037', floorStroke: '#2c1e16', enemies: ['orc', 'skeleton'] },
  swamp:  { name: 'Swamp',  wallColor: '#1b5e20', floorColor: '#1a2e1a', wallStroke: '#2e7d32', floorStroke: '#0d3b0d', enemies: ['slime', 'rat'] },
  inferno:{ name: 'Inferno',wallColor: '#4a148c', floorColor: '#1a0a2e', wallStroke: '#6a1b9a', floorStroke: '#3a0a5e', enemies: ['ghost', 'orc'] },
};

const ELITE_TEMPLATES = {
  elite_slime:  { name: 'Elite Slime',  color: '#f1c40f', hpMult: 2.0, atkMult: 1.5, defMult: 1.5, lootChance: 0.3 },
  elite_rat:    { name: 'Elite Rat',    color: '#bdc3c7', hpMult: 1.8, atkMult: 1.8, defMult: 1.2, lootChance: 0.25 },
  elite_skeleton:{ name: 'Elite Skeleton', color: '#ecf0f1', hpMult: 2.0, atkMult: 1.5, defMult: 1.5, lootChance: 0.3 },
  elite_orc:    { name: 'Elite Orc',    color: '#f1c40f', hpMult: 2.5, atkMult: 2.0, defMult: 2.0, lootChance: 0.35 },
  elite_ghost:  { name: 'Elite Ghost',  color: '#d4af37', hpMult: 1.8, atkMult: 1.8, defMult: 0.5, lootChance: 0.25 },
};

const ELITE_MAP = { slime: 'elite_slime', rat: 'elite_rat', skeleton: 'elite_skeleton', ghost: 'elite_ghost', orc: 'elite_orc' };

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

const EQUIPMENT_RARITIES = {
  common:   { weight: 50, color: '#bdc3c7' },
  uncommon: { weight: 30, color: '#2ecc71' },
  rare:     { weight: 15, color: '#3498db' },
  epic:     { weight: 5,  color: '#9b59b6' },
};

const EQUIPMENT_SKILLS = {
  whirlwind: {
    name: 'Whirlwind', cooldown: 4, type: 'aoe_attack', range: 2, multiplier: 1.2,
    desc: 'Spin attack (range 2)',
  },
  counter_strike: {
    name: 'Counter Strike', cooldown: 5, type: 'attack', multiplier: 2.5,
    desc: 'Powerful counter-attack',
  },
  arcane_blast: {
    name: 'Arcane Blast', cooldown: 3, type: 'aoe_attack', range: 3, multiplier: 1.5,
    desc: 'Homing fireballs (range 3)',
  },
  barrier: {
    name: 'Barrier', cooldown: 6, type: 'buff_shield', range: 3, value: 15,
    desc: 'Shield nearby allies for 3s',
  },
  phase: {
    name: 'Phase', cooldown: 8, type: 'stealth', duration: 3,
    desc: 'Invisible for 3s',
  },
};

const EQUIPMENT_TEMPLATES = {
  iron_sword:     { name: 'Iron Sword',     slot: 'weapon',     rarity: 'common',   primaryStat: 'atk', primaryValue: 5,  statBonuses: { atk: 5 },  skillGrant: null },
  steel_blade:    { name: 'Steel Blade',    slot: 'weapon',     rarity: 'uncommon', primaryStat: 'atk', primaryValue: 8,  statBonuses: { atk: 8 },  skillGrant: 'whirlwind' },
  flame_sword:    { name: 'Flame Sword',    slot: 'weapon',     rarity: 'rare',     primaryStat: 'atk', primaryValue: 12, statBonuses: { atk: 12 }, skillGrant: 'whirlwind' },
  shadow_blade:   { name: 'Shadow Blade',   slot: 'weapon',     rarity: 'epic',     primaryStat: 'atk', primaryValue: 18, statBonuses: { atk: 18 }, skillGrant: 'counter_strike' },
  wooden_shield:  { name: 'Wooden Shield',  slot: 'offhand',  rarity: 'common',   primaryStat: 'def', primaryValue: 3,  statBonuses: { def: 3 },  skillGrant: null },
  iron_shield:    { name: 'Iron Shield',    slot: 'offhand',  rarity: 'uncommon', primaryStat: 'def', primaryValue: 6,  statBonuses: { def: 6 },  skillGrant: null },
  magic_shield:   { name: 'Magic Shield',   slot: 'offhand',  rarity: 'rare',     primaryStat: 'def', primaryValue: 10, statBonuses: { def: 10 }, skillGrant: 'barrier' },
  leather_helm:   { name: 'Leather Helm',   slot: 'head',     rarity: 'common',   primaryStat: 'maxHp', primaryValue: 2, statBonuses: { maxHp: 2 }, skillGrant: null },
  steel_helm:     { name: 'Steel Helm',     slot: 'head',     rarity: 'uncommon', primaryStat: 'maxHp', primaryValue: 5, statBonuses: { maxHp: 5, def: 2 }, skillGrant: null },
  mage_crown:     { name: 'Mage Crown',     slot: 'head',     rarity: 'rare',     primaryStat: 'maxHp', primaryValue: 8, statBonuses: { maxHp: 8, atk: 3 }, skillGrant: 'arcane_blast' },
  leather_vest:   { name: 'Leather Vest',   slot: 'body',     rarity: 'common',   primaryStat: 'def', primaryValue: 3,  statBonuses: { def: 3, maxHp: 2 }, skillGrant: null },
  chain_mail:     { name: 'Chain Mail',     slot: 'body',     rarity: 'uncommon', primaryStat: 'def', primaryValue: 5,  statBonuses: { def: 5, maxHp: 3 }, skillGrant: null },
  plate_armor:    { name: 'Plate Armor',    slot: 'body',     rarity: 'rare',     primaryStat: 'def', primaryValue: 10, statBonuses: { def: 10, maxHp: 8 }, skillGrant: null },
  shadow_cloak:   { name: 'Shadow Cloak',   slot: 'body',     rarity: 'epic',     primaryStat: 'def', primaryValue: 15, statBonuses: { def: 15, maxHp: 5 }, skillGrant: 'phase' },
};

function generateEquipmentItem(level) {
  const rarityKeys = Object.keys(EQUIPMENT_RARITIES);
  const weights = rarityKeys.map((k, i) => {
    let w = EQUIPMENT_RARITIES[k].weight;
    if (i > 0) w *= (1 + level * 0.04);
    return w;
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  let chosen = rarityKeys[0];
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll <= 0) { chosen = rarityKeys[i]; break; }
  }
  const tierItems = Object.entries(EQUIPMENT_TEMPLATES).filter(([, t]) => t.rarity === chosen);
  const [key] = tierItems[Math.floor(Math.random() * tierItems.length)];
  return { type: 'equipment', templateKey: key };
}

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

  // Assign room variants
  const intermediateRooms = rooms.slice(1, -1);
  for (let i = 0; i < intermediateRooms.length; i++) {
    const r = intermediateRooms[i];
    const roll = Math.random();
    if (roll < 0.15) r.variant = 'treasure';
    else if (roll < 0.25) r.variant = 'trap';
    else if (roll < 0.35) r.variant = 'empty';
  }

  // Pick biome for this level
  const biomeKeys = Object.keys(BIOMES);
  const biome = BIOMES[biomeKeys[Math.floor(Math.random() * biomeKeys.length)]];

  // Connect rooms with L-shaped corridors
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1];
    const b = rooms[i];
    const horizontalFirst = Math.random() > 0.5;
    if (horizontalFirst) {
      carveCorridor(grid, a.cx, a.cy, b.cx, a.cy);
      carveCorridor(grid, b.cx, a.cy, b.cx, b.cy);
    } else {
      carveCorridor(grid, a.cx, a.cy, a.cx, b.cy);
      carveCorridor(grid, a.cx, b.cy, b.cx, b.cy);
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
      if (room.variant === 'treasure') continue;
      if (room.variant === 'empty') continue;
      const count = 1 + Math.floor(Math.random() * Math.max(1, Math.ceil(level / 4)));
      for (let j = 0; j < count; j++) {
        const mx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
        const my = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
        if (grid[my][mx] === TILE.FLOOR) {
          let type = pickEnemyType(level);
          // Elite chance
          if (Math.random() < 0.08 && ELITE_MAP[type]) {
            type = ELITE_MAP[type];
          }
          enemies.push(createEnemyFromTemplate(type, mx, my, level));
        }
      }
    }
  }

  // Items
  const itemKeys = Object.keys(ITEM_TEMPLATES);
  for (let i = 1; i < rooms.length; i++) {
    const room = rooms[i];
    if (room.variant === 'empty') continue;
    // Equipment drop chance in treasure rooms
    if (room.variant === 'treasure' && Math.random() < 0.5) {
      const ix = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
      const iy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
      if (grid[iy][ix] === TILE.FLOOR) {
        const equip = generateEquipmentItem(level);
        equip.x = ix;
        equip.y = iy;
        equip.collected = false;
        items.push(equip);
      }
    }
    let itemChance = room.variant === 'treasure' ? 0.5 : 0.25;
    if (Math.random() < itemChance) {
      const ix = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
      const iy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
      if (grid[iy][ix] === TILE.FLOOR) {
        const itemKey = itemKeys[Math.floor(Math.random() * itemKeys.length)];
        items.push({ type: 'item', itemType: itemKey, x: ix, y: iy, collected: false });
      }
    }
    // Treasure rooms get a second item
    if (room.variant === 'treasure' && Math.random() < 0.5) {
      const ix = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
      const iy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
      if (grid[iy][ix] === TILE.FLOOR) {
        const itemKey = itemKeys[Math.floor(Math.random() * itemKeys.length)];
        items.push({ type: 'item', itemType: itemKey, x: ix, y: iy, collected: false });
      }
    }
  }

  return { grid, rooms, playerStart, enemies, items, explored, walls: [], biome };
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

function carveCorridor(grid, x0, y0, x1, y1) {
  carveLine(grid, x0, y0, x1, y1);
  // Randomly widen: ~35% chance to add a 2-wide or 2-tall offset
  const horizontal = y0 === y1;
  if (horizontal && Math.random() < 0.35) {
    const off = Math.random() < 0.5 ? -1 : 1;
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
      const y = y0 + off;
      if (y >= 0 && y < GRID_H) grid[y][x] = TILE.FLOOR;
    }
  } else if (!horizontal && Math.random() < 0.35) {
    const off = Math.random() < 0.5 ? -1 : 1;
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) {
      const x = x0 + off;
      if (x >= 0 && x < GRID_W) grid[y][x] = TILE.FLOOR;
    }
  }
}


function createEnemyFromTemplate(type, x, y, level) {
  const elite = ELITE_TEMPLATES[type];
  if (elite) {
    const baseType = type.replace('elite_', '');
    const t = ENEMY_TEMPLATES[baseType] || ENEMY_TEMPLATES.slime;
    const scale = 1 + (level - 1) * 0.15;
    return {
      type: 'enemy', enemyType: type, name: elite.name,
      x, y, targetX: x, targetY: y,
      hp: Math.floor(t.hp * scale * elite.hpMult), maxHp: Math.floor(t.hp * scale * elite.hpMult),
      atk: Math.floor(t.atk * scale * elite.atkMult), def: Math.floor(t.def * scale * elite.defMult),
      speed: t.speed, xp: Math.floor(t.xp * scale * 1.5),
      color: elite.color, aggro: t.aggro, isBoss: false,
      stunned: 0, attackCooldown: 0, lootChance: elite.lootChance,
    };
  }
  const t = ENEMY_TEMPLATES[type];
  const scale = 1 + (level - 1) * 0.15;
  return {
    type: 'enemy', enemyType: type, name: t.name,
    x, y, targetX: x, targetY: y,
    hp: Math.floor(t.hp * scale), maxHp: Math.floor(t.hp * scale),
    atk: Math.floor(t.atk * scale), def: Math.floor(t.def * scale),
    speed: t.speed, xp: Math.floor(t.xp * scale),
    color: t.color, aggro: t.aggro, isBoss: t.isBoss || false,
    stunned: 0, attackCooldown: 0, lootChance: 0.05,
  };
}

function pickEnemyType(level) {
  if (!G || !G.dungeon || !G.dungeon.biome) {
    if (level <= 5) return Math.random() < 0.6 ? 'slime' : 'rat';
    if (level <= 10) return ['rat', 'skeleton'][Math.floor(Math.random() * 2)];
    if (level <= 15) return ['skeleton', 'ghost'][Math.floor(Math.random() * 2)];
    return ['orc', 'ghost'][Math.floor(Math.random() * 2)];
  }
  const biomeEnemies = G.dungeon.biome.enemies;
  // 70% biome-biased, 30% level-based for variety
  if (Math.random() < 0.7 && biomeEnemies.length === 2) {
    return biomeEnemies[Math.floor(Math.random() * 2)];
  }
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
  G.minimapDirty = true;
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
