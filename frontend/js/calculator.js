// ============================================================
// calculator.js — PurchaseIQ Core Financial Logic
//
// This file contains ONLY pure math functions.
// "Pure" means: no DOM interaction, no API calls.
// Give it the same inputs and it always returns the same output.
// ============================================================

/**
 * calculateInvestmentGrowth
 * Shows what happens if you INVEST the money instead of spending it.
 * Formula: A = P * (1 + r)^t  (compound interest)
 *
 * @param {number} principal  - The amount of money (in USD)
 * @param {number} annualRate - Annual return rate e.g. 0.105 = 10.5%
 * @param {number} years      - How many years to project
 * @returns {Array} - e.g. [{ year: 1, value: 1105 }, { year: 2, value: 1221 }]
 */
function calculateInvestmentGrowth(principal, annualRate, years) {
  const results = [];
  for (let year = 1; year <= years; year++) {
    // Each year the money grows by multiplying by (1 + rate)
    const value = principal * Math.pow(1 + annualRate, year);
    results.push({
      year,
      value: parseFloat(value.toFixed(2)),
    });
  }
  return results;
}

/**
 * calculateInflationImpact
 * Two perspectives on how inflation affects your money over time:
 *   1. How much will this item COST in the future?
 *   2. What is your money actually WORTH in the future?
 *
 * @param {number} amount        - Current purchase amount (USD)
 * @param {number} inflationRate - e.g. 0.035 = 3.5% annual inflation
 * @param {number} years         - Time horizon
 * @returns {{ futureItemCost: number, realValueOfMoney: number }}
 */
function calculateInflationImpact(amount, inflationRate, years) {
  // Future cost: the item gets more expensive each year
  const futureItemCost = amount * Math.pow(1 + inflationRate, years);

  // Real value: your money buys LESS each year (opposite of above)
  const realValueOfMoney = amount / Math.pow(1 + inflationRate, years);

  return {
    futureItemCost:    parseFloat(futureItemCost.toFixed(2)),
    realValueOfMoney:  parseFloat(realValueOfMoney.toFixed(2)),
  };
}

/**
 * calculateInflationTimeSeries
 * Returns year-by-year real value for the chart's inflation line.
 *
 * @param {number} amount        - Starting amount
 * @param {number} inflationRate - Annual inflation rate
 * @param {number} years         - Time horizon
 * @returns {Array} - [{ year: 1, realValueOfMoney: 966 }, ...]
 */
function calculateInflationTimeSeries(amount, inflationRate, years) {
  const results = [];
  for (let year = 1; year <= years; year++) {
    const realValueOfMoney = amount / Math.pow(1 + inflationRate, year);
    results.push({
      year,
      realValueOfMoney: parseFloat(realValueOfMoney.toFixed(2)),
    });
  }
  return results;
}

/**
 * calculateWorkHours
 * Converts a purchase into something personal — how many hours
 * of your life you had to work to afford it.
 *
 * @param {number} amount      - Purchase amount (any currency)
 * @param {number} hourlyWage  - Your hourly wage (same currency)
 * @returns {{ hours, days, weeks }} or null if no wage provided
 */
function calculateWorkHours(amount, hourlyWage) {
  if (!hourlyWage || hourlyWage <= 0) return null;

  const hours = amount / hourlyWage;
  const days  = hours / 8;   // standard 8-hour workday
  const weeks = hours / 40;  // standard 40-hour workweek

  return {
    hours: parseFloat(hours.toFixed(1)),
    days:  parseFloat(days.toFixed(1)),
    weeks: parseFloat(weeks.toFixed(2)),
  };
}

/**
 * calculateBreakEven
 * For recurring purchases: how many months until the savings
 * pay back the upfront cost?
 *
 * Example: Buy a $600 coffee machine instead of $80/mo cafe.
 * Home coffee costs $10/mo. Savings = $70/mo.
 * Break even = ceil(600 / 70) = 9 months.
 *
 * @param {number} purchasePrice   - One-time upfront cost
 * @param {number} monthlySavings  - How much cheaper per month
 * @returns {{ months, years, annualSavings }} or null
 */
function calculateBreakEven(purchasePrice, monthlySavings) {
  if (!monthlySavings || monthlySavings <= 0) return null;

  const months       = Math.ceil(purchasePrice / monthlySavings);
  const years        = parseFloat((months / 12).toFixed(1));
  const annualSavings = parseFloat((monthlySavings * 12).toFixed(2));

  return { months, years, annualSavings, monthlySavings };
}

/**
 * convertCurrency
 * Converts an amount from any currency to USD.
 * All our calculations happen in USD, then we convert back for display.
 *
 * @param {number} amount       - Amount to convert
 * @param {string} fromCurrency - e.g. "RWF", "EUR"
 * @param {Object} rates        - { USD: 1, RWF: 1340, EUR: 0.92, ... }
 * @returns {{ usdAmount, conversionRate }}
 */
function convertCurrency(amount, fromCurrency, rates) {
  if (fromCurrency === 'USD') {
    return { usdAmount: amount, conversionRate: 1 };
  }

  const rate = rates[fromCurrency];
  if (!rate) {
    console.warn(`Unknown currency: ${fromCurrency}. Treating as USD.`);
    return { usdAmount: amount, conversionRate: 1 };
  }

  // All rates are "how many of this currency = 1 USD"
  // So to get USD: divide the amount by the rate
  // Example: 100,000 RWF / 1340 = $74.63 USD
  const usdAmount = amount / rate;

  return {
    usdAmount:      parseFloat(usdAmount.toFixed(2)),
    conversionRate: rate,
  };
}

/**
 * formatCurrency
 * Formats a number as a readable currency string.
 * Uses the browser's built-in Intl formatter.
 *
 * @param {number} amount       - The number to format
 * @param {string} currencyCode - e.g. "USD", "RWF", "EUR"
 * @returns {string}            - e.g. "$1,234" or "RWF 1,234,567"
 */
function formatCurrency(amount, currencyCode = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Fallback if Intl doesn't know the currency code
    return `${currencyCode} ${Math.round(amount).toLocaleString()}`;
  }
}
