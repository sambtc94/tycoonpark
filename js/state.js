// ═══════════════════════════════════════════════════════
//  GAME STATE
// ═══════════════════════════════════════════════════════

const state = {
  cash: 50000,
  loans: 0,
  monthlyIncome: 0,
  monthlyExpenses: 0,
  monthlyProfit: 0,
  // Accumulators reset each month – only incremented by spend()/earn() wrappers
  tickAccumIncome: 0,
  tickAccumExpenses: 0,

  year: 1,
  month: 1,
  tick: 0,
  speed: 1,
  paused: false,

  parkRating: 650,
  entryFee: 15,
  ridePrice: 3,
  foodPrice: 4,
  drinkPrice: 3,

  staff: { mechanic: 2, janitor: 2, entertainer: 1, security: 1 },

  weather: 0,
  temperature: 24,
  weatherChangeIn: 3,

  guests: [],
  rides: [],
  grid: [],       // [row][col] = tile object

  selectedTool: 'path',

  marketing: [],  // active campaigns { id, monthsLeft, guestBonus }

  objectives: [
    { text: 'Reach 50 guests',        target: () => state.guests.length >= 50,                                       done: false },
    { text: 'Earn $100k total',        target: () => state.totalEarned >= 100000,                                     done: false },
    { text: 'Park Rating ≥ 800',       target: () => state.parkRating >= 800,                                         done: false },
    { text: 'Build 5 rides',           target: () => state.rides.filter(r => r.category !== 'shop').length >= 5,      done: false },
    { text: '100 guests at once',      target: () => state.guests.length >= 100,                                      done: false },
    { text: 'Profit $5k in a month',   target: () => state.lastMonthProfit >= 5000,                                   done: false },
  ],
  totalEarned: 0,
  lastMonthProfit: 0,

  idCounter: 0,
  nextId() { return ++this.idCounter; },

  stats: { totalGuests: 0, ridesRidden: 0, foodSold: 0, drinkSold: 0 },
};

// ── Build the tile grid ─────────────────────────────────
(function initGrid() {
  for (let r = 0; r < GRID_ROWS; r++) {
    state.grid[r] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      state.grid[r][c] = { type: 'grass', object: null };
    }
  }

  // Default entrance
  state.grid[ENT_ROW][ENT_COL] = { type: 'entrance', object: null };

  // Short path leading inward from the entrance
  for (let i = 1; i <= 4; i++) {
    state.grid[ENT_ROW - i][ENT_COL] = { type: 'path', object: null };
  }
})();

// ── Finance helpers ─────────────────────────────────────
/**
 * Deduct `amount` from cash and add it to the monthly expense accumulator.
 * Always use this instead of mutating state.cash directly for outgoings.
 */
function spend(amount) {
  state.cash -= amount;
  state.tickAccumExpenses += amount;
}

/**
 * Add `amount` to cash and the monthly income accumulator.
 * Always use this instead of mutating state.cash directly for revenue.
 */
function earn(amount) {
  state.cash += amount;
  state.tickAccumIncome += amount;
}

function canAfford(amount) {
  if (state.cash < amount) {
    notify(`Not enough cash! Need $${amount.toLocaleString()}`, 'warning');
    return false;
  }
  return true;
}
