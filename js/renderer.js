let canvas, ctx;

function initRenderer() {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  window.addEventListener('resize', resizeCanvas);
}

function ensureCanvasSize() {
  const rect = canvas.getBoundingClientRect();
  const w = Math.floor(rect.width);
  const h = Math.floor(rect.height);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width);
  canvas.height = Math.floor(rect.height);
}

function computeTileSize() {
  return Math.min(canvas.width / 14, canvas.height / 12, 48);
}

function render() {
  if (G.screen !== 'game') return;
  ensureCanvasSize();
  const tileSize = computeTileSize();
  const { player, dungeon, enemies, items } = G;

  // Camera follows player
  G.camera.x += (player.x - G.camera.x) * 0.1;
  G.camera.y += (player.y - G.camera.y) * 0.1;

  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  const camX = (G.camera.x - 7) * tileSize;
  const camY = (G.camera.y - 5) * tileSize;
  ctx.translate(-camX, -camY);

  // Draw tiles
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const sx = x * tileSize;
      const sy = y * tileSize;
      const dx2 = x - player.x, dy2 = y - player.y;
      const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

      if (dist2 > 12) continue;

      const explored = G.explored[y][x];
      if (!explored) continue;

      const visible = dist2 <= 7;
      const alpha = visible ? 1 : 0.3;

      const tile = dungeon.grid[y][x];
      if (tile === TILE.WALL) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = G.dungeon.biome.wallColor;
        ctx.fillRect(sx, sy, tileSize, tileSize);
        ctx.strokeStyle = G.dungeon.biome.wallStroke;
        ctx.strokeRect(sx, sy, tileSize, tileSize);
      } else if (tile === TILE.FLOOR || tile === TILE.STAIRS) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = G.dungeon.biome.floorColor;
        ctx.fillRect(sx, sy, tileSize, tileSize);
        ctx.strokeStyle = G.dungeon.biome.floorStroke;
        ctx.strokeRect(sx, sy, tileSize, tileSize);
        if (tile === TILE.STAIRS) {
          ctx.fillStyle = '#f1c40f';
          ctx.font = `${tileSize * 0.6}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('>', sx + tileSize / 2, sy + tileSize / 2);
        }
      }
    }
  }

  // Draw walls from Ice Wall ability
  ctx.globalAlpha = 1;
  for (const w of G.walls) {
    const sx = w.x * tileSize;
    const sy = w.y * tileSize;
    ctx.fillStyle = '#74b9ff';
    ctx.globalAlpha = Math.min(1, w.timer);
    ctx.fillRect(sx + 2, sy + 2, tileSize - 4, tileSize - 4);
  }

  // Draw items
  for (const item of items) {
    if (item.collected) continue;
    const dx2 = item.x - player.x, dy2 = item.y - player.y;
    if (Math.sqrt(dx2 * dx2 + dy2 * dy2) > 8) continue;
    ctx.globalAlpha = G.explored[item.y][item.x] ? 1 : 0.3;
    if (item.type === 'equipment') {
      const template = EQUIPMENT_TEMPLATES[item.templateKey];
      const color = EQUIPMENT_RARITIES[template.rarity].color;
      ctx.fillStyle = color;
      const cx = item.x * tileSize + tileSize / 2;
      const cy = item.y * tileSize + tileSize / 2;
      const r = tileSize * 0.25;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
      ctx.fill();
    } else {
      const t = ITEM_TEMPLATES[item.itemType];
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.arc(item.x * tileSize + tileSize / 2, item.y * tileSize + tileSize / 2, tileSize * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw enemies
  for (const e of enemies) {
    if (e.hp <= 0) continue;
    const dx2 = e.x - player.x, dy2 = e.y - player.y;
    if (Math.sqrt(dx2 * dx2 + dy2 * dy2) > 8) continue;
    const alpha = G.explored[e.y][e.x] ? 1 : 0.3;
    ctx.globalAlpha = alpha;

    // Body
    ctx.fillStyle = e.color;
    ctx.fillRect(e.x * tileSize + tileSize * 0.15, e.y * tileSize + tileSize * 0.15, tileSize * 0.7, tileSize * 0.7);

    // HP bar
    const hpRatio = e.hp / e.maxHp;
    ctx.fillStyle = '#333';
    ctx.fillRect(e.x * tileSize + tileSize * 0.1, e.y * tileSize - 4, tileSize * 0.8, 4);
    ctx.fillStyle = hpRatio > 0.5 ? '#2ecc71' : hpRatio > 0.25 ? '#f39c12' : '#e74c3c';
    ctx.fillRect(e.x * tileSize + tileSize * 0.1, e.y * tileSize - 4, tileSize * 0.8 * hpRatio, 4);

    // Boss indicator
    if (e.isBoss) {
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 2;
      ctx.strokeRect(e.x * tileSize + 1, e.y * tileSize + 1, tileSize - 2, tileSize - 2);
    }
  }

  // Draw player
  ctx.globalAlpha = 1;
  const px = player.x * tileSize;
  const py = player.y * tileSize;
  ctx.fillStyle = player.stealth ? '#a29bfe44' : player.color;
  ctx.fillRect(px + tileSize * 0.1, py + tileSize * 0.1, tileSize * 0.8, tileSize * 0.8);
  // Player outline
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(px + tileSize * 0.1, py + tileSize * 0.1, tileSize * 0.8, tileSize * 0.8);

  // Facing indicator
  const dirs = { up: [0.5, 0.15], down: [0.5, 0.85], left: [0.15, 0.5], right: [0.85, 0.5] };
  const [fx, fy] = dirs[player.facing] || [0.5, 0.85];
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(px + tileSize * fx, py + tileSize * fy, tileSize * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Draw damage numbers
  for (const dn of G.damageNumbers) {
    ctx.globalAlpha = dn.life;
    ctx.fillStyle = dn.color;
    ctx.font = `bold ${Math.max(12, tileSize * 0.35)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dn.value, dn.x * tileSize + tileSize / 2, (dn.y - (1 - dn.life) * 1.5) * tileSize);
  }

  // Draw particles
  for (const p of G.particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x * tileSize, p.y * tileSize, tileSize * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // Draw minimap
  drawMinimap();

  // Draw joystick visual
  drawJoystickZone();
}

function drawJoystickZone() {
  const zone = document.getElementById('joystick-zone');
  if (!zone) return;
  let canvas = zone.querySelector('canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    zone.appendChild(canvas);
  }
  const ctx = canvas.getContext('2d');
  const w = zone.clientWidth;
  const h = zone.clientHeight;
  if (w === 0 || h === 0) return;
  canvas.width = w;
  canvas.height = h;

  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.35;

  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawMinimap() {
  const mm = document.getElementById('minimap');
  let mc = mm.querySelector('canvas');
  if (!mc) {
    mc = document.createElement('canvas');
    mm.appendChild(mc);
  }
  const mctx = mc.getContext('2d');

  const size = mm.clientWidth || 80;
  mc.width = size;
  mc.height = size;
  mctx.fillStyle = '#0a0a0a';
  mctx.fillRect(0, 0, size, size);

  // Invalidate cache on resize
  if (G.minimapCache && (G.minimapCache.width !== size || G.minimapCache.height !== size)) {
    G.minimapCache = null;
    G.minimapDirty = true;
  }

  const scale = size / GRID_W;

  // Draw cached tile layer
  if (G.minimapDirty) {
    G.minimapDirty = false;
    if (!G.minimapCache) {
      G.minimapCache = document.createElement('canvas');
    }
    G.minimapCache.width = size;
    G.minimapCache.height = size;
    const cctx = G.minimapCache.getContext('2d');
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        if (!G.explored[y][x]) continue;
        if (G.dungeon.grid[y][x] === TILE.WALL) {
          cctx.fillStyle = G.dungeon.biome.wallColor;
        } else {
          cctx.fillStyle = G.dungeon.biome.floorColor;
        }
        cctx.fillRect(x * scale, y * scale, scale + 0.5, scale + 0.5);
      }
    }
  }
  mctx.drawImage(G.minimapCache, 0, 0);

  // Player dot
  mctx.fillStyle = '#e74c3c';
  mctx.beginPath();
  mctx.arc(G.player.x * scale, G.player.y * scale, 3, 0, Math.PI * 2);
  mctx.fill();

  // Stairs marker
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      if (!G.explored[y][x]) continue;
      if (G.dungeon.grid[y][x] === TILE.STAIRS) {
        mctx.fillStyle = '#f1c40f';
        mctx.fillRect(x * scale, y * scale, scale + 0.5, scale + 0.5);
      }
    }
  }

  // Enemy dots
  for (const e of G.enemies) {
    if (e.hp <= 0) continue;
    mctx.fillStyle = e.isBoss ? '#c0392b' : '#e67e22';
    mctx.fillRect(e.x * scale - 1, e.y * scale - 1, 2, 2);
  }
}
