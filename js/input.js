// ═══════════════════════════════════════════════════════
//  INPUT HANDLING (mouse, keyboard, scroll)
// ═══════════════════════════════════════════════════════

let isDragging  = false;
let dragStartX  = 0, dragStartY  = 0;
let camStartX   = 0, camStartY   = 0;
let hoverRow    = -1, hoverCol   = -1;

canvas.addEventListener('mousedown', e => {
  // Middle-click or right-click (or Shift+click) → pan
  if (e.button === 1 || e.button === 2 || e.shiftKey) {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    camStartX  = camX;
    camStartY  = camY;
    wrapper.classList.add('move-cursor');
    return;
  }

  const rect         = canvas.getBoundingClientRect();
  const [row, col]   = screenToGrid(e.clientX - rect.left, e.clientY - rect.top);
  handleTileClick(row, col);
});

canvas.addEventListener('mousemove', e => {
  if (isDragging) {
    camX = camStartX + (dragStartX - e.clientX);
    camY = camStartY + (dragStartY - e.clientY);
    return;
  }

  const rect       = canvas.getBoundingClientRect();
  const [row, col] = screenToGrid(e.clientX - rect.left, e.clientY - rect.top);
  hoverRow = row;
  hoverCol = col;

  if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
    const t   = state.grid[row][col];
    const obj = t.object;
    document.getElementById('tile-coords').textContent =
      `[${row},${col}] ${t.type}${obj ? ' – ' + obj.name : ''}`;
  }
});

canvas.addEventListener('mouseup',   () => { isDragging = false; wrapper.classList.remove('move-cursor'); });
canvas.addEventListener('mouseleave',() => { isDragging = false; wrapper.classList.remove('move-cursor'); });
canvas.addEventListener('contextmenu', e => e.preventDefault());

// Scroll to pan
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  camX += e.deltaX;
  camY += e.deltaY;
}, { passive: false });

// ── Tile interaction ──────────────────────────────────────
function handleTileClick(row, col) {
  if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return;

  const tile = state.grid[row][col];
  const tool = state.selectedTool;

  // Clicking an existing object (not bulldozing) → open info
  if (tile.object && tool !== 'bulldoze') {
    openRideInfo(tile.object);
    return;
  }

  switch (tool) {
    case 'bulldoze':
      bulldozeTile(row, col);
      break;

    case 'path':
      placePath(row, col);
      break;

    case 'entrance':
      placeEntrance(row, col);
      break;

    default: {
      const rDef = RIDE_TYPES[tool];
      if (rDef) { placeRide(row, col, tool, rDef); break; }

      const sDef = SCENERY_TYPES[tool];
      if (sDef) { placeScenery(row, col, tool, sDef); break; }
    }
  }
}
