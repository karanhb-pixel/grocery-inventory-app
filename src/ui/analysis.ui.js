import { getItemFrequency, getItemBurnRate } from '../features/analysis.features.js';
import { renderSpendingChart } from './charts.ui.js';

let currentPeriod = 30;

// Security: Helper to escape HTML and prevent XSS
const escapeHtml = (value) => {
    const str = value === null || value === undefined ? "" : String(value);
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
};

export function renderAnalysis(period = currentPeriod) {
  currentPeriod = period;
  const tbody = document.querySelector('#analysis-table tbody');
  
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  const items = getItemFrequency(period);
  
  if (items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 48px; color: var(--text-muted);">
          No purchase data found for the selected period.
        </td>
      </tr>
    `;
    return;
  }
  
  items.forEach((item, index) => {
    const burnData = getItemBurnRate(item.itemName, period);
    
    // Robustness: Guard against null/undefined burnData
    const burnRate = (burnData && typeof burnData.burnRate === 'number') ? burnData.burnRate : 0;
    const daysRemaining = (burnData && typeof burnData.daysRemaining === 'number' && !Number.isNaN(burnData.daysRemaining)) ? burnData.daysRemaining : Infinity;
    
    const daysClass = daysRemaining <= 3 ? 'text-error' : daysRemaining <= 7 ? 'text-warning' : 'text-success';
    const daysDisplay = daysRemaining === Infinity ? '∞' : daysRemaining.toFixed(1);

    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${escapeHtml(item.itemName)}</strong></td>
        <td><span class="frequency-badge">${escapeHtml(item.count)}</span></td>
        <td>${escapeHtml(item.avgQuantity)}</td>
        <td>₹${escapeHtml(item.avgPrice)}</td>
        <td>${escapeHtml(burnRate.toFixed(2))}</td>
        <td class="${escapeHtml(daysClass)}">${escapeHtml(daysDisplay)}</td>
        <td>${escapeHtml(new Date(item.lastPurchaseDate).toLocaleDateString())}</td>
      </tr>
    `);
  });
}

export function initAnalysisUI() {
  const periodSelect = document.getElementById('analysis-period');
  
  if (periodSelect) {
    periodSelect.addEventListener('change', (e) => {
      const period = +e.target.value;
      renderAnalysis(period);
      renderSpendingChart('spending-chart');
    });
  }
}
