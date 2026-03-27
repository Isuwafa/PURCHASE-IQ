// Handles chart rendering using Chart.js.
// Shows investment growth, original spend, and inflation over time.
let growthChartInstance = null;

/**
 * renderGrowthChart
 * Creates (or recreates) the animated line chart.
 *
 * @param {Array}  investmentData  - From calculateInvestmentGrowth()
 * @param {Array}  inflationData   - From calculateInflationTimeSeries()
 * @param {number} principal       - Original amount (for the flat red line)
 * @param {string} currencyCode    - For formatting tooltip values
 */
function renderGrowthChart(investmentData, inflationData, principal, currencyCode) {
  const canvas = document.getElementById('growth-chart');
  const ctx    = canvas.getContext('2d');

  // Destroy the previous chart if one exists.
  // Chart.js throws an error if you draw on a canvas that already has a chart.
  if (growthChartInstance) {
    growthChartInstance.destroy();
    growthChartInstance = null;
  }

  // X-axis labels: Year 1, Year 2, ... Year N
  const labels = investmentData.map(d => `Year ${d.year}`);

  // Y-axis data for each of the three lines
  const investedValues  = investmentData.map(d => d.value);
  const spentValues     = investmentData.map(() => principal); // flat line
  const inflationValues = inflationData.map(d => d.realValueOfMoney);

  growthChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: ' If Invested',
          data: investedValues,
          borderColor: '#00d4aa',               // green
          backgroundColor: 'rgba(0, 212, 170, 0.06)',
          borderWidth: 2.5,
          pointRadius: 3,
          pointHoverRadius: 6,
          tension: 0.3,  // slight curve on the line
          fill: true,
        },
        {
          label: '💸 If Spent (flat)',
          data: spentValues,
          borderColor: '#ef4444',               // red
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderDash: [6, 4],                   // dashed line
          pointRadius: 0,
          tension: 0,
        },
        {
          label: ' Purchasing Power',
          data: inflationValues,
          borderColor: '#f59e0b',               // amber
          backgroundColor: 'rgba(245, 158, 11, 0.05)',
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 6,
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
        easing: 'easeInOutQuart',
      },
      interaction: {
        mode: 'index',       // tooltip shows all 3 values at same x position
        intersect: false,
      },
      plugins: {
        legend: {
          labels: {
            color: '#94a3b8',
            font: { family: 'IBM Plex Mono', size: 11 },
            boxWidth: 16,
            padding: 16,
          },
        },
        tooltip: {
          backgroundColor: '#111827',
          borderColor: '#1e2d40',
          borderWidth: 1,
          titleColor: '#f1f5f9',
          bodyColor: '#94a3b8',
          titleFont: { family: 'Syne', size: 12 },
          bodyFont:  { family: 'IBM Plex Mono', size: 11 },
          padding: 12,
          callbacks: {
            // Format each tooltip value as currency
            label: (context) => {
              const value = context.parsed.y;
              try {
                const formatted = new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: currencyCode,
                  maximumFractionDigits: 0,
                }).format(value);
                return `  ${context.dataset.label}: ${formatted}`;
              } catch {
                return `  ${context.dataset.label}: ${Math.round(value).toLocaleString()}`;
              }
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#475569',
            font: { family: 'IBM Plex Mono', size: 10 },
            // Only show every 5th year label to avoid crowding
            callback: (val, index) =>
              (index % 5 === 0 || index === labels.length - 1) ? labels[index] : '',
          },
          grid:   { color: '#1e2d40' },
          border: { color: '#1e2d40' },
        },
        y: {
          ticks: {
            color: '#475569',
            font: { family: 'IBM Plex Mono', size: 10 },
            // Shorten large numbers: 1200 → 1.2k, 1200000 → 1.2M
            callback: (value) => {
              if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
              if (value >= 1_000)    return `${(value / 1_000).toFixed(0)}k`;
              return Math.round(value).toString();
            },
          },
          grid:   { color: '#1e2d40' },
          border: { color: '#1e2d40' },
        },
      },
    },
  });
}
