# PurchaseIQ — See the Real Price of Everything

## What is PurchaseIQ?
PurchaseIQ is a financial literacy web application that helps users understand 
the true opportunity cost of a purchase. Instead of just seeing a price tag, 
users see what that money could become if invested, how inflation affects its 
value over time, how many hours of work it represents, and when a recurring 
purchase breaks even.

## Live URL
http://13.222.29.180

## APIs Used
- **Alpha Vantage** — Fetches real S&P 500 market data to calculate investment returns
  - Docs: https://www.alphavantage.co/documentation/
- **World Bank API** — Fetches real country-specific inflation rates (no key required)
  - Docs: https://datahelpdesk.worldbank.org/knowledgebase/articles/898581
- **ExchangeRate-API** — Fetches live currency exchange rates
  - Docs: https://www.exchangerate-api.com/docs/overview

## How to Run Locally
1. Clone the repository:
```
   git clone https://github.com/Isuwafa/PURCHASE-IQ.git
   cd PURCHASE-IQ
```
2. Install dependencies:
```
   cd backend
   npm install
```
3. Create your `.env` file:
```
   cp .env.example .env
```
   Then open `.env` and fill in your API keys:
```
   ALPHA_VANTAGE_KEY=your_key_here
   EXCHANGE_RATE_KEY=your_key_here
   PORT=8000
```
4. Start the server:
```
   node server.js
```
5. Open your browser at `http://localhost:8000`

## Deployment Instructions

### On Web01 and Web02 (repeat on both servers)
```bash
# SSH into the server
ssh -i ~/.ssh/school ubuntu@SERVER_IP

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone the repository
git clone https://github.com/Isuwafa/PURCHASE-IQ.git
cd PURCHASE-IQ/backend

# Install dependencies
npm install

# Create .env file with your API keys
nano .env

# Start the app with PM2
pm2 start server.js --name "purchaseiq"
pm2 save
pm2 startup
```

### On Lb01 (Load Balancer)
```bash
# SSH into the load balancer
ssh -i ~/.ssh/school ubuntu@13.222.29.180

# Install Nginx
sudo apt-get install -y nginx

# Create the configuration file
sudo nano /etc/nginx/sites-available/purchaseiq
```

Paste this configuration:
```nginx
upstream purchaseiq_backend {
    server 3.92.239.4:8000;
    server 34.238.49.220:8000;
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

Then enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/purchaseiq /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## How the Load Balancer Works
The `upstream` block in Nginx defines a group of two backend servers (Web01 and Web02). 
When a user visits the load balancer's IP address, Nginx automatically forwards the 
request to one of the two servers using round-robin distribution  meaning requests 
alternate between Web01 and Web02 evenly. This ensures reliability: if one server 
goes down, the other continues serving traffic.

## Challenges Faced
- **World Bank API nested JSON**  The API wraps its response in an array where 
  `data[0]` is metadata and `data[1][0].value` is the actual inflation rate. 
  This was tricky to parse at first.
- **ExchangeRate-API field name**  The API returns `conversion_rates` not `rates`, 
  which caused all currency conversions to fail until we identified and fixed the mismatch.
- **API key security**  We used an Express proxy server so API keys never appear 
  in frontend code. The `.env` file is excluded from GitHub via `.gitignore`.
- **Alpha Vantage rate limit**  The free tier allows only 25 requests per day. 
  We implemented a 24-hour server side cache and a fallback to the historical 
  10.5% S&P 500 average to handle this gracefully.

## Security
- All API keys are stored in a `.env` file that is never committed to GitHub
- The backend acts as a proxy — API keys never appear in frontend code
- Rate limiting is applied to all `/api/*` routes (100 requests per 15 minutes per IP)
- Input validation and country code whitelisting prevent malicious requests

## Credits
- Alpha Vantage — https://www.alphavantage.co
- World Bank Open Data — https://data.worldbank.org
- ExchangeRate-API — https://www.exchangerate-api.com
- Chart.js — https://www.chartjs.org
- Express.js — https://expressjs.com
- PM2 — https://pm2.keymetrics.io
