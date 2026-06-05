function playerAttack(abilityIndex) {
  if (G.paused || G.gameOver || !G.player) return;
  const ability = G.player.abilities[abilityIndex];
  if (!ability || ability.cooldownTimer > 0) return;

  const { player, enemies } = G;

  switch (ability.type) {
    case 'attack': {
      let targets = getAdjacentEnemies(player.x, player.y, enemies, 1.5);
      if (ability.requiresBehind) {
        targets = targets.filter(e => isBehind(player, e));
      }
      if (targets.length === 0) return;
      targets.forEach(e => {
        let mult = ability.multiplier;
        if (ability.requiresBehind && isBehind(player, e)) mult = 3.0;
        const dmg = Math.max(1, Math.floor(getEffectiveStat(player, 'atk') * mult) - e.def);
        e.hp -= dmg;
        addDamageNumber(e.x, e.y, dmg, '#e74c3c');
        addParticle(e.x, e.y, '#e74c3c');
        playSound('hit');
        if (e.hp <= 0) killEnemy(e);
      });
      break;
    }
    case 'ranged_attack': {
      const targets = getEnemiesInRange(player.x, player.y, ability.range, enemies).sort((a, b) => {
        return dist(player, a) - dist(player, b);
      }).slice(0, 1);
      if (targets.length === 0) return;
      const e = targets[0];
      let dmg = Math.max(1, Math.floor(getEffectiveStat(player, 'atk') * ability.multiplier) - e.def);
      e.hp -= dmg;
      addDamageNumber(e.x, e.y, dmg, '#e67e22');
      addParticle(e.x, e.y, '#e67e22');
      playSound('hit');
      if (e.hp <= 0) killEnemy(e);
      break;
    }
    case 'aoe_attack': {
      const targets = getEnemiesInRange(player.x, player.y, ability.range, enemies);
      if (targets.length === 0) return;
      targets.forEach(e => {
        const dmg = Math.max(1, Math.floor(getEffectiveStat(player, 'atk') * ability.multiplier) - e.def);
        e.hp -= dmg;
        addDamageNumber(e.x, e.y, dmg, '#e67e22');
        addParticle(e.x, e.y, '#e67e22');
        if (e.hp <= 0) killEnemy(e);
      });
      break;
    }
    case 'chain': {
      let targets = getEnemiesInRange(player.x, player.y, ability.range, enemies).slice(0, ability.targets);
      if (targets.length === 0) return;
      targets.forEach(e => {
        const dmg = Math.max(1, Math.floor(getEffectiveStat(player, 'atk') * ability.multiplier) - e.def);
        e.hp -= dmg;
        addDamageNumber(e.x, e.y, dmg, '#9b59b6');
        addParticle(e.x, e.y, '#9b59b6');
        if (e.hp <= 0) killEnemy(e);
      });
      break;
    }
    case 'heal': {
      const heal = Math.floor(getEffectiveStat(player, 'maxHp') * ability.percent);
      player.hp = Math.min(getEffectiveStat(player, 'maxHp'), player.hp + heal);
      addDamageNumber(player.x, player.y, '+' + heal, '#2ecc71');
      addParticle(player.x, player.y, '#2ecc71');
      playSound('heal');
      break;
    }
    case 'stun': {
      const targets = getAdjacentEnemies(player.x, player.y, enemies, ability.range);
      targets.forEach(e => { e.stunned = Math.max(e.stunned, 2); });
      addDamageNumber(player.x, player.y, 'STUNNED', '#3498db');
      playSound('hit');
      break;
    }
    case 'buff_def': {
      player.buffs.push({ type: 'def', value: ability.value, timer: ability.duration });
      addDamageNumber(player.x, player.y, '+' + ability.value + ' DEF', '#3498db');
      break;
    }
    case 'stealth': {
      player.stealth = true;
      player.stealthTimer = ability.duration;
      addDamageNumber(player.x, player.y, 'STEALTH', '#a29bfe');
      break;
    }
    case 'buff_shield': {
      player.buffs.push({ type: 'shield', value: ability.value, timer: 3 });
      addDamageNumber(player.x, player.y, 'SHIELDED', '#f1c40f');
      break;
    }
    case 'wall': {
      const angle = player.facing === 'up' ? [0, -1] : player.facing === 'down' ? [0, 1] : player.facing === 'left' ? [-1, 0] : [1, 0];
      const wx = player.x + angle[0] * ability.range;
      const wy = player.y + angle[1] * ability.range;
      if (wx >= 0 && wx < GRID_W && wy >= 0 && wy < GRID_H) {
        G.walls.push({ x: wx, y: wy, timer: ability.duration });
        G.dungeon.grid[wy][wx] = TILE.WALL;
        addDamageNumber(wx, wy, 'WALL', '#74b9ff');
      }
      break;
    }
  }

  ability.cooldownTimer = ability.cooldown;
}

// Bresenham raycast: returns true if no wall blocks the line from (x1,y1) to (x2,y2)
function hasLineOfSight(x1, y1, x2, y2, grid) {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;
  let x = x1, y = y1;
  while (true) {
    if (x === x2 && y === y2) return true;
    const nextErr = err - dy;
    if (err >= 0) {
      if (x === x2) break;
      err -= dy; x += sx;
    } else {
      if (y === y2) break;
      err += dx; y += sy;
    }
    if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) return false;
    if (grid[y] && grid[y][x] === TILE.WALL) return false;
  }
  return false;
}

// A* pathfinding: returns array of [x, y] tiles from start to end, or null if no path
function findPath(fromX, fromY, toX, toY, grid, enemies, phase) {
  const key = (x, y) => x + ',' + y;
  const gScore = new Map();
  const fScore = new Map();
  const cameFrom = new Map();
  const openSet = new Set();
  const closedSet = new Set();

  const startKey = key(fromX, fromY);
  const endKey = key(toX, toY);
  gScore.set(startKey, 0);
  fScore.set(startKey, Math.abs(toX - fromX) + Math.abs(toY - fromY));
  openSet.add(startKey);

  while (openSet.size > 0) {
    // Find node with lowest fScore
    let currentKey = null;
    let lowestF = Infinity;
    for (const k of openSet) {
      if (fScore.get(k) < lowestF) { lowestF = fScore.get(k); currentKey = k; }
    }
    if (currentKey === null) break;
    openSet.delete(currentKey);
    closedSet.add(currentKey);

    if (currentKey === endKey) {
      // Reconstruct path
      const path = [];
      let k = currentKey;
      while (k) {
        const [cx, cy] = k.split(',').map(Number);
        path.unshift([cx, cy]);
        k = cameFrom.get(k);
      }
      return path;
    }

    const [cx, cy] = currentKey.split(',').map(Number);

    // Neighbors (cardinal directions only)
    const neighbors = [
      [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1],
    ];
    for (const [nx, ny] of neighbors) {
      const nk = key(nx, ny);
      if (closedSet.has(nk)) continue;
      if (!isWalkable(nx, ny, grid)) continue;
      if (phase !== true && enemies && isEnemyAt(nx, ny, enemies)) continue;

      const tentativeG = (gScore.get(currentKey) || 0) + 1;
      const existingG = gScore.get(nk);
      if (existingG == null || tentativeG < existingG) {
        cameFrom.set(nk, currentKey);
        gScore.set(nk, tentativeG);
        fScore.set(nk, tentativeG + Math.abs(toX - nx) + Math.abs(toY - ny));
        openSet.add(nk);
      }
    }
  }
  return null; // no path
}

function isEnemyAt(x, y, enemies) {
  return enemies.some(e => e.hp > 0 && Math.round(e.x) === x && Math.round(e.y) === y);
}

function updateEnemies(dt) {
  const { player, enemies, dungeon } = G;
  for (const e of enemies) {
    if (e.hp <= 0) continue;

    if (e.stunned > 0) { e.stunned -= dt; continue; }

    const d = dist(e, player);

    // Stealth: enemies don't aggro or attack
    if (player.stealth && !e.isBoss) continue;

    // Boss aggro range
    const aggroRange = e.isBoss ? e.aggro * 2 : e.aggro;

    if (d <= aggroRange) {
      // Line of sight check (ghosts phase through walls)
      const canSee = e.phases || hasLineOfSight(Math.round(e.x), Math.round(e.y), Math.round(player.x), Math.round(player.y), dungeon.grid);

      // Path check (ghosts phase through walls)
      const path = e.phases ? null : findPath(Math.round(e.x), Math.round(e.y), Math.round(player.x), Math.round(player.y), dungeon.grid, enemies, e.phases);

      // Aggro: need LOS or a navigable path
      if (canSee || (path && path.length > 1)) {
        // Move toward player (speed controls movement frequency)
        e.moveTimer -= dt;
        if (e.moveTimer <= 0 && d > 1.2) {
          e.moveTimer = 1.0 / e.speed;
          if (path && path.length > 1) {
            // Follow A* path
            const next = path[1];
            e.targetX = next[0];
            e.targetY = next[1];
          } else {
            // Direct movement (no obstacles)
            const dx = Math.sign(player.x - e.x);
            const dy = Math.sign(player.y - e.y);
            const nx = e.x + dx;
            const ny = e.y + dy;
            if (isWalkable(nx, e.y, dungeon.grid)) e.targetX = nx;
            if (isWalkable(e.x, ny, dungeon.grid)) e.targetY = ny;
          }
        }

        // Attack
        e.attackCooldown -= dt;
        if (e.attackCooldown <= 0 && d <= 1.5) {
          let dmg = Math.max(1, e.atk - getEffectiveDef(player));
          if (player.stealth) dmg = 0;
          if (dmg > 0) {
            player.hp -= dmg;
            addDamageNumber(player.x, player.y, dmg, '#e74c3c');
            addParticle(player.x, player.y, '#e74c3c');
            playSound('hit');
          }
          e.attackCooldown = 1.0;
        }
      }
    }

    // Move enemy toward targetX/targetY each frame
    if (e.targetX !== undefined && e.targetY !== undefined) {
      const tdx = e.targetX - e.x;
      const tdy = e.targetY - e.y;
      const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
      if (tdist > 0.01) {
        e.x += (tdx / tdist) * e.speed * dt;
        e.y += (tdy / tdist) * e.speed * dt;
      } else if (tdist < 0.01) {
        e.x = e.targetX;
        e.y = e.targetY;
      }
    }

    // Boss phase transitions
    if (e.isBoss && e.hp > 0) {
      const hpRatio = e.hp / e.maxHp;
      if (hpRatio <= 0.25 && G.bossPhase < 2) {
        G.bossPhase = 2;
        e.atk = Math.floor(e.atk * 1.5);
        e.def = Math.floor(e.def * 1.5);
        e.speed *= 1.5;
        addLog('The Dark Lord is enraged!');
      } else if (hpRatio <= 0.5 && G.bossPhase < 1) {
        G.bossPhase = 1;
        addLog('The Dark Lord summons a projectile!');
      }
      // Boss summon minions
      if (G.bossPhase >= 1) {
        G.bossSummonTimer -= dt;
        if (G.bossSummonTimer <= 0) {
          G.bossSummonTimer = 8;
          const mx = e.x + (Math.random() > 0.5 ? 3 : -3);
          const my = e.y + (Math.random() > 0.5 ? 3 : -3);
          if (isWalkable(mx, my, G.dungeon.grid)) {
            const minionType = ['skeleton', 'rat'][Math.floor(Math.random() * 2)];
            const minion = createEnemyFromTemplate(minionType, mx, my, G.level);
            enemies.push(minion);
            addLog('The Dark Lord summons a minion!');
          }
        }
      }
    }
  }

  // Clean dead enemies
  G.enemies = enemies.filter(e => e.hp > 0);
}

function updateCooldowns(dt) {
  for (const a of G.player.abilities) {
    if (a.cooldownTimer > 0) a.cooldownTimer = Math.max(0, a.cooldownTimer - dt);
  }
  for (let i = G.player.buffs.length - 1; i >= 0; i--) {
    G.player.buffs[i].timer -= dt;
    if (G.player.buffs[i].timer <= 0) G.player.buffs.splice(i, 1);
  }
  if (G.player.stealthTimer > 0) {
    G.player.stealthTimer -= dt;
    if (G.player.stealthTimer <= 0) G.player.stealth = false;
  }
}

function getEffectiveDef(player) {
  let def = getEffectiveStat(player, 'def');
  for (const b of player.buffs) {
    if (b.type === 'def') def += b.value;
    if (b.type === 'shield') def += b.value;
  }
  return def;
}

function killEnemy(e) {
  G.player.xp += e.xp;
  addLog(`Defeated ${e.name} (+${e.xp} XP)`);
  addDamageNumber(e.x, e.y, '+' + e.xp + ' XP', '#f1c40f');

  // Loot drop
  if (e.lootChance && Math.random() < e.lootChance) {
    const dropType = Object.keys(ITEM_TEMPLATES)[Math.floor(Math.random() * Object.keys(ITEM_TEMPLATES).length)];
    G.items.push({ type: 'item', itemType: dropType, x: Math.round(e.x), y: Math.round(e.y), collected: false });
    addLog(`${e.name} dropped an item!`);
  }
  // Equipment drop from enemies
  const gearChance = 0.15 + G.level * 0.0075;
  if (Math.random() < gearChance) {
    const gear = generateEquipmentItem(G.level);
    gear.x = Math.round(e.x);
    gear.y = Math.round(e.y);
    gear.collected = false;
    G.items.push(gear);
    addLog(`${e.name} dropped some gear!`);
  }

  checkLevelUp(G.player);
}

function dist(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function isWalkable(x, y, grid) {
  if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) return false;
  const tile = grid[y][x];
  return tile === TILE.FLOOR || tile === TILE.STAIRS;
}
