// ═══════════════════════════════════════════════════════
//  FINANCE & MONTH-END LOGIC
// ═══════════════════════════════════════════════════════

function calcStaffWage() {
  const s = state.staff;
  return (s.mechanic * 150) + (s.janitor * 120) + (s.entertainer * 180) + (s.security * 130);
}

function monthEnd() {
  // ── Staff wages ────────────────────────────────────────
  spend(calcStaffWage());

  // ── Loan interest (5 % p.a. → ~0.417 % per month) ─────
  if (state.loans > 0) {
    spend(Math.floor(state.loans * 0.05 / 12));
  }

  // ── Marketing campaign expiry ──────────────────────────
  for (const c of state.marketing) { c.monthsLeft--; }
  state.marketing = state.marketing.filter(c => c.monthsLeft > 0);

  // ── Weather change ─────────────────────────────────────
  state.weatherChangeIn--;
  if (state.weatherChangeIn <= 0) {
    state.weather     = Math.floor(Math.random() * WEATHER_TYPES.length);
    const w           = WEATHER_TYPES[state.weather];
    state.temperature = w.tempRange[0] + Math.floor(Math.random() * (w.tempRange[1] - w.tempRange[0]));
    state.weatherChangeIn = 2 + Math.floor(Math.random() * 4);
    notify(`Weather changed: ${w.icon} ${w.name}`, '');
  }

  // ── Park rating ────────────────────────────────────────
  const openRides = state.rides.filter(r => r.category !== 'shop' && r.status === 'open');
  let ratingChange = openRides.length * 5;

  const avgHappy = state.guests.length > 0
    ? state.guests.reduce((s, g) => s + g.happiness, 0) / state.guests.length
    : 50;
  ratingChange += (avgHappy - 50) * 0.5;
  ratingChange -= state.guests.filter(g => g.hunger > 80).length * 0.5;
  ratingChange += state.staff.janitor * 2;
  if (openRides.length === 0) ratingChange -= 20;

  state.parkRating = Math.max(0, Math.min(1000, state.parkRating + ratingChange * 0.1));

  // ── Monthly financial summary ──────────────────────────
  state.lastMonthProfit = state.tickAccumIncome - state.tickAccumExpenses;
  state.monthlyIncome   = state.tickAccumIncome;
  state.monthlyExpenses = state.tickAccumExpenses;
  state.monthlyProfit   = state.lastMonthProfit;
  state.tickAccumIncome    = 0;
  state.tickAccumExpenses  = 0;

  // ── Objectives ─────────────────────────────────────────
  checkObjectives();

  // ── Advance calendar ───────────────────────────────────
  state.month++;
  if (state.month > 12) { state.month = 1; state.year++; }

  updateUI();
}

// ── Loan helpers ────────────────────────────────────────
function takeLoan(amount) {
  if (amount <= 0) return;
  if (state.loans + amount > 100000) { notify('Loan limit: $100k', 'warning'); return; }
  state.loans += amount;
  earn(amount);
  notify(`🏦 Borrowed ${formatMoney(amount)}. Total debt: ${formatMoney(state.loans)}`, 'warning');
}

function repayLoan(amount) {
  const repay = Math.min(amount, state.loans);
  if (repay <= 0) { notify('No loan to repay!', 'warning'); return; }
  if (!canAfford(repay)) return;
  spend(repay);
  state.loans -= repay;
  notify(`✅ Repaid ${formatMoney(repay)}. Remaining: ${formatMoney(state.loans)}`, 'positive');
}

// ── Marketing helpers ───────────────────────────────────
function startCampaign(id) {
  const c = MARKETING_CAMPAIGNS.find(x => x.id === id);
  if (!c) return;
  if (!canAfford(c.cost)) return;
  spend(c.cost);
  state.marketing.push({ id: c.id, monthsLeft: c.duration, guestBonus: c.guestBonus });
  notify(`📢 ${c.name} launched!`, 'positive');
  openMarketingModal();
}
