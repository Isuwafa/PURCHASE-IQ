// ============================================================
// server.js — PurchaseIQ Express Server
//
// This is the entry point of our backend.
// It does three things:
//   1. Applies security middleware (helmet, cors, rate limiting)
//   2. Mounts our API routes at /api
//   3. Serves the frontend HTML/CSS/JS files as static files
//
// WHY one server for both API and frontend?
// Simpler deployment — one process handles everything.
// ============================================================

// Load environment variables from .env file FIRST
// This makes process.env.ALPHA_VANTAGE_KEY etc. available
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const path       = require('path');
const apiRoutes  = require('./routes/api');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Security Middleware ──────────────────────────────────────

// helmet automatically sets secure HTTP headers
// (prevents clickjacking, sniffing attacks, etc.)
app.use(helmet({ contentSecurityPolicy: false }));

// cors allows the frontend to talk to this server
// even if they run on different ports during development
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// ── Rate Limiting ────────────────────────────────────────────
// Limits each IP address to 100 requests per 15 minutes
// This protects our API keys from being burned through by bots
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 100,                  // max requests per window per IP
  message: { error: 'Too many requests, please try again later.' },
});

// Apply rate limiting ONLY to /api/* routes
app.use('/api', limiter);

// ── API Routes ───────────────────────────────────────────────
// All routes defined in routes/api.js are available at /api/...
// e.g. /api/market-return, /api/inflation, /api/exchange-rates
app.use('/api', apiRoutes);

// ── Serve Frontend Static Files ──────────────────────────────
// This tells Express to serve index.html, style.css, etc.
// directly from the frontend folder when a browser requests them
app.use(express.static(path.join(__dirname, '../frontend')));

// Catch-all: any URL not matched above serves the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Start the Server ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(` PurchaseIQ running on http://localhost:${PORT}`);
  console.log(`   API available at http://localhost:${PORT}/api`);
});
