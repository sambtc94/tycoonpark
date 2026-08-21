// ═══════════════════════════════════════════════════════
//  MAIN – GAME LOOP & BOOTSTRAP
// ═══════════════════════════════════════════════════════

// ── Game tick ───────────────────────────────────────────
function tick() {
  state.tick++;
  spawnGuest();
  updateGuests();
  updateRides();

  if (state.tick % MONTH_TICKS === 0) {
    monthEnd();
    updateRideList();
  }

  if (state.tick % 30 === 0) {
    updateUI();
  }
}

// ── Game loop (fixed 30 Hz target, speed-scaled) ─────────
// FIX: use dtTarget directly — no second division by speed.
// The for-loop runs `state.speed` ticks per frame to achieve
// 1×, 2×, 3× without altering the interval check.
let lastTime = 0;
const TICK_INTERVAL_MS = 1000 / 30; // ~33 ms between ticks at 1×

function gameLoop(ts) {
  if (!state.paused && ts - lastTime >= TICK_INTERVAL_MS) {
    lastTime = ts;
    for (let i = 0; i < state.speed; i++) {
      tick();
    }
  }
  requestAnimationFrame(gameLoop);
}

// ── Bootstrap ────────────────────────────────────────────
resizeCanvas();
render();
requestAnimationFrame(gameLoop);

updateUI();
updateRideList();
updateObjectivesUI();
selectTool('path');

notify('🎢 Welcome to TycoonPark! Build paths, place rides, and attract guests!', 'positive');
notify('💡 Tip: Lay paths from the entrance, then place rides nearby.', '');
