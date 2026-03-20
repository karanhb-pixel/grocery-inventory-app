import { getItemBurnRate, getItemFrequency } from './analysis.features';

describe('Inventory Analysis Logic', () => {
  const today = new Date();
  const fiveDaysAgo = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const fifteenDaysAgo = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const mockBills = [
    { itemName: 'Milk', quantity: 2, date: fifteenDaysAgo, purchasePrice: 10 },
    { itemName: 'Milk', quantity: 2, date: fiveDaysAgo, purchasePrice: 10 }
  ];

  test('Calculates correct burn rate for stable consumption', () => {
    // 4 units over 10 days = 0.4 units per day
    const rateData = getItemBurnRate('Milk', 10, mockBills);
    expect(rateData.burnRate).toBeCloseTo(0.4, 1);
  });

  test('Handles division-by-zero for items with no history', () => {
    const rateData = getItemBurnRate('NewItem', []);
    expect(rateData.burnRate).toBe(0); // Safety guard check
  });

  test('Frequency analysis returns 0 for empty periods', () => {
    const freqData = getItemFrequency(4, mockBills); // Only 4 days back (excludes 5 and 15 days ago)
    expect(freqData.length).toBe(0); 
  });
});
