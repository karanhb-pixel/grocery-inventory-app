import { state } from "../core/state.js";

/**
 * Calculate item purchase frequency within a time period
 * @param {number} days - Number of days to look back
 * @returns {Array} Sorted array of items with frequency data
 */
export function getItemFrequency(days = 30, customBills = null) {
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const billsToUse = customBills || state.bills;

  // Filter bills within the time period
  const relevantBills = billsToUse.filter((bill) => {
    const billDate = new Date(bill.date);
    return billDate >= cutoffDate && billDate <= now;
  });

  // Count frequency for each item
  const itemMap = {};

  relevantBills.forEach((bill) => {
    const itemName = bill.itemName;

    if (!itemMap[itemName]) {
      itemMap[itemName] = {
        itemName,
        count: 0,
        totalQuantity: 0,
        lastPurchaseDate: bill.date,
        totalSpent: 0,
      };
    }

    itemMap[itemName].count++;
    itemMap[itemName].totalQuantity += bill.quantity || 0;
    itemMap[itemName].totalSpent += bill.purchasePrice * bill.quantity || 0;

    // Update last purchase date if this bill is more recent
    if (new Date(bill.date) > new Date(itemMap[itemName].lastPurchaseDate)) {
      itemMap[itemName].lastPurchaseDate = bill.date;
    }
  });

  // Convert to array and calculate averages
  const items = Object.values(itemMap).map((item) => ({
    ...item,
    avgQuantity: (item.totalQuantity / item.count).toFixed(2),
    avgPrice:
      item.totalQuantity > 0
        ? (item.totalSpent / item.totalQuantity).toFixed(2)
        : "0.00",
  }));

  // Sort by count (descending)
  return items.sort((a, b) => b.count - a.count);
}

/**
 * Calculate burn rate and days remaining for an item
 * @param {string} itemName - Name of the item to calculate for
 * @param {number} days - Number of days to look back for frequency data (default: 30)
 * @returns {Object} Object containing burnRate, daysRemaining, and related data
 */
export function getItemBurnRate(itemName, days = 30, customBills = null, customInventory = null) {
  // Support user test signature: getItemBurnRate(name, mockBills)
  let billsToUse = customBills;
  let daysToUse = days;
  if (Array.isArray(days)) {
    billsToUse = days;
    daysToUse = 30; // Default days if not provided
  }

  // Get frequency data for the item
  const frequencyData = getItemFrequency(daysToUse, billsToUse);
  const itemFreq = frequencyData.find((item) => item.itemName === itemName);

  if (!itemFreq) {
    return {
      itemName,
      burnRate: 0,
      daysRemaining: Infinity,
      avgQuantityPerPurchase: 0,
      purchaseFrequency: 0,
      currentStock: 0,
    };
  }

  // Get current stock from inventory
  const inventoryToUse = customInventory || state.inventory;
  const inventoryItem = inventoryToUse.find((item) => item.name === itemName);
  const currentStock = inventoryItem
    ? parseFloat(inventoryItem.quantity) || 0
    : 0;

  // Calculate burn rate (average quantity used per day)
  // Burn rate = average quantity per purchase * purchase frequency per day
  const avgQuantityPerPurchase = parseFloat(itemFreq.avgQuantity) || 0;
  const purchaseCount = itemFreq.count;
  const purchaseFrequencyPerDay = purchaseCount / daysToUse; // purchases per day

  const burnRate = avgQuantityPerPurchase * purchaseFrequencyPerDay;

  // Calculate days remaining
  // Days remaining = current stock / burn rate
  let daysRemaining;
  if (burnRate > 0) {
    daysRemaining = currentStock / burnRate;
  } else {
    // If burn rate is 0 (no purchases or no usage), days remaining is infinite
    daysRemaining = currentStock > 0 ? Infinity : 0;
  }

  return {
    itemName,
    burnRate: parseFloat(burnRate.toFixed(4)),
    daysRemaining: parseFloat(daysRemaining.toFixed(1)),
    avgQuantityPerPurchase,
    purchaseFrequency: purchaseFrequencyPerDay,
    currentStock,
  };
}
