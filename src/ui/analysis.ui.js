import { getItemFrequency } from '../features/analysis.features.js';

let currentPeriod = 30;

export function renderAnalysis(period = currentPeriod) {
  currentPeriod = period;
  const tbody = document.querySelector('#analysis-table tbody');
  
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  const items = getItemFrequency(period);
  
  if (items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 48px; color: var(--text-muted);">
          No purchase data found for the selected period.
        </td>
      </tr>
    `;
    return;
  }
  
  items.forEach((item, index) => {
    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${item.itemName}</strong></td>
        <td><span class="frequency-badge">${item.count}</span></td>
        <td>${item.avgQuantity}</td>
        <td>₹${item.avgPrice}</td>
        <td>${new Date(item.lastPurchaseDate).toLocaleDateString()}</td>
      </tr>
    `);
  });
}

export function initAnalysisUI() {
  const periodSelect = document.getElementById('analysis-period');
  
  if (periodSelect) {
    periodSelect.addEventListener('change', (e) => {
      renderAnalysis(+e.target.value);
    });
  }
}
