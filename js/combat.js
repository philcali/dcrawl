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
        const dmg = Math.max(1, Math.floor(player.atk * mult) - e.def);
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
      let dmg = Math.max(1, Math.floor(player.atk * ability.multiplier) - e.def);
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
        const dmg = Math.max(1, Math.floor(player.atk * ability.multiplier) - e.def);
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
        const dmg = Math.max(1, Math.floor(player.atk * ability.multiplier) - e.def);
        e.hp -= dmg;
        addDamageNumber(e.x, e.y, dmg, '#9b59b6');
        addParticle(e.x, e.y, '#9b59b6');
        if (e.hp <= 0) killEnemy(e);
      });
      break;
    }
    case 'heal': {
      const heal = Math.floor(player.maxHp * ability.percent);
      player.hp = Math.min(player.maxHp, player.hp + heal);
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
      // Move toward player
      if (d > 1.2) {
        const dx = Math.sign(player.x - e.x);
        const dy = Math.sign(player.y - e.y);
        const nx = e.x + dx;
        const ny = e.y + dy;
        if (isWalkable(nx, e.y, dungeon.grid)) e.targetX = nx;
        if (isWalkable(e.x, ny, dungeon.grid)) e.targetY = ny;
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
  let def = player.def;
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
