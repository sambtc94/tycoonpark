// ═══════════════════════════════════════════════════════
//  RENDERING
// ═══════════════════════════════════════════════════════

const canvas  = document.getElementById('game-canvas');
const ctx     = canvas.getContext('2d');
const wrapper = document.getElementById('canvas-wrapper');

let camX = 0, camY = 0;

// ── Coordinate helpers ──────────────────────────────────
function isoToScreen(row, col) {
  const x = (col - row) * (TILE_W / 2);
  const y = (col + row) * (TILE_H / 2);
  return [x - camX, y - camY];
}

function screenToGrid(sx, sy) {
  const wx = sx + camX;
  const wy = sy + camY;
  const col = (wx / (TILE_W / 2) + wy / (TILE_H / 2)) / 2;
  const row = (wy / (TILE_H / 2) - wx / (TILE_W / 2)) / 2;
  return [Math.round(row), Math.round(col)];
}

// ── Canvas resize ───────────────────────────────────────
function resizeCanvas() {
  canvas.width  = wrapper.clientWidth;
  canvas.height = wrapper.clientHeight;
  if (camX === 0 && camY === 0) {
    const [cx, cy] = isoToScreen(Math.floor(GRID_ROWS / 2), Math.floor(GRID_COLS / 2));
    camX = cx - canvas.width  / 2;
    camY = cy - canvas.height / 2;
  }
}

window.addEventListener('resize', resizeCanvas);

// ── Tile drawing ────────────────────────────────────────
function drawTile(row, col) {
  const tile = state.grid[row][col];
  const [sx, sy] = isoToScreen(row, col);

  // Frustum culling
  if (sx < -TILE_W * 2 || sx > canvas.width  + TILE_W * 2) return;
  if (sy < -TILE_H * 3 || sy > canvas.height + TILE_H * 3) return;

  // Diamond corner points
  const pts = [
    [sx,             sy - TILE_H / 2],
    [sx + TILE_W / 2, sy],
    [sx,             sy + TILE_H / 2],
    [sx - TILE_W / 2, sy],
  ];

  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  ctx.lineTo(...pts[1]);
  ctx.lineTo(...pts[2]);
  ctx.lineTo(...pts[3]);
  ctx.closePath();

  // Ground fill
  let fill;
  if (tile.type === 'grass') {
    fill = GRASS_SHADES[(row * 7 + col * 3) % GRASS_SHADES.length];
  } else if (tile.type === 'path') {
    fill = '#8b7355';
  } else if (tile.type === 'entrance') {
    fill = '#e94560';
  } else {
    fill = '#555';
  }

  ctx.fillStyle = fill;
  ctx.fill();

  // Hover highlight
  if (row === hoverRow && col === hoverCol) {
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  if (tile.object) {
    drawObject(tile.object, sx, sy);
  }
}

// ── Object (ride / shop / scenery) drawing ──────────────
function drawObject(obj, sx, sy) {
  const s   = obj.size || 1;
  const bw  = TILE_W * s * 0.7;
  const bh  = TILE_H * s * 1.8;
  const bx  = sx - bw / 2;
  const by  = sy - bh + TILE_H * 0.4;

  if (obj.category === 'shop' || obj.type === 'scenery') {
    ctx.fillStyle = obj.color || '#888';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh * 0.6, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  } else {
    // Ride structure
    ctx.fillStyle = obj.color || '#888';
    ctx.fillRect(bx, by + bh * 0.55, bw, bh * 0.08);

    ctx.strokeStyle = obj.color || '#888';
    ctx.lineWidth = 3;
    ctx.beginPath();

    if (obj.rideType === 'coaster' || obj.rideType === 'looper') {
      ctx.moveTo(bx + 4, by + bh * 0.55);
      ctx.bezierCurveTo(bx + bw * 0.2, by, bx + bw * 0.8, by, bx + bw - 4, by + bh * 0.55);
    } else if (obj.rideType === 'drop') {
      ctx.moveTo(sx, by);
      ctx.lineTo(sx, by + bh * 0.55);
    } else if (obj.rideType === 'ferris') {
      ctx.arc(sx, by + bh * 0.3, bw * 0.38, 0, Math.PI * 2);
    } else {
      ctx.moveTo(bx + 4,       by + bh * 0.55);
      ctx.lineTo(bx + bw / 2,  by + bh * 0.1);
      ctx.lineTo(bx + bw - 4,  by + bh * 0.55);
    }
    ctx.stroke();
  }

  // Emoji icon
  ctx.font = `${14 + s * 4}px serif`;
  ctx.textAlign = 'center';
  ctx.fillText(obj.icon || '?', sx, sy - bh * 0.05);

  // Status label
  if (obj.status === 'closed') {
    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('CLOSED', sx, by - 4);
  } else if (obj.status === 'maintenance') {
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('MAINT', sx, by - 4);
  }

  // Queue indicator
  if (obj.queue && obj.queue > 0) {
    ctx.fillStyle = '#ffd700';
    ctx.font = '10px sans-serif';
    ctx.fillText(`⏳${obj.queue}`, sx + bw * 0.3, by + bh * 0.55 + 14);
  }
}

// ── Guest drawing ───────────────────────────────────────
function drawGuest(g) {
  const [sx, sy] = isoToScreen(g.row, g.col);
  if (sx < -20 || sx > canvas.width + 20 || sy < -20 || sy > canvas.height + 20) return;

  ctx.beginPath();
  ctx.arc(sx + g.offsetX, sy + g.offsetY - 8, 4, 0, Math.PI * 2);
  ctx.fillStyle = g.color;
  ctx.fill();

  if (g.happiness < 30) {
    ctx.font = '8px serif';
    ctx.fillText('😢', sx + g.offsetX - 4, sy + g.offsetY - 14);
  } else if (g.happiness > 80) {
    ctx.font = '8px serif';
    ctx.fillText('😄', sx + g.offsetX - 4, sy + g.offsetY - 14);
  }
}

// ── Main render loop ────────────────────────────────────
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#0a0a2e');
  sky.addColorStop(1, '#1a1a4e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      drawTile(r, c);
    }
  }

  for (const g of state.guests) {
    drawGuest(g);
  }

  requestAnimationFrame(render);
}
