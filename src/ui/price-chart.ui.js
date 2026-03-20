import { state } from "../core/state.js";

let priceChartInstance = null;

/**
 * Renders the price history line chart for a specific item
 * @param {string} canvasId - The ID of the canvas element
 * @param {string} itemName - The name of the item to track
 */
export function renderPriceHistory(canvasId, itemName) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  // Filter and sort bills by date for the specific item
  // Robustness: Guard against bills with missing itemName or null itemName
  const targetName = String(itemName || "").toLowerCase();
  const history = state.bills
    .filter(
      (b) => b.itemName && String(b.itemName).toLowerCase() === targetName,
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Destroy previous instance to prevent memory leaks and UI glitches
  if (priceChartInstance) {
    priceChartInstance.destroy();
    priceChartInstance = null;
  }

  const ctx = canvas.getContext("2d");

  if (history.length === 0) {
    // Clear canvas before drawing message
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Show message if no data
    ctx.font = "14px Inter";
    ctx.textAlign = "center";
    ctx.fillStyle = "#64748b";
    const displayName = targetName ? targetName : "this item";
    ctx.fillText(
      `No purchase history found for "${displayName}".`,
      canvas.width / 2,
      canvas.height / 2,
    );
    return;
  }

  // Prepare data for the chart
  const labels = history.map((b) => {
    const d = new Date(b.date);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  });
  const prices = history.map((b) => b.purchasePrice);

  priceChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: `Price Trend: ${itemName}`,
          data: prices,
          borderColor: "#6366f1",
          backgroundColor: "rgba(99, 102, 241, 0.1)",
          borderWidth: 3,
          tension: 0.4, // Smoother Curves
          fill: true,
          pointBackgroundColor: "#6366f1",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `Price: ₹${context.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
          ticks: {
            callback: function (value) {
              return "₹" + value;
            },
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    },
  });

  return priceChartInstance;
}
