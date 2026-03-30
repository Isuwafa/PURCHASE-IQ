#  PurchaseIQ

> *"The price tag is a lie. This app tells you the truth."*

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey)](https://expressjs.com)
[![APIs](https://img.shields.io/badge/External%20APIs-3-blue)](https://github.com/Isuwafa/PURCHASE-IQ)
[![Deployed](https://img.shields.io/badge/Status-Live-brightgreen)](http://13.222.29.180)

Most people look at a price tag and see a number.
PurchaseIQ makes you see the **full picture** —
what that money could grow into if invested,
how inflation quietly eats away at its value,
how many hours of your life you traded for it,
and when a recurring purchase actually starts paying you back.

This is not a gimmick. This is a financial reality check.

---

##  Live Application
```
http://13.222.29.180
```

##  Demo Video
*Watch on YouTube — 2 minutes*

---

##  Table of Contents
- [Why PurchaseIQ?](#-why-purchaseiq)
- [What It Does](#-what-it-does)
- [APIs Used](#-apis-used)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [Run Locally](#-run-locally)
- [Deployment](#-deployment)
- [Load Balancer](#-load-balancer)
- [How Caching Works](#-how-caching-works)
- [Error Handling](#-error-handling)
- [Challenges](#-challenges)
- [Credits](#-credits)

---

##  Why PurchaseIQ?

Financial illiteracy is a real problem  not because people are unintelligent,
but because compound interest and opportunity cost are invisible.
Nobody feels the $47,000 they gave up by spending $9,000 on a car instead of investing it.
PurchaseIQ makes that invisible cost visible, personal, and impossible to ignore.

---

##  What It Does

###  Investment Potential
Uses real S&P 500 historical data to show what your money becomes
if invested instead of spent. Built on a 10-year CAGR calculation
from Alpha Vantage market data.

###  Inflation Reality
Two perspectives on inflation:
- How much will this item **cost** in the future?
- What is your money actually **worth** in the future?

Powered by real country-specific CPI data from the World Bank —
covering Rwanda, Kenya, Nigeria, USA, UK and 13 more countries.

###  Work Hours Cost
Converts your purchase into something personal —
hours, days, and weeks of your life.
Because money is time, and time is the one thing you cannot earn back.

###  Break-Even Analysis
For recurring purchases and subscriptions:
how many months until the savings pay back the upfront cost?
Toggle on "Recurring Savings Mode" and find out.

### Live Investment Chart
An animated three-line Chart.js graph showing:
-  What the money grows to if invested
-  The flat "if spent" opportunity cost line  
-  How purchasing power erodes with inflation

All three lines, over your chosen time horizon, in one clear picture.

---

##  APIs Used

| API | What We Use It For | Key Required | Free Limit |
|-----|--------------------|-------------|------------|
| [Alpha Vantage](https://www.alphavantage.co/documentation/) | S&P 500 monthly adjusted prices → 10yr CAGR |  Yes | 25 req/day |
| [World Bank API](https://datahelpdesk.worldbank.org/knowledgebase/articles/898581) | Country CPI inflation rate (most recent year) |  Free & open | Unlimited |
| [ExchangeRate-API](https://www.exchangerate-api.com/docs/overview) | Live currency conversion rates (USD base) |  Yes | 1,500 req/month |

> **Security note:** API keys never appear in frontend code.
> All external calls go through our Express proxy server.
> Keys live only in the `.env` file which is excluded from GitHub.

---

##  Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Backend | Node.js + Express | Lightweight, fast, perfect for API proxying |
| Frontend | Vanilla HTML/CSS/JS | No framework needed — keeps it deployable anywhere |
| Charts | Chart.js v4 | Animated, responsive, beautiful out of the box |
| Security | Helmet + express-rate-limit | Secure headers + rate limiting on all API routes |
| Process Manager | PM2 | Keeps Node.js alive and restarts on server reboot |
| Load Balancer | Nginx | Round-robin traffic distribution across two servers |
| Fonts | Syne + IBM Plex Mono | Financial credibility meets modern design |

---

##  Project Structure
```
purchaseiq/
│
├── backend/
│   ├── routes/
│   │   └── api.js          # 3 proxy endpoints + in-memory cache + fallbacks
│   ├── server.js            # Express setup, security middleware, static serving
│   ├── .env.example         # Key names without values — safe to commit
│   └── package.json         # Dependencies
│
├── frontend/
│   ├── css/
│   │   └── style.css        # Dark fintech theme — Bloomberg meets fintech
│   ├── js/
│   │   ├── calculator.js    # Pure financial math — no DOM, fully testable
│   │   ├── api.js           # Calls our backend proxy (never external APIs)
│   │   ├── chart.js         # Chart.js three-line animated chart
│   │   ├── ui.js            # All DOM updates and result card rendering
│   │   └── main.js          # Event listeners — wires everything together
│   └── index.html           # Semantic, accessible, responsive layout
│
├── .gitignore               # Protects .env and node_modules from GitHub
└── README.md
```

---

##  Screenshots

**Input Panel — Enter your purchase details**
![Input Form](screenshots/input.png)

**Results Panel — See the true cost**
![Results](screenshots/results.png)

---

##  Run Locally

### Prerequisites
- Node.js v18+
- A free [Alpha Vantage key](https://www.alphavantage.co/support/#api-key)
- A free [ExchangeRate-API key](https://www.exchangerate-api.com)

### Steps
```bash
# 1. Clone the repo
git clone https://github.com/Isuwafa/PURCHASE-IQ.git
cd PURCHASE-IQ

# 2. Install backend dependencies
cd backend
npm install

# 3. Set up your environment variables
cp .env.example .env
# Open .env and paste your real API keys

# 4. Start the server
node server.js

# 5. Open in browser
# http://localhost:8000
```

---

##  Deployment

### Infrastructure Overview
```
Anyone in the world
        |
        ▼
http://13.222.29.180        ← Load Balancer (Lb01)
        |
   Nginx round-robin
        |
   ┌────┴────┐
   ▼         ▼
Web01       Web02
3.92.239.4  34.238.49.220
port 8000   port 8000
PM2+Node    PM2+Node
```

### Deploy on Each Web Server
```bash
# SSH in
ssh -i ~/.ssh/school ubuntu@SERVER_IP

# Install Node.js v18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone and install
git clone https://github.com/Isuwafa/PURCHASE-IQ.git
cd PURCHASE-IQ/backend
npm install

# Create .env with real API keys
nano .env

# Start with PM2
pm2 start server.js --name "purchaseiq"
pm2 save
pm2 startup
# Copy and run the command pm2 gives you
```

### Update After Code Changes
```bash
cd PURCHASE-IQ
git pull
pm2 restart purchaseiq
```

---

##  Load Balancer

Nginx configuration on Lb01:
`/etc/nginx/sites-available/purchaseiq`
```nginx
# upstream defines our two backend servers
# Nginx will alternate requests between them (round-robin)
upstream purchaseiq_backend {
    server 3.92.239.4:8000;      # Web01
    server 34.238.49.220:8000;   # Web02
}

server {
    listen 80;
    server_name 13.222.29.180;

    location / {
        proxy_pass http://purchaseiq_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/purchaseiq /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### What "upstream" means
The `upstream` block is Nginx's way of defining a **pool of servers**.
When a request comes in, Nginx picks the next server in the pool 
alternating between Web01 and Web02 on every request.
This is called **round-robin load balancing**.
If one server goes down, Nginx automatically sends all traffic to the other.

---

##  How Caching Works

Every API call is expensive  Alpha Vantage allows only 25/day.
We cache every response in memory on the server:

| Data | Cache Duration | Why |
|------|---------------|-----|
| Exchange rates | 1 hour | Changes hourly |
| Market return | 24 hours | Changes slowly |
| Inflation (per country) | 24 hours | Annual data |

If a cached value is fresh, we return it instantly without hitting the external API.
This protects our quotas and makes the app faster for every user after the first.

---

##  Error Handling

Every single API call has a fallback  the app **never crashes**:

| Scenario | What Happens |
|----------|-------------|
| Alpha Vantage rate limited | Falls back to 10.5% (S&P 500 historical avg) |
| World Bank returns no data | Falls back to 3.5% global average |
| ExchangeRate-API fails | Falls back to hardcoded approximate rates |
| User submits empty form | Inline red validation errors appear |
| User enters negative amount | Inline error: "Please enter a value greater than 0" |
| Network is offline | Fallbacks activate, amber banner notifies user |

All fallbacks show an amber warning banner so the user always knows
whether they are seeing live data or estimates.

---

##  Challenges

| Challenge | What Went Wrong | How We Fixed It |
|-----------|----------------|-----------------|
| World Bank nested JSON | Data is at `response[1][0].value` not `response.value` | Read the docs carefully — World Bank wraps data in a 2-element array |
| ExchangeRate-API field name | We used `data.rates` but the API returns `data.conversion_rates` | Tested the raw API response with curl and spotted the mismatch |
| Alpha Vantage rate limit | 25 requests/day hit quickly during development | Added 24-hour server-side cache so the API is only called once per day |
| API key exposed on GitHub | `.env` was accidentally pushed early in development | Removed with `git rm --cached`, regenerated keys, added to `.gitignore` |
| HAProxy conflict on Lb01 | Port 80 was already taken by a pre-installed HAProxy service | Stopped and disabled HAProxy before starting Nginx |
| Windows npm permission error | PowerShell blocked npm execution | Fixed with `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` |

---

##  Credits

### APIs
- [Alpha Vantage](https://www.alphavantage.co) — Real stock market data
- [World Bank Open Data](https://data.worldbank.org) — Global inflation rates
- [ExchangeRate-API](https://www.exchangerate-api.com) — Live currency rates

### Libraries
- [Express.js](https://expressjs.com) — Backend server framework
- [Chart.js](https://www.chartjs.org) — Beautiful animated charts
- [Helmet.js](https://helmetjs.github.io) — HTTP security headers
- [dotenv](https://github.com/motdotla/dotenv) — Environment variable management
- [PM2](https://pm2.keymetrics.io) — Node.js process manager

### Fonts
- [Syne](https://fonts.google.com/specimen/Syne) — Display headings
- [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) — Numbers and monospace

---


