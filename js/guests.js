// ═══════════════════════════════════════════════════════
//  GUEST SYSTEM
// ═══════════════════════════════════════════════════════

function spawnGuest() {
  if (state.guests.length >= 300) return;

  const weather    = WEATHER_TYPES[state.weather];
  const guestMult  = weather.guestMult;

  let maxPerMonth = Math.floor((state.parkRating / 20) * guestMult);
  for (const c of state.marketing) { maxPerMonth += c.guestBonus; }
  if (state.entryFee > 20) maxPerMonth = Math.floor(maxPerMonth * 0.8);
  if (state.entryFee > 35) maxPerMonth = Math.floor(maxPerMonth * 0.5);

  const perTick = maxPerMonth / MONTH_TICKS;
  if (Math.random() > perTick) return;

  // Find the entrance tile
  let eRow = ENT_ROW, eCol = ENT_COL;
  outer:
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (state.grid[r][c].type === 'entrance') { eRow = r; eCol = c; break outer; }
    }
  }

  const g = {
    id:         state.nextId(),
    name:       GUEST_NAMES[Math.floor(Math.random() * GUEST_NAMES.length)],
    color:      GUEST_COLORS[Math.floor(Math.random() * GUEST_COLORS.length)],
    row:        eRow,
    col:        eCol,
    offsetX:    Math.random() * 8 - 4,
    offsetY:    Math.random() * 8 - 4,
    happiness:  70 + Math.floor(Math.random() * 20),
    hunger:     0,
    thirst:     0,
    energy:     100,
    nausea:     0,
    cash:       state.entryFee + 20 + Math.floor(Math.random() * 40),
    ridesRidden: 0,
    state:      'wander',   // wander | goingToRide | goingToShop
    stateTimer: 0,
    rideTarget: null,
  };

  state.guests.push(g);
  earn(state.entryFee);
  state.totalEarned += state.entryFee;
  state.stats.totalGuests++;
}

function updateGuests() {
  const weather   = WEATHER_TYPES[state.weather];
  const toRemove  = [];

  for (const g of state.guests) {
    // Passive stat drift
    g.hunger  = Math.min(100, g.hunger  + 0.03);
    g.thirst  = Math.min(100, g.thirst  + 0.04);
    g.energy  = Math.max(0,   g.energy  - 0.015);
    g.nausea  = Math.max(0,   g.nausea  - 0.02);

    // Happiness drivers
    let happyChange = weather.happyMod * 0.002;
    if (g.hunger  > 70) happyChange -= 0.05;
    if (g.thirst  > 70) happyChange -= 0.06;
    if (g.nausea  > 60) happyChange -= 0.08;
    if (g.energy  < 20) happyChange -= 0.04;
    happyChange += state.staff.entertainer * 0.005;
    g.happiness = Math.max(0, Math.min(100, g.happiness + happyChange));

    // State machine
    g.stateTimer = Math.max(0, g.stateTimer - 1);

    if (g.state === 'wander' && g.stateTimer === 0) {
      if (g.hunger > 60) {
        const food = nearestShop(g, 'food');
        if (food) { g.state = 'goingToShop'; g.rideTarget = food; }
      } else if (g.thirst > 60) {
        const drink = nearestShop(g, 'drink');
        if (drink) { g.state = 'goingToShop'; g.rideTarget = drink; }
      } else {
        const ride = pickRide(g);
        if (ride) { g.state = 'goingToRide'; g.rideTarget = ride; }
      }
      g.stateTimer = 30 + Math.floor(Math.random() * 60);
    }

    if (g.state === 'goingToRide' || g.state === 'goingToShop') {
      if (g.rideTarget) {
        const dr = g.rideTarget.row - g.row;
        const dc = g.rideTarget.col - g.col;
        if (Math.abs(dr) + Math.abs(dc) <= 1) {
          if (g.state === 'goingToRide') rideGuest(g, g.rideTarget);
          else                           shopGuest(g, g.rideTarget);
          g.state      = 'wander';
          g.stateTimer = 20 + Math.floor(Math.random() * 40);
        } else {
          if (Math.random() < 0.5) g.row += Math.sign(dr);
          else                     g.col += Math.sign(dc);
          g.row = Math.max(0, Math.min(GRID_ROWS - 1, g.row));
          g.col = Math.max(0, Math.min(GRID_COLS - 1, g.col));
        }
      } else {
        g.state = 'wander';
      }
    }

    // Random wander step
    if (g.state === 'wander' && Math.random() < 0.05) {
      const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
      const [dr, dc] = dirs[Math.floor(Math.random() * 4)];
      g.row = Math.max(0, Math.min(GRID_ROWS - 1, g.row + dr));
      g.col = Math.max(0, Math.min(GRID_COLS - 1, g.col + dc));
    }

    // Leaving conditions
    if (g.happiness < 10 || g.cash <= 0 || g.energy < 5) {
      toRemove.push(g.id);
    }
  }

  for (const id of toRemove) {
    const idx = state.guests.findIndex(g => g.id === id);
    if (idx !== -1) state.guests.splice(idx, 1);
  }
}

function nearestShop(g, shopType) {
  let best = null, bestDist = 9999;
  for (const r of state.rides) {
    if (r.rideType !== shopType) continue;
    if (r.status === 'closed') continue;
    const d = Math.abs(r.row - g.row) + Math.abs(r.col - g.col);
    if (d < bestDist) { bestDist = d; best = r; }
  }
  return best;
}

function pickRide(g) {
  const available = state.rides.filter(r =>
    r.category !== 'shop' &&
    r.status === 'open' &&
    r.nausea <= g.nausea + 30 &&
    g.cash   >= state.ridePrice * r.ticketMult
  );
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

function rideGuest(g, ride) {
  if (ride.status !== 'open') return;
  const cost = Math.floor(state.ridePrice * ride.ticketMult * 100) / 100;
  if (g.cash < cost) return;

  g.cash -= cost;
  earn(cost);
  state.totalEarned += cost;
  ride.totalRiders++;
  ride.income += cost;
  g.ridesRidden++;
  g.energy    = Math.min(100, g.energy    + 5);
  g.happiness = Math.min(100, g.happiness + ride.excitement * 2);
  g.nausea    = Math.min(100, g.nausea    + ride.nausea * 2);
  ride.queue  = Math.max(0, (ride.queue || 0) - 1);
  state.stats.ridesRidden++;
}

function shopGuest(g, shop) {
  if (shop.rideType === 'food') {
    const cost = state.foodPrice;
    if (g.cash < cost) return;
    g.cash -= cost;
    earn(cost);
    state.totalEarned += cost;
    g.hunger    = Math.max(0, g.hunger - 60);
    g.happiness = Math.min(100, g.happiness + 5);
    state.stats.foodSold++;

  } else if (shop.rideType === 'drink') {
    const cost = state.drinkPrice;
    if (g.cash < cost) return;
    g.cash -= cost;
    earn(cost);
    state.totalEarned += cost;
    g.thirst    = Math.max(0, g.thirst - 70);
    g.happiness = Math.min(100, g.happiness + 4);
    state.stats.drinkSold++;

  } else if (shop.rideType === 'souvenir') {
    const cost = 5;
    if (g.cash < cost) return;
    g.cash -= cost;
    earn(cost);
    state.totalEarned += cost;
    g.happiness = Math.min(100, g.happiness + 3);
  }
}
