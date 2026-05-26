function createPlayer(classKey) {
  const cls = CLASSES[classKey];
  const abilities = cls.abilities.map(a => ({ ...a, cooldownTimer: 0 }));
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
  };
}

function applyItem(item, player) {
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
      break;
  }
  addLog(`Picked up ${t.name}`);
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
