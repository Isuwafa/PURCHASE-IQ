// ============================================================
// api.js — Frontend API Client
//
// This file calls OUR backend server (not external APIs directly).
// The backend holds the secret API keys — we never put them here.
//
// Each function:
//   1. Calls one of our /api/* endpoints
//   2. Returns the data if successful
//   3. Returns a safe fallback object if anything goes wrong
// ============================================================

/**
 * fetchMarketReturn
 * Gets the S&P 500 annual return rate from our backend,
 * which fetches it from Alpha Vantage.
 *
 * @returns {{ annualReturnRate: number, source: string, fallback: boolean }}
 */
async function fetchMarketReturn() {
  try {
    const response = await fetch('/api/market-return');
    if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('fetchMarketReturn failed:', error.message);
    // Return a fallback so the rest of the app still works
    return {
      annualReturnRate: 0.105,
      source: 'Historical average',
      fallback: true,
    };
  }
}

/**
 * fetchInflation
 * Gets the inflation rate for a specific country from our backend,
 * which fetches it from the World Bank API.
 *
 * @param {string} countryCode - 2-letter ISO code e.g. "RW", "US"
 * @returns {{ inflationRate: number, country: string, year: string, fallback: boolean }}
 */
async function fetchInflation(countryCode) {
  try {
    // encodeURIComponent makes the country code safe to put in a URL
    const response = await fetch(`/api/inflation?country=${encodeURIComponent(countryCode)}`);
    if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('fetchInflation failed:', error.message);
    return {
      inflationRate:    0.035,
      inflationPercent: 3.5,
      country:          countryCode,
      year:             'N/A',
      fallback:         true,
    };
  }
}

/**
 * fetchExchangeRates
 * Gets all currency exchange rates from our backend,
 * which fetches them from ExchangeRate-API.
 *
 * @returns {{ rates: Object, fallback: boolean }}
 */
async function fetchExchangeRates() {
  try {
    const response = await fetch('/api/exchange-rates');
    if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('fetchExchangeRates failed:', error.message);
    // Hardcoded approximate rates as fallback
    return {
      rates: {
        USD: 1,    EUR: 0.92, GBP: 0.79,  RWF: 1340,
        KES: 131,  NGN: 1580, GHS: 12.5,  ZAR: 18.6,
        EGP: 30.9, ETB: 56.7,
      },
      fallback: true,
    };
  }
}
