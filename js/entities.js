function createPlayer(classKey) {
  const cls = CLASSES[classKey];
  const abilities = [
    { ...cls.standardAttack, cooldownTimer: 0 },
    ...cls.abilities.map(a => ({ ...a, cooldownTimer: 0 })),
  ];
  return {
    type: 'player', class: classKey,
    x: 0, y: 0, targetX: 0, targetY: 0,
    hp: cls.stats.hp, maxHp: cls.stats.hp,
    atk: cls.stats.atk, def: cls.stats.def, speed: cls.stats.speed,
    xp: 0, xpToNext: 100, level: 1,
    abilities, buffs: [],
    stealth: false, stealthTimer: 0,
    attackCooldown: 0, facing: 'down',
    color: cls.color,
    equipment: { weapon: null, offhand: null, head: null, body: null },
    equipmentBonuses: { atk: 0, def: 0, maxHp: 0 },
    skills: [],
  };
}

function getEffectiveStat(player, stat) {
  return player[stat] + (player.equipmentBonuses[stat] || 0);
}

function rebuildEquipmentBonuses(player) {
  const bonuses = { atk: 0, def: 0, maxHp: 0 };
  for (const slot of ['weapon', 'offhand', 'head', 'body']) {
    const item = player.equipment[slot];
    if (item) {
      const template = EQUIPMENT_TEMPLATES[item.templateKey];
      if (template) {
        for (const [stat, val] of Object.entries(template.statBonuses)) {
          bonuses[stat] = (bonuses[stat] || 0) + val;
        }
      }
    }
  }
  player.equipmentBonuses = bonuses;
  const newMax = player.maxHp + bonuses.maxHp;
  player.hp = Math.min(player.hp, newMax);
  player.maxHp = newMax;
}

function applySkillGrant(player, skillKey) {
  if (!skillKey || !EQUIPMENT_SKILLS[skillKey]) return;
  if (player.skills.includes(skillKey)) return;
  if (player.abilities.length >= 8) {
    addLog('Cannot learn more skills!');
    return;
  }
  const skill = { ...EQUIPMENT_SKILLS[skillKey], cooldownTimer: 0, isGearSkill: true };
  player.abilities.push(skill);
  player.skills.push(skillKey);
  addLog('Learned ' + skill.name + '!');
}

function applyItem(item, player) {
  if (item.type === 'equipment') {
    handleEquipmentPickup(item, player);
  } else {
    const t = ITEM_TEMPLATES[item.itemType];
    switch (t.effect) {
      case 'heal':
        player.hp = Math.min(player.maxHp, player.hp + t.value);
        addDamageNumber(player.x, player.y, '+' + t.value, '#2ecc71');
        break;
      case 'atk':
        player.atk += t.value;
        addDamageNumber(player.x, player.y, '+' + t.value + ' ATK', '#e67e22');
        break;
      case 'def':
        player.def += t.value;
        addDamageNumber(player.x, player.y, '+' + t.value + ' DEF', '#3498db');
        break;
      case 'xp':
        player.xp += t.value;
        addDamageNumber(player.x, player.y, '+' + t.value + ' XP', '#9b59b6');
        checkLevelUp(player);
        break;
    }
    addLog('Picked up ' + t.name);
  }
}

function handleEquipmentPickup(item, player) {
  const template = EQUIPMENT_TEMPLATES[item.templateKey];
  const slot = template.slot;
  const current = player.equipment[slot];

  // Grant skill first
  applySkillGrant(player, template.skillGrant);

  if (!current) {
    player.equipment[slot] = { templateKey: item.templateKey };
    addLog('Equipped ' + template.name + '!');
  } else {
    const currentTemplate = EQUIPMENT_TEMPLATES[current.templateKey];
    const currentPrimary = currentTemplate.statBonuses[currentTemplate.primaryStat] || 0;
    if (template.primaryValue > currentPrimary) {
      // Unequip current, equip new — drop at adjacent tile
      const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      let dropX = player.x, dropY = player.y;
      for (const [dx, dy] of dirs) {
        const nx = player.x + dx, ny = player.y + dy;
        if (G.dungeon && G.dungeon.grid[ny] && G.dungeon.grid[ny][nx] === TILE.FLOOR) {
          dropX = nx; dropY = ny;
          break;
        }
      }
      const dropped = { type: 'equipment', templateKey: current.templateKey, x: dropX, y: dropY, collected: false };
      G.items.push(dropped);
      player.equipment[slot] = { templateKey: item.templateKey };
      addLog('Replaced ' + currentTemplate.name + ' with ' + template.name + '!');
    } else {
      // Keep current, drop new on ground at adjacent tile
      const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      let dropX = player.x, dropY = player.y;
      for (const [dx, dy] of dirs) {
        const nx = player.x + dx, ny = player.y + dy;
        if (G.dungeon && G.dungeon.grid[ny] && G.dungeon.grid[ny][nx] === TILE.FLOOR) {
          dropX = nx; dropY = ny;
          break;
        }
      }
      item.x = dropX;
      item.y = dropY;
      item.collected = false;
      G.items.push(item);
      addLog(currentTemplate.name + ' is better than ' + template.name + '.');
    }
  }
  rebuildEquipmentBonuses(player);
  addDamageNumber(player.x, player.y, template.name, EQUIPMENT_RARITIES[template.rarity].color);
}

function checkLevelUp(player) {
  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level++;
    const growth = CLASSES[player.class].statGrowth;
    player.maxHp += growth.hp;
    player.hp = Math.min(player.hp + growth.hp, player.maxHp);
    player.atk += growth.atk;
    player.def += growth.def;
    player.xpToNext = 80 + player.level * 40;
    addLog(`Level up! Now level ${player.level}`);
    addDamageNumber(player.x, player.y, 'LEVEL UP!', '#f1c40f');
  }
}
