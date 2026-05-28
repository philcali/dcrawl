function renderCharacterSelect() {
  const container = document.getElementById('class-cards');
  container.innerHTML = Object.entries(CLASSES).map(([key, cls]) => `
    <div class="class-card ${G && G.selectedClass === key ? 'selected' : ''}" onclick="selectClass('${key}')">
      <div class="icon" style="color:${cls.color}">${cls.icon}</div>
      <div class="name">${cls.name}</div>
      <div class="stats">HP:${cls.stats.hp} ATK:${cls.stats.atk} DEF:${cls.stats.def}</div>
      <div class="abilities">
        <div>${cls.standardAttack.name}: ${cls.standardAttack.desc}</div>
        ${cls.abilities.map(a => `<div>${a.name}: ${a.desc}</div>`).join('')}
      </div>
    </div>
  `).join('');
  const saveBtn = document.getElementById('btn-continue');
  if (saveBtn) {
    saveBtn.style.display = loadGame() ? 'block' : 'none';
  }
}

function selectClass(classKey) {
  G.selectedClass = classKey;
  renderCharacterSelect();
  document.getElementById('btn-start').disabled = false;
}

function updateHUD() {
  if (G.screen !== 'game' || !G.player) return;
  document.getElementById('hud-level').textContent = `Depth ${G.level}`;
  document.getElementById('hud-hp').textContent = `HP: ${G.player.hp}/${getEffectiveStat(G.player, 'maxHp')}`;
  document.getElementById('hud-xp').textContent = `L${G.player.level} - XP: ${G.player.xp}/${G.player.xpToNext}`;

  for (let i = 0; i < 2; i++) {
    const btn = document.getElementById(`btn-ability${i + 1}`);
    const ability = G.player.abilities[i + 1];
    if (ability) {
      if (ability.cooldownTimer > 0) {
        btn.disabled = true;
        btn.textContent = `${ability.name} (${Math.ceil(ability.cooldownTimer)})`;
      } else {
        btn.disabled = false;
        btn.textContent = ability.name;
      }
      btn.style.borderColor = ability.cooldownTimer > 0 ? '#444' : G.player.color;
    }
  }

  // Attack button
  const atkBtn = document.getElementById('btn-attack');
  const atkAbility = G.player.abilities[0];
  if (atkAbility) {
    if (atkAbility.cooldownTimer > 0) {
      atkBtn.disabled = true;
      atkBtn.textContent = `${atkAbility.name} (${Math.ceil(atkAbility.cooldownTimer)})`;
    } else {
      atkBtn.disabled = false;
      atkBtn.textContent = atkAbility.name;
    }
  }

  // Dynamic ability buttons beyond index 2
  for (let i = 3; i < G.player.abilities.length && i <= 8; i++) {
    let btn = document.getElementById(`btn-ability${i}`);
    const ability = G.player.abilities[i];
    if (!btn && ability) {
      btn = document.createElement('button');
      btn.id = `btn-ability${i}`;
      btn.className = 'action-btn';
      btn.style.maxWidth = '110px';
      document.getElementById('combat-controls').insertBefore(btn, document.getElementById('btn-descend'));
      // Wire click handler for dynamic buttons
      (function(idx) {
        btn.addEventListener('click', () => { if (G && G.player) playerAttack(idx); });
      })(i);
    }
    if (btn && ability) {
      if (ability.cooldownTimer > 0) {
        btn.disabled = true;
        btn.textContent = `${ability.name} (${Math.ceil(ability.cooldownTimer)})`;
      } else {
        btn.disabled = false;
        btn.textContent = ability.name;
      }
      btn.style.borderColor = ability.cooldownTimer > 0 ? '#444' : G.player.color;
    }
  }

  // Descend button
  const descendBtn = document.getElementById('btn-descend');
  const tile = G.dungeon ? G.dungeon.grid[G.player.y][G.player.x] : 0;
  descendBtn.style.display = tile === TILE.STAIRS ? 'block' : 'none';

  // Game over check
  if (G.player.hp <= 0) {
    G.player.hp = 0;
    showGameOver('defeat');
  }
}

function populateGameOver() {
  const title = document.getElementById('result-title');
  const sub = document.getElementById('result-sub');
  if (G.winner === 'victory') {
    title.textContent = 'Victory!';
    title.style.color = '#f1c40f';
    sub.textContent = `You defeated the Dark Lord at level ${G.player.level}!`;
    playSound('victory');
  } else {
    title.textContent = 'Defeat';
    title.style.color = '#e74c3c';
    sub.textContent = `You fell on level ${G.level} at level ${G.player.level}.`;
    playSound('death');
  }
}

function renderStatusPage() {
  const slots = document.getElementById('equipment-slots');
  const stats = document.getElementById('stats-breakdown');
  const skills = document.getElementById('skills-list');
  if (!slots || !stats || !skills) return;

  const slotNames = { weapon: 'Weapon', offhand: 'Off-Hand', head: 'Head', body: 'Body' };
  const slotKeys = ['weapon', 'offhand', 'head', 'body'];

  // Equipment section
  slots.innerHTML = slotKeys.map(slot => {
    const item = G.player.equipment[slot];
    if (!item) {
      return `<div class="equip-slot empty"><div class="slot-name">${slotNames[slot]}</div><div class="item-name" style="color:#666">Empty</div></div>`;
    }
    const template = EQUIPMENT_TEMPLATES[item.templateKey];
    const rarityColor = EQUIPMENT_RARITIES[template.rarity].color;
    const statText = Object.entries(template.statBonuses).map(([s, v]) => `+${v} ${s.toUpperCase()}`).join(' ');
    let skillText = '';
    if (template.skillGrant && EQUIPMENT_SKILLS[template.skillGrant]) {
      skillText = `<div class="item-skill">Skill: ${EQUIPMENT_SKILLS[template.skillGrant].name}</div>`;
    }
    return `<div class="equip-slot equipped" style="--rarity-color:${rarityColor}"><div class="slot-name">${slotNames[slot]}</div><div class="item-name" style="color:${rarityColor}">${template.name}</div><div class="item-stats">${statText}</div>${skillText}</div>`;
  }).join('');

  // Stats breakdown
  const statsList = [
    { label: 'ATK', base: G.player.atk, bonus: G.player.equipmentBonuses.atk },
    { label: 'DEF', base: G.player.def, bonus: G.player.equipmentBonuses.def },
    { label: 'Max HP', base: G.player.maxHp, bonus: G.player.equipmentBonuses.maxHp },
  ];
  stats.innerHTML = statsList.map(s => {
    const total = s.base + s.bonus;
    return `<div class="stat-row"><span class="stat-label">${s.label}</span><span class="stat-value bonus">+${s.bonus}</span><span class="stat-value total">${total}</span></div>`;
  }).join('') + `<div class="stat-row" style="border-top:1px solid #444;margin-top:0.3rem;padding-top:0.4rem"><span class="stat-label">Level</span><span class="stat-value total">${G.player.level}</span></div>`;

  // Skills list
  skills.innerHTML = G.player.abilities.map((ability, i) => {
    const isGear = ability.isGearSkill;
    return `<div class="skill-item"><span class="skill-name">${ability.name}</span>${isGear ? '<span class="skill-gear">(Gear)</span>' : ''}<span class="skill-cooldown">[${ability.cooldown}s]</span><div class="skill-desc">${ability.desc || ''}</div></div>`;
  }).join('');
}
