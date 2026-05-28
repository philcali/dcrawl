let lastTime = 0;

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  if (G && G.screen === 'game' && !G.gameOver && !G.statusPageOpen) {
    processInput(dt);
    updateExplored(G.player, G.explored, G.dungeon.grid);
    updateEnemies(dt);
    updateCooldowns(dt);
    updateDamageNumbers(dt);
    updateParticles(dt);
    render();
    updateHUD();
  }

  requestAnimationFrame(gameLoop);
}

function updateDamageNumbers(dt) {
  for (let i = G.damageNumbers.length - 1; i >= 0; i--) {
    G.damageNumbers[i].life -= dt * 0.8;
    if (G.damageNumbers[i].life <= 0) G.damageNumbers.splice(i, 1);
  }
}

function updateParticles(dt) {
  for (let i = G.particles.length - 1; i >= 0; i--) {
    const p = G.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) G.particles.splice(i, 1);
  }
}

function init() {
  G = createInitialState();
  renderCharacterSelect();
  initRenderer();
  initControls();
  transitionTo('character-select');
  requestAnimationFrame(gameLoop);
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', init);
