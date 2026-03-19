import { state } from '../core/state.js';

let spendingChartInstance = null;

/**
 * Aggregates spending by category from state.bills
 * @returns {Object} Category totals
 */
export function getCategorySpending() {
    return state.bills.reduce((acc, bill) => {
        const total = (bill.quantity || 0) * (bill.purchasePrice || 0);
        const category = bill.category || 'Other';
        acc[category] = (acc[category] || 0) + total;
        return acc;
    }, {});
}

/**
 * Renders the spending doughnut chart
 * @param {string} canvasId - The ID of the canvas element
 */
export function renderSpendingChart(canvasId) {
    const data = getCategorySpending();
    const canvas = document.getElementById(canvasId);
    
    if (!canvas) return;

    // Destroy previous instance to prevent memory leaks and UI glitches
    if (spendingChartInstance) {
        spendingChartInstance.destroy();
        spendingChartInstance = null;
    }

    const ctx = canvas.getContext('2d');
    const categories = Object.keys(data);
    const totals = Object.values(data);

    if (categories.length === 0) {
        // Clear canvas before drawing message
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Show message if no data
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#64748b';
        ctx.fillText('No spending data available for the selected period.', canvas.width / 2, canvas.height / 2);
        return;
    }

    spendingChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: totals,
                backgroundColor: [
                    '#6366f1', // Indigo
                    '#14b8a6', // Teal
                    '#f97316', // Orange
                    '#ef4444', // Red
                    '#22c55e', // Green
                    '#3b82f6', // Blue
                    '#f59e0b', // Amber
                    '#8b5cf6', // Violet
                    '#ec4899', // Pink
                    '#64748b'  // Slate
                ],
                borderWidth: 2,
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary').trim() || '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            family: "'Inter', sans-serif",
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return `${label}: ₹${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });

    return spendingChartInstance;
}
