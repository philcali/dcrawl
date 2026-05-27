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
}

function selectClass(classKey) {
  G.selectedClass = classKey;
  renderCharacterSelect();
  document.getElementById('btn-start').disabled = false;
}

function updateHUD() {
  if (G.screen !== 'game' || !G.player) return;
  document.getElementById('hud-level').textContent = `Depth ${G.level}`;
  document.getElementById('hud-hp').textContent = `HP: ${G.player.hp}/${G.player.maxHp}`;
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
