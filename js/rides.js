// ═══════════════════════════════════════════════════════
//  RIDE PLACEMENT & MAINTENANCE
// ═══════════════════════════════════════════════════════

function placePath(row, col) {
  if (!canAfford(25)) return;
  if (state.grid[row][col].type !== 'grass') { notify('Tile already occupied!', 'warning'); return; }
  spend(25);
  state.grid[row][col] = { type: 'path', object: null };
}

function placeEntrance(row, col) {
  if (!canAfford(500)) return;
  if (state.grid[row][col].type !== 'grass') { notify('Need empty land!', 'warning'); return; }
  spend(500);
  state.grid[row][col] = { type: 'entrance', object: null };
}

function placeRide(row, col, rideType, def) {
  if (!canAfford(def.cost)) return;
  const tile = state.grid[row][col];
  if (tile.object) { notify('Tile occupied!', 'warning'); return; }
  if (tile.type === 'entrance') { notify("Can't build on the entrance!", 'warning'); return; }

  spend(def.cost);
  tile.type = 'built';

  const ride = {
    id:          state.nextId(),
    rideType,
    name:        def.name,
    icon:        def.icon,
    color:       def.color,
    category:    def.category,
    cost:        def.cost,
    excitement:  def.excitement + (Math.random() * 0.5 - 0.25),
    intensity:   def.intensity,
    nausea:      def.nausea,
    capacity:    def.capacity,
    ticketMult:  def.ticketMult,
    size:        def.size,
    status:      'open',          // open | closed | maintenance
    queue:       0,
    riderCount:  0,
    totalRiders: 0,
    income:      0,
    breakdown:   0,
    maintenanceDue: 0,
    row,
    col,
    age: 0,
  };

  tile.object = ride;
  state.rides.push(ride);
  notify(`${def.icon} ${def.name} built! Cost $${def.cost.toLocaleString()}`, 'positive');
  updateRideList();
}

function placeScenery(row, col, sType, def) {
  if (!canAfford(def.cost)) return;
  const tile = state.grid[row][col];
  if (tile.object) { notify('Tile occupied!', 'warning'); return; }
  spend(def.cost);
  tile.type = 'scenery';
  tile.object = {
    id:       state.nextId(),
    type:     'scenery',
    category: 'scenery',
    name:     sType,
    icon:     def.icon,
    color:    '#666',
    size:     1,
    row,
    col,
  };
}

function bulldozeTile(row, col) {
  const tile = state.grid[row][col];
  if (tile.type === 'grass')    { notify('Nothing to bulldoze.', 'warning'); return; }
  if (tile.type === 'entrance') { notify("Can't remove the entrance!", 'warning'); return; }
  if (!canAfford(5)) return;

  spend(5);

  if (tile.object && tile.object.id) {
    const idx = state.rides.findIndex(r => r.id === tile.object.id);
    if (idx !== -1) {
      const refund = Math.floor((tile.object.cost || 0) * 0.25);
      earn(refund);
      notify(`Demolished. Refund: $${refund}`, 'warning');
      state.rides.splice(idx, 1);
    }
  }

  state.grid[row][col] = { type: 'grass', object: null };
  updateRideList();
}

// ── Ride maintenance simulation ─────────────────────────
function updateRides() {
  const mechEfficiency = 1 + state.staff.mechanic * 0.15;

  for (const ride of state.rides) {
    if (ride.category === 'shop') continue;

    ride.age++;

    // Update queue length estimate
    ride.queue = Math.max(0, Math.min(
      ride.capacity * 3,
      Math.floor(state.guests.length * 0.08 * (ride.excitement / 8))
    ));

    // Random breakdown
    if (ride.status === 'open') {
      const breakProb = 0.0005 * (1 + ride.age * 0.001) / mechEfficiency;
      if (Math.random() < breakProb) {
        ride.status        = 'maintenance';
        ride.maintenanceDue = 120 + Math.floor(Math.random() * 180);
        notify(`⚠️ ${ride.name} broke down! Mechanic dispatched.`, 'warning');
        state.parkRating = Math.max(0, state.parkRating - 10);
      }
    }

    // Repair countdown
    if (ride.status === 'maintenance') {
      ride.maintenanceDue = Math.max(0, ride.maintenanceDue - mechEfficiency);
      if (ride.maintenanceDue <= 0) {
        ride.status = 'open';
        notify(`✅ ${ride.name} repaired and re-opened!`, 'positive');
      }
    }
  }
}
