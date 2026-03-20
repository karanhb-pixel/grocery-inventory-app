import { state } from '../core/state.js';
import { saveBills } from '../core/storage.js';

export function addBill(bill) {
  state.bills.push({
    id: state.nextBillId++,
    ...bill
  });
  saveBills();
}

export function deleteBill(id) {
  state.bills = state.bills.filter(b => b.id !== id);
  saveBills();
}

export function updateBill(id, updated) {
  const index = state.bills.findIndex(b => b.id === id);
  if (index !== -1) {
    state.bills[index] = { ...state.bills[index], ...updated };
    saveBills();
  }
}

export function getLastBillPrice(itemName) {
  const itemBills = state.bills.filter(b => b.itemName === itemName);
  if (itemBills.length === 0) return 0;
  
  // Assuming bills are appended chronologically, last one is latest.
  // We can sort just to be sure if date editing is allowed.
  // For now, simple last item:
  return itemBills[itemBills.length - 1].purchasePrice;
}

export function getFilteredBills() {
  if (!state.billFilterDate) {
    return state.bills;
  }
  return state.bills.filter(bill => bill.date === state.billFilterDate);
}
