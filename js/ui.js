// ═══════════════════════════════════════════════════════
//  UI – HUD, MODALS, PANELS
// ═══════════════════════════════════════════════════════

// ── Formatting ──────────────────────────────────────────
function formatMoney(n) {
  const v = Math.abs(n);
  const s = v >= 1000 ? '$' + (v / 1000).toFixed(1) + 'k' : '$' + v.toFixed(0);
  return n < 0 ? '-' + s : s;
}

// ── Notifications ────────────────────────────────────────
function notify(msg, type = '') {
  const container = document.getElementById('notifications');
  const el        = document.createElement('div');
  el.className    = 'notif ' + type;
  el.textContent  = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

// ── Tool selection ───────────────────────────────────────
function selectTool(tool) {
  state.selectedTool = tool;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('selected'));
  const btn = document.getElementById('tool-' + tool);
  if (btn) btn.classList.add('selected');
  document.getElementById('status-text').textContent = getToolHint(tool);
}

function getToolHint(tool) {
  const hints = {
    path:     'Click tiles to lay paths ($25 each)',
    bulldoze: 'Click to demolish tiles (25% refund on rides)',
    entrance: 'Place a park entrance ($500)',
    tree:     'Plant a tree for scenery ($50)',
    bench:    'Place a bench ($80)',
    fountain: 'Build a fountain ($200)',
  };
  const rDef = RIDE_TYPES[tool];
  if (rDef) {
    return `Place ${rDef.icon} ${rDef.name} – Cost $${rDef.cost.toLocaleString()} | Excitement:${rDef.excitement} Intensity:${rDef.intensity}`;
  }
  return hints[tool] || 'Select a tile to place';
}

// ── Speed controls ───────────────────────────────────────
function setSpeed(s) {
  state.speed  = s;
  state.paused = (s === 0);
  ['btn-pause', 'btn-1x', 'btn-3x'].forEach(id => document.getElementById(id).classList.remove('active'));
  if      (s === 0) document.getElementById('btn-pause').classList.add('active');
  else if (s === 1) document.getElementById('btn-1x').classList.add('active');
  else              document.getElementById('btn-3x').classList.add('active');
}

// ── Main HUD update ──────────────────────────────────────
function updateUI() {
  // Top bar
  const cashEl = document.getElementById('stat-cash');
  cashEl.textContent = formatMoney(state.cash);
  cashEl.className   = 'stat-value ' + (state.cash < 0 ? 'red' : state.cash < 5000 ? 'yellow' : 'green');

  const incomeEl = document.getElementById('stat-income');
  incomeEl.textContent = (state.monthlyProfit >= 0 ? '+' : '') + formatMoney(state.monthlyProfit);
  incomeEl.className   = 'stat-value ' + (state.monthlyProfit >= 0 ? 'cyan' : 'red');

  document.getElementById('stat-guests').textContent = state.guests.length;

  const ratingEl = document.getElementById('stat-rating');
  ratingEl.textContent = Math.floor(state.parkRating);
  ratingEl.className   = 'stat-value ' + (state.parkRating > 750 ? 'green' : state.parkRating > 500 ? 'yellow' : 'red');

  const avgHappy = state.guests.length > 0
    ? Math.floor(state.guests.reduce((s, g) => s + g.happiness, 0) / state.guests.length)
    : 75;
  const happyEl = document.getElementById('stat-happiness');
  happyEl.textContent = avgHappy + '%';
  happyEl.className   = 'stat-value ' + (avgHappy > 65 ? 'green' : avgHappy > 40 ? 'yellow' : 'red');

  document.getElementById('date-display').textContent = `Year ${state.year}, Month ${state.month}`;

  // Right info panel – finances
  document.getElementById('ip-cash').textContent     = formatMoney(state.cash);
  document.getElementById('ip-loans').textContent    = formatMoney(state.loans);
  document.getElementById('ip-income').textContent   = formatMoney(state.monthlyIncome);
  document.getElementById('ip-expenses').textContent = formatMoney(state.monthlyExpenses);
  const profitEl = document.getElementById('ip-profit');
  profitEl.textContent = (state.monthlyProfit >= 0 ? '+' : '') + formatMoney(state.monthlyProfit);
  profitEl.style.color = state.monthlyProfit >= 0 ? '#4caf50' : '#e94560';

  // Park stats
  const rides = state.rides.filter(r => r.category !== 'shop');
  const shops = state.rides.filter(r => r.category === 'shop');
  document.getElementById('ip-rides').textContent = rides.length;
  document.getElementById('ip-open').textContent  = rides.filter(r => r.status === 'open').length;
  document.getElementById('ip-shops').textContent = shops.length;
  document.getElementById('ip-staff').textContent = Object.values(state.staff).reduce((a, b) => a + b, 0);
  document.getElementById('ip-entry').textContent = '$' + state.entryFee;

  // Guest mood averages
  function avg(key) {
    return state.guests.length > 0
      ? Math.floor(state.guests.reduce((s, g) => s + g[key], 0) / state.guests.length)
      : 0;
  }
  const happy  = avg('happiness');
  const hunger = avg('hunger');
  const energy = avg('energy');
  const nausea = avg('nausea');

  document.getElementById('ip-happy').textContent  = happy  + '%';
  document.getElementById('ip-hunger').textContent = hunger + '%';
  document.getElementById('ip-energy').textContent = energy + '%';
  document.getElementById('ip-nausea').textContent = nausea + '%';
  document.getElementById('bar-happy').style.width  = happy  + '%';
  document.getElementById('bar-hunger').style.width = hunger + '%';
  document.getElementById('bar-energy').style.width = energy + '%';
  document.getElementById('bar-nausea').style.width = nausea + '%';

  // Weather
  const w = WEATHER_TYPES[state.weather];
  document.getElementById('ip-weather').textContent  = `${w.name} ${w.icon}`;
  document.getElementById('ip-temp').textContent     = `${state.temperature}°C`;
  document.getElementById('ip-wchange').textContent  = `${state.weatherChangeIn} mo`;
  document.getElementById('weather-icon').textContent  = w.icon;
  document.getElementById('weather-label').textContent = w.name;

  updateObjectivesUI();
}

// ── Ride list (right panel) ───────────────────────────────
function updateRideList() {
  const el = document.getElementById('ride-list');
  if (state.rides.length === 0) {
    el.innerHTML = '<div style="color:#555;font-size:11px;">No rides yet</div>';
    return;
  }
  el.innerHTML = state.rides.slice(0, 12).map(r => `
    <div class="ride-item" onclick="openRideInfoById(${r.id})">
      <div class="ride-item-name">${r.icon} ${r.name}</div>
      <div class="ride-item-stats">
        <span style="color:${r.status === 'open' ? '#4caf50' : r.status === 'maintenance' ? '#ffd700' : '#e94560'}">${r.status.toUpperCase()}</span>
        <span>👥${r.queue}</span>
        <span>💰${formatMoney(r.income)}</span>
      </div>
    </div>
  `).join('');
}

// ── Objectives ────────────────────────────────────────────
function checkObjectives() {
  let changed = false;
  for (const obj of state.objectives) {
    if (!obj.done && obj.target()) {
      obj.done = true;
      changed  = true;
      notify(`🏆 Objective complete: ${obj.text}!`, 'positive');
    }
  }
  if (changed) updateObjectivesUI();
}

function updateObjectivesUI() {
  const el = document.getElementById('objectives-list');
  el.innerHTML = state.objectives.map(o =>
    `<div style="color:${o.done ? '#4caf50' : '#ccc'}">${o.done ? '✅' : '⬜'} ${o.text}</div>`
  ).join('');
}

// ═══════════════════════════════════════════════════════
//  MODALS
// ═══════════════════════════════════════════════════════

function closeModal(id) {
  document.getElementById(id).classList.remove('visible');
}

// Close on backdrop click
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => {
    if (e.target === m) m.classList.remove('visible');
  });
});

// ── Pricing ──────────────────────────────────────────────
function openPricingModal() {
  document.getElementById('price-entry').value = state.entryFee;
  document.getElementById('price-ride').value  = state.ridePrice;
  document.getElementById('price-food').value  = state.foodPrice;
  document.getElementById('price-drink').value = state.drinkPrice;
  updatePriceLabel('entry');
  updatePriceLabel('ride');
  updatePriceLabel('food');
  updatePriceLabel('drink');
  document.getElementById('modal-pricing').classList.add('visible');
}

function updatePriceLabel(which) {
  const v = document.getElementById('price-' + which).value;
  document.getElementById('label-' + which).textContent = '$' + parseFloat(v).toFixed(which === 'entry' ? 0 : 1);
}

function applyPricing() {
  state.entryFee   = parseFloat(document.getElementById('price-entry').value);
  state.ridePrice  = parseFloat(document.getElementById('price-ride').value);
  state.foodPrice  = parseFloat(document.getElementById('price-food').value);
  state.drinkPrice = parseFloat(document.getElementById('price-drink').value);
  notify('💲 Prices updated!', 'positive');
  closeModal('modal-pricing');
  updateUI();
}

// ── Staff ────────────────────────────────────────────────
function openStaffModal() {
  document.getElementById('staff-mechanic').value    = state.staff.mechanic;
  document.getElementById('staff-janitor').value     = state.staff.janitor;
  document.getElementById('staff-entertainer').value = state.staff.entertainer;
  document.getElementById('staff-security').value    = state.staff.security;
  updateStaffLabel('mechanic');
  updateStaffLabel('janitor');
  updateStaffLabel('entertainer');
  updateStaffLabel('security');
  _refreshStaffCost();
  document.getElementById('modal-staff').classList.add('visible');
}

function updateStaffLabel(which) {
  const v = document.getElementById('staff-' + which).value;
  document.getElementById('label-' + which).textContent = v;
  _refreshStaffCost();
}

function _refreshStaffCost() {
  const m = +document.getElementById('staff-mechanic').value;
  const j = +document.getElementById('staff-janitor').value;
  const e = +document.getElementById('staff-entertainer').value;
  const s = +document.getElementById('staff-security').value;
  document.getElementById('staff-cost').textContent = '$' + (m * 150 + j * 120 + e * 180 + s * 130).toLocaleString();
}

function applyStaff() {
  state.staff.mechanic    = +document.getElementById('staff-mechanic').value;
  state.staff.janitor     = +document.getElementById('staff-janitor').value;
  state.staff.entertainer = +document.getElementById('staff-entertainer').value;
  state.staff.security    = +document.getElementById('staff-security').value;
  notify('👷 Staff updated!', 'positive');
  closeModal('modal-staff');
  updateUI();
}

// ── Marketing ────────────────────────────────────────────
function openMarketingModal() {
  const el = document.getElementById('marketing-options');
  el.innerHTML = MARKETING_CAMPAIGNS.map(c => {
    const active = state.marketing.find(m => m.id === c.id);
    return `
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:10px;margin-bottom:8px;">
        <div style="font-weight:bold;margin-bottom:4px;">${c.name}</div>
        <div style="font-size:11px;color:#aaa;margin-bottom:6px;">${c.desc}</div>
        <div style="font-size:11px;color:#ffd700;">Cost: $${c.cost.toLocaleString()}</div>
        ${active
          ? `<div style="color:#4caf50;font-size:11px;margin-top:4px;">✅ Active – ${active.monthsLeft} months left</div>`
          : `<button class="modal-btn" style="margin-top:6px;padding:5px 14px;font-size:12px;" onclick="startCampaign('${c.id}')">Launch</button>`
        }
      </div>
    `;
  }).join('');
  document.getElementById('modal-marketing').classList.add('visible');
}

// ── Loans ────────────────────────────────────────────────
function openLoansModal() {
  document.getElementById('loan-amount').value = 10000;
  updateLoanLabel();
  document.getElementById('loan-current').textContent = formatMoney(state.loans);
  document.getElementById('modal-loans').classList.add('visible');
}

function updateLoanLabel() {
  const v = +document.getElementById('loan-amount').value;
  document.getElementById('label-loan').textContent = formatMoney(v);
}

function handleTakeLoan() {
  const amount = +document.getElementById('loan-amount').value;
  takeLoan(amount);
  document.getElementById('loan-current').textContent = formatMoney(state.loans);
  updateUI();
}

function handleRepayLoan() {
  repayLoan(5000);
  document.getElementById('loan-current').textContent = formatMoney(state.loans);
  updateUI();
}

// ── Ride info modal ──────────────────────────────────────
let selectedRideId = null;

function openRideInfo(ride) {
  selectedRideId = ride.id;
  document.getElementById('ride-modal-title').textContent = ride.icon + ' ' + ride.name;
  document.getElementById('ride-modal-body').innerHTML = `
    <div class="info-row"><span>Status</span><span style="color:${ride.status === 'open' ? '#4caf50' : ride.status === 'maintenance' ? '#ffd700' : '#e94560'}">${ride.status.toUpperCase()}</span></div>
    ${ride.category !== 'shop' ? `
    <div class="info-row"><span>Excitement</span><span>${ride.excitement.toFixed(1)}</span></div>
    <div class="info-row"><span>Intensity</span><span>${ride.intensity.toFixed(1)}</span></div>
    <div class="info-row"><span>Nausea</span><span>${ride.nausea.toFixed(1)}</span></div>
    <div class="info-row"><span>Queue</span><span>${ride.queue || 0}</span></div>
    <div class="info-row"><span>Total Riders</span><span>${ride.totalRiders}</span></div>
    ` : ''}
    <div class="info-row"><span>Total Income</span><span>${formatMoney(ride.income)}</span></div>
    <div class="info-row"><span>Build Cost</span><span>${formatMoney(ride.cost)}</span></div>
    <div class="info-row"><span>Age</span><span>${ride.age} months</span></div>
  `;
  document.getElementById('modal-ride-info').classList.add('visible');
}

function openRideInfoById(id) {
  const ride = state.rides.find(r => r.id === id);
  if (ride) openRideInfo(ride);
}

function toggleRide() {
  const ride = state.rides.find(r => r.id === selectedRideId);
  if (!ride) return;
  ride.status = ride.status === 'open' ? 'closed' : 'open';
  openRideInfo(ride);
  updateRideList();
}

function demolishRide() {
  const ride = state.rides.find(r => r.id === selectedRideId);
  if (!ride) return;
  closeModal('modal-ride-info');
  bulldozeTile(ride.row, ride.col);
}
