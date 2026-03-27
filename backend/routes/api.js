// ============================================================
// routes/api.js PurchaseIQ API Proxy Routes
//
// WHY like  proxy server?
// API keys must NEVER appear in frontend code because anyone
// can view source a webpage and steal them. Instead:
//   - Frontend calls OUR server at /api/...
//   - OUR server calls the real external API with the secret key
//   - The key never leaves the server
//
// THREE endpoints:
//   GET /api/market return       → Alpha Vantage
//   GET /api/inflation?country=  → World Bank
//   GET /api/exchange-rates      → ExchangeRate-API
// ============================================================

const express = require('express');
const router  = express.Router();

// ── In Memory Cache ──────────────────────────────────────────
// A simple object that stores API results temporarily.
// This avoids hitting external APIs on every single request,
// which saves our daily/monthly API quotas.
const cache = {};

/**
 * getCached  returns stored data if it hasn't expired yet
 * @param {string} key   - unique name for this cache entry
 * @param {number} ttlMs - how long the cache is valid (in milliseconds)
 * @returns stored data, or null if expired/missing
 */
function getCached(key, ttlMs) {
  const entry = cache[key];
  if (entry && Date.now() - entry.timestamp < ttlMs) return entry.data;
  return null;
}

/**
 * setCache — saves data into the cache with a timestamp
 * @param {string} key  - cache key
 * @param {any}    data - data to store
 */
function setCache(key, data) {
  cache[key] = { data, timestamp: Date.now() };
}

// ── Security: Allowed Country Codes ─────────────────────────
// We whitelist valid country codes to prevent malicious input.
// Without this, a user could send harmful values in the URL.
const VALID_COUNTRY_CODES = new Set([
  'US','GB','RW','KE','NG','GH','ZA','EG','ET',
  'FR','DE','JP','IN','CN','BR','CA','AU'
]);

// Cache durations
const ONE_HOUR = 60 * 60 * 1000;       // exchange rates change hourly
const ONE_DAY  = 24 * ONE_HOUR;        // market/inflation data changes daily

// ============================================================
// ENDPOINT 1: GET /api/market-return
// Fetches S&P 500 (SPY) historical data from Alpha Vantage
// and calculates a 10-year CAGR (compound annual growth rate).
// Cached for 24 hours.
// Fallback: 10.5% if API fails.
// ============================================================
router.get('/market-return', async (req, res) => {
  // Check cache first  no need to call the API if we have fresh data
  const cached = getCached('market-return', ONE_DAY);
  if (cached) return res.json({ ...cached, cached: true });

  try {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol=SPY&apikey=${process.env.ALPHA_VANTAGE_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    // Alpha Vantage sends a 'Note' field when rate limited
    if (data['Note'] || data['Information'] || !data['Monthly Adjusted Time Series']) {
      throw new Error('Alpha Vantage rate limit or invalid response');
    }

    const timeSeries = data['Monthly Adjusted Time Series'];
    const dates = Object.keys(timeSeries).sort(); // oldest → newest

    // Get the most recent price
    const mostRecentDate  = dates[dates.length - 1];
    const mostRecentPrice = parseFloat(timeSeries[mostRecentDate]['5. adjusted close']);

    // Get the price from ~10 years ago
    const tenYearsAgo = new Date(mostRecentDate);
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    const targetYear = tenYearsAgo.toISOString().slice(0, 7); // "YYYY-MM"
    const oldDate    = dates.find(d => d >= targetYear) || dates[0];
    const oldPrice   = parseFloat(timeSeries[oldDate]['5. adjusted close']);

    // CAGR formula: (endValue / startValue) ^ (1/years) - 1
    const annualReturnRate = Math.pow(mostRecentPrice / oldPrice, 1 / 10) - 1;

    const result = {
      annualReturnRate: parseFloat(annualReturnRate.toFixed(4)),
      source: 'Alpha Vantage (SPY 10yr CAGR)',
      fallback: false,
    };

    setCache('market-return', result);
    return res.json({ ...result, cached: false });

  } catch (err) {
    // API failed use the historical S&P 500 average as fallback
    console.error('Alpha Vantage error:', err.message);
    return res.json({
      annualReturnRate: 0.105, // 10.5% historical average
      source: 'Historical average (S&P 500 ~100yr)',
      fallback: true,
      cached: false,
    });
  }
});

// ============================================================
// ENDPOINT 2: GET /api/inflation?country=RW
// Fetches the most recent inflation rate for a country
// from the World Bank open API (no API key needed).
// Cached per country for 24 hours.
// Fallback: 3.5% if API fails.
// ============================================================
router.get('/inflation', async (req, res) => {
  const countryCode = (req.query.country || 'US').toUpperCase().trim();

  // Reject any country code not in our whitelist
  if (!VALID_COUNTRY_CODES.has(countryCode)) {
    return res.status(400).json({ error: 'Invalid country code' });
  }

  const cached = getCached(`inflation-${countryCode}`, ONE_DAY);
  if (cached) return res.json({ ...cached, cached: true });

  try {
    // FP.CPI.TOTL.ZG = CPI inflation indicator | mrv=1 = most recent value only
    const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/FP.CPI.TOTL.ZG?format=json&mrv=1`;
    const response = await fetch(url);
    const data = await response.json();

    // IMPORTANT: World Bank wraps its response in an array:
    // data[0] = metadata (page info)
    // data[1] = array of actual data points  ← we want this
    // data[1][0].value = the inflation percentage (e.g. 4.12 means 4.12%)
    if (!data[1] || !data[1][0] || data[1][0].value === null) {
      throw new Error('No inflation data found');
    }

    const inflationRate = data[1][0].value / 100; // convert % to decimal

    const result = {
      inflationRate:    parseFloat(inflationRate.toFixed(4)),
      inflationPercent: parseFloat(data[1][0].value.toFixed(2)),
      country:          countryCode,
      year:             data[1][0].date,
      fallback:         false,
    };

    setCache(`inflation-${countryCode}`, result);
    return res.json({ ...result, cached: false });

  } catch (err) {
    console.error('World Bank error:', err.message);
    return res.json({
      inflationRate: 0.035,
      inflationPercent: 3.5,
      country: countryCode,
      year: 'N/A',
      fallback: true,
      cached: false,
    });
  }
});

// ============================================================
// ENDPOINT 3: GET /api/exchange-rates
// Fetches all currency rates relative to USD.
// Cached for 1 hour to protect the 1,500/month free quota.
// Fallback: hardcoded approximate rates if API fails.
// ============================================================
router.get('/exchange-rates', async (req, res) => {
  const cached = getCached('exchange-rates', ONE_HOUR);
  if (cached) return res.json({ ...cached, cached: true });

  try {
    const url = `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_KEY}/latest/USD`;
    const response = await fetch(url);
    const data = await response.json();

    // The API returns { result: "success", rates: { USD: 1, EUR: 0.92, ... } }
    if (data.result !== 'success') throw new Error('Bad response from ExchangeRate-API');

    const result = {
      rates:    data.conversion_rates,
      baseCode: data.base_code,
      fallback: false,
    };

    setCache('exchange-rates', result);
    return res.json({ ...result, cached: false });

  } catch (err) {
    console.error('ExchangeRate-API error:', err.message);
    // Return hardcoded approximate rates as fallback
    return res.json({
      rates: {
        USD:1, EUR:0.92, GBP:0.79, RWF:1340,
        KES:131, NGN:1580, GHS:12.5, ZAR:18.6, EGP:30.9, ETB:56.7
      },
      fallback: true,
      cached: false,
    });
  }
});

module.exports = router;
