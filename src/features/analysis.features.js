import { state } from '../core/state.js';

/**
 * Calculate item purchase frequency within a time period
 * @param {number} days - Number of days to look back
 * @returns {Array} Sorted array of items with frequency data
 */
export function getItemFrequency(days = 30) {
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  
  // Filter bills within the time period
  const relevantBills = state.bills.filter(bill => {
    const billDate = new Date(bill.date);
    return billDate >= cutoffDate && billDate <= now;
  });

  // Count frequency for each item
  const itemMap = {};
  
  relevantBills.forEach(bill => {
    const itemName = bill.itemName;
    
    if (!itemMap[itemName]) {
      itemMap[itemName] = {
        itemName,
        count: 0,
        totalQuantity: 0,
        lastPurchaseDate: bill.date,
        totalSpent: 0
      };
    }
    
    itemMap[itemName].count++;
    itemMap[itemName].totalQuantity += bill.quantity || 0;
    itemMap[itemName].totalSpent += (bill.purchasePrice * bill.quantity) || 0;
    
    // Update last purchase date if this bill is more recent
    if (new Date(bill.date) > new Date(itemMap[itemName].lastPurchaseDate)) {
      itemMap[itemName].lastPurchaseDate = bill.date;
    }
  });

  // Convert to array and calculate averages
  const items = Object.values(itemMap).map(item => ({
    ...item,
    avgQuantity: (item.totalQuantity / item.count).toFixed(2),
    avgPrice: (item.totalSpent / item.totalQuantity).toFixed(2)
  }));

  // Sort by count (descending)
  return items.sort((a, b) => b.count - a.count);
}
