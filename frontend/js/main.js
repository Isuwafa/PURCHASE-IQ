// App entry point.
// Validates input, fetches data, runs calculations, and updates the UI.

//  Get references to key DOM elements
const analyzeBtn      = document.getElementById('analyze-btn');
const timeSlider      = document.getElementById('time-horizon');
const horizonLabel    = document.getElementById('horizon-label');
const recurringToggle = document.getElementById('recurring-toggle');
const recurringFields = document.getElementById('recurring-fields');
const noticeClose     = document.getElementById('notice-close');

//Slider: update the label as user drags it 
timeSlider.addEventListener('input', () => {
  horizonLabel.textContent = `${timeSlider.value} year${timeSlider.value > 1 ? 's' : ''}`;
  timeSlider.setAttribute('aria-valuenow', timeSlider.value);
});

// Recurring toggle: show/hide the extra fields 
recurringToggle.addEventListener('click', () => {
  const isOn = recurringToggle.getAttribute('aria-checked') === 'true';
  // Flip the state
  recurringToggle.setAttribute('aria-checked', !isOn);
  recurringFields.classList.toggle('hidden', isOn);
});

// Dismiss notice banner 
noticeClose.addEventListener('click', hideNotice);

// Main Analysis Function 
analyzeBtn.addEventListener('click', async () => {

  // Step 1: Validate form  stop here if anything is missing
  if (!validateInputs()) return;

  // Step 2: Read all form values
  const itemName    = document.getElementById('purchase-name').value.trim();
  const amount      = parseFloat(document.getElementById('purchase-amount').value);
  const currency    = document.getElementById('currency').value;
  const country     = document.getElementById('country').value;
  const wage        = parseFloat(document.getElementById('hourly-wage').value) || 0;
  const years       = parseInt(timeSlider.value);
  const isRecurring = recurringToggle.getAttribute('aria-checked') === 'true';
  const costThis    = parseFloat(document.getElementById('cost-this').value) || 0;
  const costAlt     = parseFloat(document.getElementById('cost-alt').value) || 0;

  // Step 3: Show loading state  disable button, show skeletons
  analyzeBtn.disabled  = true;
  analyzeBtn.textContent = 'Analyzing...';
  showLoadingState();
  hideNotice();

  // Step 4: Fire all 3 API calls at the same time
  // Promise.allSettled waits for ALL to finish even if one fails
  // (Promise.all would stop everything if one fails  we don't want that)
  const [marketResult, inflationResult, exchangeResult] = await Promise.allSettled([
    fetchMarketReturn().then(data => { markProgressDone('prog-market');    return data; }),
    fetchInflation(country).then(data => { markProgressDone('prog-inflation'); return data; }),
    fetchExchangeRates().then(data => { markProgressDone('prog-exchange');  return data; }),
  ]);

  // Extract the actual values (allSettled wraps them in { status, value })
  const marketData   = marketResult.status   === 'fulfilled' ? marketResult.value   : { annualReturnRate: 0.105, fallback: true };
  const inflationData = inflationResult.status === 'fulfilled' ? inflationResult.value : { inflationRate: 0.035,   fallback: true };
  const exchangeData  = exchangeResult.status  === 'fulfilled' ? exchangeResult.value  : { rates: { USD: 1 },       fallback: true };

  // Step 5: Show warnings if any API used a fallback
  const notices = [];
  if (marketData.fallback)   notices.push('Market data unavailable — using 10.5% historical average.');
  if (inflationData.fallback) notices.push('Inflation data unavailable — using 3.5% default.');
  if (exchangeData.fallback)  notices.push('Currency conversion unavailable — using approximate rates.');
  if (notices.length > 0) showNotice('⚠ ' + notices.join(' '));

  // Step 6: Convert the purchase amount to USD for calculations
  const { usdAmount } = convertCurrency(amount, currency, exchangeData.rates);

  // Step 7: Run all financial calculations
  const growthData    = calculateInvestmentGrowth(usdAmount, marketData.annualReturnRate, years);
  const inflationImpact = calculateInflationImpact(usdAmount, inflationData.inflationRate, years);
  const inflationSeries = calculateInflationTimeSeries(usdAmount, inflationData.inflationRate, years);
  const workData      = wage > 0 ? calculateWorkHours(amount, wage) : null;

  // Break-even: only calculate if recurring mode is on AND both costs provided
  const monthlySavings = isRecurring ? (costAlt - costThis) : 0;
  const breakEvenData  = isRecurring && monthlySavings > 0
    ? calculateBreakEven(amount, monthlySavings)
    : null;

  // Step 8: Render everything to the page
  setResultsTitle(itemName, years);
  renderInvestmentCard(usdAmount, growthData, currency, marketData);
  renderInflationCard(inflationImpact, years, currency, inflationData);
  renderWorkHoursCard(workData);
  renderBreakEvenCard(breakEvenData);
  renderGrowthChart(growthData, inflationSeries, usdAmount, currency);

  // Step 9: Show results panel
  showResultsState();

  // Step 10: Re-enable the button
  analyzeBtn.disabled    = false;
  analyzeBtn.textContent = 'Run Analysis →';
});
