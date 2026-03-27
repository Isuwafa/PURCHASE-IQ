// Handles all DOM updates: showing panels, filling results,
// displaying errorsand managing loading states.
// Pure UI No calculations here.

/** Called when Analyze button is clicked — shows skeleton loaders */
function showLoadingState() {
  document.getElementById('empty-state').classList.add('hidden');
  document.getElementById('results-content').classList.add('hidden');
  document.getElementById('loading-state').classList.remove('hidden');

  // Reset all progress indicators back to the waiting state
  resetProgress('prog-market',    ' Fetching market data...');
  resetProgress('prog-inflation', ' Fetching inflation data...');
  resetProgress('prog-exchange',  ' Fetching exchange rates...');
}

function resetProgress(id, text) {
  const el = document.getElementById(id);
  el.classList.remove('done');
  el.textContent = text;
}

/** Called when one API call finishes — turns that line green */
function markProgressDone(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('done');
  // Replace the hourglass with a checkmark
  el.textContent = el.textContent.replace
}

/** Called when all APIs are done — hides skeleton, shows results */
function showResultsState() {
  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('results-content').classList.remove('hidden');
}

// ── Notice Banner ─────────────────────────────────────────

/**
 * showNotice — displays the warning/error banner
 * @param {string} message         - Text to show
 * @param {'warning'|'error'} type - warning = amber, error = red
 */
function showNotice(message, type = 'warning') {
  const banner = document.getElementById('notice-banner');
  document.getElementById('notice-text').textContent = message;
  banner.classList.remove('hidden', 'error');
  if (type === 'error') banner.classList.add('error');
}

function hideNotice() {
  document.getElementById('notice-banner').classList.add('hidden');
}

// ── Form Validation ───────────────────────────────────────

/**
 * validateInputs — checks required fields before running analysis
 * Shows red borders and error messages under any invalid field.
 * @returns {boolean} true = form is valid, false = has errors
 */
function validateInputs() {
  let isValid = true;

  // Clear any previous error styling
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  document.querySelectorAll('input').forEach(el => el.classList.remove('error'));

  const name   = document.getElementById('purchase-name').value.trim();
  const amount = parseFloat(document.getElementById('purchase-amount').value);

  if (!name) {
    showFieldError('purchase-name', 'err-name', 'Please enter what you are buying.');
    isValid = false;
  }

  if (!amount || amount <= 0) {
    showFieldError('purchase-amount', 'err-amount', 'Please enter a value greater than 0.');
    isValid = false;
  }

  return isValid;
}

function showFieldError(inputId, errorId, message) {
  document.getElementById(inputId).classList.add('error');
  document.getElementById(errorId).textContent = message;
}

// ── Result Card Renderers ─────────────────────────────────

/** Card 1 — Investment Potential */
function renderInvestmentCard(principal, growthData, currency, marketData) {
  const finalValue  = growthData[growthData.length - 1].value;
  const years       = growthData.length;
  const ratePercent = (marketData.annualReturnRate * 100).toFixed(1);

  document.getElementById('invest-future-value').textContent =
    formatCurrency(finalValue, currency);

  document.getElementById('invest-subtext').textContent =
    `${formatCurrency(principal, currency)} grows to ${formatCurrency(finalValue, currency)} `+
    `in ${years} years at ${ratePercent}% avg. annual return`;

  document.getElementById('invest-source').textContent = marketData.fallback
    ? '⚠ Using historical average (live data unavailable)'
    : `Data: ${marketData.source}`;
}

/** Card 2 — Inflation Reality */
function renderInflationCard(inflationResult, years, currency, inflationData) {
  const ratePercent = (inflationData.inflationRate * 100).toFixed(1);

  document.getElementById('inflation-future-cost').textContent =
    formatCurrency(inflationResult.futureItemCost, currency);

  document.getElementById('inflation-real-value').textContent =
    formatCurrency(inflationResult.realValueOfMoney, currency);

  document.getElementById('inflation-years').textContent = years;

  document.getElementById('inflation-source').textContent = inflationData.fallback
    ? '⚠ Using default rate (3.5%). Live data unavailable.'
    : `Data: World Bank (${inflationData.country} ${inflationData.year}, ${ratePercent}% inflation)`;
}

/** Card 3 — Work Hours (hidden if no wage entered) */
function renderWorkHoursCard(workData) {
  const card = document.getElementById('card-hours');
  if (!workData) { card.classList.add('hidden'); return; }

  card.classList.remove('hidden');
  document.getElementById('work-hours').textContent  = workData.hours.toLocaleString();
  document.getElementById('work-days').textContent   = `~${workData.days} workdays`;
  document.getElementById('work-weeks').textContent  = `~${workData.weeks} workweeks`;

  // Animate the hours bar — capped at 100% so it doesn't overflow
  const barPercent = Math.min((workData.hours / 40) * 100, 100);
  setTimeout(() => {
    document.getElementById('hours-bar-fill').style.width = `${barPercent}%`;
  }, 300);
}

/** Card 4 — Break-Even (hidden if recurring toggle is off) */
function renderBreakEvenCard(breakEvenData) {
  const card = document.getElementById('card-breakeven');
  if (!breakEvenData) { card.classList.add('hidden'); return; }

  card.classList.remove('hidden');
  document.getElementById('breakeven-months').textContent =
    `${breakEvenData.months} month${breakEvenData.months !== 1 ? 's' : ''}`;

  document.getElementById('breakeven-subtext').textContent =
    `After that, you save ${formatCurrency(breakEvenData.monthlySavings, 'USD')}/mo` +
    ` — ${formatCurrency(breakEvenData.annualSavings, 'USD')}/year`;
}

/** Updates the results heading and chart title with the item name */
function setResultsTitle(itemName, years) {
  document.getElementById('results-title').innerHTML =
    `Analysis: <span>${itemName || 'Your Purchase'}</span>`;

  document.getElementById('chart-title').textContent =
    `${itemName || 'Your Purchase'} — ${years}-Year Projection`;
}
